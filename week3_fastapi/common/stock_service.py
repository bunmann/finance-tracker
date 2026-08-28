# ============================================================================
# File: stock_service.py
# Description: Fetches live stock prices from Yahoo Finance (yfinance) with caching,
#              and resolves ambiguous ticker symbols to their correct exchange suffix.
# ============================================================================
import os
import json
import yfinance as yf
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import models

# Explicitly trigger loading of environmental configurations at module import
load_dotenv()

# Caching Strategy: We consider cached prices "fresh" for 60 minutes.
# This keeps response times ultra-fast and avoids unnecessary network requests.
CACHE_DURATION_MINUTES = 60

# Historical chart cache duration: 15 minutes to balance responsiveness and Yahoo Finance rate limits.
CHART_CACHE_DURATION_MINUTES = 15


def get_stock_price(ticker: str, db: Session) -> tuple[float | None | bool, datetime | None, bool]:
    """
    Retrieves the current market price for a given stock ticker along with metadata.

    This function implements a cache-aside pattern:
      1. Inspects the SQLite `price_cache` table for a fresh price.
      2. Serves the cached price directly if it is less than 60 minutes old.
      3. Otherwise, requests the current price from Yahoo Finance (yfinance).
      4. Saves the retrieved price to the SQLite cache (upserts).
      5. Gracefully degrades to stale cached data if the external API fails.

    IMPORTANT: The `ticker` argument must already be the RESOLVED symbol
    (e.g. 'XEQT.TO', 'GOOG.NE'). Call `normalize_ticker_symbol` first if
    you have a raw ticker from a CSV or user input.

    Args:
        ticker (str): The fully-resolved stock symbol (e.g. "XEQT.TO", "AAPL").
        db (Session): The database session.

    Returns:
        tuple[float | None | bool, datetime | None, bool]:
            - price (float | None | bool): The price, False if invalid symbol, or None if unavailable.
            - last_updated (datetime | None): Timestamp of when the price was fetched.
            - is_stale (bool): True if served from fallback/expired cache because API failed.
    """
    ticker = ticker.upper().strip()

    # ── Step 1: Check Database Cache ──
    cached = db.query(models.PriceCache).filter(
        models.PriceCache.ticker == ticker
    ).first()

    if cached:
        # Convert naive datetime representation to UTC context for timedelta math
        last_updated_utc = cached.last_updated.replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - last_updated_utc

        # Serving from cache saves bandwidth and response is immediate
        if age < timedelta(minutes=CACHE_DURATION_MINUTES):
            return float(cached.price), cached.last_updated, False

    # ── Step 2: Fetch Live Price from External API ──
    # _fetch_price_from_api only attempts the EXACT ticker given;
    # candidate fallbacks are handled in normalize_ticker_symbol.
    price = _fetch_price_from_api(ticker)

    # ── Step 3: Handle Failures & Caching Updates ──
    if price is False:
        return False, None, False

    if price is None:
        # Graceful Degradation: If API limits are reached or network is down,
        # we return the stale price and flag it as is_stale=True.
        if cached:
            return float(cached.price), cached.last_updated, True
        return None, None, True

    # ── Step 4: Upsert the resolved price into the cache ──
    # We always cache under the EXACT ticker key passed to this function.
    # normalize_ticker_symbol is responsible for calling us with the resolved
    # symbol (e.g. 'XEQT.TO'), so the cache key is always the correct one.
    now_utc = datetime.now(timezone.utc)
    if cached:
        cached.price = price
        cached.last_updated = now_utc
    else:
        new_cache = models.PriceCache(
            ticker=ticker,
            price=price,
            last_updated=now_utc
        )
        db.add(new_cache)

    db.commit()
    return price, now_utc, False


