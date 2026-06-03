# LESSON 2: Pydantic & Request Data Validation

When building an API, you cannot trust the data sent by clients. A user could send a string instead of a number, a negative amount for a purchase, or omit required fields completely.

In FastAPI, we use **Pydantic** to validate incoming data structures.

---

## 1. What is Pydantic?

**Pydantic** is a library that enforces type hints. 
* If a variable is declared as an `int`, Pydantic checks if the incoming value is an integer. 
* If it can be safely cast (like the string `"123"` into `123`), Pydantic converts it automatically.
* If it cannot be converted, Pydantic rejects the request immediately and returns a **`422 Unprocessable Entity`** error with a detailed message—without your endpoint code ever running!

---

## 2. Path vs. Query Parameters

FastAPI distinguishes parameters by where they appear in the request URL:

### 1. Path Parameters (Part of the URL path)
Used to identify a specific resource.
```python
# GET /transactions/42
@app.get("/transactions/{transaction_id}")
def get_transaction(transaction_id: int):
    return {"transaction_id": transaction_id}
```

### 2. Query Parameters (Appended after the `?` in the URL)
Used for filtering, sorting, or pagination. They do not appear in the route decorator path.
```python
# GET /transactions?limit=10&type=expense
@app.get("/transactions")
def list_transactions(limit: int = 10, type: str | None = None):
    return {"limit": limit, "type": type}
```

---

## 3. Request Bodies using Pydantic `BaseModel`

For creating or updating records (like a `POST` request), clients send JSON data in the HTTP request body. We define the shape of this JSON using Pydantic's `BaseModel`.

### How to define a Pydantic Schema:
Create a new file `week3_fastapi/schemas.py`:

```python
from pydantic import BaseModel, Field
from datetime import date

# Define the schema for creating a transaction
class TransactionCreate(BaseModel):
    amount: float = Field(gt=0, description="Amount must be positive")
    category_id: int
    description: str
    type: str = Field(description="Must be 'income' or 'expense'")
    date: date | None = None  # Optional field, defaults to None
```
* **`Field(gt=0)`**: Enforces that the amount must be Greater Than 0.
* **`date | None`**: Makes the field optional. Pydantic automatically parses date strings like `"2026-06-03"` into Python `datetime.date` objects!

### Using the Schema in your route:
Import the schema in `main.py`:

```python
from schemas import TransactionCreate

@app.post("/transactions")
def create_transaction(transaction: TransactionCreate):
    # 'transaction' is now a fully validated Python object
    return {
        "status": "validated",
        "data": transaction.dict()
    }
```

---

## 4. Let's practice (Your Task)

Open [main.py](file:///Users/david/Documents/PG/Finance%20Project/week3_fastapi/main.py) and implement the following:

1. Create a `schemas.py` file with:
   * A `UserCreate` schema requiring `email` (string) and `password` (string).
   * A `TransactionCreate` schema requiring `amount` (positive float), `category_id` (integer), `type` (string), and `description` (string).
2. In `main.py`, create a `POST /users` endpoint that accepts the `UserCreate` schema and returns the email back.
3. In `main.py`, create a `POST /transactions` endpoint that accepts the `TransactionCreate` schema and returns the validated transaction data.

Once you write the code, start uvicorn and test them using your interactive Swagger docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)!
