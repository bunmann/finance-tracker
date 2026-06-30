# ============================================================================
# File: common/transaction_csv_parser.py
# Description: CSV parsing logic for bank transactions.
# ============================================================================
import csv
import io
from io import StringIO
from common.date_parser import parse_date
from common.file_validator import validate_and_read_csv

def parse_transactions_csv(file_stream: StringIO) -> tuple[list[dict], list[str]]:
    """
    Parses a bank transaction CSV stream and returns a tuple of
    (parsed_transactions_list, row_errors_list).
    """
    reader = csv.DictReader(file_stream)
    parsed_txs = []
    errors = []

    for row_num, row in enumerate(reader, start=2):
        if not any(str(v).strip() for v in row.values() if v is not None):
            continue
        row_lower = {k.strip().lower(): (str(v).strip() if v is not None else "") for k, v in row.items() if k}
        
        date_str = row_lower.get("date") or row_lower.get("transaction date") or row_lower.get("transaction_date") or ""
        description = row_lower.get("description") or row_lower.get("name") or row_lower.get("activity_sub_type") or row_lower.get("activity_type") or ""
        amount_str = row_lower.get("amount") or row_lower.get("net_cash_amount") or row_lower.get("net amount") or ""

        tx_date = parse_date(date_str)
        if tx_date is None:
            # Skip footer rows or metadata rows (e.g. 'As of 2026-06-30...')
            continue

        if not description or not amount_str:
            errors.append(f"Row {row_num}: Missing required fields")
            continue

        try:
            amount = float(amount_str)
        except Exception:
            errors.append(f"Row {row_num}: Invalid amount '{amount_str}'")
            continue

        if amount < 0:
            tx_type = "expense"
            amount = abs(amount)  # Store as positive
        else:
            tx_type = "income"

        parsed_txs.append({
            "date": tx_date,
            "description": description,
            "amount": amount,
            "type": tx_type
        })

    return parsed_txs, errors

def validate_and_parse_transactions_csv(file) -> tuple[list[dict], list[str]]:
    """
    Step 1: Validate file extension (.csv)
    Step 2: Validate file content (valid UTF-8 text)
    Step 3: Parse CSV content all the way into transaction dictionaries
    """
    contents = validate_and_read_csv(file)
    return parse_transactions_csv(io.StringIO(contents))
