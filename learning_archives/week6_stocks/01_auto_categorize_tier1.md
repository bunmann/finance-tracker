# Week 6 — Lesson 1: Smart Auto-Categorization — Tier 1 (Global Keyword Matching)

Right now, when you import a bank CSV, every transaction gets dumped into "Uncategorized." You then have to manually assign categories one by one — tedious and repetitive. In this lesson, we'll build a **keyword-based auto-categorizer** that recognizes common merchants and assigns categories automatically during import.

---

## 1. The Problem

Look at a typical bank CSV:

```csv
Date,Description,Amount
2026-06-01,STARBUCKS #1234 TORONTO ON,-4.75
2026-06-02,UBER *TRIP HELP.UBER.COM,-12.50
2026-06-03,NETFLIX.COM,-15.99
2026-06-04,LOBLAWS #0437 TORONTO ON,-67.23
2026-06-05,PAYROLL DEPOSIT,2500.00
```

A human can instantly tell that Starbucks = Food & Dining, Uber = Transportation, Netflix = Entertainment. But our CSV import endpoint just blindly dumps everything into "Uncategorized."

We're going to teach the app to do what a human does — scan the description for known keywords and assign the right category.

---

## 2. The Architecture: Separation of Concerns

We could just jam the keyword logic directly into the CSV import loop in `transactions.py`. But that would violate a key software principle: **separation of concerns**.

Instead, we'll create a dedicated **helper module** — `categorization.py` — that contains *only* the categorization logic. The CSV import endpoint will call this helper, but the logic lives separately.

**Why this matters:**
- The CSV import code stays focused on parsing files
- The categorization logic can be reused by other features later (like the manual transaction form or AI categorization in Week 9)
- It's easier to test and modify one thing without breaking the other
- This is how production codebases are organized — small, focused modules

```
routers/transactions.py  ──calls──>  categorization.py
     (file parsing)                  (keyword matching)
```

---

## 3. The Global Keyword Dictionary

Create a new file: **`week3_fastapi/categorization.py`**

```python
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
```

Let's break this down piece by piece.

### The Dictionary

```python
GLOBAL_KEYWORDS = {
    "starbucks": "Food & Dining",
    "uber eats": "Food & Dining",
    "uber": "Transportation",
    ...
}
```

This is a simple Python dictionary where:
- **Keys** are lowercase substrings to search for in transaction descriptions
- **Values** are the category names those merchants belong to

### Why Sort by Length?

```python
for keyword in sorted(GLOBAL_KEYWORDS.keys(), key=len, reverse=True):
```

Consider a description like `"UBER EATS ORDER #1234"`. Without sorting:
- `"uber"` matches first → assigned to **Transportation** ❌
- `"uber eats"` never gets checked

By sorting longest keywords first:
- `"uber eats"` matches first → assigned to **Food & Dining** ✅
- `"uber"` is never reached (we already returned)

This is a common pattern called **longest-match-first** — the same strategy DNS resolvers and URL routers use.

### The Name-to-ID Lookup

```python
name_to_id = {cat.name.lower(): cat.id for cat in user_categories}
```

This is a **dictionary comprehension** — it builds a new dict in one line. It converts the user's category objects into a quick lookup table:

```python
# Input: [Category(id=1, name="Food & Dining"), Category(id=2, name="Transportation"), ...]
# Output: {"food & dining": 1, "transportation": 2, ...}
```

We need this because the keyword dictionary maps to category **names** (like `"Food & Dining"`), but the database needs category **IDs** (like `1`). The lookup bridges the gap.

### Case-Insensitive Matching

```python
description_lower = description.lower()
```

Bank descriptions come in ALL CAPS (`"STARBUCKS #1234 TORONTO ON"`), title case (`"Starbucks"`), or anything in between. By converting both the description and the keywords to lowercase, we catch all variations.

---

## 4. Integrating into the CSV Import

Now we plug the categorizer into the existing CSV upload endpoint. Open **`routers/transactions.py`** and make these changes:

### Add the import

At the top of the file, add:

```python
from categorization import auto_categorize
```

### Update the CSV import loop

In the `upload_csv` function, find the section where we query for user categories. We need to also load all of the user's categories so we can pass them to `auto_categorize`. Add this line right after the `uncat_id` assignment:

```python
# Load ALL user categories for auto-categorization
user_categories = db.query(models.Category).filter(
    models.Category.user_id == current_user.id
).all()
```

Then, in the import loop, replace the line where we assign `category_id`:

**Before:**
```python
db_transaction = models.Transaction(
    amount=amount,
    description=description,
    type=tx_type,
    date=tx_date,
    user_id=current_user.id,
    category_id=uncat_id if tx_type == "expense" else None,
    fingerprint=fingerprint
)
```