def normalize_ticker_symbol(
    ticker: str,
    db: Session,
    currency_hint: str | None = None,
    name_hint: str | None = None
) -> tuple[str, float | None | bool]:
    """
    Resolves a raw ticker symbol (e.g. 'XEQT', 'GOOG', 'HPS.A') to the correct
    Yahoo Finance symbol and returns its current price.

    WHY THIS EXISTS
    ---------------
    Wealthsimple exports Canadian stocks WITHOUT exchange suffixes (e.g. 'XEQT'
    instead of 'XEQT.TO'). If we query yfinance naively, 'GOOG' returns the US
    Alphabet stock (~$170 USD) — not the Canadian CDR GOOG.NE (~$55 CAD). This
    function fixes that by using broker-supplied metadata to bias lookups toward
    the correct exchange before falling back to a US match.

    RESOLUTION ORDER
    ----------------
    1. CDR/Hedged detection: If the stock name contains keywords like "CDR" or
       "HEDGED", check the NEO exchange (.NE) FIRST. This correctly handles
       GOOG.NE (Alphabet CDR) before it can match US GOOG.

    2. CAD currency bias: If the CSV says currency='CAD', check TSX (.TO) and
       NEO (.NE) variations before trying a bare US symbol. This handles cases
       like XEQT → XEQT.TO and prevents accidental USD price matches.

    3. Exact match: Try the ticker exactly as-is (handles US tickers like AAPL,
       or already-suffixed tickers like XEQT.TO).

    4. General candidate fallback: If all above fail, try .TO / .NE / .V
       variations for any ticker that doesn't already have a known suffix.

    Args:
        ticker (str): Raw ticker symbol (e.g. "XEQT", "GOOG", "HPS.A").
        db (Session): Database session for the price cache.
        currency_hint (str | None): ISO currency from the broker CSV (e.g. "CAD").
                                    When "CAD", Canadian exchanges are checked first.
        name_hint (str | None): Full security name from the broker CSV (e.g.
                                "Alphabet CDR (CAD Hedged)"). Used to detect CDRs.

    Returns:
        tuple[str, float | None | bool]:
            - resolved_ticker (str): The corrected Yahoo Finance symbol (e.g. "GOOG.NE").
            - price (float | None | bool): Live price, None if unavailable, False if invalid.
    """
    ticker = ticker.upper().strip()
    name_upper = (name_hint or "").upper()
    curr_upper = (currency_hint or "").upper()

    # ── Step 1: CDR / Hedged Asset Detection ──
    # Canadian Depositary Receipts and CAD-hedged US stock versions trade on the
    # NEO exchange with a .NE suffix. The broker name column always contains
    # "CDR" or "Hedged", which is far more reliable than guessing from the ticker.
    # We MUST check this before trying the bare ticker, otherwise GOOG → US GOOG.
    cdr_keywords = {"CDR", "HEDGED", "DEPOSITARY", "NEO"}
    is_cdr = any(kw in name_upper for kw in cdr_keywords)
    if is_cdr and not ticker.endswith(".NE") and not ticker.endswith(".TO"):
        cdr_candidate = f"{ticker}.NE"
        cdr_price, _, _ = get_stock_price(cdr_candidate, db)
        if cdr_price is not False and cdr_price is not None:
            return cdr_candidate, cdr_price

    # ── Step 2: CAD Currency Bias ──
    # If the broker settled this trade in CAD and the ticker has no exchange
    # suffix yet, check Canadian exchanges (.TO, .NE) before the bare US symbol.
    # This correctly resolves XEQT → XEQT.TO and prevents false US matches.
    canadian_suffixes = {".TO", ".NE", ".V", ".TRT"}
    already_canadian = any(ticker.endswith(s) for s in canadian_suffixes)

    if curr_upper == "CAD" and not already_canadian:
        # Wealthsimple class-share tickers use dots (e.g. HPS.A, TECK.B).
        # Yahoo Finance uses hyphens (HPS-A.TO, TECK-B.TO), so we try both forms.
        base_hyphen = ticker.replace(".", "-")
        cad_candidates = [
            f"{ticker}.TO",          # Most Canadian TSX stocks
            f"{ticker}.NE",          # NEO-exchange ETFs (e.g. QQQX.NE)
            f"{base_hyphen}.TO",     # Share classes: TECK.B → TECK-B.TO
            base_hyphen,             # Plain hyphen fallback (e.g. HPS-A)
            f"{ticker}.V",           # TSX Venture Exchange
        ]
        for cand in cad_candidates:
            if cand == ticker:
                continue
            cad_price, _, _ = get_stock_price(cand, db)
            if cad_price is not False and cad_price is not None:
                return cand, cad_price

    # ── Step 3: Exact Match ──
    # Try the ticker exactly as provided. Handles US stocks (AAPL, TSLA),
    # stocks already suffixed (.TO, .NE), and CAD-listed stocks without a
    # suffix on Yahoo Finance (e.g. CEF for Sprott Physical Gold & Silver Trust).
    price, _, _ = get_stock_price(ticker, db)
    if price is not False and price is not None:
        return ticker, price

    # ── Step 4: General Candidate Fallback ──
    # If the exact match failed and we haven't already done the CAD bias pass,
    # try common Canadian suffixes anyway. This is a last-resort safety net.
    if not already_canadian:
        base_hyphen = ticker.replace(".", "-")
        fallback_candidates = [
            f"{ticker}.TO",
            f"{ticker}.NE",
            f"{base_hyphen}.TO",
            base_hyphen,
            f"{ticker}.V",
        ]
        for cand in fallback_candidates:
            if cand == ticker:
                continue
            cand_price, _, _ = get_stock_price(cand, db)
            if cand_price is not False and cand_price is not None:
                return cand, cand_price

    # Exhausted all candidates — return the original ticker and the failed price
    return ticker, price


