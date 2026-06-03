/*

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

*/

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(255) DEFAULT '📁',
    monthly_budget DECIMAL(10, 2) DEFAULT 0.0,
    user_id INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(10) NOT NULL CHECK(type IN ('income', 'expense')),
    user_id INTEGER NOT NULL REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
);