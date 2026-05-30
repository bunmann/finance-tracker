"""
=============================================================================
WEEK 1 EXERCISE: Build a Mini Finance Tracker (CLI)
=============================================================================

This is your Week 1 milestone project. It ties together EVERYTHING from
lessons 1-4: variables, data structures, functions, classes, file I/O,
CSV, JSON, and error handling.

YOUR TASK:
    Build a command-line finance tracker that can:

    1. Add transactions (amount, category, description)
    2. View all transactions
    3. Show a spending summary by category
    4. Save transactions to a JSON file
    5. Load transactions from a JSON file on startup

REQUIREMENTS:
    - Use a Transaction class (or dataclass)
    - Use a dict to track spending by category
    - Use try/except for error handling (bad input, missing file)
    - Use JSON for persistence (save/load)
    - Calculate and display: total income, total expenses, net balance

STRETCH GOALS (optional):
    - Import transactions from a CSV file
    - Add date filtering (show transactions from this month only)
    - Add budget warnings ("You've spent 80% of your Food budget!")
    - Sort transactions by date or amount

HOW TO RUN:
    cd "Finance Project/week1_python"
    python3 05_week1_exercise.py

HINTS:
    - Start with the Transaction class
    - Then build the menu loop
    - Then add save/load
    - Don't try to do everything at once!

Below is a SKELETON to get you started. Fill in the TODO sections.
If you get stuck, check the solutions/ folder (but try first!).
=============================================================================
"""

import json
import os
from dataclasses import dataclass, asdict
from datetime import datetime


# =========================================================================
# STEP 1: Define your Transaction data class
# =========================================================================
@dataclass
class Transaction:
    amount: float
    category: str
    description: str
    date: str  # We'll store as string for JSON compatibility
    type: str  # "income" or "expense"

    def __str__(self) -> str:
        sign = "+" if self.type == "income" else "-"
        return f"{self.date} | {sign}${abs(self.amount):>8.2f} | {self.category:15s} | {self.description}"


# =========================================================================
# STEP 2: Finance Tracker class — manages all transactions
# =========================================================================
class FinanceTracker:
    DATA_FILE = "data/tracker_data.json"

    def __init__(self):
        self.transactions: list[Transaction] = []
        self.load()  # Load saved data on startup, defined function in class below

    def add_transaction(self, amount: float, category: str, description: str) -> Transaction:
        """Add a new transaction. Positive = income, negative = expense."""
        # TODO: Create a Transaction object and append it to self.transactions
        # HINT:
        #   - Use datetime.now().strftime("%Y-%m-%d") for the date
        #   - Determine type based on whether amount is positive or negative
        #   - Return the created transaction

        # Determine if income or expense.
        if amount > 0: type = 'income'
        else: type = 'expense'
        amount = abs(amount)
        date = datetime.now().strftime("%Y-%m-%d")

        # Create new transaction, append and return.
        new_transaction = Transaction(amount, category, description, date, type)
        self.transactions.append(new_transaction)
        return new_transaction


    def get_summary(self) -> dict:
        """Calculate spending summary by category.
        
        Returns a dict with:
            - 'total_income': float
            - 'total_expenses': float 
            - 'net': float
            - 'by_category': dict[str, float]  (category -> total spent)
        """
        # TODO: Loop through self.transactions and calculate totals
        # HINT:
        #   - Use a dict to accumulate spending per category
        #   - Only count expenses in by_category (not income)

        # Create total income and expenses with category.
        total_income = 0
        total_expenses = 0
        expense_category: dict[str,float] = {}

        # Parse data appropriately.
        for transaction in self.transactions:
            if transaction.type == 'income': 
                total_income += transaction.amount
            elif transaction.type == 'expense':
                total_expenses += transaction.amount
                expense_category[transaction.category] = expense_category.get(transaction.category, 0) + transaction.amount

        # Calculate net income and return.
        net = total_income - total_expenses
        return {'total_income': total_income, 'total_expenses': total_expenses, 'net': net, 'by_category': expense_category}


    def save(self) -> None:
        """Save all transactions to a JSON file."""
        # TODO: Convert transactions to a list of dicts and save to DATA_FILE
        # HINT:
        #   - Use asdict(t) to convert a dataclass to a dict
        #   - Use json.dump() to write to file
        #   - Use os.makedirs() to create the data/ directory if needed

        # Convert self.transactions -> list of dicts.
        transactions_dict = []
        for transaction in self.transactions:
            transactions_dict.append(asdict(transaction))
        # Better way: transactions_list = [asdict(t) for t in self.transactions]

        # Create json file if needed.
        os.makedirs(os.path.dirname(self.DATA_FILE), exist_ok= True)

        # Convert list of dicts -> json.
        with open(self.DATA_FILE, "w") as f:
            json.dump(transactions_dict, f)

        return


    def load(self) -> None:
        """Load transactions from a JSON file (if it exists)."""
        # TODO: Read DATA_FILE and populate self.transactions
        # HINT:
        #   - Use try/except FileNotFoundError to handle missing file
        #   - Use json.load() to read the file
        #   - Use Transaction(**data) to create Transaction from dict

        # Load saved data into self.transactions.
        # If no saved data, load nothing
        try:
            with open(self.DATA_FILE, "r") as f:
                saved_data = json.load(f)
            self.transactions = [Transaction(**item_dict) for item_dict in saved_data]
        except FileNotFoundError:
            pass
        

    def display_transactions(self) -> None:
        """Print all transactions in a formatted table."""
        if not self.transactions:
            print("\n  No transactions yet. Add some!")
            return

        print(f"\n  {'Date':<12} | {'Amount':>10} | {'Category':15s} | Description")
        print("  " + "-" * 65)
        for t in self.transactions:
            print(f"  {t}")

    def display_summary(self) -> None:
        """Print the spending summary."""
        summary = self.get_summary()
        if summary is None:
            print("\n  No transactions to summarize.")
            return

        print("\n  === Financial Summary ===")
        print(f"  Total Income:   ${summary['total_income']:>10.2f}")
        print(f"  Total Expenses: ${summary['total_expenses']:>10.2f}")
        print(f"  Net Balance:    ${summary['net']:>10.2f}")

        if summary['by_category']:
            print("\n  Spending by Category:")
            for cat, total in sorted(summary['by_category'].items(), key=lambda x: x[1], reverse=True):
                bar = "█" * int(total / 10)
                print(f"    {cat:15s} ${total:>8.2f}  {bar}")


