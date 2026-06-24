import csv
import io
from io import StringIO
from decimal import Decimal
from datetime import date
from common.date_parser import parse_date
from common.file_validator import validate_and_read_csv

def parse_brokerage_csv(file_stream: StringIO) -> list[dict]:
    """
    Parses a brokerage CSV file stream (Wealthsimple or Questrade) and returns
    a list of standardized transaction dictionaries.
    
    Returns standard format:
    [
        {
            "date": date,
            "ticker": str,
            "type": "buy" | "sell" | "dividend",
            "shares": Decimal,
            "price": Decimal,
            "total": Decimal
        },
        ...
    ]
    """
    # Read headers to auto-detect format
    reader = csv.reader(file_stream)
    try:
        headers = next(reader)
    except StopIteration:
        raise ValueError("The CSV file is empty.")

    # Trim and clean headers
    headers = [h.strip() for h in headers]
    
    # Reset stream pointer after reading headers
    file_stream.seek(0)
    
    # We use DictReader to easily access row values by column name
    dict_reader = csv.DictReader(file_stream)

    # Detect format based on headers
    is_questrade = "Transaction Date" in headers and "Action" in headers
    is_wealthsimple = "Date" in headers and "Type" in headers and "Symbol" in headers and not is_questrade

    if not is_questrade and not is_wealthsimple:
        raise ValueError("Unsupported CSV structure. Ensure it is a valid Wealthsimple or Questrade activity export.")

    parsed_transactions = []

    for row_idx, row in enumerate(dict_reader, start=2):
        # 1. Date parsing
        date_raw = row.get("Transaction Date" if is_questrade else "Date")
        if not date_raw:
            continue
        parsed_dt = parse_date(date_raw.strip())
        if not parsed_dt:
            raise ValueError(f"Row {row_idx}: Invalid date format '{date_raw}'")

        # 2. Type/Action parsing & normalization
        action_orig = row.get("Action" if is_questrade else "Type", "").strip()
        action_raw = action_orig.lower()
        if "buy" in action_raw:
            tx_type = "buy"
        elif "sell" in action_raw:
            tx_type = "sell"
        elif "div" in action_raw or "dividend" in action_raw:
            tx_type = "dividend"
        else:
            # Skip unsupported transaction actions like deposits, withdrawals, or institutional adjustments
            print(f"WARNING: Skipping unsupported transaction action '{action_orig}' on row {row_idx}")
            continue

        # 3. Ticker symbol
        ticker = row.get("Symbol", "").strip().upper()
        if not ticker:
            raise ValueError(f"Row {row_idx}: Missing stock ticker symbol.")

        # 4. Shares count
        shares_raw = row.get("Quantity", "").strip()
        if not shares_raw or shares_raw == "0":
            shares = Decimal("0")
        else:
            try:
                shares = Decimal(shares_raw)
            except Exception:
                shares = Decimal("0")

        # 5. Price per share
        price_raw = row.get("Price", "").strip()
        if not price_raw or price_raw == "0":
            price = Decimal("0")
        else:
            try:
                price = Decimal(price_raw)
            except Exception:
                price = Decimal("0")

        # 6. Net Total proceeds / cost
        total_col = "Net Amount" if is_questrade else "Amount"
        total_raw = row.get(total_col, "").strip()
        if not total_raw:
            raise ValueError(f"Row {row_idx}: Missing total amount.")
        try:
            # Keep as positive absolute Decimal
            total = abs(Decimal(total_raw))
        except Exception:
            raise ValueError(f"Row {row_idx}: Invalid total amount '{total_raw}'")

        parsed_transactions.append({
            "date": parsed_dt,
            "ticker": ticker,
            "type": tx_type,
            "shares": shares,
            "price": price,
            "total": total
        })

    return parsed_transactions

def validate_and_parse_brokerage_csv(file) -> list[dict]:
    """
    Step 1: Validate file extension (.csv)
    Step 2: Validate file content (valid UTF-8 text)
    Step 3: Parse CSV content all the way into brokerage trade dictionaries
    """
    contents = validate_and_read_csv(file)
    return parse_brokerage_csv(io.StringIO(contents))
