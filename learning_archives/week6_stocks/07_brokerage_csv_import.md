# Week 6 — Lesson 7: Brokerage CSV Import (Wealthsimple / Questrade)

In Lesson 5, users had to manually enter every stock trade. In the real world, people have hundreds of trades across months or years. In this lesson, we build a **brokerage CSV importer** that accepts trade history exports from **Wealthsimple** and **Questrade** (Canada's two most popular brokerages) and bulk-imports them into the portfolio.

This is the same pattern as the bank CSV importer from Week 5 — but now we're parsing stock trades instead of expenses, and we need to handle **multiple CSV formats** from different brokerages.

---

## 1. What Brokerage Exports Look Like

### Wealthsimple (Activity → Export CSV)

```csv
Date,Type,Description,Symbol,Quantity,Price,Amount
2026-06-15,buy,Market order,AAPL,5,198.50,-992.50
2026-06-10,sell,Limit order,TSLA,2,245.00,490.00
2026-06-01,dividend,,VOO,,0,12.34
2026-05-28,buy,Market order,SHOP.TO,10,95.25,-952.50
```

Key observations:
- `Type` is lowercase: `buy`, `sell`, `dividend`
- `Amount` is negative for buys (money going out), positive for sells/dividends
- Dividends have empty `Quantity` and `Price` fields
- Canadian stocks have `.TO` suffix

### Questrade (Reports → Account Activity → Export)

```csv
Transaction Date,Action,Symbol,Quantity,Price,Commission,Net Amount
2026-06-15,Buy,AAPL,5,198.50,4.95,-997.45
2026-06-10,Sell,TSLA,2,245.00,4.95,485.05
2026-06-01,DIV,VOO,,,0,12.34
```

Key differences from Wealthsimple:
- Column names are different (`Transaction Date` vs `Date`, `Action` vs `Type`)
- `Action` uses different casing (`Buy` vs `buy`, `DIV` vs `dividend`)
- Has a `Commission` column (Wealthsimple has no commission)
- `Net Amount` includes commission

---

## 2. The Strategy Pattern: Auto-Detecting the Format

Rather than making the user tell us which brokerage they use, we **inspect the CSV headers** and pick the right parser automatically. This is called the **strategy pattern** — choose a strategy (parser) based on the input.

```python
def detect_brokerage(headers: list[str]) -> str:
    """Detect which brokerage exported this CSV based on column headers."""
    header_set = {h.strip().lower() for h in headers}
    
    if "transaction date" in header_set and "action" in header_set:
        return "questrade"
    elif "date" in header_set and "type" in header_set and "symbol" in header_set:
        return "wealthsimple"
    else:
        return "unknown"
```

Simple and effective — if the CSV has `Transaction Date` and `Action` columns, it's Questrade. If it has `Date`, `Type`, and `Symbol`, it's Wealthsimple.

---

## 3. Building the Parsers

Each parser normalizes the brokerage-specific format into our unified schema:

```python
# Unified output: what every parser returns
{
    "ticker": "AAPL",
    "type": "buy",       # "buy", "sell", or "dividend"
    "shares": 5.0,
    "price": 198.50,
    "total": 992.50,
    "date": date(2026, 6, 15)
}
```

### Wealthsimple Parser

```python
def parse_wealthsimple_row(row: dict) -> dict | None:
    """Parse a single row from a Wealthsimple CSV export."""
    tx_type = row.get("Type", "").strip().lower()
    
    # Skip non-trade rows (e.g., deposits, withdrawals, fees)
    if tx_type not in ("buy", "sell", "dividend"):
        return None
    
    ticker = row.get("Symbol", "").strip().upper()
    if not ticker:
        return None
    
    date_str = row.get("Date", "").strip()
    tx_date = parse_trade_date(date_str)
    if not tx_date:
        return None
    
    if tx_type == "dividend":
        amount_str = row.get("Amount", "0").strip()
        return {
            "ticker": ticker,
            "type": "dividend",
            "shares": 0,
            "price": 0,
            "total": abs(float(amount_str)),
            "date": tx_date
        }
    
    shares = float(row.get("Quantity", "0").strip() or "0")
    price = float(row.get("Price", "0").strip() or "0")
    total = shares * price
    
    return {
        "ticker": ticker,
        "type": tx_type,
        "shares": shares,
        "price": price,
        "total": total,
        "date": tx_date
    }
```

### Questrade Parser

```python
def parse_questrade_row(row: dict) -> dict | None:
    """Parse a single row from a Questrade CSV export."""
    action = row.get("Action", "").strip().lower()
    
    # Normalize Questrade action names
    type_map = {"buy": "buy", "sell": "sell", "div": "dividend", "dividend": "dividend"}
    tx_type = type_map.get(action)
    if not tx_type:
        return None
    
    ticker = row.get("Symbol", "").strip().upper()
    if not ticker:
        return None
    
    date_str = row.get("Transaction Date", "").strip()
    tx_date = parse_trade_date(date_str)
    if not tx_date:
        return None
    
    if tx_type == "dividend":
        amount_str = row.get("Net Amount", "0").strip()
        return {
            "ticker": ticker,
            "type": "dividend",
            "shares": 0,
            "price": 0,
            "total": abs(float(amount_str)),
            "date": tx_date
        }
    
    shares = float(row.get("Quantity", "0").strip() or "0")
    price = float(row.get("Price", "0").strip() or "0")
    total = shares * price
    
    return {
        "ticker": ticker,
        "type": tx_type,
        "shares": shares,
        "price": price,
        "total": total,
        "date": tx_date
    }
```

### Date Parser

```python
def parse_trade_date(date_str: str):
    """Parse dates in common formats used by brokerages."""
    formats = ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None
```

---

## 4. The Import Endpoint

Add to **`routers/stocks.py`**:

```python
from fastapi import UploadFile, File
from collections import defaultdict
import csv
import io
import hashlib
from datetime import datetime

@router.post("/import-csv")
def import_stock_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Import stock trades from a brokerage CSV (Wealthsimple or Questrade).
    Auto-detects the brokerage format from CSV headers.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV.")

    try:
        contents = file.file.read().decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File content is not valid text.")

    reader = csv.DictReader(io.StringIO(contents))
    headers = reader.fieldnames or []

    # Auto-detect brokerage
    brokerage = detect_brokerage(headers)
    if brokerage == "unknown":
        raise HTTPException(
            status_code=400,
            detail="Unrecognized CSV format. Supported: Wealthsimple, Questrade."
        )

    # Pick the right parser
    parser = parse_wealthsimple_row if brokerage == "wealthsimple" else parse_questrade_row

    imported = 0
    skipped = 0
    errors = []
    occurrence_tracker = defaultdict(int)

    for row_num, row in enumerate(reader, start=2):
        try:
            parsed = parser(row)
            if parsed is None:
                continue  # Non-trade row (deposit, fee, etc.)

            # Fingerprint for deduplication
            row_key = (parsed["date"].isoformat(), parsed["ticker"], parsed["type"], str(parsed["shares"]))
            occurrence_tracker[row_key] += 1
            occurrence = occurrence_tracker[row_key]

            fingerprint = hashlib.sha256(
                f"{parsed['date'].isoformat()}|{parsed['ticker']}|{parsed['type']}|{parsed['shares']}|{occurrence}".encode()
            ).hexdigest()

            # Check for duplicates
            existing = db.query(models.StockTransaction).filter(
                models.StockTransaction.fingerprint == fingerprint,
                models.StockTransaction.user_id == current_user.id
            ).first()

            if existing:
                skipped += 1
                continue

            # Create the stock transaction
            db_tx = models.StockTransaction(
                user_id=current_user.id,
                ticker=parsed["ticker"],
                type=parsed["type"],
                shares=parsed["shares"],
                price=parsed["price"],
                total=parsed["total"],
                date=parsed["date"],
                fingerprint=fingerprint
            )
            db.add(db_tx)

            # Update holdings (reuse buy/sell logic)
            if parsed["type"] == "buy":
                _update_holding_buy(db, current_user.id, parsed)
            elif parsed["type"] == "sell":
                _update_holding_sell(db, current_user.id, parsed)
            # Dividends don't affect holdings

            imported += 1

        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    db.commit()

    return {
        "brokerage_detected": brokerage,
        "imported": imported,
        "skipped_duplicates": skipped,
        "errors": errors,
        "total_rows": imported + skipped + len(errors)
    }
```

### Helper Functions for Holdings Updates

These reuse the same logic from the buy/sell endpoints, extracted into helpers:

```python
def _update_holding_buy(db: Session, user_id: int, trade: dict):
    """Update or create a holding after a buy trade."""
    holding = db.query(models.Holding).filter(
        models.Holding.user_id == user_id,
        models.Holding.ticker == trade["ticker"]
    ).first()

    shares = Decimal(str(trade["shares"]))
    price = Decimal(str(trade["price"]))
    total = shares * price

    if holding:
        old_total = holding.shares * holding.avg_cost
        holding.shares = holding.shares + shares
        holding.avg_cost = (old_total + total) / holding.shares
    else:
        new_holding = models.Holding(
            user_id=user_id,
            ticker=trade["ticker"],
            shares=shares,
            avg_cost=price
        )
        db.add(new_holding)


def _update_holding_sell(db: Session, user_id: int, trade: dict):
    """Update a holding after a sell trade."""
    holding = db.query(models.Holding).filter(
        models.Holding.user_id == user_id,
        models.Holding.ticker == trade["ticker"]
    ).first()

    if not holding:
        return  # Can't sell what you don't have — skip silently during import

    shares = Decimal(str(trade["shares"]))
    holding.shares = holding.shares - shares

    if holding.shares <= 0:
        db.delete(holding)
```

Don't forget to add `Decimal` import at the top of the file if it's not already there.

---

## 5. Frontend: Stock CSV Upload

Add a CSV upload component to the stocks page. You can reuse the pattern from `CsvUpload.jsx` — create a similar component or add a file input directly to `StockPortfolio.jsx`.

Add to **`StockPortfolio.jsx`**, right after the stock forms section:

```jsx
{/* CSV Import */}
<div className="card">
    <h3>📥 Import from Brokerage</h3>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Upload a CSV export from Wealthsimple or Questrade. Format is auto-detected.
    </p>
    <input
        type="file"
        accept=".csv"
        onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            api.post('/stocks/import-csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            .then(response => {
                const r = response.data;
                showToast?.(
                    `Imported ${r.imported} trades from ${r.brokerage_detected} (${r.skipped_duplicates} duplicates skipped)`
                );
                fetchPortfolio();
            })
            .catch(error => {
                const detail = error.response?.data?.detail || 'Import failed.';
                showToast?.(detail, 'error');
            });

            e.target.value = '';  // Reset file input
        }}
    />
</div>
```

---

## 6. Testing

Create test CSV files to verify:

### `week6_stocks/test_wealthsimple.csv`
```csv
Date,Type,Description,Symbol,Quantity,Price,Amount
2026-06-01,buy,Market order,AAPL,10,195.00,-1950.00
2026-06-05,buy,Market order,TSLA,3,240.00,-720.00
2026-06-10,sell,Limit order,AAPL,5,205.00,1025.00
2026-06-12,dividend,,VOO,,0,15.50
2026-06-15,buy,Market order,SHOP.TO,20,92.50,-1850.00
```

### `week6_stocks/test_questrade.csv`
```csv
Transaction Date,Action,Symbol,Quantity,Price,Commission,Net Amount
2026-06-01,Buy,GOOG,2,175.00,4.95,-354.95
2026-06-08,Buy,GOOG,3,180.00,4.95,-544.95
2026-06-14,Sell,GOOG,1,185.00,4.95,180.05
2026-06-15,DIV,XIC,,,0,8.25
```

### Verification Checklist
1. Upload `test_wealthsimple.csv` → should detect "wealthsimple", import 5 trades
2. Upload it again → should skip all 5 (duplicates)
3. Upload `test_questrade.csv` → should detect "questrade", import 4 trades
4. Check `GET /stocks/portfolio` → should show AAPL (5 shares), TSLA (3), SHOP.TO (20), GOOG (4)
5. Upload a random non-trade CSV → should get "Unrecognized CSV format" error

---

## 7. Your Task

1. Add the `detect_brokerage()`, `parse_wealthsimple_row()`, `parse_questrade_row()`, and `parse_trade_date()` functions to the stocks router (or a helper module).
2. Add the `POST /stocks/import-csv` endpoint with auto-detection, parsing, dedup, and holdings updates.
3. Add the `_update_holding_buy()` and `_update_holding_sell()` helper functions.
4. Add the CSV upload section to `StockPortfolio.jsx`.
5. Create test CSV files and test the full import flow for both Wealthsimple and Questrade formats.
6. Verify deduplication works (upload the same file twice).

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **Strategy pattern** | Detect the CSV format and pick the right parser function dynamically |
| **Format auto-detection** | Inspect CSV headers to determine which brokerage exported it |
| **Data normalization** | Convert different column names/formats into one unified schema |
| **Parser functions** | Each brokerage gets its own parser that returns a standardized dict |
| **Reusing business logic** | Import calls the same buy/sell helpers that the manual endpoints use |
| **Defensive parsing** | Handle missing fields, unexpected values, and non-trade rows gracefully |
| **Fingerprint deduplication** | SHA256 hash prevents re-importing the same trades |