**After:**
```python
# Auto-categorize: try keyword matching first, fall back to Uncategorized
if tx_type == "expense":
    matched_category_id = auto_categorize(description, user_categories)
    cat_id = matched_category_id if matched_category_id else uncat_id
else:
    cat_id = None

db_transaction = models.Transaction(
    amount=amount,
    description=description,
    type=tx_type,
    date=tx_date,
    user_id=current_user.id,
    category_id=cat_id,
    fingerprint=fingerprint
)
```

The logic is straightforward:
1. If it's an expense, try to auto-categorize by keyword
2. If auto-categorize finds a match, use that category ID
3. If no match, fall back to "Uncategorized" (same as before)
4. If it's income, don't assign any category (same as before)

---

## 5. Making Sure the Categories Exist

The keyword dictionary maps to category names like `"Food & Dining"`, `"Transportation"`, `"Entertainment"`, etc. But auto-categorization only works if the user actually **has** those categories in their account.

Right now, new users only get an "Uncategorized" category seeded on signup. We should seed a fuller set of default categories.

Open **`routers/auth.py`** and find the signup endpoint where we create the "Uncategorized" category. Update the default categories list:

```python
# Seed default categories for the new user
default_categories = [
    {"name": "Uncategorized", "icon": "📁"},
    {"name": "Food & Dining", "icon": "🍔"},
    {"name": "Transportation", "icon": "🚗"},
    {"name": "Entertainment", "icon": "🎬"},
    {"name": "Shopping", "icon": "🛍️"},
    {"name": "Bills & Utilities", "icon": "💡"},
    {"name": "Health", "icon": "💊"},
    {"name": "Income", "icon": "💰"},
]

for cat in default_categories:
    db_category = models.Category(
        name=cat["name"],
        icon=cat["icon"],
        user_id=db_user.id
    )
    db.add(db_category)

db.commit()
```

This replaces the existing single "Uncategorized" category seeding with a full set. Now every new user automatically has categories that match the keyword dictionary.

> **Note:** Existing users won't have these categories. You can either:
> 1. Reset the database (`POST /debug/reset-db`) and re-register — easiest for development
> 2. Manually create the categories through the UI — more realistic

---

## 6. Testing It

1. Reset the database: `POST /debug/reset-db`
2. Create a new account and log in
3. Verify the default categories were seeded: `GET /categories`
4. Upload the sample CSV with recognizable merchants

Create a test CSV file `week6_stocks/test_categorization.csv`:

```csv
Date,Description,Amount
2026-06-01,STARBUCKS #1234 TORONTO ON,-4.75
2026-06-02,UBER *TRIP HELP.UBER.COM,-12.50
2026-06-03,NETFLIX.COM,-15.99
2026-06-04,RANDOM UNKNOWN STORE,-25.00
2026-06-05,PAYROLL DEPOSIT,2500.00
2026-06-06,AMAZON.CA *MARKETPLACE,-39.99
2026-06-07,SHOPPERS DRUG MART #0432,-18.75
```

After importing, check your transactions:
- Starbucks → **Food & Dining** ✅
- Uber → **Transportation** ✅
- Netflix → **Entertainment** ✅
- Random Unknown Store → **Uncategorized** (no keyword match, correct!)
- Payroll Deposit → **No category** (income, correct!)
- Amazon → **Shopping** ✅
- Shoppers Drug Mart → **Health** ✅

---

## 7. Your Task

1. Create `week3_fastapi/categorization.py` with the keyword dictionary and `auto_categorize()` function from Section 3.
2. Update `routers/transactions.py`:
   - Import `auto_categorize` from `categorization`
   - Load user categories before the CSV import loop
   - Replace the hardcoded `uncat_id` assignment with the auto-categorization logic
3. Update `routers/auth.py` to seed a fuller set of default categories on signup.
4. Reset the database, re-register, and test with the sample CSV.
5. Verify in Swagger (`GET /transactions`) that merchants are correctly categorized.

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **Separation of concerns** | Keep categorization logic in its own module, not inside the route handler |
| **Dictionary lookup** | Map keywords to categories using a Python dict — O(1) average lookup |
| **Longest-match-first** | Sort keywords by length descending so "uber eats" matches before "uber" |
| **Dictionary comprehension** | `{cat.name.lower(): cat.id for cat in categories}` — build a lookup in one line |
| **`.lower()` normalization** | Convert both description and keywords to lowercase for case-insensitive matching |
| **Fallback pattern** | Try keyword match → fall back to Uncategorized → fall back to None (income) |
