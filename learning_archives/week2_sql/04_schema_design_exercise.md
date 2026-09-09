# WEEK 2 EXERCISE: Schema Design for your Finance Tracker

This is your Week 2 challenge. You will design and implement the relational database schema (tables, datatypes, and relationships) that your personal finance app will use.

In Week 1, you built a single-user system that saved transactions directly to JSON. 
For Week 2, we want to upgrade this to a **multi-user system** backed by **PostgreSQL**.

---

## 1. The Requirements

Your database needs to support the following three entities:

### A. Users Table (`users`)
* Each user needs a unique ID (primary key).
* An email address (must be unique, cannot be null).
* A password hash (string, cannot be null).
* A timestamp of when the account was created.

### B. Categories Table (`categories`)
* Unique ID (primary key).
* A name (e.g., "Food", "Transport") that cannot be null.
* An icon (string, default '📁').
* A monthly budget amount (float/decimal, defaults to 0.0).
* **Relationship:** Each category must belong to a specific **User**. (A foreign key pointing to the `users` table).

### C. Transactions Table (`transactions`)
* Unique ID (primary key).
* An amount (numeric decimal).
* A description (string).
* A date (date type, defaults to the current day).
* A transaction type (must be either 'income' or 'expense').
* **Relationship 1:** Each transaction must belong to a specific **User**. (A foreign key pointing to the `users` table).
* **Relationship 2:** Each transaction has a **Category** (A foreign key pointing to the `categories` table. If the category is deleted, you can decide whether to delete the transaction or set the category to null/default).

---

## 2. Your Task

1. Read through [03_postgres_setup.md](file:///Users/david/Documents/PG/Finance%20Project/week2_sql/03_postgres_setup.md) to install PostgreSQL and log into `psql`.
2. Create a new database named `finance_tracker`:
   ```sql
   CREATE DATABASE finance_tracker;
   ```
3. Connect to it:
   ```sql
   \c finance_tracker
   ```
4. Create a new file in your editor named `week2_sql/schema.sql`.
5. Write the `CREATE TABLE` SQL statements for `users`, `categories`, and `transactions` inside `week2_sql/schema.sql`.
   * *Remember: Order matters! You cannot create a Foreign Key pointing to a table that doesn't exist yet. Create independent tables first, then dependent tables.*
6. Run the script in `psql` to create the tables. You can load and execute a `.sql` file inside `psql` using the `\i` command:
   ```sql
   \i week2_sql/schema.sql
   ```
7. Verify that your tables and relationships were created successfully using `\dt` and `\d table_name`.

---

## 💡 SQL Syntax Hints:
* **Timestamps:** Use `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.
* **Foreign Keys:** 
  ```sql
  user_id INT REFERENCES users(id) ON DELETE CASCADE
  ```
  *(Note: `ON DELETE CASCADE` means if a user deletes their account, all of their categories/transactions are deleted automatically).*
* **Enforcing Specific Values:** To force a column to only accept 'income' or 'expense', use a `CHECK` constraint:
  ```sql
  type VARCHAR(10) CHECK (type IN ('income', 'expense'))
  ```
