/*
=============================================================================
WEEK 2 PRACTICE: SQL Inserts, Joins, and Aggregations
=============================================================================

This practice script will help you build muscle memory for writing SQL queries.
You will insert test data and retrieve structured information from your 
`finance_tracker` database.

HOW TO RUN:
    1. Open your terminal and connect to your database:
       psql finance_tracker
    2. Run this script:
       \i week2_sql/practice.sql
=============================================================================
*/

-- =========================================================================
-- STEP 1: Insert a test user
-- =========================================================================
-- TODO: Insert a user into the 'users' table.
-- Hint: Provide 'email' and 'password_hash'. The 'id' and 'created_at' are handled automatically.

INSERT INTO users (email, password_hash) VALUES
   ('joe123@gmail.com', 'password123');

-- =========================================================================
-- STEP 2: Insert categories linked to your user
-- =========================================================================
-- TODO: Insert 4-5 categories into the 'categories' table.
-- Hint: 
--  - Link each category to the user you created in Step 1 (check what ID they got, likely 1).
--  - Provide: 'name', 'icon' (optional), 'monthly_budget' (optional), and 'user_id'.

INSERT INTO categories (name, icon, monthly_budget, user_id) VALUES
    ('Food', '🍔', 500.00, 1),
    ('Transport', '🚗', 300.00, 1),
    ('Income', '💰', 0.00, 1),
    ('Entertainment', '🎉', 200.00, 1),
    ('Housing', '🏠', 800.00, 1);

-- =========================================================================
-- STEP 3: Insert transactions
-- =========================================================================
-- TODO: Insert 10-12 transactions (mix of incomes and expenses) into 'transactions'.
-- Hint:
--  - Make sure 'user_id' and 'category_id' point to valid records in your tables!
--  - Provide: 'amount', 'description', 'user_id', 'category_id', and 'type' ('income' or 'expense').
--  - 'date' is optional (defaults to CURRENT_DATE).

INSERT INTO transactions (amount, description, user_id, category_id, type) VALUES
    (10.00, 'Coffee', 1, 1, 'expense'),
    (20.00, 'Lunch', 1, 1, 'expense'),
    (30.00, 'Dinner', 1, 1, 'expense'),
    (40.00, 'Taxi', 1, 2, 'expense'),
    (50.00, 'Bus', 1, 2, 'expense'),
    (60.00, 'Train', 1, 2, 'expense'),
    (70.00, 'Movie', 1, 4, 'expense'),
    (1500.00, 'Paycheck', 1, 3, 'income'),
    (50.00, 'Tips', 1, 3, 'income'),
    (100.00, 'Rent', 1, 5, 'expense'),
    (110.00, 'Electricity', 1, 5, 'expense'),
    (120.00, 'Water', 1, 5, 'expense');

-- =========================================================================
-- STEP 4: Write verification queries
-- =========================================================================

-- Query 1: Get all transactions showing the amount, description, and type.
SELECT amount, description, type FROM transactions;

-- Query 2: Get all transactions but JOIN them with their categories so you can 
-- display the category name next to the transaction details.
SELECT * FROM transactions
LEFT JOIN categories ON transactions.category_id = categories.id;

-- Query 3: Calculate the total spending (expenses only) grouped by category.
-- Hint: Use GROUP BY and SUM(amount).
SELECT c.name as category, SUM(t.amount) as total_spent
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id 
WHERE t.type = 'expense'
GROUP BY c.id;


-- Query 4: Calculate the net balance for the user (total income - total expenses).
-- Hint: You can use a conditional aggregation:
--       SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS net_balance

SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS net_balance
FROM transactions;


-- Query 5: Get the top 3 highest expenses.
-- Hint: Filter by type, sort by amount descending, and limit to 3.
SELECT * FROM transactions
WHERE type = 'expense'
ORDER BY amount DESC
LIMIT 3;