"""
=============================================================================
LESSON 4: File I/O, JSON, CSV, and Error Handling
=============================================================================

This is directly relevant to your project:
    - CSV: you'll import bank statement CSVs
    - JSON: your API will send/receive JSON
    - Error handling: your backend needs to handle bad input gracefully

This lesson creates sample files, reads them, and processes them.
=============================================================================
"""

import csv
import json
import os
from datetime import datetime


def main():
    # We'll create files in a 'data' subdirectory
    os.makedirs("data", exist_ok=True)

    # =========================================================================
    # 1. READING AND WRITING TEXT FILES
    # =========================================================================
    print("=== Text Files ===\n")

    # Writing a file
    # C++: ofstream file("data/notes.txt"); file << "Hello\n";
    with open("data/notes.txt", "w") as f:
        f.write("Finance Project Notes\n")
        f.write(f"Created: {datetime.now()}\n")
        f.write("TODO: Learn Python, SQL, FastAPI, React\n")
    # 'with' automatically closes the file — no need for f.close()
    # This is like RAII in C++ but explicit

    # Reading a file
    with open("data/notes.txt", "r") as f:
        content = f.read()  # Read entire file as one string
    print(f"File contents:\n{content}")

    # Reading line by line
    with open("data/notes.txt", "r") as f:
        for line_number, line in enumerate(f, 1):
            print(f"  Line {line_number}: {line.strip()}")
            # .strip() removes the trailing newline

    # =========================================================================
    # 2. CSV FILES — You'll use this for importing bank statements
    # =========================================================================
    print("\n=== CSV Files ===\n")

    # Create a sample CSV (simulating a bank statement)
    transactions = [
        {"date": "2026-05-01", "description": "Tim Hortons", "amount": -5.50, "category": "Food"},
        {"date": "2026-05-02", "description": "Presto Reload", "amount": -50.00, "category": "Transport"},
        {"date": "2026-05-03", "description": "Tutoring Payment", "amount": 200.00, "category": "Income"},
        {"date": "2026-05-05", "description": "Grocery Store", "amount": -45.30, "category": "Food"},
        {"date": "2026-05-07", "description": "Netflix", "amount": -16.99, "category": "Entertainment"},
        {"date": "2026-05-10", "description": "Textbook Refund", "amount": 85.00, "category": "Income"},
        {"date": "2026-05-12", "description": "Uber Eats", "amount": -22.50, "category": "Food"},
        {"date": "2026-05-15", "description": "Spotify", "amount": -9.99, "category": "Entertainment"},
    ]

    # Write CSV
    with open("data/transactions.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["date", "description", "amount", "category"])
        writer.writeheader()
        writer.writerows(transactions)
    print("Created data/transactions.csv")

    # Read CSV
    loaded_transactions = []
    with open("data/transactions.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # CSV reads everything as strings — need to convert types
            row["amount"] = float(row["amount"])
            loaded_transactions.append(row)

    print(f"Loaded {len(loaded_transactions)} transactions from CSV:")
    for t in loaded_transactions[:3]:  # Show first 3
        print(f"  {t['date']} | {t['description']:20s} | ${t['amount']:>8.2f}")
    print("  ...")

    # =========================================================================
    # 3. JSON — Your API will send and receive this format
    # =========================================================================
    print("\n=== JSON ===\n")

    # JSON is THE data format of the web.
    # When your React frontend talks to your FastAPI backend, they exchange JSON.

    # Python dict → JSON string
    user_data = {
        "name": "David",
        "email": "dav.jung@mail.utoronto.ca",
        "monthly_budget": 1500.00,
        "categories": ["Food", "Transport", "Entertainment"],
        "is_premium": False,  # Note: Python's True/False → JSON's true/false
    }

    json_string = json.dumps(user_data, indent=2)
    print(f"Python dict as JSON:\n{json_string}")

    # Write JSON to file
    with open("data/user_data.json", "w") as f:
        json.dump(user_data, f, indent=2)
    print("\nSaved to data/user_data.json")

    # Read JSON from file
    with open("data/user_data.json", "r") as f:
        loaded_data = json.load(f)
    print(f"Loaded name: {loaded_data['name']}")
    print(f"Loaded categories: {loaded_data['categories']}")

    # JSON string → Python dict
    api_response = '{"status": "success", "balance": 1234.56}'
    parsed = json.loads(api_response)
    print(f"\nParsed API response: {parsed}")
    print(f"Balance: ${parsed['balance']:.2f}")

    # =========================================================================
    # 4. ERROR HANDLING — try/except (like try/catch in C++)
    # =========================================================================
    print("\n=== Error Handling ===\n")

    # Basic try/except
    # C++: try { ... } catch (const exception& e) { ... }
    try:
        result = 10 / 0
    except ZeroDivisionError:
        print("Can't divide by zero!")

    # Catching multiple exception types
    try:
        data = {"a": 1}
        value = data["b"]  # KeyError — key doesn't exist
    except KeyError as e:
        print(f"Key not found: {e}")
    except TypeError as e:
        print(f"Type error: {e}")

    # Real-world example: safely parsing user input
    def parse_amount(amount_str: str) -> float | None:
        """Try to parse a string as a dollar amount. Return None if invalid."""
        try:
            # Remove $ sign if present
            cleaned = amount_str.replace("$", "").replace(",", "").strip()
            return float(cleaned)
        except (ValueError, AttributeError):
            return None

    test_inputs = ["$15.50", "1,234.56", "abc", "$-45.00", ""]
    for inp in test_inputs:
        result = parse_amount(inp)
        print(f"  parse_amount('{inp}') = {result}")

    # try/except/else/finally (full version)
    print("\nFull try/except/else/finally:")
    try:
        f = open("data/transactions.csv", "r")
        lines = f.readlines()
    except FileNotFoundError:
        print("  File not found!")
    else:
        # Runs only if NO exception occurred
        print(f"  Successfully read {len(lines)} lines")
    finally:
        # ALWAYS runs (like a destructor)
        f.close()
        print("  File closed.")

    # Raising exceptions (like throw in C++)
    def withdraw(balance: float, amount: float) -> float:
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > balance:
            raise ValueError(f"Insufficient funds: balance=${balance:.2f}, requested=${amount:.2f}")
        return balance - amount

    try:
        new_balance = withdraw(100.00, 150.00)
    except ValueError as e:
        print(f"\nWithdrawal failed: {e}")

    # =========================================================================
    # 5. PRACTICAL EXERCISE — Process the CSV we created
    # =========================================================================
    print("\n=== Practical: CSV Analysis ===\n")

    # This is essentially what your finance tracker will do!
    # Read transactions, categorize, summarize.

    spending_by_category: dict[str, float] = {}
    total_income = 0.0
    total_expenses = 0.0

    for t in loaded_transactions:
        amount = t["amount"]
        category = t["category"]

        if amount >= 0:
            total_income += amount
        else:
            total_expenses += abs(amount)
            spending_by_category[category] = spending_by_category.get(category, 0) + abs(amount)

    print("Monthly Summary")
    print("-" * 35)
    print(f"  Total Income:   ${total_income:>10.2f}")
    print(f"  Total Expenses: ${total_expenses:>10.2f}")
    print(f"  Net:            ${total_income - total_expenses:>10.2f}")
    print()
    print("Spending by Category:")
    for category, total in sorted(spending_by_category.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * int(total / 5)  # Simple bar chart
        print(f"  {category:15s} ${total:>8.2f}  {bar}")

    print("\n✅ Lesson 4 complete! Run 05_week1_exercise.py next (it's your challenge!).")


if __name__ == "__main__":
    main()
