# Week 6 — Lesson 3: Stock Portfolio — Schema & Models

We're shifting domains. For the past 5 weeks, we've been building a personal **expense tracker**. Now we're adding a **stock portfolio tracker** — a completely different feature that tracks your investments, calculates profit/loss, and fetches live stock prices.

This lesson is all about **designing the database schema** before writing any API logic. Good schema design is the foundation of everything that follows.

---

## 1. What We're Building

A stock portfolio tracker that lets users:
- **Buy stocks** — record a purchase (ticker, quantity, price)
- **Sell stocks** — record a sale (ticker, quantity, price, calculate profit)
- **Track dividends** — record dividend payments received
- **View portfolio** — see all current holdings with live prices and P&L (profit & loss)
- **Import trades** — upload Wealthsimple/Questrade CSV exports (Lesson 7)

### The Data Model

We need three new tables:

| Table | Purpose |
|---|---|
| `holdings` | Current state: what stocks you own right now (ticker, shares, avg cost) |
| `stock_transactions` | History: every buy, sell, and dividend ever logged |
| `price_cache` | Performance: cached stock prices so we don't hit the API every request |

---

## 2. Why Three Tables?

You might wonder: "Can't I just have one table with all the buys and sells, and calculate holdings from that?"

You *could*, but it gets expensive. Every time someone views their portfolio, you'd need to:
1. Query ALL their stock transactions (could be hundreds)
2. Group by ticker
3. Sum up shares bought vs. sold
4. Calculate the weighted average cost basis

With a `holdings` table, the current state is pre-computed:

```
Without holdings table:  SELECT all 500 trades → compute in Python → return
With holdings table:     SELECT 12 holdings → return (already up to date)
```

The `holdings` table acts as a **materialized view** — a snapshot that gets updated on every buy/sell, so reads are fast.

---

## 3. The Holdings Table

The `holdings` table represents what the user currently owns:

```python
class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String(10), nullable=False)           # e.g., "AAPL", "TSLA"
    shares = Column(Numeric(12, 4), nullable=False)       # e.g., 5.0000 (supports fractional)
    avg_cost = Column(Numeric(12, 4), nullable=False)     # weighted average cost per share
    
    # Each user can only have one holding per ticker
    __table_args__ = (UniqueConstraint('user_id', 'ticker', name='_user_ticker_uc'),)
```

### Key Design Decisions

**`ticker` as String(10):** Stock symbols are short — `AAPL`, `TSLA`, `VOO`, `SHOP.TO`. 10 characters is more than enough.

**`shares` as Numeric(12, 4):** Not an integer! Many brokerages (especially Wealthsimple) support **fractional shares** — you can buy 0.5 shares of Amazon. `Numeric(12, 4)` gives us up to 12 total digits with 4 decimal places (max: 99,999,999.9999).

**`avg_cost` as Numeric(12, 4):** This is the **weighted average cost basis**. If you buy 10 shares at $100 and then 5 shares at $120:

```
avg_cost = (10 × $100 + 5 × $120) / (10 + 5)
         = ($1000 + $600) / 15
         = $106.67
```

We'll calculate this in the buy endpoint (Lesson 5).

**`UNIQUE(user_id, ticker)`:** One holding row per stock per user. When the user buys more of a stock they already own, we **update** the existing row (add shares, recalculate avg_cost) rather than creating a new one.

### Why Numeric Instead of Float?

This is critical for financial applications:

```python
>>> 0.1 + 0.2
0.30000000000000004  # ← Floating point error!
```

Floats are **approximate** — they store numbers in binary and can't represent most decimal fractions exactly. For money, this is unacceptable (imagine your portfolio value being off by $0.01 on every trade).

`Numeric` (also called `Decimal`) stores numbers as **exact decimal values**. It's slower than float, but precision matters more than speed for financial math.

---

## 4. The Stock Transactions Table

This is the **history log** — every buy, sell, and dividend:

```python
class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String(10), nullable=False)
    type = Column(String(10), nullable=False)             # "buy", "sell", or "dividend"
    shares = Column(Numeric(12, 4), nullable=False)       # number of shares traded
    price = Column(Numeric(12, 4), nullable=False)        # price per share at time of trade
    total = Column(Numeric(12, 2), nullable=False)        # total value (shares × price)
    date = Column(Date, nullable=False)
    fingerprint = Column(String(64), nullable=True, index=True)  # for CSV import dedup
```

### Why Store Both `shares`, `price`, AND `total`?

Isn't `total = shares × price`? Yes, but:
- Storing the pre-computed total saves calculation on every query
- It handles rounding correctly at the point of insertion (rather than re-rounding on every read)
- Some brokerage CSVs give you the total but not the per-share price (or vice versa) — having both fields lets us accept either format

