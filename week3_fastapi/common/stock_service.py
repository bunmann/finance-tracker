# ============================================================================
# File: stock_service.py
# Description: Fetches live stock prices from Yahoo Finance (yfinance) with caching.
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
      
    Args:
        ticker (str): The stock symbol (e.g., "AAPL").
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

    # Database Cache Upsert Logic
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


def _fetch_price_from_api(ticker: str) -> float | None | bool:
    """
    Fetches the current price for a stock ticker from Yahoo Finance (yfinance).
    
    Args:
        ticker (str): The normalized ticker symbol.
        
    Returns:
        float | None | bool: 
            - float: The parsed stock price.
            - False: The stock symbol is definitely invalid.
            - None: The request failed due to connection issues.
    """
    try:
        ticker_obj = yf.Ticker(ticker)
        price = ticker_obj.fast_info.last_price

        if price is None:
            # If yfinance successfully returned but the price is None, the symbol does not exist
            print(f"WARNING: Symbol '{ticker}' does not exist on Yahoo Finance.")
            return False

        return float(price)

    except Exception as e:
        print(f"ERROR: Failed to fetch price from yfinance for {ticker}: {e}")
        return None
