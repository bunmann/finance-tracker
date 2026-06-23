# ============================================================================
# File: stock_service.py
# Description: Fetches live stock prices from Alpha Vantage API with caching.
# ============================================================================
import os
import requests
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import models

# Explicitly trigger loading of environmental configurations at module import
load_dotenv()

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

# Caching Strategy: We consider cached prices "fresh" for 60 minutes.
# This prevents our backend from hitting Alpha Vantage's strict 25 calls/day free limit.
CACHE_DURATION_MINUTES = 60


def get_stock_price(ticker: str, db: Session) -> tuple[float | None, datetime | None, bool]:
    """
    Retrieves the current market price for a given stock ticker along with metadata.
    
    This function implements a cache-aside pattern:
      1. Inspects the SQLite `price_cache` table for a fresh price.
      2. Serves the cached price directly if it is less than 60 minutes old.
      3. Otherwise, requests the current price from the Alpha Vantage API.
      4. Saves the retrieved price to the SQLite cache (upserts).
      5. Gracefully degrades to stale cached data if the external API fails.
      
    Args:
        ticker (str): The stock symbol (e.g., "AAPL").
        db (Session): The database session.
        
    Returns:
        tuple[float | None, datetime | None, bool]:
            - price (float | None): The stock price, or None if unavailable.
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
        
        # Serving from cache saves bandwidth, respects rate-limits, and response is immediate
        if age < timedelta(minutes=CACHE_DURATION_MINUTES):
            return float(cached.price), cached.last_updated, False

    # ── Step 2: Fetch Live Price from External API ──
    price = _fetch_price_from_api(ticker)
    
    # ── Step 3: Handle Failures & Caching Updates ──
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


def _fetch_price_from_api(ticker: str) -> float | None:
    """
    Sends an outbound HTTP GET request to the Alpha Vantage GLOBAL_QUOTE API.
    
    Args:
        ticker (str): The normalized ticker symbol.
        
    Returns:
        float | None: The parsed stock price, or None if network or parsing fails.
    """
    if not ALPHA_VANTAGE_API_KEY or ALPHA_VANTAGE_API_KEY == "your_actual_key_here":
        print("WARNING: ALPHA_VANTAGE_API_KEY not configured or using default placeholder.")
        return None

    try:
        response = requests.get(ALPHA_VANTAGE_BASE_URL, params={
            "function": "GLOBAL_QUOTE",
            "symbol": ticker,
            "apikey": ALPHA_VANTAGE_API_KEY
        }, timeout=10) # 10-second timeout ensures our backend doesn't freeze if Alpha Vantage hangs

        # Turn HTTP error statuses (4xx, 5xx) into exceptions to trigger our catch blocks
        response.raise_for_status()  
        data = response.json()

        # Parse response schema: Alpha Vantage wraps the result under a "Global Quote" key
        quote = data.get("Global Quote", {})
        price_str = quote.get("05. price")

        if not price_str:
            # Handles API return formats when we exceed rate limits or symbols are invalid
            # Note: Alpha Vantage returns a successful 200 OK containing warning messages on errors
            print(f"WARNING: No price data returned for {ticker}. API Response: {data}")
            return None

        return float(price_str)

    except requests.exceptions.Timeout:
        print(f"ERROR: Alpha Vantage request timed out for {ticker}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Outbound request to Alpha Vantage failed for {ticker}: {e}")
        return None
    except (ValueError, KeyError) as e:
        print(f"ERROR: Could not parse price output for {ticker}: {e}")
        return None
