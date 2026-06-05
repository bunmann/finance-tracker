from fastapi import FastAPI, Depends, HTTPException
from schemas import TransactionCreate, UserCreate, CategoryCreate
from database import engine, get_db, Base
from sqlalchemy import func
from sqlalchemy.orm import Session
import models
from datetime import date
from typing import Optional, Literal

# Create all tables in the database (if they don't exist yet)
Base.metadata.create_all(bind=engine)

app = FastAPI()

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
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists."
        )

    # 1. Create a SQLAlchemy model instance from the validated Pydantic data
    db_user = models.User(  # db_user is object instance, models.User is class from models.py
        email=user.email,
        password_hash=user.password   # In real life, you'd hash this first!
    )
    # 2. Stage it (like git add)
    db.add(db_user)
    # 3. Save it (like git commit)
    db.commit()
    # 4. Refresh to get the auto-generated id from the database
    db.refresh(db_user)
    # 5. Return the created user
    return {"id": db_user.id, "email": db_user.email}



# =====================TRANSACTION ENDPOINTS====================

@app.get("/transactions")
def get_transactions(
    limit: int = 10,
    offset: int = 0,
    type: Optional[Literal["income", "expense"]] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    # Start building the base query
    query = db.query(models.Transaction)
    
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
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    # Create python instance object for transaction.
    db_transaction = models.Transaction(
        amount=transaction.amount,
        description=transaction.description,
        type=transaction.type,
        date=transaction.date,
        category_id=transaction.category_id,
        user_id=1  # Hardcoded for now — we'll fix this when we add authentication
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    # Find the transaction
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id
    ).first()
    
    # If not found, return an error
    if not transaction:
        return {"error": "Transaction not found"}
    
    # Delete it
    db.delete(transaction)
    db.commit()
    return {"message": f"Transaction {transaction_id} deleted"}


    # =====================CATEGORY ENDPOINTS====================

@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@app.post("/categories")
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    # Check if a category with this name already exists for the user
    existing_category = db.query(models.Category).filter(
        models.Category.name == category.name,
        models.Category.user_id == 1  # Hardcoded to user 1 for now
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
        user_id=1  # Hardcoded to user 1 for now
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@app.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
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
def get_dashboard_summary(month: int, year: int, db: Session = Depends(get_db)):
    # 1. Fetch total income for this month & year
    total_income = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "income",
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).scalar() or 0.0
    
    # 2. Fetch total expenses for this month & year
    total_expense = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "expense",
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).scalar() or 0.0
    
    # 3. Fetch breakdown of expenses by category for this month & year
    category_data = db.query(
        models.Category.name,
        func.sum(models.Transaction.amount)
    ).join(
        models.Transaction, models.Transaction.category_id == models.Category.id
    ).filter(
        models.Transaction.type == "expense",
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).group_by(
        models.Category.name
    ).all()
    
    # 4. Format the category data into a list of dicts
    by_category = [{"category_name": name, "amount": float(amount)} for name, amount in category_data]
    
    # 5. Return the full dashboard summary
    return {
      "total_income": float(total_income),
      "total_expense": float(total_expense),
      "net_savings": float(total_income - total_expense),
      "by_category": by_category
    }