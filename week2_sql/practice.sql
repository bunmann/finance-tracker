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



-- =========================================================================
-- STEP 2: Insert categories linked to your user
-- =========================================================================
-- TODO: Insert 4-5 categories into the 'categories' table.
-- Hint: 
--  - Link each category to the user you created in Step 1 (check what ID they got, likely 1).
--  - Provide: 'name', 'icon' (optional), 'monthly_budget' (optional), and 'user_id'.



-- =========================================================================
-- STEP 3: Insert transactions
-- =========================================================================
-- TODO: Insert 10-12 transactions (mix of incomes and expenses) into 'transactions'.
-- Hint:
--  - Make sure 'user_id' and 'category_id' point to valid records in your tables!
--  - Provide: 'amount', 'description', 'user_id', 'category_id', and 'type' ('income' or 'expense').
--  - 'date' is optional (defaults to CURRENT_DATE).



-- =========================================================================
-- STEP 4: Write verification queries
-- =========================================================================

-- Query 1: Get all transactions showing the amount, description, and type.


-- Query 2: Get all transactions but JOIN them with their categories so you can 
-- display the category name next to the transaction details.


-- Query 3: Calculate the total spending (expenses only) grouped by category.
-- Hint: Use GROUP BY and SUM(amount).


-- Query 4: Calculate the net balance for the user (total income - total expenses).
-- Hint: You can use a conditional aggregation:
--       SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS net_balance


-- Query 5: Get the top 3 highest expenses.
-- Hint: Filter by type, sort by amount descending, and limit to 3.