def detect_ticker_currency(ticker: str) -> str:
    """
    Queries Yahoo Finance to determine the native trading currency of a ticker.

    Used by the manual buy endpoint to detect whether a user-entered ticker
    (e.g. 'AAPL', 'XEQT.TO') is priced in USD or CAD at the source, so we
    can store the correct currency on the Holding record.

    Args:
        ticker (str): A RESOLVED Yahoo Finance ticker symbol.

    Returns:
        str: ISO 4217 currency code, e.g. "CAD" or "USD". Defaults to "USD"
             if yfinance does not return currency info (safe fallback — conversion
             will be applied, which is better than silently skipping it for USD stocks).
    """
    try:
        info = yf.Ticker(ticker).fast_info
        # fast_info.currency is the most reliable field for trading currency
        currency = getattr(info, "currency", None)
        if currency:
            return currency.upper().strip()
    except Exception:
        pass
    # Default to USD so conversion is applied rather than skipped.
    # For a genuine CAD stock this slightly over-values it, but is much safer
    # than skipping conversion for a USD stock (which would under-value it by ~30%).
    return "USD"


def _fetch_price_from_api(ticker: str) -> float | None | bool:
    """
    Fetches the current price for a SINGLE ticker from Yahoo Finance (yfinance).

    IMPORTANT: This function does NOT attempt candidate fallbacks (e.g. trying .TO
    after a bare symbol fails). All exchange-suffix fallback logic lives in
    normalize_ticker_symbol so that the resolved key is always used for caching.

    WHY MULTIPLE PRICE FIELDS?
    --------------------------
    yfinance's `fast_info.last_price` is the fastest field but it frequently returns
    None for valid Canadian stocks (especially ETFs on TSX and NEO). When this
    happens, we fall back to the `.info` dict which is slower but more complete,
    and finally to `.history()` which is always reliable but slowest.

    Returning False only when ALL methods fail (and the symbol is definitively
    absent) prevents valid Canadian tickers like CCO.TO, GOOG.NE, QQQX.TO from
    being incorrectly rejected during CSV import.

    Args:
        ticker (str): An exact Yahoo Finance ticker symbol (e.g. "XEQT.TO", "AAPL").

    Returns:
        float | None | bool:
            - float:  Parsed stock price on success.
            - None:   Network or API failure (caller should serve stale cache).
            - False:  Symbol definitively does not exist on this exchange.
    """
    ticker_clean = ticker.upper().strip()
    try:
        ticker_obj = yf.Ticker(ticker_clean)

        # ── Method 1: fast_info.last_price (fastest, but unreliable for some TSX/NEO stocks) ──
        price = ticker_obj.fast_info.last_price
        if price is not None and float(price) > 0:
            return float(price)

        # ── Method 2: .info dict price fields (slower, more complete coverage) ──
        # These fields are populated even when fast_info returns None.
        try:
            info = ticker_obj.info
            # Try each price field in order of reliability
            for key in ("regularMarketPrice", "currentPrice", "previousClose"):
                val = info.get(key)
                if val is not None and float(val) > 0:
                    return float(val)
        except Exception:
            pass

        # ── Method 3: .history() (always works for valid tickers, even inactive ones) ──
        # If both fast_info and .info fail, fetch the most recent closing price from
        # the 5-day price history. A valid symbol will always have at least one row.
        try:
            hist = ticker_obj.history(period="5d")
            if not hist.empty:
                return float(hist["Close"].iloc[-1])
        except Exception:
            pass

        # All price methods returned None/empty → symbol does not exist on this exchange.
        return False

    except Exception as e:
        # Differentiate transient network errors from invalid-symbol errors.
        # Connection errors → return None (caller uses stale cache).
        # Other errors (e.g. RemoteDataError) → return False (bad symbol).
        import requests
        if isinstance(e, (requests.exceptions.ConnectionError, requests.exceptions.Timeout)):
            return None
        return False


