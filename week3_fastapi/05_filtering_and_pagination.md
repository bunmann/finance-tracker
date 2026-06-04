# Week 3 — Lesson 5: Filtering & Pagination

So far, our `GET /transactions` endpoint returns **every single transaction** in the database. If a user has 10,000 transactions, returning them all at once will slow down the API, freeze the browser, and waste server resources.

In this lesson, we will learn how to add **query parameters** to filter search results by date range, type, or category, and implement **pagination** to return data in small, manageable pages.

---

## 1. How Query Parameters Work in FastAPI

Unlike path parameters (e.g. `/transactions/{id}`), **query parameters** are appended to the end of the URL after a `?` symbol:

`http://127.0.0.1:8000/transactions?limit=10&type=expense`

In FastAPI, any function parameter that is a basic type (like `int`, `str`, `date`) and is **not** part of the path is automatically treated as a query parameter. We can also make them optional by giving them a default value of `None`.

```python
from datetime import date
from typing import Optional

@app.get("/transactions")
def get_transactions(
    limit: int = 10,
    offset: int = 0,
    type: Optional[str] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    # logic here...
```

---

## 2. Dynamic Filtering in SQLAlchemy

To build a query dynamically based on which filters the user provided, we build a query object first, add filters conditionally, and then execute it:

```python
# 1. Start a base query (doesn't execute yet)
query = db.query(models.Transaction)

# 2. Add filters dynamically if they were provided
if type:
    query = query.filter(models.Transaction.type == type)

if category_id:
    query = query.filter(models.Transaction.category_id == category_id)

# 3. Add date range filter (start_date <= date <= end_date)
if start_date:
    query = query.filter(models.Transaction.date >= start_date)
if end_date:
    query = query.filter(models.Transaction.date <= end_date)
```

---

## 3. SQL Pagination (LIMIT and OFFSET)

To keep responses fast, we divide results into pages:
* **`LIMIT`** tells the database: *"Only return $N$ rows."* (In SQLAlchemy: `.limit(N)`)
* **`OFFSET`** tells the database: *"Skip the first $M$ rows before starting to return."* (In SQLAlchemy: `.offset(M)`)

For example:
* **Page 1** (first 10 items): `limit=10`, `offset=0`
* **Page 2** (items 11-20): `limit=10`, `offset=10`
* **Page 3** (items 21-30): `limit=10`, `offset=20`

In SQLAlchemy, we chain these onto the end of our query:
```python
transactions = query.offset(offset).limit(limit).all()
```

---

## 4. Your Task: Update the GET /transactions Endpoint

Update your `GET /transactions` endpoint in [main.py](file:///Users/david/Documents/PG/Finance%20Project/week3_fastapi/main.py) to look like this:

```python
from datetime import date
from typing import Optional

@app.get("/transactions")
def get_transactions(
    limit: int = 10,
    offset: int = 0,
    type: Optional[str] = None,
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
```

### Testing your new filters:
Go back to [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) and click the **`GET /transactions`** dropdown.
1. Click **Try it out**.
2. Notice the new parameters input fields.
3. Try entering `limit=2` and execute it. You should only see 2 items.
4. Try filtering by `type` (e.g. `expense` or `income`).
5. Try filtering by `start_date` and `end_date` (format: `YYYY-MM-DD`).
