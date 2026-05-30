"""
=============================================================================
LESSON 1: Python Basics — Variables, Types, and Operators
=============================================================================

You know C++. Python is the same concepts with simpler syntax.
This file is meant to be READ and RUN. Read each section, then run:

    python3 01_basics.py

Key differences from C++:
    - No type declarations needed (but you CAN add type hints)
    - No semicolons
    - No curly braces — indentation IS the structure
    - No main() required (but we'll use one anyway for good practice)
=============================================================================
"""


def main():
    # =========================================================================
    # 1. VARIABLES — No type declarations needed
    # =========================================================================
    # C++: int age = 21;
    # Python:
    age = 21
    name = "David"
    gpa = 3.89
    is_dean_list = True  # Note: True/False are capitalized (not true/false)

    print(f"Name: {name}, Age: {age}, GPA: {gpa}")
    # ^ f-strings are Python's equivalent of cout with formatting
    # They're like printf but way cleaner

    # Type hints (optional, but good practice for larger projects):
    height_cm: int = 175
    university: str = "University of Toronto"

    # =========================================================================
    # 2. TYPES — Dynamic typing (unlike C++ which is static)
    # =========================================================================
    x = 10       # int
    x = "hello"  # now it's a str — Python doesn't care!
    # In C++ this would be a compile error. Python figures out types at runtime.

    # Check types with type():
    print(f"type(42) = {type(42)}")         # <class 'int'>
    print(f"type(3.14) = {type(3.14)}")     # <class 'float'>
    print(f"type('hi') = {type('hi')}")     # <class 'str'>
    print(f"type(True) = {type(True)}")     # <class 'bool'>
    print(f"type(None) = {type(None)}")     # <class 'NoneType'>
    # None is Python's equivalent of nullptr/NULL

    # =========================================================================
    # 3. STRINGS — Way more powerful than C++ strings
    # =========================================================================
    course = "ECE244"

    # f-strings (formatted string literals) — your new best friend
    print(f"I am taking {course} at {university}")

    # String methods (no #include needed!)
    print(course.lower())          # "ece244"
    print(course.upper())          # "ECE244"
    print(course.startswith("ECE"))  # True
    print(course.replace("244", "297"))  # "ECE297"

    # Slicing — like array indexing but more powerful
    print(course[0])      # "E"        (first char)
    print(course[-1])     # "4"        (last char)
    print(course[0:3])    # "ECE"      (first 3 chars)
    print(course[3:])     # "244"      (from index 3 onward)

    # Multi-line strings
    description = """
    This is a multi-line string.
    You can write as many lines as you want.
    No need for string concatenation.
    """
    print(description)

    # =========================================================================
    # 4. OPERATORS — Same as C++ (mostly)
    # =========================================================================
    a, b = 10, 3  # Multiple assignment in one line!

    print(f"{a} + {b} = {a + b}")     # 13
    print(f"{a} - {b} = {a - b}")     # 7
    print(f"{a} * {b} = {a * b}")     # 30
    print(f"{a} / {b} = {a / b}")     # 3.333... (always float!)
    print(f"{a} // {b} = {a // b}")   # 3 (integer division — like C++ int/int)
    print(f"{a} % {b} = {a % b}")     # 1 (modulo)
    print(f"{a} ** {b} = {a ** b}")   # 1000 (exponentiation — no pow() needed!)

    # Comparison operators: ==, !=, <, >, <=, >= (same as C++)
    # Logical operators: and, or, not (NOT &&, ||, !)
    print(f"a > 5 and b < 5: {a > 5 and b < 5}")  # True
    print(f"not True: {not True}")                   # False

    # =========================================================================
    # 5. CONTROL FLOW — Same logic, different syntax
    # =========================================================================
    # C++: if (grade >= 90) { ... } else if (grade >= 80) { ... }
    # Python:
    grade = 91.6
    if grade >= 90:
        print("A+ — Dean's List!")
    elif grade >= 80:
        print("A")
    elif grade >= 70:
        print("B")
    else:
        print("Below B")
    # No parentheses needed around condition, colon instead of brace

    # Ternary operator
    # C++: string result = (grade >= 90) ? "excellent" : "good";
    result = "excellent" if grade >= 90 else "good"
    print(f"Result: {result}")

    # =========================================================================
    # 6. LOOPS
    # =========================================================================
    # For loop — Python's for is like C++ range-based for
    # C++: for (const auto& course : courses) { ... }
    courses = ["ECE244", "ECE241", "ECE297"]
    for course in courses:
        print(f"Taking: {course}")

    # Range — like a C++ counting for loop
    # C++: for (int i = 0; i < 5; i++) { ... }
    for i in range(5):
        print(f"i = {i}")  # 0, 1, 2, 3, 4

    # range(start, stop, step)
    for i in range(2, 10, 2):
        print(f"Even: {i}")  # 2, 4, 6, 8

    # enumerate — get index AND value (super useful!)
    for i, course in enumerate(courses):
        print(f"Course {i}: {course}")

    # While loop — same concept
    count = 0
    while count < 3:
        print(f"count = {count}")
        count += 1  # Note: no count++ in Python!

    # =========================================================================
    # 7. INPUT / OUTPUT
    # =========================================================================
    # print() is your cout
    print("Hello", "World", sep=", ")  # "Hello, World"
    print("No newline", end=" ")
    print("Same line!")

    # input() is your cin (always returns a string)
    # Uncomment these to try interactively:
    # user_name = input("Enter your name: ")
    # user_age = int(input("Enter your age: "))  # Must cast to int!
    # print(f"Hello {user_name}, you are {user_age} years old")

    print("\n✅ Lesson 1 complete! Run 02_data_structures.py next.")


if __name__ == "__main__":
    main()
