# ============================================================================
# File: routers/transactions.py
# Description: Defines transaction CRUD and CSV import routes using APIRouter.
# ============================================================================
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

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)

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


@router.get("")
def get_transactions(
    limit: int = 10,
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


@router.post("")
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cat_id = transaction.category_id
    if cat_id is None:
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

            # 8. Create the transaction
            db_transaction = models.Transaction(
                amount=amount,
                description=description,
                type=tx_type,
                date=tx_date,
                user_id=current_user.id,
                category_id=uncat_id,  # CSV imports start in the database-backed Uncategorized category
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
