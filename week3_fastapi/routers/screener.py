# ============================================================================
# File: routers/screener.py
# Description: Sub-router for the stock screener. Fetches fundamentals and 
#              calculates cross-sectional relative strength momentum.
# ============================================================================
import yfinance as yf
from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
from schemas import ScreenerAsset, ScreenerAssetResponse

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

# ----------------------------------------------------------------------------
# Function: _get_evaluated_candidates
# Description: Gathers metrics and computes relative strength rankings across all
#              monitored and baseline tickers.
#
# Processing Steps:
#   Step 1: Scope Consolidation & Relationship Mapping
#     - Builds a unified dictionary of unique tickers and tags their relational origin
#       (watchlist, portfolio, both, or recommendation).
#   Step 2: Metric Fetching & Normalization
#     - Retrieves live stock data from Yahoo Finance and calculates rolling 30-day close returns.
#     - Converts foreign pricing from USD to CAD dynamically using USDCAD exchange rates.
#     - Computes trailing PE ratios, profit margins, debt-to-equity ratios, and FCF growth rates.
#     - Computes QoQ Revenue Growth using quarterly statement entries (falling back to yfinance info).
#   Step 3: Cross-Sectional Momentum (Relative Strength) Calculation
#     - Sorts the entire consolidated universe by 30-day price returns.
#     - Assigns each ticker a Relative Strength Percentile (0% to 100%) reflecting its
#       momentum ranking relative to all other scanned assets.
# ----------------------------------------------------------------------------
def _get_evaluated_candidates(db: Session, current_user: models.User) -> List[dict]:
    # Step 1: Scope Consolidation & Relationship Mapping
    watchlist_items = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id
    ).all()
    holding_items = db.query(models.Holding).filter(
        models.Holding.user_id == current_user.id
    ).all()

    ticker_sources = {}
    for symbol in TICKER_UNIVERSE:
        ticker_sources[symbol.upper().strip()] = "recommendation"

    for item in watchlist_items:
        ticker_sources[item.ticker.upper().strip()] = "watchlist"

    for item in holding_items:
        t_clean = item.ticker.upper().strip()
        if ticker_sources.get(t_clean) in ["watchlist", "both"]:
            ticker_sources[t_clean] = "both"
        else:
            ticker_sources[t_clean] = "portfolio"

    candidates_raw = []
    from routers.stocks import _get_cad_price

    # Step 2: Metric Fetching & Normalization across consolidated universe
    for symbol, source in ticker_sources.items():
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            name = info.get("longName") or info.get("shortName") or symbol
            sector = info.get("sector") or "Unknown"
            price_usd = info.get("currentPrice") or info.get("regularMarketPrice")
            
            performance_30d, hist_price = _calculate_30d_return(ticker)
            if price_usd is None:
                price_usd = hist_price or 0.0
            
            currency = info.get("currency", "USD")
            price_cad = _get_cad_price(price_usd, currency, db, ticker=symbol)

            pe = info.get("trailingPE")
            profit_margin = info.get("profitMargins")
            
            debt_to_equity_pct = info.get("debtToEquity")
            debt_to_equity = (debt_to_equity_pct / 100.0) if debt_to_equity_pct is not None else None

            fcf_growth = _calculate_fcf_growth(ticker, info)
            q_revenue_growth = _calculate_qoq_revenue_growth(ticker, info)

            candidates_raw.append({
                "ticker": symbol,
                "name": name,
                "sector": sector,
                "price": float(price_cad),
                "current_price": float(price_cad),
                "pe": pe,
                "fcf_growth": fcf_growth,
                "profit_margin": profit_margin,
                "debt_to_equity": debt_to_equity,
                "performance_30d": performance_30d or 0.0,
                "qoq_revenue_growth": q_revenue_growth,
                "source": source
            })
        except Exception as e:
            print(f"ERROR: Failed to fetch data for {symbol}: {e}")
            continue

    if not candidates_raw:
        return []

    # Step 3: Cross-Sectional Momentum (Relative Strength) Calculation
    candidates_raw.sort(key=lambda x: x["performance_30d"], reverse=True)
    total_candidates = len(candidates_raw)

    for idx, item in enumerate(candidates_raw):
        rank = total_candidates - idx
        relative_strength = (rank / total_candidates) * 100.0
        item["relative_strength"] = relative_strength

    return candidates_raw


# ----------------------------------------------------------------------------
# Function: get_candidates
# Description: Returns the full evaluated candidate list with relative strength
#              percentiles and raw financial ratios for instant client-side filtering.
# ----------------------------------------------------------------------------
@router.get("/candidates", response_model=ScreenerAssetResponse)
def get_candidates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    candidates = _get_evaluated_candidates(db, current_user)
    return ScreenerAssetResponse(candidates=candidates)


def _calculate_fcf_growth(ticker: yf.Ticker, info: dict = None) -> Optional[float]:
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

    # Final fallback: use revenueGrowth or earningsGrowth from info dictionary
    if info:
        if info.get("revenueGrowth") is not None:
            return float(info.get("revenueGrowth"))
        if info.get("earningsGrowth") is not None:
            return float(info.get("earningsGrowth"))

    return None


def _calculate_30d_return(ticker: yf.Ticker) -> Tuple[float, Optional[float]]:
    """
    Private helper to calculate rolling 30-day price performance.
    Returns a tuple: (performance_30d_ratio, last_close_price).
    """
    performance_30d = 0.0
    last_price = None
    try:
        hist = ticker.history(period="1mo")
        if not hist.empty and len(hist) >= 2:
            price_start = float(hist["Close"].iloc[0])
            price_end = float(hist["Close"].iloc[-1])
            if price_start > 0:
                performance_30d = (price_end - price_start) / price_start
            last_price = price_end
    except Exception:
        pass
    return performance_30d, last_price


def _calculate_qoq_revenue_growth(ticker: yf.Ticker, info: dict) -> Optional[float]:
    """
    Private helper to calculate Quarter-over-Quarter (QoQ) Revenue Growth.
    Queries quarterly income statements and falls back to yfinance info.get("revenueGrowth").
    """
    q_revenue_growth = None
    try:
        q_inc = ticker.quarterly_income_stmt
        if q_inc.empty:
            q_inc = ticker.quarterly_financials
        
        rev_row = None
        for idx in ["Total Revenue", "Revenue"]:
            if idx in q_inc.index:
                rev_row = q_inc.loc[idx]
                break
        
        if rev_row is not None and len(rev_row) >= 2:
            rev_latest = float(rev_row.iloc[0])
            rev_prev = float(rev_row.iloc[1])
            if rev_prev > 0:
                q_revenue_growth = (rev_latest - rev_prev) / rev_prev
    except Exception:
        pass

    if q_revenue_growth is None:
        q_revenue_growth = info.get("revenueGrowth")

    return q_revenue_growth
