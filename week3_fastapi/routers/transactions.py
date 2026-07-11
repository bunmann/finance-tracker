# ============================================================================
# File: routers/transactions.py
# Description: Defines transaction CRUD, manual updates, and CSV import routes using APIRouter.
# ============================================================================
from routers import dashboard
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from schemas import TransactionCreate
import models
from datetime import date, datetime
from typing import Optional, Literal
from collections import defaultdict
import csv
import io
import hashlib
from common.date_parser import parse_date
from common.categorization import auto_categorize, clean_description
from common.transaction_csv_parser import validate_and_parse_transactions_csv

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


# API Endpoint: GET /transactions
# Description: Fetches a filtered, paginated list of the current user's transactions.
# Query Params:
#   - limit (int): Max number of items to return (default: 100).
#   - offset (int): Pagination offset.
#   - type (str): Filter by type ('income' or 'expense').
#   - category_id (int): Filter by category ID.
#   - start_date (date): Filter transactions on or after this date.
#   - end_date (date): Filter transactions on or before this date.
@router.get("")
def get_transactions(
    limit: int = 5000,
    offset: int = 0,
    type: Optional[Literal["income", "expense"]] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Start building the base query
    query = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id)  # Only this user's transactions
    
    # Apply filters dynamically
    if type:
        query = query.filter(models.Transaction.type == type)
    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)
        
    # Apply sorting (newest date first, then highest ID first to break ties)
    query = query.order_by(models.Transaction.date.asc(), models.Transaction.id.asc())
        
    # Apply pagination and execute query
    transactions = query.offset(offset).limit(limit).all()
    
    return transactions


# API Endpoint: POST /transactions
# Description: Manually records a new income or expense transaction for the user,
#              falling back to Uncategorized for expenses if no category is specified.
# Request Body: TransactionCreate schema (amount, description, type, date, category_id).
@router.post("")
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cat_id = transaction.category_id
    if cat_id is None and transaction.type == "expense":
        # Default to the user's database-seeded Uncategorized category if none specified
        uncat_category = db.query(models.Category).filter(
            models.Category.user_id == current_user.id,
            models.Category.name == "Uncategorized"
        ).first()
        if uncat_category:
            cat_id = uncat_category.id

    # Create python instance object for transaction.
    db_transaction = models.Transaction(
        amount=transaction.amount,
        description=transaction.description,
        type=transaction.type,
        date=transaction.date,
        category_id=cat_id,
        user_id=current_user.id
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


# API Endpoint: DELETE /transactions/{transaction_id}
# Description: Deletes a specific transaction owned by the current user.
# Path Params:
#   - transaction_id (int): Database ID of the transaction to delete.
@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Find the transaction
    transaction = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.id == transaction_id
    ).first()
    
    # If not found, return an error
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Delete it
    db.delete(transaction)
    db.commit()
    return {"message": f"Transaction {transaction_id} deleted"}


# API Endpoint: PUT /transactions/{transaction_id}
# Description: Updates a specific transaction's category and trains a custom rule for the user (upsert).
@router.put("/{transaction_id}")
def update_transaction_category(
    transaction_id: int,
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Update a transaction's category and save a user rule for future auto-categorization.
    """
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
    cleaned_keyword = clean_description(transaction.description)
    existing_rule = db.query(models.CategoryRule).filter(
        models.CategoryRule.user_id == current_user.id,
        models.CategoryRule.keyword == cleaned_keyword
    ).first()

    if existing_rule:
        # Rule exists — update the category
        existing_rule.category_id = category_id
    else:
        # No rule — create a new one
        new_rule = models.CategoryRule(
            user_id=current_user.id,
            keyword=cleaned_keyword,
            category_id=category_id
        )
        db.add(new_rule)

    db.commit()
    db.refresh(transaction)
    return transaction


# API Endpoint: POST /transactions/upload-csv
# Description: Uploads and parses a bank statement CSV, automatically matching
#              known merchants against default category keywords and filtering out
#              duplicate transaction entries using SHA256 fingerprints.
# Request Body: Multipart form data containing the 'file'.
@router.post("/upload-csv")
def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        parsed_txs, errors = validate_and_parse_transactions_csv(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Find the user's "Uncategorized" category so we can assign it by default.
    uncat_category = db.query(models.Category).filter(
        models.Category.user_id == current_user.id,
        models.Category.name == "Uncategorized"
    ).first()
    uncat_id = uncat_category.id if uncat_category else None

    # Load categories and personal categorization rules for Tier 1 and Tier 2 auto-categorization
    user_categories = db.query(models.Category).filter(
        models.Category.user_id == current_user.id
    ).all()

    user_rules = db.query(models.CategoryRule).filter(
        models.CategoryRule.user_id == current_user.id
    ).all()

    imported = 0
    skipped = 0

    # Track occurrence counts for identical rows within this CSV
    occurrence_tracker = defaultdict(int)

    for tx in parsed_txs:
        try:
            tx_date = tx["date"]
            description = tx["description"]
            amount = tx["amount"]
            tx_type = tx["type"]

            # Count the occurrence of this (date, description, amount) combo
            row_key = (tx_date.isoformat(), description, str(amount))
            occurrence_tracker[row_key] += 1
            occurrence = occurrence_tracker[row_key]

            # Compute fingerprint for duplicate detection (includes occurrence)
            fingerprint = hashlib.sha256(
                f"{tx_date.isoformat()}|{description}|{amount}|{occurrence}".encode()
            ).hexdigest()

            # Check for duplicates
            existing = db.query(models.Transaction).filter(
                models.Transaction.fingerprint == fingerprint,
                models.Transaction.user_id == current_user.id
            ).first()

            if existing:
                skipped += 1
                continue

            # Auto-categorization: try user rules, then global keywords, and fall back to Uncategorized
            if tx_type == "expense":
                matched_category_id = auto_categorize(description, user_categories, user_rules)
                cat_id = matched_category_id if matched_category_id else uncat_id
            else:
                cat_id = None

            # Create the transaction
            db_transaction = models.Transaction(
                amount=amount,
                description=description,
                type=tx_type,
                date=tx_date,
                user_id=current_user.id,
                category_id=cat_id,
                fingerprint=fingerprint
            )
            db.add(db_transaction)
            imported += 1

        except Exception as e:
            # We construct a generic row error. Note: since row numbers aren't preserved 1-to-1 in the parsed list easily, 
            # the helper records any parse-related line errors, while DB-related errors are handled here.
            errors.append(f"DB Error for '{description}': {str(e)}")

    if imported > 0:
        db.commit()

    return {
        "imported": imported,
        "skipped_duplicates": skipped,
        "errors": errors,
        "total_rows": imported + skipped + len(errors)
    }