# ============================================================================
# Historical Chart & Ratios Discovery (15-Minute Caching & Parallel Fetching)
# ============================================================================


def _fetch_history_from_api(ticker: str, period: str, interval: str) -> tuple[list[dict] | None, dict]:
    """
    Fetches historical chart points and company metadata directly from Yahoo Finance (yfinance) without DB access.
    Returns (chart_data, metadata).
    """
    ticker_clean = ticker.upper().strip()
    try:
        ticker_obj = yf.Ticker(ticker_clean)
        hist = ticker_obj.history(period=period, interval=interval)
        if hist.empty:
            return None, {}

        chart_data = []
        for idx_timestamp, row in hist.iterrows():
            if hasattr(idx_timestamp, "to_pydatetime"):
                dt = idx_timestamp.to_pydatetime()
            else:
                dt = idx_timestamp
            
            # Format timestamp cleanly as ISO string
            if hasattr(dt, "isoformat"):
                ts_str = dt.isoformat()
            else:
                ts_str = str(dt)

            price_val = float(row.get("Close", 0.0))
            vol_val = int(row.get("Volume", 0))
            if price_val > 0:
                chart_data.append({
                    "timestamp": ts_str,
                    "price": round(price_val, 4),
                    "volume": vol_val
                })

        # Extract metadata metrics cleanly
        metadata = {}
        try:
            info = ticker_obj.info
            metadata["name"] = info.get("shortName") or info.get("longName") or ticker_clean
            pe = info.get("trailingPE") or info.get("forwardPE")
            metadata["pe_ratio"] = round(float(pe), 2) if pe else None
            pm = info.get("profitMargins")
            metadata["profit_margin"] = round(float(pm) * 100, 2) if pm else None
            de = info.get("debtToEquity")
            metadata["debt_to_equity"] = round(float(de), 2) if de else None
            high52 = info.get("fiftyTwoWeekHigh")
            metadata["high_52w"] = round(float(high52), 2) if high52 else None
            low52 = info.get("fiftyTwoWeekLow")
            metadata["low_52w"] = round(float(low52), 2) if low52 else None
        except Exception:
            metadata["name"] = ticker_clean

        return chart_data, metadata
    except Exception:
        return None, {}


