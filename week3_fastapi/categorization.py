# ============================================================================
# File: categorization.py
# Description: Auto-categorization pipeline for imported transactions.
#              Tier 1: Global keyword matching against known merchants.
# ============================================================================

# Global keyword dictionary — maps known merchant substrings to category names.
# Keys are LOWERCASE substrings to match against transaction descriptions.
# Values are the category names they should map to.
GLOBAL_KEYWORDS = {
    # Food & Dining
    "starbucks": "Food & Dining",
    "tim hortons": "Food & Dining",
    "mcdonald": "Food & Dining",
    "subway": "Food & Dining",
    "uber eats": "Food & Dining",
    "doordash": "Food & Dining",
    "skip the dishes": "Food & Dining",
    "loblaws": "Food & Dining",
    "no frills": "Food & Dining",
    "metro": "Food & Dining",
    "freshco": "Food & Dining",
    "walmart": "Food & Dining",
    "costco": "Food & Dining",

    # Transportation
    "uber": "Transportation",
    "lyft": "Transportation",
    "presto": "Transportation",
    "ttc": "Transportation",
    "go transit": "Transportation",
    "shell": "Transportation",
    "petro": "Transportation",
    "esso": "Transportation",
    "parkgreen": "Transportation",

    # Entertainment
    "netflix": "Entertainment",
    "spotify": "Entertainment",
    "disney": "Entertainment",
    "apple.com/bill": "Entertainment",
    "steam": "Entertainment",
    "playstation": "Entertainment",
    "cineplex": "Entertainment",

    # Shopping
    "amazon": "Shopping",
    "best buy": "Shopping",
    "canadian tire": "Shopping",
    "ikea": "Shopping",
    "winners": "Shopping",

    # Bills & Utilities
    "rogers": "Bills & Utilities",
    "bell canada": "Bills & Utilities",
    "fido": "Bills & Utilities",
    "koodo": "Bills & Utilities",
    "hydro": "Bills & Utilities",
    "enbridge": "Bills & Utilities",
    "toronto water": "Bills & Utilities",

    # Health
    "shoppers drug": "Health",
    "rexall": "Health",
    "pharmacy": "Health",
    "life labs": "Health",
}


def auto_categorize(description: str, user_categories: list) -> int | None:
    """
    Attempt to auto-categorize a transaction based on its description.

    Tier 1: Check the global keyword dictionary for known merchants.

    Args:
        description: The raw transaction description from the bank CSV.
        user_categories: List of the user's Category ORM objects (from the database).

    Returns:
        The category_id if a match is found, or None if no match.
    """
    description_lower = description.lower()

    # Build a quick lookup: category name (lowercase) -> category id
    name_to_id = {cat.name.lower(): cat.id for cat in user_categories}

    # Check each keyword against the description
    # Important: check LONGER keywords first so "uber eats" matches before "uber"
    for keyword in sorted(GLOBAL_KEYWORDS.keys(), key=len, reverse=True):
        if keyword in description_lower:
            target_category = GLOBAL_KEYWORDS[keyword].lower()
            if target_category in name_to_id:
                return name_to_id[target_category]

    return None