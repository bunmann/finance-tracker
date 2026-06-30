# ============================================================================
# File: stock_service.py
# Description: Fetches live stock prices from Yahoo Finance (yfinance) with caching,
#              and resolves ambiguous ticker symbols to their correct exchange suffix.
# ============================================================================
import os
import yfinance as yf
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import models

# Explicitly trigger loading of environmental configurations at module import
load_dotenv()

# Caching Strategy: We consider cached prices "fresh" for 60 minutes.
# This keeps response times ultra-fast and avoids unnecessary network requests.
CACHE_DURATION_MINUTES = 60


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
