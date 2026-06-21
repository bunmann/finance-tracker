# Week 6 — Lesson 4: Stock Portfolio — Alpha Vantage API Integration

Up until now, our backend has only talked to our own database. In this lesson, we make our first **outbound API call** — our backend will reach out to an external service (Alpha Vantage) to fetch live stock prices. This is a critical production skill: almost every real application integrates with third-party APIs.

---

## 1. What is Alpha Vantage?

[Alpha Vantage](https://www.alphavantage.co/) provides free stock market data via a REST API. It's one of the most popular free options for personal projects.

**Free tier limits:**
- 25 API calls per day
- Supports US and Canadian stocks
- Returns JSON

**What we'll use:** The `GLOBAL_QUOTE` endpoint — returns the current price for a single stock ticker.

Example request:
```
https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY
```

Example response:
```json
{
    "Global Quote": {
        "01. symbol": "AAPL",
        "02. open": "198.4100",
        "03. high": "199.6200",
        "04. low": "196.0000",
        "05. price": "198.1100",
        "06. volume": "48230912",
        "07. latest trading day": "2026-06-20",
        "08. previous close": "197.5700",
        "09. change": "0.5400",
        "10. change percent": "0.2733%"
    }
}
```

The field we care about most is `"05. price"` — the current stock price.

---

## 2. Getting Your API Key

1. Go to [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. Enter your email and get a free API key
3. It looks something like: `ABCDEF1234567890`

**Never hardcode API keys in your source code.** If you push the code to GitHub, anyone can see and steal your key. Instead, we use **environment variables**.

---

## 3. Environment Variables with `.env` Files

Create a file: **`week3_fastapi/.env`**

```
ALPHA_VANTAGE_API_KEY=your_actual_key_here
```

This file stores secrets locally and is **never committed to Git**. Make sure `.env` is already in your `.gitignore` (it is — check line 14).

### Loading `.env` in Python

The `python-dotenv` library reads `.env` files and loads them as environment variables. After installing it (`pip install python-dotenv`), you use it like this:

```python
import os
from dotenv import load_dotenv

load_dotenv()  # Reads .env file and sets environment variables

api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
```

`os.getenv("KEY")` returns the value of the environment variable, or `None` if it's not set. This is the standard way to access secrets in Python — it works locally (reading `.env`) and in production (reading real environment variables set by the deployment platform).

---

## 4. Building the Stock Service Module

Create a new file: **`week3_fastapi/stock_service.py`**

```python
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

load_dotenv()

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"
CACHE_DURATION_MINUTES = 60  # Consider cached prices "fresh" for 1 hour


def get_stock_price(ticker: str, db: Session) -> float | None:
    """
    Get the current price for a stock ticker.
    
    Strategy:
        1. Check the price_cache table for a fresh price
        2. If stale or missing, fetch from Alpha Vantage API
        3. Save to cache and return
    
    Returns the price as a float, or None if the API call fails.
    """
    ticker = ticker.upper().strip()

    # ── Step 1: Check cache ──
    cached = db.query(models.PriceCache).filter(
        models.PriceCache.ticker == ticker
    ).first()

    if cached:
        age = datetime.now(timezone.utc) - cached.last_updated.replace(tzinfo=timezone.utc)
        if age < timedelta(minutes=CACHE_DURATION_MINUTES):
            return float(cached.price)

    # ── Step 2: Fetch from Alpha Vantage ──
    price = _fetch_price_from_api(ticker)
    
    if price is None:
        # API failed — return stale cache if available, otherwise None
        return float(cached.price) if cached else None

    # ── Step 3: Save to cache (upsert) ──
    if cached:
        cached.price = price
        cached.last_updated = datetime.now(timezone.utc)
    else:
        new_cache = models.PriceCache(
            ticker=ticker,
            price=price,
            last_updated=datetime.now(timezone.utc)
        )
        db.add(new_cache)

    db.commit()
    return price


def _fetch_price_from_api(ticker: str) -> float | None:
    """
    Call the Alpha Vantage GLOBAL_QUOTE endpoint.
    Returns the price as a float, or None on failure.
    """
    if not ALPHA_VANTAGE_API_KEY:
        print("WARNING: ALPHA_VANTAGE_API_KEY not set in .env")
        return None

    try:
        response = requests.get(ALPHA_VANTAGE_BASE_URL, params={
            "function": "GLOBAL_QUOTE",
            "symbol": ticker,
            "apikey": ALPHA_VANTAGE_API_KEY
        }, timeout=10)

        response.raise_for_status()  # Raises an exception for 4xx/5xx status codes
        data = response.json()

        # Parse the price from the response
        quote = data.get("Global Quote", {})
        price_str = quote.get("05. price")

        if not price_str:
            print(f"WARNING: No price data for {ticker}. Response: {data}")
            return None

        return float(price_str)

    except requests.exceptions.Timeout:
        print(f"ERROR: Alpha Vantage request timed out for {ticker}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Alpha Vantage request failed for {ticker}: {e}")
        return None
    except (ValueError, KeyError) as e:
        print(f"ERROR: Could not parse price for {ticker}: {e}")
        return None
```

This is a lot of code, so let's break it into sections.

### The Caching Strategy

```python
# Step 1: Check cache
cached = db.query(models.PriceCache).filter(
    models.PriceCache.ticker == ticker
).first()

if cached:
    age = datetime.now(timezone.utc) - cached.last_updated.replace(tzinfo=timezone.utc)
    if age < timedelta(minutes=CACHE_DURATION_MINUTES):
        return float(cached.price)  # Cache hit! No API call needed.
```

This is the **cache-aside pattern** (also called lazy loading):
1. Check the cache first
2. If the data is fresh (less than 60 minutes old), return it immediately — **zero API calls**
3. If the cache is stale or missing, fetch fresh data from the API
4. Save the fresh data to the cache for next time

### Graceful Degradation

```python
if price is None:
    return float(cached.price) if cached else None
```

If the API call fails (network error, rate limit exceeded, etc.), we return the **stale cached price** rather than nothing. A 2-hour-old price is better than no price at all. This is called **graceful degradation** — the system continues to work (with reduced quality) when a dependency fails.

### The API Call

```python
response = requests.get(ALPHA_VANTAGE_BASE_URL, params={
    "function": "GLOBAL_QUOTE",
    "symbol": ticker,
    "apikey": ALPHA_VANTAGE_API_KEY
}, timeout=10)
```

`requests.get()` makes an HTTP GET request — the same thing your browser does when you visit a URL, but from Python. The `params` dict is automatically appended as query string parameters:

```
https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=ABC123
```

`timeout=10` means: if the server doesn't respond within 10 seconds, give up. Without a timeout, your API could hang forever if Alpha Vantage is down.

### Error Handling

```python
response.raise_for_status()  # Raises exception for 4xx/5xx
```

If the API returns an error status code (400, 401, 500, etc.), this raises an exception that we catch in the `except` block. Without this, `response.json()` would still succeed but return an error message instead of stock data.

```python
except requests.exceptions.Timeout:
    ...
except requests.exceptions.RequestException as e:
    ...
except (ValueError, KeyError) as e:
    ...
```

We handle three categories of failure:
1. **Timeout** — server took too long
2. **RequestException** — network error, DNS failure, connection refused, etc.
3. **ValueError/KeyError** — API returned unexpected JSON structure

### The Underscore Prefix

```python
def _fetch_price_from_api(ticker: str) -> float | None:
```

The `_` prefix is a Python convention meaning "this function is private/internal." It signals to other developers: "don't call this directly — use `get_stock_price()` instead, which handles caching."

---

## 5. Loading Environment Variables at Startup

Update **`database.py`** (or create a config module) to load `.env` at the very start. Actually, since `stock_service.py` already calls `load_dotenv()`, you're fine — but it's good practice to call it once in `main.py` as well:

Add to the top of **`main.py`**:

```python
from dotenv import load_dotenv
load_dotenv()
```

This ensures environment variables are available everywhere in the application, not just in `stock_service.py`.

---

## 6. Quick Test Endpoint

Let's add a simple test endpoint to verify the API integration works. Add this to **`routers/stocks.py`**:

```python
from stock_service import get_stock_price

@router.get("/price/{ticker}")
def get_price(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get the current price for a stock ticker."""
    price = get_stock_price(ticker, db)
    if price is None:
        raise HTTPException(status_code=404, detail=f"Could not fetch price for {ticker}")
    return {"ticker": ticker.upper(), "price": price}
```

Test it in Swagger:
- `GET /stocks/price/AAPL` → `{"ticker": "AAPL", "price": 198.11}`
- Call it again immediately → should be fast (cached!)
- `GET /stocks/price/INVALIDTICKER` → should return a 404

---

## 7. Your Task

1. Get your free Alpha Vantage API key from [alphavantage.co](https://www.alphavantage.co/support/#api-key).
2. Create `week3_fastapi/.env` with your API key. Verify `.env` is in `.gitignore`.
3. Install dependencies: `pip install requests python-dotenv`
4. Create `week3_fastapi/stock_service.py` with the caching + API fetch logic.
5. Add `load_dotenv()` to the top of `main.py`.
6. Add the `GET /stocks/price/{ticker}` test endpoint to `routers/stocks.py`.
7. Reset the database and test:
   - Fetch a real stock price (AAPL, TSLA, etc.)
   - Call it twice — second call should be instant (cached)
   - Try an invalid ticker — should return 404

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **External API consumption** | Making HTTP requests from your backend to third-party services |
| **Environment variables (`.env`)** | Store secrets outside source code, loaded at runtime |
| **`python-dotenv`** | Reads `.env` files and sets them as environment variables |
| **Cache-aside pattern** | Check cache → if stale/missing, fetch from source → save to cache |
| **Graceful degradation** | Return stale data instead of nothing when the API fails |
| **`requests.get()`** | Python's standard library for making HTTP requests |
| **`timeout`** | Prevent hanging forever if the external service is down |
| **`response.raise_for_status()`** | Turn HTTP error codes into Python exceptions |
| **`_private_function()`** | Underscore prefix convention for internal/private functions |
