"""
=============================================================================
LESSON 3: Functions, Classes, and Modules
=============================================================================

This covers:
    - Functions (def, args, kwargs, return values, type hints)
    - Classes (OOP — you know this from C++)
    - Modules and imports

After this lesson you'll be able to write structured, organized Python code.
=============================================================================
"""

from dataclasses import dataclass
from datetime import datetime


def main():
    # =========================================================================
    # 1. FUNCTIONS
    # =========================================================================

    # Basic function
    # C++: int add(int a, int b) { return a + b; }
    def add(a: int, b: int) -> int:
        return a + b

    print(f"add(3, 4) = {add(3, 4)}")

    # Default arguments (same concept as C++)
    def greet(name: str, greeting: str = "Hello") -> str:
        return f"{greeting}, {name}!"

    print(greet("David"))                    # "Hello, David!"
    print(greet("David", "Hey"))             # "Hey, David!"
    print(greet("David", greeting="Yo"))     # Named argument — "Yo, David!"

    # Multiple return values (Python superpower — no need for structs/pairs!)
    def get_stats(numbers: list[float]) -> tuple[float, float, float]:
        """Return min, max, and average of a list of numbers."""
        return min(numbers), max(numbers), sum(numbers) / len(numbers)

    grades = [85.0, 92.0, 78.0, 95.0, 88.0]
    low, high, avg = get_stats(grades)  # Tuple unpacking!
    print(f"Low: {low}, High: {high}, Avg: {avg:.1f}")

    # *args — variable number of positional arguments
    def sum_all(*numbers: float) -> float:
        """Sum any number of arguments."""
        return sum(numbers)

    print(f"sum_all(1,2,3) = {sum_all(1, 2, 3)}")
    print(f"sum_all(1,2,3,4,5) = {sum_all(1, 2, 3, 4, 5)}")

    # **kwargs — variable number of keyword arguments
    def create_profile(**info) -> dict:
        """Create a profile dict from keyword arguments."""
        return info

    profile = create_profile(name="David", age=21, university="UofT")
    print(f"Profile: {profile}")
    # {'name': 'David', 'age': 21, 'university': 'UofT'}

    # Lambda functions — anonymous one-liners
    # C++: auto square = [](int x) { return x * x; };
    square = lambda x: x ** 2
    print(f"square(5) = {square(5)}")

    # Lambdas are most useful for sorting:
    students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]
    students.sort(key=lambda s: s[1], reverse=True)  # Sort by grade, descending
    print(f"Sorted by grade: {students}")

    # =========================================================================
    # 2. CLASSES — You know this from C++, just simpler syntax
    # =========================================================================

    # C++ class:
    # class Transaction {
    #   private:
    #     double amount;
    #     string category;
    #   public:
    #     Transaction(double a, string c) : amount(a), category(c) {}
    #     double getAmount() { return amount; }
    # };

    # Python class:
    class Transaction:
        """Represents a financial transaction."""

        def __init__(self, amount: float, category: str, description: str = ""):
            # __init__ is the constructor
            # self is like 'this' in C++, but you must write it explicitly
            self.amount = amount
            self.category = category
            self.description = description
            self.date = datetime.now()

        def __str__(self) -> str:
            """Called when you print() the object (like operator<< in C++)."""
            return f"${self.amount:.2f} [{self.category}] - {self.description}"

        def __repr__(self) -> str:
            """Called in debugging / when object is in a list."""
            return f"Transaction({self.amount}, '{self.category}')"

        def is_expense(self) -> bool:
            """Check if this is an expense (negative amount)."""
            return self.amount < 0

    # Using the class
    t1 = Transaction(-15.50, "Food", "Lunch at Bahen")
    t2 = Transaction(-45.00, "Transport", "Presto reload")
    t3 = Transaction(500.00, "Income", "Tutoring payment")

    print(f"\nTransaction: {t1}")      # Calls __str__
    print(f"Is expense? {t1.is_expense()}")

    # =========================================================================
    # 3. INHERITANCE — Same as C++ but simpler
    # =========================================================================

    class RecurringTransaction(Transaction):
        """A transaction that repeats on a schedule."""

        def __init__(self, amount: float, category: str, description: str,
                     frequency: str = "monthly"):
            # Call parent constructor — like C++ : Transaction(amount, category)
            super().__init__(amount, category, description)
            self.frequency = frequency

        def __str__(self) -> str:
            return f"{super().__str__()} (recurring: {self.frequency})"

    rent = RecurringTransaction(-750.00, "Housing", "Rent", "monthly")
    print(f"\n{rent}")

    # =========================================================================
    # 4. DATACLASSES — Modern Python's shortcut for simple data-holding classes
    # =========================================================================
    # If your class is mainly holding data (like a C++ struct), use @dataclass.
    # It auto-generates __init__, __repr__, __eq__ for you.

    @dataclass
    class Category:
        name: str
        icon: str = "📁"
        budget: float = 0.0

    # No need to write __init__! It's auto-generated from the fields.
    food = Category("Food", "🍔", 300.0)
    transport = Category("Transport", "🚌", 150.0)
    print(f"\n{food}")        # Category(name='Food', icon='🍔', budget=300.0)
    print(f"{transport}")

    # Dataclasses are VERY common in FastAPI for defining data models.
    # You'll use something similar (Pydantic models) for your API.

    # =========================================================================
    # 5. PUTTING IT TOGETHER — A mini finance tracker
    # =========================================================================
    print("\n--- Mini Finance Tracker ---")

    transactions = [
        Transaction(-15.50, "Food", "Lunch"),
        Transaction(-45.00, "Transport", "Presto"),
        Transaction(-12.99, "Food", "Coffee & snacks"),
        Transaction(500.00, "Income", "Tutoring"),
        Transaction(-89.00, "Entertainment", "Concert tickets"),
        Transaction(-8.50, "Food", "Tim Hortons"),
    ]

    # Total spending by category (using a dict)
    spending: dict[str, float] = {}
    for t in transactions:
        if t.is_expense():
            category = t.category
            spending[category] = spending.get(category, 0) + abs(t.amount)

    print("\nSpending by category:")
    for category, total in sorted(spending.items(), key=lambda x: x[1], reverse=True):
        print(f"  {category}: ${total:.2f}")

    # Total income vs expenses
    total_income = sum(t.amount for t in transactions if not t.is_expense())
    total_expense = sum(abs(t.amount) for t in transactions if t.is_expense())
    print(f"\nIncome:   ${total_income:.2f}")
    print(f"Expenses: ${total_expense:.2f}")
    print(f"Net:      ${total_income - total_expense:.2f}")

    print("\n✅ Lesson 3 complete! Run 04_file_io_and_errors.py next.")


if __name__ == "__main__":
    main()