def get_stock_history(
    ticker: str,
    period: str,
    interval: str,
    db: Session 
) -> tuple[list[dict] | None, dict, bool]:
    """
    Retrieves historical stock data and metadata with 15-minute SQLite ChartCache integration.
    Returns (chart_data, metadata, is_stale).
    """
    ticker = ticker.upper().strip()

    # Step 1: Check Database Cache
    cached = db.query(models.ChartCache).filter(
        models.ChartCache.ticker == ticker,
        models.ChartCache.period == period,
        models.ChartCache.interval == interval
    ).first()

    if cached:
        last_updated_utc = cached.last_updated.replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - last_updated_utc
        if age < timedelta(minutes=CHART_CACHE_DURATION_MINUTES):
            try:
                payload = json.loads(cached.data_json)
                return payload.get("chart", []), payload.get("metadata", {}), False
            except Exception:
                pass

    # Step 2: Fetch Live from API
    chart_data, metadata = _fetch_history_from_api(ticker, period, interval)

    # Step 3: Handle Failures
    if chart_data is None:
        if cached:
            try:
                payload = json.loads(cached.data_json)
                return payload.get("chart", []), payload.get("metadata", {}), True
            except Exception:
                pass
        return None, {}, True

    # Step 4: Upsert into ChartCache
    now_utc = datetime.now(timezone.utc)
    payload_str = json.dumps({"chart": chart_data, "metadata": metadata})

    if cached:
        cached.data_json = payload_str
        cached.last_updated = now_utc
    else:
        new_cache = models.ChartCache(
            ticker=ticker,
            period=period,
            interval=interval,
            data_json=payload_str,
            last_updated=now_utc
        )
        db.add(new_cache)

    db.commit()
    return chart_data, metadata, False


def get_multiple_stocks_history(
    tickers: list[str],
    period: str,
    interval: str,
    db: Session
) -> dict[str, list[dict]]:
    """
    Retrieves historical chart data across multiple tickers concurrently using ThreadPoolExecutor,
    while maintaining thread-safe access to the SQLite ChartCache.
    Returns a dictionary mapping ticker -> list[dict of chart points].
    """
    unique_tickers = sorted(list({t.upper().strip() for t in tickers if t}))
    results = {}
    missing_tickers = []

    # Step 1: Check cache on main thread for all unique tickers
    now_utc = datetime.now(timezone.utc)
    for ticker in unique_tickers:
        cached = db.query(models.ChartCache).filter(
            models.ChartCache.ticker == ticker,
            models.ChartCache.period == period,
            models.ChartCache.interval == interval
        ).first()

        hit = False
        if cached:
            last_updated_utc = cached.last_updated.replace(tzinfo=timezone.utc)
            age = now_utc - last_updated_utc
            if age < timedelta(minutes=CHART_CACHE_DURATION_MINUTES):
                try:
                    payload = json.loads(cached.data_json)
                    chart_data = payload.get("chart")
                    if chart_data is not None:
                        results[ticker] = chart_data
                        hit = True
                except Exception:
                    pass
        if not hit:
            missing_tickers.append(ticker)

    if not missing_tickers:
        return results

    # Step 2: Concurrently fetch uncached tickers without passing SQLAlchemy session to threads
    def _worker(symbol: str):
        data, meta = _fetch_history_from_api(symbol, period, interval)
        return symbol, data, meta

    with ThreadPoolExecutor(max_workers=min(10, len(missing_tickers))) as executor:
        futures_map = {executor.submit(_worker, t): t for t in missing_tickers}
        for future in futures_map:
            try:
                symbol, chart_data, metadata = future.result()
                if chart_data is not None:
                    results[symbol] = chart_data
                    # Step 3: Upsert into SQLite on the main thread safely
                    payload_str = json.dumps({"chart": chart_data, "metadata": metadata})
                    cached_row = db.query(models.ChartCache).filter(
                        models.ChartCache.ticker == symbol,
                        models.ChartCache.period == period,
                        models.ChartCache.interval == interval
                    ).first()
                    if cached_row:
                        cached_row.data_json = payload_str
                        cached_row.last_updated = now_utc
                    else:
                        db.add(models.ChartCache(
                            ticker=symbol,
                            period=period,
                            interval=interval,
                            data_json=payload_str,
                            last_updated=now_utc
                        ))
            except Exception as e:
                print(f"[Concurrent Fetch Error] {futures_map[future]}: {e}")

    db.commit()
    return results


# ============================================================================
# Portfolio Historical Simulation & Currency Conversion Service
# ============================================================================


