# ============================================================================
# File: date_parser.py
# Description: General shared helper utility functions for date parsing.
# ============================================================================
from datetime import datetime

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
