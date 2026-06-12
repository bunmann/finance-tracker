# Week 5 — Lesson 1: JWT Authentication (Backend)

Right now, every endpoint in your API is public — anyone can create, read, or delete transactions. Worse, every transaction is hardcoded to `user_id=1`. In this lesson, we'll add **real authentication** so each user has their own account and can only see their own data.

---

## 1. What is Authentication?

**Authentication** = proving *who you are* (login with email + password).
**Authorization** = checking *what you're allowed to do* (can this user see this transaction?).

We'll implement both:
1. Users sign up with an email and password (authentication)
2. Each API request includes a token proving who they are (authorization)

---

## 2. How JWT Tokens Work

**JWT (JSON Web Token)** is the industry standard for API authentication. Here's the flow:

```
1. User sends email + password to POST /login
2. Server verifies the password
3. Server creates a JWT token containing the user's ID
4. Server sends the token back to the client
5. Client stores the token and includes it in every future request
6. Server reads the token to know which user is making the request
```

A JWT token looks like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzE5...
```

It's just a Base64-encoded JSON object with three parts separated by dots:
- **Header**: algorithm used (HS256)
- **Payload**: data you put in (user ID, expiration time)
- **Signature**: cryptographic proof that the token hasn't been tampered with

The server signs the token with a **secret key**. If anyone modifies the payload, the signature won't match, and the server rejects it.

### Why Not Just Use Sessions/Cookies?

| Sessions (Server-side) | JWT (Token-based) |
|---|---|
| Server stores session data in memory/database | Token is self-contained — server stores nothing |
| Doesn't scale well (each server needs access to session store) | Scales easily (any server can verify the token) |
| Tied to cookies (browser-only) | Works with any client (mobile apps, Postman, etc.) |

JWT is the standard for modern APIs, especially when the frontend and backend are separate applications (like ours).

---

## 3. Installing Dependencies

We need two new libraries:

```bash
pip install python-jose[cryptography] passlib[bcrypt]
```

- **`python-jose`**: Creates and verifies JWT tokens
- **`passlib`**: Hashes passwords securely using bcrypt

### Why Hash Passwords?

Right now, our `POST /users` endpoint stores the password as plain text in `password_hash`. If anyone gains access to the database, they can see everyone's passwords.

**Hashing** converts the password into an irreversible string:
```
"mypassword123" → "$2b$12$LJ3m4ks92jfNsd8f..."
```

You can verify a password against a hash, but you **cannot** reverse the hash back to the password. This is why password hashing is non-negotiable in any real application.

---

## 4. Creating the Auth Utility Module

Create a new file: **`week3_fastapi/auth.py`**

```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models

# ====== Configuration ======
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ====== Password Hashing ======
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Convert a plain password into a bcrypt hash."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if a plain password matches a stored hash."""
    return pwd_context.verify(plain_password, hashed_password)

# ====== JWT Token Creation ======
def create_access_token(data: dict) -> str:
    """Create a JWT token with an expiration time."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ====== Token Verification (Dependency) ======
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Extract the user from a JWT token. Use as a FastAPI dependency."""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Look up the user in the database
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user
```

That's a lot of code, so let's break it down piece by piece.

### Password Hashing Functions

```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