def _get_cad_price(raw_price: float | None, currency: str, db: Session, ticker: str | None = None) -> float | None:
    """
    Converts a stock price to CAD if needed, based on the STORED currency of the holding.
    Uses the cache-aside live USDCAD exchange rate. Guaranteed never to double-convert CAD stocks.
    """
    if raw_price is None or raw_price is False:
        return raw_price

    target_currency = os.getenv("CURRENCY", "CAD").upper().strip()
    if target_currency != "CAD":
        return raw_price

    # 1. Immediate Canadian Exchange Suffix Check:
    # If the ticker ends with a Canadian exchange suffix (.TO, .NE, .V, .TRT),
    # the raw_price from Yahoo Finance or spot quote is ALREADY 100% IN CAD.
    # We must NEVER multiply by exchange rate even if currency was marked USD in DB/CSV.
    if ticker:
        t_upper = ticker.upper().strip()
        canadian_suffixes = {".TO", ".NE", ".V", ".TRT"}
        if any(t_upper.endswith(s) for s in canadian_suffixes):
            return float(raw_price)
    elif currency and currency.upper() == "CAD":
        return float(raw_price)

    try:
        rate, _, _ = get_stock_price("USDCAD=X", db)
        if rate is not None and rate is not False and rate > 0:
            return float(raw_price) * float(rate)
    except Exception:
        pass

    # Standard fallback rate (~1.37 CAD/USD) if the exchange rate fetch fails.
    return float(raw_price) * 1.37


def calculate_exact_holding_cost(user_id: int, ticker: str, db: Session) -> Decimal:
    """
    Calculates the exact, unrounded cumulative out-of-pocket cost basis for a holding by
    replaying its transaction history (buys/sells) cleanly without division rounding loss.
    """
    txs = db.query(models.StockTransaction).filter(
        models.StockTransaction.user_id == user_id,
        models.StockTransaction.ticker == ticker
    ).order_by(models.StockTransaction.date.asc()).all()

    if not txs:
        # Fallback to Holding table if no transaction logs exist
        holding = db.query(models.Holding).filter(
            models.Holding.user_id == user_id,
            models.Holding.ticker == ticker
        ).first()
        return Decimal(str(holding.avg_cost * holding.shares)) if holding else Decimal("0")

    shares = Decimal("0")
    cost_basis = Decimal("0")

    for tx in txs:
        tx_curr = tx.currency or "CAD"
        converted_total = _get_cad_price(float(tx.total), tx_curr, db, ticker=tx.ticker)
        tx_total_cad = Decimal(str(converted_total if converted_total is not None else tx.total))

        if tx.type == "buy":
            shares += tx.shares
            cost_basis += tx_total_cad
        elif tx.type == "sell":
            if shares > 0:
                avg_cost_per_share = cost_basis / shares
                sold_cost = avg_cost_per_share * tx.shares
                cost_basis = max(Decimal("0"), cost_basis - sold_cost)
            shares = max(Decimal("0"), shares - tx.shares)
        elif tx.type == "dividend":
            if tx.shares > 0:
                # DRIP stock dividend: adds shares without increasing out-of-pocket cash cost
                shares += tx.shares

    return cost_basis


