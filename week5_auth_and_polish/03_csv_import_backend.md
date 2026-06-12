# Week 5 — Lesson 3: CSV Import (Backend)

Manually entering every transaction is tedious. In this lesson, we'll build an API endpoint that accepts a **CSV file upload** from a bank or credit card export and **bulk-creates transactions** — with duplicate detection so uploading the same file twice doesn't create duplicate entries.

---

## 1. How Banks Export Transaction Data

Almost every bank and credit card company (TD, RBC, Scotiabank, CIBC, AMEX, etc.) lets you download your transaction history as a CSV file. A typical bank CSV looks like this:

```csv
Date,Description,Amount
2026-06-01,STARBUCKS #1234 TORONTO ON,-4.75
2026-06-02,PAYROLL DEPOSIT,2500.00
2026-06-03,AMAZON.CA *MARKETPLACE,-29.99
2026-06-04,UBER *TRIP,-12.50
2026-06-05,E-TRANSFER FROM MOM,100.00
```

Key observations:
- **Negative amounts** = expenses (money going out)
- **Positive amounts** = income (money coming in)
- Dates and descriptions vary by bank (some use `DD/MM/YYYY`, others `YYYY-MM-DD`)
- There's no universal standard — each bank formats slightly differently

---

## 2. The Duplicate Problem

What happens if a user:
1. Uploads the same CSV file twice?
2. Manually enters a transaction, then uploads a CSV containing that same transaction?

Without protection, you'd get duplicate entries. We'll solve this with a **fingerprint hash**.

### Fingerprint Hashing

For every transaction, we compute a unique fingerprint from the combination of `date + description + amount`:

```python
import hashlib

def compute_fingerprint(date_str: str, description: str, amount: float) -> str:
    """Create a unique fingerprint for a transaction to detect duplicates."""
    raw = f"{date_str}|{description}|{amount}"
    return hashlib.sha256(raw.encode()).hexdigest()
```

- Same inputs → same hash → duplicate detected → skip
- Different inputs → different hash → insert normally

We'll store this fingerprint in a new column on the `transactions` table.

### Limitations

This catches **exact duplicates** (same date, same description, same amount). It won't catch a manually-entered "Coffee $4.75" matching a CSV row "STARBUCKS #1234 TORONTO ON $4.75" — the descriptions differ. Perfect deduplication is genuinely hard (even apps like Mint struggle with this), but exact-match fingerprinting handles the most common case: accidental re-uploads.

---

## 3. Adding a Fingerprint Column to the Database

Update **`models.py`** to add the fingerprint column to Transaction:

```python
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)
    type = Column(String(10), nullable=False)  # 'income' or 'expense'
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    fingerprint = Column(String(64), nullable=True, index=True)  # SHA256 hash for dedup
```

After updating the model, reset the database to apply the new column:
- Use `POST /debug/reset-db` (or drop and recreate tables)

### Why `nullable=True`?

Existing transactions (and manually-entered ones) won't have a fingerprint — that's fine. The fingerprint is only used for CSV import deduplication. Setting `nullable=True` means old data isn't affected.

---

## 4. The CSV Upload Endpoint

Add this to **`main.py`**:

```python
from fastapi import UploadFile, File
import csv
import io
import hashlib
from datetime import datetime
```

Then add the endpoint:

```python
@app.post("/transactions/upload-csv")
def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Read the uploaded file
    contents = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(contents))

    imported = 0
    skipped = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is the header
        try:
            # 2. Parse the row
            date_str = row.get("Date", "").strip()
            description = row.get("Description", "").strip()
            amount_str = row.get("Amount", "").strip()

            if not date_str or not description or not amount_str:
                errors.append(f"Row {row_num}: Missing required fields")
                continue

            # 3. Parse the amount and determine type
            amount = float(amount_str)
            if amount < 0:
                tx_type = "expense"
                amount = abs(amount)  # Store as positive
            else:
                tx_type = "income"

            # 4. Parse the date (try common formats)
            tx_date = parse_date(date_str)
            if tx_date is None:
                errors.append(f"Row {row_num}: Could not parse date '{date_str}'")
                continue

            # 5. Compute fingerprint for duplicate detection
            fingerprint = hashlib.sha256(
                f"{tx_date.isoformat()}|{description}|{amount}".encode()
            ).hexdigest()

            # 6. Check for duplicates
            existing = db.query(models.Transaction).filter(
                models.Transaction.fingerprint == fingerprint,
                models.Transaction.user_id == current_user.id
            ).first()

            if existing:
                skipped += 1
                continue

            # 7. Create the transaction
            db_transaction = models.Transaction(
                amount=amount,
                description=description,
                type=tx_type,
                date=tx_date,
                user_id=current_user.id,
                category_id=None,  # CSV imports start uncategorized
                fingerprint=fingerprint
            )
            db.add(db_transaction)
            imported += 1

        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    # 8. Commit all at once (batch insert)
    db.commit()

    return {
        "imported": imported,
        "skipped_duplicates": skipped,
        "errors": errors,
        "total_rows": imported + skipped + len(errors)
    }


def parse_date(date_str: str):
    """Try to parse a date string in common formats."""
    formats = [
        "%Y-%m-%d",     # 2026-06-01
        "%m/%d/%Y",     # 06/01/2026
        "%d/%m/%Y",     # 01/06/2026
        "%m-%d-%Y",     # 06-01-2026
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None
```

