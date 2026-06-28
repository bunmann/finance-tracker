# ============================================================================
# File: routers/screener.py
# Description: Sub-router for the stock screener. Fetches fundamentals and 
#              calculates cross-sectional relative strength momentum.
# ============================================================================
import yfinance as yf
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
from schemas import ScreenerRequest, ScreenerResponseItem

router = APIRouter(
    prefix="/screener",
    tags=["Screener"]
)

import os
# Check target currency configuration (default: CAD)
TARGET_CURRENCY = os.getenv("CURRENCY", "CAD").upper().strip()

if TARGET_CURRENCY == "USD":
    # Baseline US large-cap stock universe
    TICKER_UNIVERSE = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
        "META", "TSLA", "BRK-B", "V", "JPM",
        "PG", "JNJ", "UNH", "HD", "DIS",
        "NFLX", "WMT", "KO", "CAT", "GE"
    ]
else:
    # Baseline Canadian large-cap stock universe
    TICKER_UNIVERSE = [
        "SHOP.TO", "CSU.TO", "RY.TO", "TD.TO", "BNS.TO",
        "CNR.TO", "CP.TO", "ENB.TO", "TRP.TO", "ATD.TO",
        "L.TO", "WN.TO", "BCE.TO", "T.TO", "RCI-B.TO",
        "FM.TO", "TECK-B.TO", "WCN.TO", "GIB-A.TO", "H.TO"
    ]

@router.post("/run", response_model=List[ScreenerResponseItem])
def run_screener(
    req: ScreenerRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Run the algorithmic screener. Filters stocks by fundamentals and 
    ranks them by 30-day relative strength price momentum.
    """
    screened_candidates = []

    # Fetch active Circle of Competence sectors for the user if requested
    allowed_sectors = []
    if req.circle_of_competence_only:
        competences = db.query(models.SectorCompetence).filter(
            models.SectorCompetence.user_id == current_user.id
        ).all()
        allowed_sectors = [c.sector.strip().lower() for c in competences]

    # Gather data for each ticker in the universe
    for symbol in TICKER_UNIVERSE:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            # Basic metadata
            name = info.get("longName") or info.get("shortName") or symbol
            sector = info.get("sector") or "Unknown"

            # Check sector filter early if active
            if req.circle_of_competence_only and sector.strip().lower() not in allowed_sectors:
                continue

            # Core pricing
            price = info.get("currentPrice") or info.get("regularMarketPrice")

            # Fundamental ratios
            pe = info.get("trailingPE")
            profit_margin = info.get("profitMargins")  # e.g., 0.22 for 22%
            
            # yfinance returns debtToEquity in percent (e.g. 85.5). Convert to standard ratio.
            debt_to_equity_pct = info.get("debtToEquity")
            debt_to_equity = (debt_to_equity_pct / 100.0) if debt_to_equity_pct is not None else None

            # Calculate YoY Free Cash Flow Growth
            fcf_growth = _calculate_fcf_growth(ticker)

            # Retrieve 30-day price performance history
            performance_30d = 0.0
            try:
                hist = ticker.history(period="1mo")
                if not hist.empty and len(hist) >= 2:
                    price_start = float(hist["Close"].iloc[0])
                    price_end = float(hist["Close"].iloc[-1])
                    if price_start > 0:
                        performance_30d = (price_end - price_start) / price_start
                    # Fallback current price from historical end if info price is missing
                    if price is None:
                        price = price_end
            except Exception:
                pass

            if price is None:
                price = 0.0

            screened_candidates.append({
                "ticker": symbol,
                "name": name,
                "sector": sector,
                "price": float(price),
                "pe": pe,
                "fcf_growth": fcf_growth,
                "profit_margin": profit_margin,
                "debt_to_equity": debt_to_equity,
                "performance_30d": performance_30d
            })

        except Exception as e:
            # Silently fallback and skip failed tickers to maintain API resilience
            continue

    if not screened_candidates:
        return []

    # Cross-Sectional Ranking:
    # 1. Sort all candidates by 30-day performance descending
    screened_candidates.sort(key=lambda x: x["performance_30d"], reverse=True)
    total_candidates = len(screened_candidates)

    final_results = []
    for idx, candidate in enumerate(screened_candidates):
        # Calculate relative strength percentile score (0% - 100%)
        # Index 0 has the highest performance and gets a percentile score of 100%
        relative_strength = ((total_candidates - idx) / total_candidates) * 100.0

        # Apply Threshold Filters
        
        # 1. Profit Margin filter
        if candidate["profit_margin"] is not None and candidate["profit_margin"] < req.min_profit_margin:
            continue
            
        # 2. Debt to Equity filter
        if candidate["debt_to_equity"] is not None and candidate["debt_to_equity"] > req.max_debt_equity:
            continue

        # 3. Trailing P/E filter (filter out if PE is negative/loss or greater than max threshold)
        if candidate["pe"] is not None and (candidate["pe"] < 0 or candidate["pe"] > req.max_pe):
            continue

        # 4. Free Cash Flow Growth filter
        if candidate["fcf_growth"] is not None and candidate["fcf_growth"] < req.min_fcf_growth:
            continue

        final_results.append(ScreenerResponseItem(
            ticker=candidate["ticker"],
            name=candidate["name"],
            sector=candidate["sector"],
            price=candidate["price"],
            pe=candidate["pe"],
            fcf_growth=candidate["fcf_growth"],
            profit_margin=candidate["profit_margin"],
            debt_to_equity=candidate["debt_to_equity"],
            performance_30d=candidate["performance_30d"],
            relative_strength=relative_strength
        ))

    # Return final candidates sorted by relative strength (highest momentum first)
    return final_results


def _calculate_fcf_growth(ticker: yf.Ticker) -> Optional[float]:
    """
    Private helper to calculate YoY Free Cash Flow growth.
    Calculates FCF = Operating Cash Flow - Capital Expenditures.
    Falls back to YoY Revenue Growth if cash flow records are missing.
    """
    try:
        cf = ticker.cashflow
        if not cf.empty:
            fcf_series = None
            if "Free Cash Flow" in cf.index:
                fcf_series = cf.loc["Free Cash Flow"]
            elif "Operating Cash Flow" in cf.index and "Capital Expenditures" in cf.index:
                # Defensively take absolute value of CapEx and subtract it, in case upstream signs shift
                fcf_series = cf.loc["Operating Cash Flow"] - cf.loc["Capital Expenditures"].abs()

            if fcf_series is not None and len(fcf_series) >= 2:
                # yfinance returns newest years first (index 0 is current, index 1 is previous)
                fcf_current = float(fcf_series.iloc[0])
                fcf_prev = float(fcf_series.iloc[1])
                if fcf_prev > 0:
                    return (fcf_current - fcf_prev) / fcf_prev
    except Exception:
        pass

    # Fallback to YoY Revenue Growth
    try:
        inc = ticker.income_stmt
        if not inc.empty and "Total Revenue" in inc.index:
            rev_series = inc.loc["Total Revenue"]
            if len(rev_series) >= 2:
                rev_current = float(rev_series.iloc[0])
                rev_prev = float(rev_series.iloc[1])
                if rev_prev > 0:
                    return (rev_current - rev_prev) / rev_prev
    except Exception:
        pass

    return None
