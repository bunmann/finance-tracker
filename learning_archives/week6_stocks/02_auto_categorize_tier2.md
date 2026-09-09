# Week 6 — Lesson 2: Smart Auto-Categorization — Tier 2 (User-Trained Rules)

Tier 1 handles the obvious merchants — Starbucks, Netflix, Uber. But what about `"JOE'S PIZZA"` or `"POS DEBIT VISA - 7832 KING SHAWARMA"`? No global dictionary can cover every local shop. In this lesson, we build a **self-learning system**: when a user manually re-categorizes a transaction, the app **remembers** that mapping and automatically applies it to future imports.

---

## 1. How It Works

The flow is simple:

```
1. User imports CSV → "JOE'S PIZZA" gets tagged as Uncategorized (no keyword match)
2. User manually changes "JOE'S PIZZA" to Food & Dining
3. App saves a RULE: "JOE'S PIZZA" → Food & Dining (for this user)
4. Next CSV import → "JOE'S PIZZA" auto-categorized as Food & Dining ✅
```

This is called **event-driven data capture** — a user action (re-categorizing) produces a side effect (saving a rule). The app learns from the user's behavior without them doing anything extra.

---

## 2. The Category Rules Table

We need a new database table to store these user-trained mappings. Add to **`models.py`**:

```python
class CategoryRule(Base):
    __tablename__ = "category_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    keyword = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    # Each user can only have one rule per keyword
    __table_args__ = (UniqueConstraint('user_id', 'keyword', name='_user_keyword_uc'),)
```

### Why `UNIQUE(user_id, keyword)`?

If the user re-categorizes "JOE'S PIZZA" again (say, from Food & Dining to Restaurants), we want to **update** the existing rule, not create a duplicate. The unique constraint prevents duplicate rows and lets us use an **upsert** pattern.

### What's an Upsert?

**Upsert** = **UP**date or In**SERT**. It means:
- If a row with this `(user_id, keyword)` already exists → **update** it with the new `category_id`
- If no such row exists → **insert** a new one

This is extremely common in production databases. Without it, you'd need to query first ("does this rule exist?"), then decide whether to insert or update — two database calls instead of one.

---

## 3. Adding a Transaction Update Endpoint

Right now, users can create and delete transactions, but they can't **edit** them. We need a PUT endpoint so users can change a transaction's category. This is also where we'll capture the rule.

Add to **`routers/transactions.py`**:

```python
@router.put("/{transaction_id}")
def update_transaction_category(
    transaction_id: int,
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a transaction's category and save a user rule for future auto-categorization."""
    # 1. Find the transaction
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # 2. Verify the category exists and belongs to this user
    category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id
    ).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 3. Update the transaction's category
    transaction.category_id = category_id
    
    # 4. Save a user rule (upsert: update if exists, insert if not)
    existing_rule = db.query(models.CategoryRule).filter(
        models.CategoryRule.user_id == current_user.id,
        models.CategoryRule.keyword == transaction.description.lower()
    ).first()

    if existing_rule:
        # Rule exists — update the category
        existing_rule.category_id = category_id
    else:
        # No rule — create a new one
        new_rule = models.CategoryRule(
            user_id=current_user.id,
            keyword=transaction.description.lower(),
            category_id=category_id
        )
        db.add(new_rule)

    db.commit()
    db.refresh(transaction)
    return transaction
```

### The Upsert Logic

```python
existing_rule = db.query(models.CategoryRule).filter(
    models.CategoryRule.user_id == current_user.id,
    models.CategoryRule.keyword == transaction.description.lower()
).first()

if existing_rule:
    existing_rule.category_id = category_id  # UPDATE
else:
    new_rule = models.CategoryRule(...)
    db.add(new_rule)                          # INSERT
```

This is the manual Python upsert pattern. We query for an existing rule first, then either update or insert. SQLAlchemy tracks changes to the ORM objects, so modifying `existing_rule.category_id` automatically generates an `UPDATE` SQL statement when `db.commit()` is called.

> **Note:** PostgreSQL also supports `INSERT ... ON CONFLICT DO UPDATE` (a database-level upsert), but the manual pattern is clearer for learning and works with any database.

---

## 4. Updating the Categorization Pipeline

Now we add Tier 2 to the `auto_categorize` function. The key rule: **user rules are checked FIRST** because they're the most accurate (personalized to this user).

Update **`categorization.py`**:

