# Week 6 — Lesson 5: Stock Portfolio — CRUD Endpoints & Business Logic

In this lesson, we implement the real stock portfolio API — buy, sell, dividend, and portfolio view. Unlike simple CRUD (where you just save data to a table), stock trading requires **business logic**: calculating weighted average cost basis, tracking realized gains, and ensuring you can't sell more shares than you own.

---

## 1. The Financial Math

Before writing any code, let's understand the calculations.

### Cost Basis (Average Cost per Share)

When you buy a stock multiple times at different prices, you need to know your **average cost per share** — this determines your profit or loss when you sell.

**Example:**
- Buy 10 shares of AAPL at $100 → spent $1,000
- Buy 5 shares of AAPL at $120 → spent $600

```
Total shares: 10 + 5 = 15
Total spent: $1,000 + $600 = $1,600
Average cost: $1,600 / 15 = $106.67 per share
```

**Formula (for adding to an existing position):**
```
new_avg_cost = (existing_shares × existing_avg_cost + new_shares × new_price) / (existing_shares + new_shares)
```

### Unrealized Gain/Loss

"Unrealized" means you haven't sold yet — it's a **paper profit or loss**.

```
unrealized_gain = (current_price - avg_cost) × shares
```

If AAPL is currently at $130 and you own 15 shares at avg cost $106.67:
```
unrealized_gain = ($130 - $106.67) × 15 = $350 profit
```

### Realized Gain/Loss

When you **sell**, the gain/loss becomes "realized" — you've locked in the profit or loss.

```
realized_gain = (sell_price - avg_cost) × shares_sold
```

Sell 5 shares at $130 with avg cost $106.67:
```
realized_gain = ($130 - $106.67) × 5 = $116.65 profit
```

---

## 2. The Buy Endpoint

Replace the placeholder in **`routers/stocks.py`**:

```python
from decimal import Decimal

@router.post("/buy")
def buy_stock(
    trade: StockTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Log a stock purchase.
    - If the user already holds this ticker: update shares and avg cost
    - If new ticker: create a new holding
    """
    ticker = trade.ticker.upper().strip()
    shares = Decimal(str(trade.shares))
    price = Decimal(str(trade.price))
    total = shares * price

    # 1. Log the transaction
    tx_date = trade.date if trade.date else date.today()
    
    db_transaction = models.StockTransaction(
        user_id=current_user.id,
        ticker=ticker,
        type="buy",
        shares=shares,
        price=price,
        total=total,
        date=tx_date
    )
    db.add(db_transaction)

    # 2. Update or create the holding
    holding = db.query(models.Holding).filter(
        models.Holding.user_id == current_user.id,
        models.Holding.ticker == ticker
    ).first()

    if holding:
        # Existing holding — recalculate weighted average cost
        old_total = holding.shares * holding.avg_cost
        new_total = old_total + total
        holding.shares = holding.shares + shares
        holding.avg_cost = new_total / holding.shares
    else:
        # New holding
        holding = models.Holding(
            user_id=current_user.id,
            ticker=ticker,
            shares=shares,
            avg_cost=price
        )
        db.add(holding)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction
```

### Why `Decimal(str(trade.shares))`?

```python
shares = Decimal(str(trade.shares))
```

Pydantic gives us a Python `float`, but we need exact `Decimal` for math. The trick: convert float → string → Decimal. Going directly from float to Decimal (`Decimal(0.1)`) preserves the floating-point error. Going through a string (`Decimal("0.1")`) gives us the exact value.

```python
>>> Decimal(0.1)
Decimal('0.1000000000000000055511151231257827021181583404541015625')

>>> Decimal(str(0.1))
Decimal('0.1')
```

### The Weighted Average Calculation

```python
old_total = holding.shares * holding.avg_cost     # Total cost of existing shares
new_total = old_total + total                      # Total cost of all shares
holding.shares = holding.shares + shares           # Total share count
holding.avg_cost = new_total / holding.shares      # New average cost
```

This is the core financial math. Walk through an example:
- Existing: 10 shares at $100 avg → `old_total = 10 × 100 = $1,000`
- Buying: 5 shares at $120 → `total = 5 × 120 = $600`
- New total cost: `$1,000 + $600 = $1,600`
- New shares: `10 + 5 = 15`
- New avg cost: `$1,600 / 15 = $106.67`

---

## 3. The Sell Endpoint

```python
@router.post("/sell")
def sell_stock(
    trade: StockTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Log a stock sale.
    - Validates the user has enough shares
    - Calculates realized gain/loss
    - Updates (or deletes) the holding
    """
    ticker = trade.ticker.upper().strip()
    shares = Decimal(str(trade.shares))
    price = Decimal(str(trade.price))
    total = shares * price

    # 1. Check if user holds this stock
    holding = db.query(models.Holding).filter(
        models.Holding.user_id == current_user.id,
        models.Holding.ticker == ticker
    ).first()

    if not holding:
        raise HTTPException(status_code=400, detail=f"You don't hold any {ticker} shares")

    if holding.shares < shares:
        raise HTTPException(
            status_code=400,
            detail=f"You only have {holding.shares} shares of {ticker}, cannot sell {shares}"
        )

    # 2. Calculate realized gain/loss
    realized_gain = (price - holding.avg_cost) * shares

    # 3. Log the transaction
    tx_date = trade.date if trade.date else date.today()

    db_transaction = models.StockTransaction(
        user_id=current_user.id,
        ticker=ticker,
        type="sell",
        shares=shares,
        price=price,
        total=total,
        date=tx_date
    )
    db.add(db_transaction)

    # 4. Update the holding
    holding.shares = holding.shares - shares

    if holding.shares == 0:
        # Sold all shares — remove the holding entirely
        db.delete(holding)
    # Note: avg_cost stays the same when selling (only changes on buys)

    db.commit()
    db.refresh(db_transaction)
    return {
        "transaction": db_transaction,
        "realized_gain": float(realized_gain)
    }
```

