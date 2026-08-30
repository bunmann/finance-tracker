import csv
import io
from io import StringIO
from decimal import Decimal
from datetime import date
from common.date_parser import parse_date
from common.file_validator import validate_and_read_csv

def parse_brokerage_csv(file_stream: StringIO) -> list[dict]:
    """
    Parses a brokerage CSV file stream (Wealthsimple format 1 & 2, or Questrade) and returns
    a list of standardized transaction dictionaries.
    """
    reader = csv.reader(file_stream)
    try:
        headers = next(reader)
    except StopIteration:
        raise ValueError("The CSV file is empty.")

    headers_lower = [h.strip().lower() for h in headers]
    
    # Reset stream pointer after reading headers
    file_stream.seek(0)
    dict_reader = csv.DictReader(file_stream)

    is_questrade = "transaction date" in headers_lower and "action" in headers_lower
    is_wealthsimple = ("date" in headers_lower and ("type" in headers_lower or "symbol" in headers_lower)) or ("transaction_date" in headers_lower and "symbol" in headers_lower)

    if not is_questrade and not is_wealthsimple:
        raise ValueError("Unsupported CSV structure. Ensure it is a valid Wealthsimple activity export.")

    parsed_transactions = []

    for row_idx, row in enumerate(dict_reader, start=2):
        # Create case-insensitive dictionary map for row
        row_lower = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}

        # 1. Date parsing
        date_raw = row_lower.get("transaction date") or row_lower.get("transaction_date") or row_lower.get("date")
        if not date_raw:
            continue
        parsed_dt = parse_date(date_raw)
        if not parsed_dt:
            # Skip non-transaction rows like footer/summary lines
            continue

        # 2. Action / Type parsing
        action_str = f"{row_lower.get('action', '')} {row_lower.get('type', '')} {row_lower.get('activity_type', '')} {row_lower.get('activity_sub_type', '')}".lower()
        if "buy" in action_str:
            tx_type = "buy"
        elif "sell" in action_str:
            tx_type = "sell"
        elif "div" in action_str or "dividend" in action_str:
            tx_type = "dividend"
        else:
            # Skip money movements, EFT deposits, interest, or unsupported actions
            continue

        # 3. Ticker symbol
        ticker = (row_lower.get("symbol") or "").upper()
        if not ticker:
            continue

        # 4. Shares count
        shares_raw = row_lower.get("quantity") or row_lower.get("shares") or "0"
        try:
            shares = Decimal(shares_raw) if shares_raw else Decimal("0")
        except Exception:
            shares = Decimal("0")

        # 5. Price per share
        price_raw = row_lower.get("unit_price") or row_lower.get("price") or "0"
        try:
            price = Decimal(price_raw) if price_raw else Decimal("0")
        except Exception:
            price = Decimal("0")

        # 6. Total Amount
        total_raw = row_lower.get("net_cash_amount") or row_lower.get("net amount") or row_lower.get("amount") or ""
        if not total_raw:
            if shares > 0 and price > 0:
                total = shares * price
            else:
                continue
        else:
            try:
                total = abs(Decimal(total_raw))
            except Exception:
                continue

        # 7. Currency & Security Name Metadata (critical for Canadian CDR/exchange normalization)
        currency_raw = row_lower.get("currency") or row_lower.get("currency_code") or row_lower.get("settlement_currency") or row_lower.get("account_currency") or ""
        name_raw = row_lower.get("name") or row_lower.get("description") or row_lower.get("security") or row_lower.get("security_name") or ""

        parsed_transactions.append({
            "date": parsed_dt,
            "ticker": ticker,
            "type": tx_type,
            "shares": shares,
            "price": price,
            "total": total,
            "currency": currency_raw.upper().strip() if currency_raw else "",
            "name": name_raw.strip()
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