```python
# ============================================================================
# File: categorization.py
# Description: Auto-categorization pipeline for imported transactions.
#              Tier 1: Global keyword matching against known merchants.
#              Tier 2: User-trained rules learned from manual corrections.
# ============================================================================

GLOBAL_KEYWORDS = {
    # ... (same dictionary as before, keep all the keywords)
}


def auto_categorize(description: str, user_categories: list, user_rules: list = None) -> int | None:
    """
    Attempt to auto-categorize a transaction based on its description.

    Pipeline order:
        Tier 2: Check user-trained rules (most accurate, personalized)
        Tier 1: Check global keyword dictionary (catches common merchants)
        None:   No match — caller assigns Uncategorized

    Args:
        description: The raw transaction description from the bank CSV.
        user_categories: List of the user's Category ORM objects.
        user_rules: List of CategoryRule ORM objects for this user (optional).

    Returns:
        The category_id if a match is found, or None if no match.
    """
    description_lower = description.lower()

    # ── Tier 2: User-trained rules (highest priority) ──
    if user_rules:
        for rule in user_rules:
            if rule.keyword in description_lower:
                return rule.category_id

    # ── Tier 1: Global keyword dictionary ──
    name_to_id = {cat.name.lower(): cat.id for cat in user_categories}

    for keyword in sorted(GLOBAL_KEYWORDS.keys(), key=len, reverse=True):
        if keyword in description_lower:
            target_category = GLOBAL_KEYWORDS[keyword].lower()
            if target_category in name_to_id:
                return name_to_id[target_category]

    return None
```

### Why Tier 2 Runs First

Consider: the global dictionary maps `"shoppers drug"` → Health. But maybe this user always buys snacks at Shoppers and wants it categorized as Food & Dining. Their personal rule should **override** the global default.

This is the **cascading/fallback pattern**:
1. User rules (personalized, highest priority)
2. Global keywords (general, lower priority)
3. No match → Uncategorized (lowest priority)

This pattern is everywhere in production software — CSS cascading, DNS resolution, environment variable lookup (`.env.local` → `.env` → system defaults).

---

## 5. Passing User Rules to the CSV Import

Update the CSV import endpoint in **`routers/transactions.py`** to load and pass user rules:

After the line where you load `user_categories`, add:

```python
# Load user's personal categorization rules for Tier 2
user_rules = db.query(models.CategoryRule).filter(
    models.CategoryRule.user_id == current_user.id
).all()
```

Then update the `auto_categorize` call to pass the rules:

```python
matched_category_id = auto_categorize(description, user_categories, user_rules)
```

Don't forget to import the `CategoryRule` model — it's already available through `models.CategoryRule` since you added it to `models.py`.

---

## 6. Testing the Full Pipeline

Here's how to verify the whole cascading system works:

### Test 1: Global keywords still work
1. Reset database, create account, log in
2. Upload a CSV with `"STARBUCKS #1234"` → should auto-categorize to Food & Dining

### Test 2: Unknown merchants are Uncategorized
1. Upload a CSV with `"JOE'S PIZZA PARLOUR"` → should be Uncategorized (no keyword match)

### Test 3: User rules learn from corrections
1. After Test 2, use `PUT /transactions/{id}?category_id={food_id}` to re-categorize "JOE'S PIZZA PARLOUR" to Food & Dining
2. Upload a **new** CSV containing `"JOE'S PIZZA PARLOUR"` again
3. It should now auto-categorize to Food & Dining ✅ (Tier 2 rule kicks in)

### Test 4: User rules override global keywords
1. Re-categorize a Starbucks transaction to "Entertainment" (maybe you only go there for live music events)
2. Upload a CSV with `"STARBUCKS"` → should be **Entertainment** (user rule overrides global keyword)

---

## 7. Your Task

1. Add the `CategoryRule` model to `models.py` with the `UNIQUE(user_id, keyword)` constraint.
2. Add the `PUT /transactions/{id}` endpoint to `routers/transactions.py` that updates the category and saves a user rule.
3. Update `categorization.py`:
   - Add a `user_rules` parameter to `auto_categorize()`
   - Add Tier 2 checking (user rules) before Tier 1 (global keywords)
4. Update the CSV import in `transactions.py` to load user rules and pass them to `auto_categorize()`.
5. Reset the database and test the full pipeline (all 4 tests above).

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **Event-driven data capture** | A user action (re-categorizing) triggers a side effect (saving a rule) |
| **Upsert (UPDATE or INSERT)** | Check if a row exists → update it; if not → insert a new one |
| **UNIQUE constraint** | `UNIQUE(user_id, keyword)` prevents duplicate rules per user |
| **Cascading/fallback pattern** | Tier 2 (user rules) → Tier 1 (global keywords) → Uncategorized |
| **Priority ordering** | More specific/personalized data takes precedence over general defaults |
| **Self-improving system** | Each manual correction makes the system smarter for future imports |