### The `fingerprint` Column

Same pattern as bank transactions — SHA256 hash for deduplication when importing from brokerage CSVs (Lesson 7).

---

## 5. The Price Cache Table

We'll be fetching live stock prices from Alpha Vantage (Lesson 4). But the free tier only allows **25 API calls per day**. If a user has 10 stocks and refreshes their portfolio 3 times, that's 30 calls — over the limit.

Solution: **cache prices** in the database.

```python
class PriceCache(Base):
    __tablename__ = "price_cache"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), unique=True, nullable=False)
    price = Column(Numeric(12, 4), nullable=False)
    last_updated = Column(DateTime, nullable=False)
```

The caching strategy (implemented in Lesson 4):
1. User requests portfolio → need AAPL price
2. Check `price_cache` for AAPL
3. If found AND `last_updated` is within the last hour → use cached price
4. If not found OR stale → fetch from Alpha Vantage API → save to cache → return

### Why `unique=True` on `ticker`?

There's only one current price for AAPL — we don't need multiple rows. When we update the price, we overwrite the existing row.

### Why This Cache Is Global

Notice there's no `user_id` column. Stock prices are the same for everyone — AAPL is $198.50 regardless of who's asking. So we share one cache across all users.

---

## 6. Adding the Models to models.py

Update **`models.py`** with all three new models. You'll need to add `DateTime` to the SQLAlchemy imports:

```python
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, UniqueConstraint
```

Then add the three classes from sections 3, 4, and 5 below the existing models.

---

## 7. Pydantic Schemas

Add these to **`schemas.py`** for request validation:

```python
class StockTransactionCreate(BaseModel):
    ticker: str
    shares: float = Field(gt=0, description="Number of shares must be positive")
    price: float = Field(gt=0, description="Price per share must be positive")
    date: Optional[DateType] = None
```

This schema is used for both buy and sell requests. The `type` field ("buy", "sell", "dividend") will be set by the endpoint, not the user — different endpoints for different actions.

---

## 8. Creating the Router Skeleton

Create **`routers/stocks.py`** with placeholder endpoints:

```python
# ============================================================================
# File: routers/stocks.py
# Description: Stock portfolio endpoints: buy, sell, dividend, portfolio view.
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from schemas import StockTransactionCreate
import models

router = APIRouter(
    prefix="/stocks",
    tags=["Stocks"]
)


@router.get("/portfolio")
def get_portfolio(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all holdings with current prices and P&L."""
    # TODO: Implement in Lesson 5
    holdings = db.query(models.Holding).filter(
        models.Holding.user_id == current_user.id
    ).all()
    return holdings


@router.get("/transactions")
def get_stock_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get stock transaction history."""
    transactions = db.query(models.StockTransaction).filter(
        models.StockTransaction.user_id == current_user.id
    ).order_by(models.StockTransaction.date.desc()).all()
    return transactions


@router.post("/buy")
def buy_stock(
    trade: StockTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Log a stock purchase."""
    # TODO: Implement in Lesson 5
    pass


@router.post("/sell")
def sell_stock(
    trade: StockTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Log a stock sale."""
    # TODO: Implement in Lesson 5
    pass
```

### Register the Router

Add to **`main.py`**:

```python
from routers import auth, transactions, categories, dashboard, stocks
```

And:

```python
app.include_router(stocks.router)
```

---

## 9. Your Task

1. Update `models.py`:
   - Add `DateTime` to the SQLAlchemy imports
   - Add the `Holding`, `StockTransaction`, and `PriceCache` models
2. Update `schemas.py`:
   - Add `StockTransactionCreate`
3. Create `routers/stocks.py` with the placeholder endpoints
4. Register the stocks router in `main.py`
5. Reset the database (`POST /debug/reset-db`) to create the new tables
6. Verify in Swagger (`http://localhost:8000/docs`) that the new `/stocks/` endpoints appear

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **Materialized view (holdings table)** | Pre-computed snapshot of current state — fast reads, updated on writes |
| **Numeric vs Float** | `Numeric` stores exact decimals; `Float` has rounding errors — never use float for money |
| **Weighted average cost basis** | `(old_shares × old_avg + new_shares × new_price) / total_shares` |
| **Price caching** | Store API responses in the database to avoid hitting rate limits |
| **UNIQUE constraint** | One holding per ticker per user; one cached price per ticker globally |
| **Fingerprint column** | SHA256 hash for deduplication during brokerage CSV imports |
| **Router skeleton** | Define endpoints with `pass`/`TODO` to plan the API structure before writing logic |
