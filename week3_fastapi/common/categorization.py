# ============================================================================
# File: categorization.py
# Description: Auto-categorization pipeline for imported transactions.
#              Tier 1: Global keyword matching against known merchants.
#              Tier 2: User-trained rules learned from manual corrections.
# ============================================================================
import re


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


def clean_description(desc: str) -> str:
    """
    Conservatively cleans a transaction description by converting to lowercase,
    removing numbers and special symbols, and collapsing extra whitespace.
    """
    if not desc:
        return ""
    
    # 1. Convert to lowercase
    desc = desc.lower()
    
    # 2. Replace any numbers with spaces
    desc = re.sub(r'\d+', ' ', desc)
    
    # 3. Replace special characters common in bank terminal noise with spaces
    desc = re.sub(r'[*_\-/\\#]', ' ', desc)
    
    # 4. Collapse multiple whitespaces and strip trailing/leading spaces
    desc = ' '.join(desc.split())
    
    return desc


def auto_categorize(description: str, user_categories: list, user_rules: list = None) -> int | None:
    """
    Attempt to auto-categorize a transaction based on its description.

    Pipeline order:
        Tier 2: Check user-trained rules (most accurate, personalized)
        Tier 1: Check global keyword dictionary (catches common merchants)
        None:   No match — caller assigns Uncategorized

    Args:
        description: The raw transaction description from the bank CSV.
        user_categories: List of the user's Category ORM objects (from the database).
        user_rules: List of CategoryRule ORM objects for this user (optional).

    Returns:
        The category_id if a match is found, or None if no match.
    """
    # Clean the incoming description
    cleaned_desc = clean_description(description)
    if not cleaned_desc:
        return None

    # ── Tier 2: User-trained rules (highest priority) ──
    if user_rules:
        # Sort rules by keyword length in descending order to check longer rules first (e.g. "uber eats" before "uber")
        sorted_rules = sorted(user_rules, key=lambda r: len(r.keyword), reverse=True)
        for rule in sorted_rules:
            if rule.keyword in cleaned_desc:
                return rule.category_id

    # ── Tier 1: Global keyword dictionary ──
    name_to_id = {cat.name.lower(): cat.id for cat in user_categories}

    # Check each keyword against the description
    # Important: check LONGER keywords first so "uber eats" matches before "uber"
    for keyword in sorted(GLOBAL_KEYWORDS.keys(), key=len, reverse=True):
        if keyword in cleaned_desc:
            target_category = GLOBAL_KEYWORDS[keyword].lower()
            if target_category in name_to_id:
                return name_to_id[target_category]

    return None