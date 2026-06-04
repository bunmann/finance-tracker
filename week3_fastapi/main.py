from fastapi import FastAPI
from schemas import TransactionCreate, UserCreate
from database import engine, get_db, Base
from sqlalchemy.orm import Session
from fastapi import Depends
import models

# Create all tables in the database (if they don't exist yet)
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")       # Whenever HTTPS request is made at path "/"
def read_root():       # execute this function
    return {"message": "Hello World! Welcome to your Finance API."}

# =====================USER ENDPOINTS====================

@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
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


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all() # Gets all rows of User from models.py
    return users

# =====================TRANSACTION ENDPOINTS====================

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


@app.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).all()
    return transactions


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