# =========================================================================
# STEP 3: Main menu loop
# =========================================================================

def get_user_transaction(is_expense: bool) -> tuple[float, str, str]:
    # Keep asking for amount if it's not a float.
    while True:
        amount = input ("Please provide amount: ").strip()
        try: # Convert amount into float and change to negative
            amount = float(amount)
            break
        except ValueError:
            pass

    # If expense, make amount negative.
    if is_expense:
        amount *= -1

    # Ask for remaining inputs.
    category = input("Please provide category: ").strip()
    description = input("Please provide description: ").strip()

    return (amount, category, description)

def main():
    tracker = FinanceTracker()
    print("\n💰 Personal Finance Tracker — Week 1 Exercise")
    print("=" * 50)

    while True:
        print("\n  1. Add expense")
        print("  2. Add income")
        print("  3. View transactions")
        print("  4. View summary")
        print("  5. Save & quit")
        print()

        choice = input("  Choose (1-5): ").strip()

        if choice == "1":
            # TODO: Prompt for amount, category, description
            # HINT:
            #   - Use input() to get values
            #   - Use float() to convert amount (wrap in try/except!)
            #   - Call tracker.add_transaction() with NEGATIVE amount
            #   - Print confirmation

            # Get user transaction
            amount, category, description = get_user_transaction(is_expense = True)
            
            # Add transaction into tracker.
            tracker.add_transaction(amount, category, description)

            # Print confirmation
            print ("Successfully added expense!")


        elif choice == "2":
            # TODO: Same as above but with POSITIVE amount
                        # Get user transaction
            amount, category, description = get_user_transaction(is_expense = False)
            
            # Add transaction into tracker.
            tracker.add_transaction(amount, category, description)

            # Print confirmation
            print ("Successfully added income!")

        elif choice == "3":
            tracker.display_transactions()

        elif choice == "4":
            tracker.display_summary()

        elif choice == "5":
            tracker.save()
            print("\n  💾 Data saved. Goodbye!")
            break

        else:
            print("\n  ❌ Invalid choice. Try 1-5.")


if __name__ == "__main__":
    main()
