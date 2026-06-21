# ============================================================================
# File: routers/transactions.py
# Description: Defines transaction CRUD and CSV import routes using APIRouter.
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
from utils import parse_date
from categorization import auto_categorize

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
    limit: int = 100,
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
    # 0. Guard: reject non-CSV files
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV.")

    # 1. Read the uploaded file
    try:
        contents = file.file.read().decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File content is not valid text. Please upload a plain-text CSV.")

    # Find the user's "Uncategorized" category so we can assign it by default.
    uncat_category = db.query(models.Category).filter(
        models.Category.user_id == current_user.id,
        models.Category.name == "Uncategorized"
    ).first()
    uncat_id = uncat_category.id if uncat_category else None

    reader = csv.DictReader(io.StringIO(contents))

    imported = 0
    skipped = 0
    errors = []

    # Track occurrence counts for identical rows within this CSV
    occurrence_tracker = defaultdict(int)

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

            # 5. Count the occurrence of this (date, description, amount) combo
            row_key = (tx_date.isoformat(), description, str(amount))
            occurrence_tracker[row_key] += 1
            occurrence = occurrence_tracker[row_key]

            # 6. Compute fingerprint for duplicate detection (includes occurrence)
            fingerprint = hashlib.sha256(
                f"{tx_date.isoformat()}|{description}|{amount}|{occurrence}".encode()
            ).hexdigest()

            # 7. Check for duplicates
            existing = db.query(models.Transaction).filter(
                models.Transaction.fingerprint == fingerprint,
                models.Transaction.user_id == current_user.id
            ).first()

            if existing:
                skipped += 1
                continue

            # 8. Auto-categorization: try keyword matching first, fall back to Uncategorized

            user_categories = db.query(models.Category).filter(
                models.Category.user_id == current_user.id
            ).all()

            if tx_type == "expense":
                matched_category_id = auto_categorize(description, user_categories)
                cat_id = matched_category_id if matched_category_id else uncat_id
            else:
                cat_id = None

            # 8. Create the transaction
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
            errors.append(f"Row {row_num}: {str(e)}")

    # 9. Commit all at once (batch insert)
    db.commit()

    return {
        "imported": imported,
        "skipped_duplicates": skipped,
        "errors": errors,
        "total_rows": imported + skipped + len(errors)
    }
