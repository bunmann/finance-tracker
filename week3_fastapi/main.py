# ============================================================================
# File: main.py
# Description: Main entry point & routing for the FastAPI application.
#              Registers CORS middleware and declares all REST API routes.
# ============================================================================

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from auth import hash_password, verify_password, create_access_token, get_current_user
from schemas import TransactionCreate, UserCreate, CategoryCreate, LoginRequest
from database import engine, get_db, Base
from sqlalchemy import func
from sqlalchemy.orm import Session
import models
from datetime import date, datetime
from typing import Optional, Literal
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict
import csv
import io
import hashlib

# Create all tables in the database (if they don't exist yet)
Base.metadata.create_all(bind=engine)


app = FastAPI()

# Allow the React frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],       # Allow all HTTP methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],       # Allow all headers
)


@app.get("/")       # Whenever HTTPS request is made at path "/"
def read_root():       # execute this function
    return {"message": "Hello World! Welcome to your Finance API."}

# =====================USER ENDPOINTS====================

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all() # Gets all rows of User from models.py
    return users


@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if a user with this email already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    # 1. Create a SQLAlchemy model instance from the validated Pydantic data
    db_user = models.User(  # db_user is object instance, models.User is class from models.py
        email=user.email,
        password_hash=hash_password(user.password)  # Hash the password!
    )
    # 2. Stage it (like git add)
    db.add(db_user)
    # 3. Save it (like git commit)
    db.commit()
    # 4. Refresh to get the auto-generated id from the database
    db.refresh(db_user)

    # Seed default categories for the new user
    default_categories = [
        {"name": "Food & Dining", "icon": "🍔"},
        {"name": "Transportation", "icon": "🚗"},
        {"name": "Entertainment", "icon": "🎬"},
        {"name": "Utilities", "icon": "💡"},
        {"name": "Rent & Housing", "icon": "🏠"},
    ]
    for cat in default_categories:
        db_cat = models.Category(
            name=cat["name"],
            icon=cat["icon"],
            monthly_budget=0.0,
            user_id=db_user.id
        )
        db.add(db_cat)
    db.commit()

    return {"id": db_user.id, "email": db_user.email}


@app.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # 1. Find the user by email
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 2. Verify the password against the stored hash
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 3. Create and return a JWT token
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}



# =====================TRANSACTION ENDPOINTS====================

@app.get("/transactions")
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
        
    # Apply pagination and execute query
    transactions = query.offset(offset).limit(limit).all()
    
    return transactions


@app.post("/transactions")
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Create python instance object for transaction.
    db_transaction = models.Transaction(
        amount=transaction.amount,
        description=transaction.description,
        type=transaction.type,
        date=transaction.date,
        category_id=transaction.category_id,
        user_id=current_user.id
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Find the transaction
    transaction = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.id == transaction_id
        ).first()
    
    # If not found, return an error
    if not transaction:
        return {"error": "Transaction not found"}
    
    # Delete it
    db.delete(transaction)
    db.commit()
    return {"message": f"Transaction {transaction_id} deleted"}


@app.post("/transactions/upload-csv")
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
                category_id=None,  # CSV imports start uncategorized
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


    # =====================CATEGORY ENDPOINTS====================

@app.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Category).filter(models.Category.user_id == current_user.id).all()


@app.post("/categories")
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if a category with this name already exists for the user
    existing_category = db.query(models.Category).filter(
        models.Category.user_id == current_user.id,
        models.Category.name == category.name
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=400,
            detail=f"Category '{category.name}' already exists."
        )

    db_category = models.Category(
        name=category.name,
        icon=category.icon,
        monthly_budget=category.monthly_budget,
        user_id=current_user.id
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@app.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    category = db.query(models.Category).filter(
        models.Category.user_id == current_user.id,
        models.Category.id == category_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    db.delete(category)
    db.commit()
    return {"message": f"Category {category_id} deleted"}


@app.post("/debug/reset-db")
def reset_db():
    # Drop all existing tables
    Base.metadata.drop_all(bind=engine)
    # Recreate all tables with new schema/constraints
    Base.metadata.create_all(bind=engine)
    return {"message": "Database reset successfully! All tables recreated with new schemas."}


# =====================DASHBOARD ENDPOINT====================

@app.get("/dashboard")
def get_dashboard_summary(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Fetch total income for this month & year
    income_val = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "income",
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).scalar()
    total_income = float(income_val) if income_val is not None else 0.0
    
    # 2. Fetch total expenses for this month & year
    expense_val = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "expense",
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).scalar()
    total_expense = float(expense_val) if expense_val is not None else 0.0
    
    # 3. Fetch breakdown of expenses by category for this month & year (including uncategorized)
    category_data = db.query(
        models.Category.name,
        func.sum(models.Transaction.amount)
    ).select_from(models.Transaction).outerjoin(
        models.Category, models.Transaction.category_id == models.Category.id
    ).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "expense",
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).group_by(
        models.Category.name
    ).all()
    
    # 4. Format the category data into a list of dicts
    by_category = [
        {"category_name": name if name is not None else "Uncategorized", "amount": float(amount)}
        for name, amount in category_data
    ]
    
    # 5. Return the full dashboard summary
    return {
      "total_income": total_income,
      "total_expense": total_expense,
      "net_savings": total_income - total_expense,
      "by_category": by_category
    }