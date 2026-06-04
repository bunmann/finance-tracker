# LESSON 4: CRUD Endpoints — Connecting Everything Together

So far you have built:
* **`schemas.py`** — Pydantic validation (the gatekeeper)
* **`models.py`** — SQLAlchemy models (the database blueprint)
* **`database.py`** — Database connection setup (the wiring)

Now we connect them all in `main.py` to build endpoints that **actually save and read data from PostgreSQL**.

---

## 1. The Full Data Flow

When a user sends a POST request to create a transaction, here's what happens step by step:

```
User sends JSON  →  Pydantic validates  →  SQLAlchemy model created  →  Saved to PostgreSQL
                     (schemas.py)            (models.py)                 (database.py)
```

1. FastAPI receives the JSON request body
2. Pydantic (`schemas.py`) validates the data — rejects bad input with a 422 error
3. You create a SQLAlchemy model instance (`models.py`) using the validated data
4. You use a database session (`database.py`) to save it to PostgreSQL
5. You return a response to the user

---

## 2. Before We Start: Create the Database Tables

SQLAlchemy can automatically create all the tables defined in your `models.py`. We need to tell it to do this when the app starts.

Add these lines to the **top** of your `main.py` (after existing imports):

```python
from database import engine, get_db, Base
from sqlalchemy.orm import Session
from fastapi import Depends
import models

# Create all tables in the database (if they don't exist yet)
Base.metadata.create_all(bind=engine)
```

* **`Base.metadata.create_all(bind=engine)`**: Reads all classes that inherit from `Base` (your `User`, `Category`, `Transaction` models) and runs `CREATE TABLE` SQL for each one — but only if the table doesn't already exist.
* **`import models`**: We must import models so that Python loads the classes and `Base` knows about them.
* **`Depends(get_db)`**: This is FastAPI's **dependency injection** — it automatically calls `get_db()` to give each endpoint a fresh database session, and closes it when done.

---

## 3. Your First Real Endpoint: Create a User (POST)

Update `main.py` to add a `POST /users` endpoint that actually saves to the database:

```python
@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Create a SQLAlchemy model instance from the validated Pydantic data
    db_user = models.User(
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
```

### Breaking down the new parts:

| Code | What it does |
|------|-------------|
| `db: Session = Depends(get_db)` | FastAPI automatically provides a database session to this function |
| `models.User(email=..., password_hash=...)` | Creates a Python object representing a new row |
| `db.add(db_user)` | Stages the new row (tells DB "I want to add this") |
| `db.commit()` | Saves it permanently to PostgreSQL |
| `db.refresh(db_user)` | Reloads the object from DB to get the auto-generated `id` |

---

## 4. Read All Users (GET)

```python
@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users
```

* **`db.query(models.User)`** — tells SQLAlchemy "I want to query the `users` table"
* **`.all()`** — "give me ALL rows" (equivalent to `SELECT * FROM users`)

---

## 5. Create a Transaction (POST)

```python
@app.post("/transactions")
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
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
```

> **Note:** We hardcode `user_id=1` for now because we haven't built login/authentication yet. Once we do, this will automatically use the logged-in user's ID.

---

## 6. Read All Transactions (GET)

```python
@app.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).all()
    return transactions
```

---

## 7. Delete a Transaction (DELETE)

This uses a **path parameter** — the transaction ID is part of the URL:

```python
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
```

### New concepts:
| Code | What it does |
|------|-------------|
| `@app.delete(...)` | Handles HTTP DELETE requests |
| `.filter(models.Transaction.id == transaction_id)` | SQL `WHERE id = ?` |
| `.first()` | Returns the first matching row (or `None` if nothing found) |
| `db.delete(transaction)` | Marks the row for deletion |

---

## 8. Let's practice (Your Task)

1. Update your `main.py` with the database imports and `Base.metadata.create_all(...)`.
2. Replace your old `POST /users` endpoint with the real one that saves to PostgreSQL.
3. Add the `GET /users` endpoint.
4. Replace your old `POST /transactions` endpoint with the real one that saves to PostgreSQL.
5. Add the `GET /transactions` endpoint.
6. Add the `DELETE /transactions/{transaction_id}` endpoint.

### Testing:
Start uvicorn and go to [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs):
1. First, create a user with `POST /users`
2. Verify it saved with `GET /users`
3. Create a transaction with `POST /transactions`
4. Verify it saved with `GET /transactions`
5. Delete it with `DELETE /transactions/{id}`
6. Verify it's gone with `GET /transactions`

If all 6 steps work, your API is officially talking to PostgreSQL! 🎉
