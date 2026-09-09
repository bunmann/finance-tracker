# LESSON 1: Relational Database Basics & CRUD

Welcome to Week 2! Today we are moving from in-memory data (Python lists and dicts) and text files (JSON/CSV) to a **Relational Database Management System (RDBMS)**.

For this project, we will use **PostgreSQL**, one of the most powerful, industry-standard SQL databases.

---

## 1. What is a Relational Database?

In Python, you grouped data using **classes** and **objects**. 
In a relational database, data is stored in **Tables** (analogous to a spreadsheet or a collection of class instances).

* **Table (Entity):** A collection of related data (e.g., `transactions`, `categories`).
* **Row (Record/Tuple):** A single data entry (equivalent to a class *instance* in Python).
* **Column (Field/Attribute):** A specific data point inside a row (equivalent to an object *member variable*).
* **Datatypes:** Every column has a strict type (e.g. `INT`, `VARCHAR` (string), `FLOAT`, `BOOLEAN`, `DATE`).

---

## 2. Primary Keys & Foreign Keys

To link tables together, we use **Keys**:

* **Primary Key (PK):** A column (or set of columns) that **uniquely identifies** each row in a table. It cannot be null and cannot have duplicates. 
  * *Example:* `id` (an auto-incrementing integer: 1, 2, 3...).
* **Foreign Key (FK):** A column in one table that **points to the Primary Key** of another table. This creates a "relationship" between them.
  * *Example:* A `category_id` column inside the `transactions` table pointing to `id` in the `categories` table.

```
  [categories]                      [transactions]
  ┌────────────┐                    ┌─────────────────┐
  │ id (PK)    │ <──────┐           │ id (PK)         │
  │ name       │        └────────── │ category_id (FK)│
  │ icon       │                    │ amount          │
  └────────────┘                    │ description     │
                                    └─────────────────┘
```

---

## 3. Basic CRUD Operations in SQL

SQL (Structured Query Language) is the language we use to talk to the database. There are 4 primary operations (CRUD):

| CRUD Operation | SQL Command |
| :--- | :--- |
| **C**reate | `INSERT` |
| **R**ead | `SELECT` |
| **U**pdate | `UPDATE` |
| **D**elete | `DELETE` |

### A. CREATE Table
To create a table, we define its schema:
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,        -- AUTO_INCREMENT equivalent
    name VARCHAR(50) NOT NULL,    -- String, max 50 chars, cannot be null
    icon VARCHAR(10) DEFAULT '📁' -- Default value if none provided
);
```

### B. INSERT (Create records)
Adds a new row of data to the table:
```sql
INSERT INTO categories (name, icon) 
VALUES ('Food', '🍔');

-- To insert multiple at once:
INSERT INTO categories (name, icon)
VALUES 
    ('Transport', '🚌'),
    ('Entertainment', '🎬');
```

### C. SELECT (Read records)
Fetches data from the table:
```sql
-- Read all columns from the table
SELECT * FROM categories;

-- Read only specific columns
SELECT name, icon FROM categories;
```

### D. UPDATE (Modify records)
Modifies existing data. **Always use a WHERE clause, or you will update every row in the table!**
```sql
UPDATE categories 
SET icon = '🍕' 
WHERE name = 'Food'; -- Only updates the row where name is 'Food'
```

### E. DELETE (Remove records)
Removes rows from the table. **Always use a WHERE clause, or you will wipe the entire table!**
```sql
DELETE FROM categories 
WHERE name = 'Entertainment';
```

---

## 4. Sorting & Limiting

Just like Python's `sorted()` and slicing, SQL lets you sort and limit your read results:

```sql
-- Sort categories alphabetically:
SELECT * FROM categories 
ORDER BY name ASC; -- Use DESC for reverse order

-- Get only the first 5 rows (like list[:5] in Python):
SELECT * FROM categories 
LIMIT 5;

-- Skip the first 2 rows and get the next 5 (Pagination - like list[2:7]):
SELECT * FROM categories 
LIMIT 5 OFFSET 2;
```
