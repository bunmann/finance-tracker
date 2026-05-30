"""
=============================================================================
LESSON 2: Data Structures — Lists, Dicts, Sets, Tuples
=============================================================================

C++ equivalents:
    list    → std::vector  (dynamic array, ordered, mutable)
    dict    → std::map / std::unordered_map  (key-value pairs)
    set     → std::set / std::unordered_set  (unique elements)
    tuple   → std::tuple  (immutable, fixed-size)

These 4 data structures cover 90% of what you'll use in Python.
=============================================================================
"""


def main():
    # =========================================================================
    # 1. LISTS — Python's vector
    # =========================================================================
    # C++: vector<string> courses = {"ECE244", "ECE241", "MAT185"};
    courses = ["ECE244", "ECE241", "MAT185"]

    # Access (same as C++)
    print(courses[0])      # "ECE244"
    print(courses[-1])     # "MAT185" (last element — Python superpower!)

    # Modify
    courses[0] = "ECE297"
    print(courses)  # ['ECE297', 'ECE241', 'MAT185']

    # Add elements
    courses.append("ECE345")        # push_back equivalent
    courses.insert(1, "ECE253")     # insert at index 1
    print(courses)

    # Remove elements
    courses.remove("MAT185")        # remove by value
    last = courses.pop()             # remove and return last element (like stack)
    print(f"Popped: {last}")
    print(courses)

    # Length
    print(f"Number of courses: {len(courses)}")  # len() not .size()

    # Check membership (no find() + end() nonsense!)
    print(f"ECE297 in courses? {'ECE297' in courses}")  # True

    # Slicing (same as strings)
    numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    print(numbers[2:5])    # [2, 3, 4]
    print(numbers[:3])     # [0, 1, 2]     (first 3)
    print(numbers[-3:])    # [7, 8, 9]     (last 3)
    print(numbers[::2])    # [0, 2, 4, 6, 8]  (every other)
    print(numbers[::-1])   # [9, 8, ..., 0]   (reversed!)

    # Sorting
    grades = [85, 92, 78, 95, 88]
    grades.sort()                    # In-place sort (ascending)
    print(f"Sorted: {grades}")
    grades.sort(reverse=True)        # Descending
    print(f"Desc: {grades}")

    # sorted() returns a NEW list (original unchanged)
    original = [3, 1, 4, 1, 5]
    new_sorted = sorted(original)
    print(f"Original: {original}, Sorted copy: {new_sorted}")

    # =========================================================================
    # 2. LIST COMPREHENSIONS — Python's secret weapon (no C++ equivalent!)
    # =========================================================================
    # This is THE most important Python feature you don't have in C++.
    # It's a concise way to create lists with a single expression.

    # Basic: create a list of squares
    # C++: vector<int> squares; for (int i=0; i<10; i++) squares.push_back(i*i);
    squares = [x**2 for x in range(10)]
    print(f"Squares: {squares}")  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

    # With condition: only even squares
    even_squares = [x**2 for x in range(10) if x % 2 == 0]
    print(f"Even squares: {even_squares}")  # [0, 4, 16, 36, 64]

    # Transform a list
    courses = ["ece244", "ece241", "mat185"]
    upper_courses = [c.upper() for c in courses]
    print(f"Upper: {upper_courses}")  # ['ECE244', 'ECE241', 'MAT185']

    # Nested: flatten a 2D list
    matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    flat = [num for row in matrix for num in row]
    print(f"Flat: {flat}")  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

    # =========================================================================
    # 3. DICTIONARIES — Python's map
    # =========================================================================
    # C++: map<string, int> grades = {{"ECE244", 90}, {"ECE241", 85}};
    grades = {
        "ECE244": 90,
        "ECE241": 85,
        "MAT185": 92,
    }

    # Access
    print(grades["ECE244"])        # 90
    print(grades.get("ECE345", 0))  # 0 (default if key missing — no crash!)
    # grades["ECE345"] would raise KeyError — .get() is safer

    # Modify / Add
    grades["ECE297"] = 88          # Add new key
    grades["ECE244"] = 95          # Update existing

    # Remove
    del grades["ECE241"]           # Remove a key
    # or: grades.pop("ECE241")

    # Iterate
    print("\nAll grades:")
    for course, grade in grades.items():
        print(f"  {course}: {grade}")

    # Just keys or values
    print(f"Courses: {list(grades.keys())}")
    print(f"Grades: {list(grades.values())}")

    # Check if key exists
    print(f"ECE244 in grades? {'ECE244' in grades}")  # True

    # Dict comprehension (like list comprehension but for dicts!)
    # Create a dict of course -> pass/fail
    pass_fail = {course: ("Pass" if g >= 50 else "Fail") for course, g in grades.items()}
    print(f"Pass/Fail: {pass_fail}")

    # =========================================================================
    # 4. SETS — Unique elements only
    # =========================================================================
    # C++: set<string> skills = {"C++", "Python", "Verilog"};
    skills = {"C++", "Python", "Verilog"}

    skills.add("SQL")            # Insert
    skills.add("C++")            # No duplicate — already exists
    skills.discard("Verilog")    # Remove (no error if missing)
    print(f"Skills: {skills}")

    # Set operations (super useful!)
    required = {"Python", "SQL", "Docker", "Git"}
    my_skills = {"C++", "Python", "Git", "Verilog"}

    print(f"Skills I have that are required: {required & my_skills}")        # Intersection
    print(f"Skills I'm missing:             {required - my_skills}")         # Difference
    print(f"All unique skills:              {required | my_skills}")         # Union
    print(f"Skills in one but not both:     {required ^ my_skills}")        # Symmetric diff

    # =========================================================================
    # 5. TUPLES — Immutable lists
    # =========================================================================
    # Like a list, but you CANNOT modify it after creation.
    # Used for things that shouldn't change (coordinates, RGB, return values).

    point = (3, 4)
    rgb = (255, 128, 0)
    # point[0] = 5  # ERROR! Tuples are immutable.

    # Unpacking — assign tuple elements to variables
    x, y = point
    print(f"x={x}, y={y}")

    # Common use: return multiple values from a function
    # (You'll see this a LOT in Python)

    # =========================================================================
    # 6. USEFUL BUILT-IN FUNCTIONS
    # =========================================================================
    numbers = [4, 2, 7, 1, 9, 3]

    print(f"len: {len(numbers)}")     # 6
    print(f"min: {min(numbers)}")     # 1
    print(f"max: {max(numbers)}")     # 9
    print(f"sum: {sum(numbers)}")     # 26
    print(f"any > 5: {any(n > 5 for n in numbers)}")   # True
    print(f"all > 0: {all(n > 0 for n in numbers)}")   # True

    # zip — iterate over multiple lists in parallel
    names = ["ECE244", "ECE241", "MAT185"]
    scores = [90, 85, 92]
    for name, score in zip(names, scores):
        print(f"  {name}: {score}")

    print("\n✅ Lesson 2 complete! Run 03_functions_and_classes.py next.")


if __name__ == "__main__":
    main()
