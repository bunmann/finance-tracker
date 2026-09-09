# LESSON 2: Advanced Queries, Joins & Aggregations

Now that you know basic CRUD, we will look at how to filter data, combine tables (joins), and group data (aggregates).

---

## 1. Advanced Filtering (`WHERE` Operators)

In Python, you used `if` statements and list comprehensions to filter lists. In SQL, you do this in the `WHERE` clause.

Here are the common comparison operators:

| Operator | Meaning | Example |
| :--- | :--- | :--- |
| `=` | Equals | `WHERE category = 'Food'` |
| `!=` or `<>` | Not equals | `WHERE category != 'Income'` |
| `<`, `>`, `<=`, `>=` | Numeric bounds | `WHERE amount > 50.00` |
| `BETWEEN x AND y` | Inclusive range | `WHERE date BETWEEN '2026-05-01' AND '2026-05-31'` |
| `IN (a, b, c)` | Matches any in list | `WHERE category IN ('Food', 'Transport')` |
| `LIKE` | Wildcard text match | `WHERE description LIKE '%Timmies%'` (matches any description containing "Timmies") |
| `IS NULL` | Checks for null | `WHERE description IS NULL` |

### Combining Conditions (Logical Operators):
Just like Python's `and`, `or`, and `not`:
```sql
SELECT * FROM transactions
WHERE amount > 50.00 
  AND category = 'Food' 
  AND NOT description LIKE '%Refund%';
```

---

## 2. Joins (Combining Tables)

Usually, databases are **normalized** (split into multiple tables to avoid redundancy). 
For example, we store category metadata in `categories`, and link transactions to it using a `category_id`.

To reconstruct the full data in a query, we **join** the tables together on their shared keys.

```sql
SELECT transactions.date, transactions.amount, transactions.description, categories.name, categories.icon
FROM transactions
INNER JOIN categories ON transactions.category_id = categories.id;
```

### Types of JOINS:

1. **`INNER JOIN` (Default):**
   * Returns rows only when there is a match in **both** tables.
   * If a transaction has a `category_id` that doesn't exist in `categories`, that transaction is excluded from the results.

2. **`LEFT JOIN` (Most Common):**
   * Returns **all** rows from the left table (`transactions`), plus any matching rows from the right table (`categories`). 
   * If there is no match in the right table, those columns return as `NULL`.
   * *Usage:* Useful if you want to see all transactions, even if they don't have a category assigned.

```
      INNER JOIN                      LEFT JOIN
   ┌───────────┐                   ┌───────────┐
   │   Match   │                   │ Left Table│ Match
   │   Only    │                   │   (All)   │ Only
   └───────────┘                   └───────────┘
```

---

## 3. Aggregate Functions & GROUP BY

In Python, you calculated total expenses and grouped spending by category using dictionaries and loops:
```python
spending = {}
for t in transactions:
    spending[t.category] = spending.get(t.category, 0) + t.amount
```

In SQL, we use **Aggregate Functions** combined with **`GROUP BY`**.

### Common Aggregate Functions:
* `SUM(column)`: Adds values together.
* `COUNT(column)`: Counts the number of rows.
* `AVG(column)`: Calculates the average.
* `MIN(column)` / `MAX(column)`: Finds extreme values.

### The `GROUP BY` Clause:
To group your calculations by a specific column (like `category_id` or `type`):

```sql
-- Sum up spending grouped by category_id
SELECT category_id, SUM(amount) AS total_spent
FROM transactions
WHERE type = 'expense'
GROUP BY category_id;
```

### Filtering Aggregates (`HAVING`):
If you want to filter based on the *result* of an aggregate function, you **cannot** use `WHERE`. You must use `HAVING`.
* `WHERE` filters rows *before* grouping occurs.
* `HAVING` filters groups *after* grouping occurs.

```sql
-- Get categories where total spending is greater than $500
SELECT category_id, SUM(amount) AS total_spent
FROM transactions
WHERE type = 'expense'
GROUP BY category_id
HAVING SUM(amount) > 500.00;
```