### Key Points

**Validation first:** We check that the user actually holds the stock AND has enough shares before allowing the sale. This prevents impossible states in the database.

**Average cost doesn't change on sell:** If you own 15 shares at $106.67 and sell 5, the remaining 10 shares still have an avg cost of $106.67. Average cost only changes when you buy more.

**Delete holding when empty:** If the user sells all their shares of a stock, we delete the holding row entirely. This keeps the portfolio view clean — no zero-share rows cluttering the response.

---

## 4. The Portfolio Endpoint

Update the placeholder `get_portfolio` endpoint:

```python
from stock_service import get_stock_price

@router.get("/portfolio")
def get_portfolio(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all holdings with current prices and unrealized P&L."""
    holdings = db.query(models.Holding).filter(
        models.Holding.user_id == current_user.id
    ).all()

    portfolio = []
    total_value = Decimal("0")
    total_cost = Decimal("0")

    for holding in holdings:
        current_price = get_stock_price(holding.ticker, db)
        
        market_value = Decimal(str(current_price)) * holding.shares if current_price else None
        cost_basis = holding.avg_cost * holding.shares
        unrealized_gain = market_value - cost_basis if market_value else None
        gain_percent = (unrealized_gain / cost_basis * 100) if unrealized_gain and cost_basis else None

        portfolio.append({
            "ticker": holding.ticker,
            "shares": float(holding.shares),
            "avg_cost": float(holding.avg_cost),
            "current_price": current_price,
            "market_value": float(market_value) if market_value else None,
            "cost_basis": float(cost_basis),
            "unrealized_gain": float(unrealized_gain) if unrealized_gain else None,
            "gain_percent": float(gain_percent) if gain_percent else None,
        })

        if market_value:
            total_value += market_value
        total_cost += cost_basis

    return {
        "holdings": portfolio,
        "total_value": float(total_value),
        "total_cost": float(total_cost),
        "total_gain": float(total_value - total_cost),
    }
```

This endpoint does several things:
1. Loads all the user's holdings
2. For each holding, fetches the current price (from cache or API)
3. Calculates unrealized gain/loss per holding
4. Returns the full portfolio with totals

### Don't forget the imports

Add these at the top of `routers/stocks.py`:

```python
from decimal import Decimal
from datetime import date
from stock_service import get_stock_price
```

---

## 5. Testing the Full Flow

### Test 1: Buy stocks
```json
POST /stocks/buy
{"ticker": "AAPL", "shares": 10, "price": 198.50, "date": "2026-06-01"}

POST /stocks/buy
{"ticker": "AAPL", "shares": 5, "price": 205.00, "date": "2026-06-15"}

POST /stocks/buy
{"ticker": "TSLA", "shares": 3, "price": 245.00, "date": "2026-06-10"}
```

### Test 2: Check portfolio
```
GET /stocks/portfolio
```
Expected: AAPL with 15 shares, avg cost ~$200.67. TSLA with 3 shares, avg cost $245.00. Both with current prices and unrealized P&L.

### Test 3: Sell shares
```json
POST /stocks/sell
{"ticker": "AAPL", "shares": 5, "price": 210.00}
```
Expected: Realized gain = (210 - 200.67) × 5 = ~$46.67. Holding updated to 10 shares.

### Test 4: Sell all shares
```json
POST /stocks/sell
{"ticker": "TSLA", "shares": 3, "price": 250.00}
```
Expected: TSLA holding deleted. Portfolio now shows only AAPL.

### Test 5: Can't over-sell
```json
POST /stocks/sell
{"ticker": "AAPL", "shares": 100, "price": 210.00}
```
Expected: 400 error — "You only have 10 shares of AAPL, cannot sell 100"

---

## 6. Your Task

1. Implement the `POST /stocks/buy` endpoint with weighted average cost basis calculation.
2. Implement the `POST /stocks/sell` endpoint with validation and realized gain/loss.
3. Update `GET /stocks/portfolio` to include live prices and unrealized P&L.
4. Add imports: `Decimal`, `date`, `get_stock_price`.
5. Test the full flow: buy → portfolio → sell → portfolio → edge cases.

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **Weighted average cost basis** | `new_avg = (old_shares × old_avg + new_shares × new_price) / total_shares` |
| **Realized vs. unrealized gain** | Realized = sold (locked in). Unrealized = still holding (paper profit/loss) |
| **`Decimal(str(float_val))`** | Convert float → string → Decimal for exact financial math |
| **Business logic validation** | Check holdings exist and have enough shares before allowing a sell |
| **Atomic operations** | Buy = log transaction + update holding in one commit (both succeed or both fail) |
| **Graceful null handling** | If price fetch fails, show `null` for market value instead of crashing |
