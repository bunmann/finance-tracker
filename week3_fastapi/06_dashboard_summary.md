# Week 3 — Lesson 6: The Dashboard Summary Endpoint

To build our dashboard in React next week, we need an endpoint that returns a high-level summary of the user's financial status for a given month. 

Instead of asking the frontend to fetch thousands of transactions and sum them up (which is slow and inefficient), we will do this aggregation directly in the database using **SQL aggregates** (like `SUM` and `GROUP BY`).

---

## 1. What does the Dashboard need?

We want our frontend dashboard to show:
1. **Total Income** for the month.
2. **Total Expenses** for the month.
3. **Net Savings** (Income - Expenses).
4. **Spending by Category** (e.g. Food: $300, Rent: $1200) to populate a pie chart.

We want our endpoint `GET /dashboard` to return a clean JSON payload like this:

```json
{
  "total_income": 5000.00,
  "total_expense": 2400.00,
  "net_savings": 2600.00,
  "by_category": [
    {"category_name": "Rent", "amount": 2000.00},
    {"category_name": "Food", "amount": 400.00}
  ]
}
```

---

## 2. Using SQL Aggregations in SQLAlchemy

To sum up values, SQL uses the `SUM()` function. In SQLAlchemy, we import this function from the `func` module:

```python
from sqlalchemy import func
```

### Querying Total Income & Expense:
We filter transactions by `type` and sum the `amount` column:
```python
total_income = db.query(func.sum(models.Transaction.amount)).filter(
    models.Transaction.type == "income"
).scalar() or 0.0
```
*Note: `.scalar()` extracts the single numeric value from the query result. We use `or 0.0` to handle cases where there are no transactions (since `SUM()` on 0 rows returns `None` in SQL).*

### Querying Grouped Expenses by Category:
To get the breakdown, we need a SQL `JOIN` between `transactions` and `categories`, grouped by the category name:
```python
category_summary = db.query(
    models.Category.name,
    func.sum(models.Transaction.amount)
).join(
    models.Transaction, models.Transaction.category_id == models.Category.id
).filter(
    models.Transaction.type == "expense"
).group_by(
    models.Category.name
).all()
```

---

## 3. Your Task: Add the GET /dashboard Endpoint

Add the `GET /dashboard` endpoint to your `main.py` file.

Open [main.py](file:///Users/david/Documents/PG/Finance%20Project/week3_fastapi/main.py) and add this code (make sure to import `func` from `sqlalchemy` at the top!):

```python
# Add this import at the top of main.py
from sqlalchemy import func
```

And add the endpoint:

```python
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
```

---

## 4. Testing the Dashboard:
1. Since we dropped the tables, you'll need to create a user, create a category (using a tool like `psql` or by checking if you want to add a quick `POST /categories` endpoint), and then add some transactions.
2. Visit `http://127.0.0.1:8000/docs`.
3. Try calling `GET /dashboard?month=6&year=2026`.
4. Observe the clean financial breakdown!

You've completed Week 3! You now have a complete, fully featured API backend ready to power a modern React single-page app. 🎉
