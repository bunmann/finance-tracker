# LESSON 3: Connecting to PostgreSQL using SQLAlchemy (ORM)

So far, you've written SQL scripts in `schema.sql` and Python scripts in `main.py`. In this lesson, we will connect them using an **ORM (Object-Relational Mapper)** called **SQLAlchemy**.

---

## 1. What is an ORM?

An **ORM** translates database tables into Python classes, and database rows into Python objects.

Instead of writing raw SQL strings inside Python:
```python
# Raw SQL inside Python (Messy, prone to SQL injection)
cursor.execute("INSERT INTO users (email) VALUES ('joe@gmail.com');")
```

You interact with database records entirely using Python objects:
```python
# SQLAlchemy ORM (Clean, type-safe)
new_user = User(email="joe@gmail.com")
db.add(new_user)
db.commit()
```

---

## 2. Pydantic Schemas vs. SQLAlchemy Models

This is the most common point of confusion for backend beginners. They seem similar, but have completely different purposes:

| Concept | File | Purpose | Analogy |
| :--- | :--- | :--- | :--- |
| **Pydantic Schema** | `schemas.py` | Defines data shapes for HTTP requests and responses (JSON validation). | The **Passport/ID** (validates who enters the API). |
| **SQLAlchemy Model** | `models.py` | Defines the actual database tables, columns, and relations. | The **Blueprint/Cabinet** (defines how data is stored on disk). |

---

## 3. Setting Up the Database Connection

Create a new file `week3_fastapi/database.py`. It is responsible for setting up the connection pool and sessions:

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL format: postgresql://[user]:[password]@[host]/[database_name]
# Since we are local and have no password set:
DATABASE_URL = "postgresql://localhost/finance_tracker"

# 1. Create engine (handles the connection pool)
engine = create_engine(DATABASE_URL)

# 2. SessionLocal (creates temporary sessions to interact with database)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Base class (all database models will inherit from this)
Base = declarative_base()

# 4. Dependency Injection Helper
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```
* **`get_db()`** is a helper function that will open a database session for each API request, pass it to the route, and automatically close it when the request is done to prevent memory leaks.

---

## 4. Declaring SQLAlchemy Models

Create a new file `week3_fastapi/models.py`. Here is how we map the SQL tables we designed in Week 2 into Python classes:

```python
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    icon = Column(String(255), default="📁")
    monthly_budget = Column(Numeric(10, 2), default=0.0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)
    type = Column(String(10), nullable=False)  # 'income' or 'expense'
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
```
* **`__tablename__`**: Tells SQLAlchemy which database table this class represents.
* **`ForeignKey("users.id")`**: Links the column to another table's primary key, mirroring our SQL design.

---

## 5. Let's practice (Your Task)

Before installing SQLAlchemy and psycopg2 (the PostgreSQL adapter for Python), run:
```bash
pip install sqlalchemy psycopg2-binary
```

Your task is to:
1. Create `database.py` with the connection code.
2. Create `models.py` with the three database classes matching your database structure.
3. Next, we will write routes that query and insert data using these models!