`CryptContext` is from `passlib`. It manages password hashing. We tell it to use **bcrypt**, which is the industry standard for password hashing (it's intentionally slow, making brute-force attacks impractical).

```python
def hash_password(password: str) -> str:
    return pwd_context.hash(password)
```

Takes `"mypassword123"` and returns something like `"$2b$12$LJ3m4ks92j..."`. Each call produces a different hash (due to random salt), but `verify_password` can still match them.

### JWT Token Creation

```python
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

We pass in `{"sub": "1"}` (the user's ID), add an expiration timestamp, and sign it with our secret key. The `"sub"` key is a JWT convention for "subject" (who this token is about).

### Token Verification Dependency

```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
```

This tells FastAPI: "When an endpoint requires authentication, look for a `Bearer` token in the `Authorization` header." It also configures Swagger UI to show a login button.

```python
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
```

This is a **FastAPI dependency** — just like `get_db`. When you add `user = Depends(get_current_user)` to any endpoint, FastAPI will:
1. Extract the token from the `Authorization: Bearer <token>` header
2. Decode and verify the JWT
3. Look up the user in the database
4. Return the user object (or raise a 401 error if anything fails)

---

## 5. Adding a Login Schema

Add this to **`schemas.py`**:

```python
class LoginRequest(BaseModel):
    email: str
    password: str
```

This validates the login request body — same pattern as `TransactionCreate` and `UserCreate`.

---

## 6. Updating the Endpoints

Now we update **`main.py`** to use our new auth system.

### Import the auth module

Add to the top of `main.py`:
```python
from auth import hash_password, verify_password, create_access_token, get_current_user
from schemas import TransactionCreate, UserCreate, CategoryCreate, LoginRequest
```

### Update `POST /users` to hash the password

```python
@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    db_user = models.User(
        email=user.email,
        password_hash=hash_password(user.password)  # Hash the password!
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"id": db_user.id, "email": db_user.email}
```

The only change: `password_hash=hash_password(user.password)` instead of `password_hash=user.password`.

### Add the login endpoint

```python
@app.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # 1. Find the user by email
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 2. Verify the password against the stored hash
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 3. Create and return a JWT token
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
```

Notice the error message says "Invalid email or password" for both cases (wrong email and wrong password). This is a security best practice — you don't want to reveal whether an email exists in your system.

### Protect the transaction endpoints

Replace the hardcoded `user_id=1` with the logged-in user:

```python
@app.get("/transactions")
def get_transactions(
    limit: int = 10,
    offset: int = 0,
    type: Optional[Literal["income", "expense"]] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)  # NEW!
):
    query = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id  # Only this user's transactions
    )

    if type:
        query = query.filter(models.Transaction.type == type)
    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)

    return query.offset(offset).limit(limit).all()


@app.post("/transactions")
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)  # NEW!
):
    db_transaction = models.Transaction(
        amount=transaction.amount,
        description=transaction.description,
        type=transaction.type,
        date=transaction.date,
        category_id=transaction.category_id,
        user_id=current_user.id  # Use logged-in user instead of hardcoded 1
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)  # NEW!
):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id  # Can only delete own transactions
    ).first()

    if not transaction:
        return {"error": "Transaction not found"}

    db.delete(transaction)
    db.commit()
    return {"message": f"Transaction {transaction_id} deleted"}
```

The pattern is always the same:
1. Add `current_user: models.User = Depends(get_current_user)` to the function signature
2. Filter queries by `current_user.id` instead of hardcoding `1`

### Protect category and dashboard endpoints the same way

Apply the same pattern to `GET /categories`, `POST /categories`, `DELETE /categories/{id}`, and `GET /dashboard` — add the `current_user` dependency and filter by `current_user.id`.

---

## 7. Testing in Swagger

After restarting uvicorn, go to `http://localhost:8000/docs`.

1. **Reset the database** first (since existing passwords aren't hashed):
   - Hit `POST /debug/reset-db`

2. **Create a user:**
   - `POST /users` with `{"email": "test@example.com", "password": "mypassword"}`

3. **Login:**
   - `POST /login` with `{"email": "test@example.com", "password": "mypassword"}`
   - Copy the `access_token` from the response

4. **Authenticate in Swagger:**
   - Click the 🔒 **Authorize** button at the top of the Swagger page
   - Paste your token and click "Authorize"
   - Now all your requests will include the token automatically

5. **Test a protected endpoint:**
   - `GET /transactions` should work (returns empty list for new user)
   - Try without the token — you should get a `401 Unauthorized` error

---

## 8. Your Task

1. Install the new dependencies: `pip install python-jose[cryptography] passlib[bcrypt]`
2. Create `week3_fastapi/auth.py` with the code from Section 4.
3. Add `LoginRequest` to `schemas.py`.
4. Update `main.py`:
   - Import from `auth.py`
   - Update `POST /users` to hash passwords
   - Add the `POST /login` endpoint
   - Add `Depends(get_current_user)` to all transaction, category, and dashboard endpoints
   - Replace all `user_id=1` with `current_user.id`
5. Reset your database (`POST /debug/reset-db`) since old passwords aren't hashed.
6. Test the full flow in Swagger: signup → login → use token → access protected data.

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **bcrypt** | Hashes passwords so they can't be reversed |
| **JWT** | Self-contained token carrying user identity |
| **SECRET_KEY** | Server-side key used to sign/verify tokens |
| **`Depends(get_current_user)`** | FastAPI dependency that extracts the user from the token |
| **401 Unauthorized** | HTTP status code for "you're not logged in" or "bad token" |
| **OAuth2PasswordBearer** | FastAPI helper that reads `Authorization: Bearer <token>` headers |