Let's break this down step by step.

### `UploadFile` — FastAPI's File Upload

```python
def upload_csv(file: UploadFile = File(...)):
```

`UploadFile` is FastAPI's way of receiving file uploads. The `File(...)` tells FastAPI this parameter comes from a `multipart/form-data` request (not JSON). The file object has:
- `file.file` — the actual file-like object you can `.read()`
- `file.filename` — the original filename (e.g., "td_transactions.csv")

### `csv.DictReader` — Parsing CSV

```python
contents = file.file.read().decode("utf-8")
reader = csv.DictReader(io.StringIO(contents))
```

`csv.DictReader` reads CSV data and treats the first row as column headers. Each subsequent row becomes a dictionary:

```python
# CSV:    Date,Description,Amount
#         2026-06-01,STARBUCKS,-4.75

# row = {"Date": "2026-06-01", "Description": "STARBUCKS", "Amount": "-4.75"}
```

`io.StringIO(contents)` wraps the string in a file-like object because `csv.DictReader` expects a file, not a raw string.

### Batch Commit

```python
db.commit()  # One commit for all transactions
```

Instead of committing after each row (which would be slow), we `db.add()` all transactions and then commit once at the end. This is called a **batch insert** — it's much faster because it hits the database once instead of hundreds of times.

### The `parse_date` Helper

Banks use different date formats. This helper tries common formats one by one until one works:

```python
datetime.strptime("06/01/2026", "%m/%d/%Y")  # → June 1, 2026
datetime.strptime("2026-06-01", "%Y-%m-%d")  # → June 1, 2026
```

`strptime` = "string parse time" — converts a date string into a Python `datetime` object.

---

## 5. Creating a Sample CSV for Testing

Create a test file to verify the endpoint works. Save this as **`sample_transactions.csv`** in your project root:

```csv
Date,Description,Amount
2026-06-01,STARBUCKS #1234 TORONTO ON,-4.75
2026-06-01,UBER *TRIP TORONTO,-12.50
2026-06-02,PAYROLL DEPOSIT - ACME INC,2500.00
2026-06-03,AMAZON.CA *MARKETPLACE,-29.99
2026-06-03,NETFLIX.COM,-15.99
2026-06-04,SHOPPERS DRUG MART #456,-8.43
2026-06-05,E-TRANSFER FROM MOM,100.00
2026-06-06,TIM HORTONS #789,-3.25
2026-06-07,SPOTIFY PREMIUM,-11.99
2026-06-08,LOBLAW SUPERSTORE #321,-67.82
```

---

## 6. Testing in Swagger

1. Go to `http://localhost:8000/docs`
2. Authorize with your JWT token (login first)
3. Find `POST /transactions/upload-csv`
4. Click "Try it out"
5. Click "Choose File" and select your `sample_transactions.csv`
6. Execute — you should see:

```json
{
  "imported": 10,
  "skipped_duplicates": 0,
  "errors": [],
  "total_rows": 10
}
```

7. **Upload the same file again** — this time you should see:

```json
{
  "imported": 0,
  "skipped_duplicates": 10,
  "errors": [],
  "total_rows": 10
}
```

The fingerprint deduplication caught all 10 rows as duplicates!

---

## 7. Your Task

1. Add the `fingerprint` column to the `Transaction` model in `models.py`.
2. Reset the database (`POST /debug/reset-db`) to apply the schema change.
3. Add the `upload_csv` endpoint and `parse_date` helper to `main.py`.
4. Create `sample_transactions.csv` in your project root.
5. Test in Swagger:
   - Upload the sample CSV → verify 10 transactions imported
   - Upload the same CSV again → verify 0 imported, 10 skipped
   - Check `GET /transactions` → verify all 10 transactions appear
6. Try creating a CSV with a bad date format or missing fields — verify errors are reported correctly.

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **`UploadFile`** | FastAPI type for receiving file uploads |
| **`csv.DictReader`** | Parses CSV into dictionaries using header row as keys |
| **`io.StringIO`** | Wraps a string to behave like a file object |
| **SHA256 fingerprint** | Unique hash to detect duplicate transactions |
| **Batch insert** | Adding many rows and committing once (faster than one-by-one) |
| **`strptime`** | Parses date strings into Python datetime objects |
| **`multipart/form-data`** | HTTP encoding for file uploads (vs `application/json` for data) |