def calculate_portfolio_historical_curve(period: str, user_id: int, db: Session) -> dict:
    """
    Calculates the daily historical valuation curve vs cost basis and cumulative dividends over time
    for a user's entire portfolio.
    """
    period_upper = period.upper().strip()
    if period_upper == "1M":
        yf_period, interval, days_cutoff = "1mo", "1d", 30
    elif period_upper == "3M":
        yf_period, interval, days_cutoff = "3mo", "1d", 90
    elif period_upper == "1Y":
        yf_period, interval, days_cutoff = "1y", "1d", 365
    else:  # ALL / MAX
        period_upper = "ALL"
        yf_period, interval, days_cutoff = "max", "1wk", 3650

    # Query user's transactions and active holdings
    txs = db.query(models.StockTransaction).filter(
        models.StockTransaction.user_id == user_id
    ).order_by(models.StockTransaction.date.asc()).all()
    holdings = db.query(models.Holding).filter(
        models.Holding.user_id == user_id
    ).all()

    unique_tickers = sorted(list({tx.ticker for tx in txs} | {h.ticker for h in holdings}))
    if not unique_tickers:
        return {"period": period_upper, "chart": []}

    # Map currency for each ticker from transactions and holdings
    currency_map = {tx.ticker: (tx.currency or "CAD") for tx in txs}
    currency_map.update({h.ticker: (h.currency or "CAD") for h in holdings})

    # Concurrently fetch history across unique tickers
    history_map = get_multiple_stocks_history(unique_tickers, yf_period, interval, db)

    # Collect distinct trading dates
    distinct_dates = set()
    cutoff_date = date.today() - timedelta(days=days_cutoff)
    for t_sym, points in history_map.items():
        for p in points:
            ts = p["timestamp"]
            try:
                if len(ts) >= 10:
                    dt_date = datetime.fromisoformat(ts[:10]).date()
                    if dt_date >= cutoff_date:
                        distinct_dates.add(dt_date)
            except Exception:
                pass

    sorted_dates = sorted(list(distinct_dates))
    if not sorted_dates:
        return {"period": period_upper, "chart": []}

    portfolio_chart = []
    # Reconstruct share count, cost basis & cumulative dividends day by day
    for D in sorted_dates:
        shares_on_date = {t: Decimal("0") for t in unique_tickers}
        cost_basis_on_date = {t: Decimal("0") for t in unique_tickers}
        dividends_on_date = {t: Decimal("0") for t in unique_tickers}

        for tx in txs:
            if tx.date <= D:
                t_sym = tx.ticker
                tx_curr = tx.currency or "CAD"
                converted_tx_total = _get_cad_price(float(tx.total), tx_curr, db, ticker=t_sym)
                tx_total_cad = Decimal(str(converted_tx_total if converted_tx_total is not None else tx.total))

                if tx.type == "buy":
                    shares_on_date[t_sym] += tx.shares
                    cost_basis_on_date[t_sym] += tx_total_cad
                elif tx.type == "sell":
                    old_shares = shares_on_date[t_sym]
                    if old_shares > 0:
                        avg_cost_per_share = cost_basis_on_date[t_sym] / old_shares
                        sold_cost = avg_cost_per_share * tx.shares
                        cost_basis_on_date[t_sym] = max(Decimal("0"), cost_basis_on_date[t_sym] - sold_cost)
                    shares_on_date[t_sym] = max(Decimal("0"), old_shares - tx.shares)
                elif tx.type == "dividend":
                    if tx.shares > 0:
                        # DRIP / Stock Dividend (add shares and track cumulative dividends received, but do NOT increase out-of-pocket cost basis)
                        shares_on_date[t_sym] += tx.shares
                        dividends_on_date[t_sym] += tx_total_cad
                    else:
                        # Pure Cash Dividend
                        dividends_on_date[t_sym] += tx_total_cad

        daily_value = Decimal("0")
        daily_cost = Decimal("0")
        daily_dividends = Decimal("0")
        has_active_shares = False

        for t_sym in unique_tickers:
            sh = shares_on_date[t_sym]
            div = dividends_on_date[t_sym]
            if sh > 0 or div > 0:
                if sh > 0:
                    has_active_shares = True
                daily_cost += cost_basis_on_date[t_sym]
                daily_dividends += div
                if sh > 0:
                    # Find historical closing price on or before date D
                    pts = history_map.get(t_sym, [])
                    best_price = None
                    for p in pts:
                        ts = p["timestamp"] if len(p["timestamp"]) >= 10 else p["timestamp"][:10]
                        if ts[:10] <= D.isoformat():
                            best_price = p["price"]
                        else:
                            break
                    if best_price is None and pts:
                        best_price = pts[0]["price"]
                    if best_price is not None:
                        price_cad = _get_cad_price(best_price, currency_map.get(t_sym, "CAD"), db, ticker=t_sym)
                        daily_value += sh * Decimal(str(price_cad if price_cad is not None else best_price))

        if has_active_shares or daily_dividends > 0:
            portfolio_chart.append({
                "timestamp": D.isoformat(),
                "portfolio_value": round(float(daily_value), 2),
                "total_cost": round(float(daily_cost), 2),
                "total_dividends": round(float(daily_dividends), 2)
            })

    return {"period": period_upper, "chart": portfolio_chart}
