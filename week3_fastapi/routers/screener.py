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
from schemas import ScreenerRequest, ScreenerResponseItem, AnomalyResponseItem, MultiStrategyScanResponse

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

# # ----------------------------------------------------------------------------
# Function: run_multi_strategy_scan
# Description: Gathers watchlist and holdings database items, combines them with
#              general market baseline tickers, calculates relative strength
#              percentiles, evaluates momentum quality and divergence value gap
#              logic, and returns strategy-grouped lists.
# Parameters:
#   - req (ScreenerRequest): Parameter sliders and limits for momentum quality.
#   - db (Session): The database session dependency.
#   - current_user (User): The currently authenticated user.
# Returns:
#   - MultiStrategyScanResponse: Grouped response of triggered candidates.
# ----------------------------------------------------------------------------
@router.post("/scan", response_model=MultiStrategyScanResponse)
def run_multi_strategy_scan(
    req: ScreenerRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Unified Quantitative Multi-Strategy Market Scanner.
    
    This endpoint executes a multi-strategy quantitative scan across a consolidated 
    ticker scope containing:
    1. Active User Portfolio Holdings (e.g. assets the user currently owns).
    2. User Watchlist Stocks (e.g. assets the user is actively monitoring).
    3. General Market Universe (TICKER_UNIVERSE - baseline blue-chip list).

    It runs the following processing steps and quantitative algorithms:

    Step 1: Scope Consolidation & Relationship Mapping
      - Builds a unified dictionary of unique tickers and tags their relational origin
        (watchlist, portfolio, both, or recommendation).
        
    Step 2: Metric Fetching & Normalization
      - Retrieves live stock data from Yahoo Finance and calculates rolling 30-day close returns.
      - Converts foreign pricing from USD to CAD dynamically using USDCAD exchange rates.
      - Computes trailing PE ratios, profit margins, debt-to-equity ratios, and FCF growth rates.
      - Computes QoQ Revenue Growth using quarterly statement entries (falling back to yfinance info).

    Step 3: Cross-Sectional Momentum (Relative Strength) Calculation
      - Sorts the entire consolidated universe by 30-day price returns.
      - Assigns each ticker a Relative Strength Percentile (0% to 100%) reflecting its 
        momentum ranking relative to all other scanned assets.

    Step 4: Strategy Evaluation & Execution
      - Strategy A: Momentum Quality (Riding the Trend)
        - Thesis: Invests in healthy companies displaying strong intermediate momentum.
        - Triggers if: Ticker meets user thresholds (PE, margin, FCF growth, debt/equity) 
          and falls within the user's Circle of Competence (if active).
      - Strategy B: Value Gap / Anomalous Divergence (Buying the Dip)
        - Thesis: Flags oversold opportunities where business sales are growing but price drops.
        - Triggers if: QoQ Revenue Growth > 10% and 30-day Price Return < -10%.
        - Filter: If circle of competence is active, restricts general recommendations to those sectors.

    Step 5: Sorting & Response Serialization
      - Sorts Momentum Quality candidates descending by Relative Strength.
      - Sorts Value Gap alerts ascending by 30-day price performance (largest drops first).
      - Package results into a structured MultiStrategyScanResponse.
    """
    # 1. Fetch user's active tickers
    watchlist_items = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id
    ).all()
    holding_items = db.query(models.Holding).filter(
        models.Holding.user_id == current_user.id
    ).all()

    # Map tickers to their sources (initializing baseline universe as "recommendation")
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

    # Fetch active sector competences for the Circle of Competence check
    allowed_sectors = []
    if req.circle_of_competence_only:
        competences = db.query(models.SectorCompetence).filter(
            models.SectorCompetence.user_id == current_user.id
        ).all()
        allowed_sectors = [c.sector.strip().lower() for c in competences]

    candidates_raw = []

    # 2. Gather metrics for each unique ticker
    from routers.stocks import _get_cad_price

    for symbol, source in ticker_sources.items():
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            # Metadata
            name = info.get("longName") or info.get("shortName") or symbol
            sector = info.get("sector") or "Unknown"

            # Pricing
            price_usd = info.get("currentPrice") or info.get("regularMarketPrice")
            
            # Fetch 30-day performance and fallback price
            performance_30d, hist_price = _calculate_30d_return(ticker)
            if price_usd is None:
                price_usd = hist_price or 0.0
            
            currency = info.get("currency", "USD")
            price_cad = _get_cad_price(price_usd, currency, db)

            # Fundamental ratios
            pe = info.get("trailingPE")
            profit_margin = info.get("profitMargins")
            
            debt_to_equity_pct = info.get("debtToEquity")
            debt_to_equity = (debt_to_equity_pct / 100.0) if debt_to_equity_pct is not None else None

            fcf_growth = _calculate_fcf_growth(ticker, info)

            # Calculate QoQ Revenue Growth using private helper
            q_revenue_growth = _calculate_qoq_revenue_growth(ticker, info)

            candidates_raw.append({
                "ticker": symbol,
                "name": name,
                "sector": sector,
                "price": float(price_cad),
                "pe": pe,
                "fcf_growth": fcf_growth,
                "profit_margin": profit_margin,
                "debt_to_equity": debt_to_equity,
                "performance_30d": performance_30d,
                "qoq_revenue_growth": q_revenue_growth,
                "source": source
            })
        except Exception as e:
            print(f"ERROR: Failed to fetch data for {symbol}: {e}")
            continue

    if not candidates_raw:
        return MultiStrategyScanResponse(momentum_quality=[], value_gap=[])

    # 3. Compute cross-sectional relative strength percentiles across all candidates
    candidates_raw.sort(key=lambda x: x["performance_30d"], reverse=True)
    total_candidates = len(candidates_raw)

    for idx, item in enumerate(candidates_raw):
        # Calculate rank percentile (100% is top performance)
        rank = total_candidates - idx
        relative_strength = (rank / total_candidates) * 100.0
        item["relative_strength"] = relative_strength

    momentum_quality_list = []
    value_gap_list = []

    # 4. Evaluate both strategies on each candidate
    for item in candidates_raw:
        # --- Global Gatekeeper: Circle of Competence Filter ---
        # When active, filter out general market candidates outside the user's expertise sectors.
        # (Active portfolio holdings remain monitored so users never miss critical alerts on owned assets).
        if req.circle_of_competence_only and item["source"] == "recommendation":
            if item["sector"].strip().lower() not in allowed_sectors:
                continue

        # --- Strategy 1: Momentum Quality ---
        qualifies_momentum = True
        
        # Margin filter
        if qualifies_momentum and req.min_profit_margin is not None:
            if item["profit_margin"] is not None:
                if item["profit_margin"] < req.min_profit_margin:
                    qualifies_momentum = False
            elif req.min_profit_margin > 0:
                qualifies_momentum = False
                
        # PE filter
        if qualifies_momentum and req.max_pe is not None:
            if item["pe"] is not None:
                if item["pe"] > req.max_pe:
                    qualifies_momentum = False

        # Debt to Equity filter
        if qualifies_momentum and req.max_debt_equity is not None:
            if item["debt_to_equity"] is not None:
                if item["debt_to_equity"] > req.max_debt_equity:
                    qualifies_momentum = False

        # FCF Growth filter
        if qualifies_momentum and req.min_fcf_growth is not None:
            if item["fcf_growth"] is not None:
                if item["fcf_growth"] < req.min_fcf_growth:
                    qualifies_momentum = False
            elif req.min_fcf_growth > 0:
                qualifies_momentum = False

        if qualifies_momentum:
            fcf_pct = item["fcf_growth"] * 100.0 if item["fcf_growth"] is not None else 0.0
            rs_rank_pct = 100.0 - item["relative_strength"]
            msg = f"{item['ticker']} - Top {rs_rank_pct:.1f}% relative strength momentum leader with {fcf_pct:.1f}% FCF growth"
            
            momentum_quality_list.append(ScreenerResponseItem(
                ticker=item["ticker"],
                name=item["name"],
                sector=item["sector"],
                price=item["price"],
                pe=item["pe"],
                fcf_growth=item["fcf_growth"],
                profit_margin=item["profit_margin"],
                debt_to_equity=item["debt_to_equity"],
                performance_30d=item["performance_30d"],
                relative_strength=item["relative_strength"],
                source=item["source"],
                message=msg
            ))

        # --- Strategy 2: Value Gap (Divergence Anomaly) ---
        qualifies_value_gap = True

        if qualifies_value_gap and item["qoq_revenue_growth"] is not None and item["performance_30d"] is not None:
            if item["qoq_revenue_growth"] > 0.10 and item["performance_30d"] < -0.10:
                growth_pct = item["qoq_revenue_growth"] * 100.0
                return_pct = item["performance_30d"] * 100.0
                msg = f"{item['ticker']} - Revenue grew {growth_pct:.1f}% QoQ but share price dropped {abs(return_pct):.1f}% in 30 days"
                
                value_gap_list.append(AnomalyResponseItem(
                    ticker=item["ticker"],
                    name=item["name"],
                    sector=item["sector"],
                    current_price=item["price"],
                    performance_30d=item["performance_30d"],
                    qoq_revenue_growth=item["qoq_revenue_growth"],
                    message=msg,
                    source=item["source"]
                ))

    # Sort momentum quality results by relative strength (highest momentum first)
    momentum_quality_list.sort(key=lambda x: x.relative_strength, reverse=True)

    # Sort value gap alerts by 30-day return ascending (largest price correction/biggest discount first)
    value_gap_list.sort(key=lambda x: x.performance_30d)

    return MultiStrategyScanResponse(
        momentum_quality=momentum_quality_list,
        value_gap=value_gap_list
    )


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
