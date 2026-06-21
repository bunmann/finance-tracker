# ============================================================================
# File: routers/auth.py
# Description: Defines authentication routes including registration, login,
#              and user listing using APIRouter.
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import hash_password, verify_password, create_access_token
from schemas import UserCreate, LoginRequest
import models

router = APIRouter(
    tags=["Authentication"]
)

# API Endpoint: GET /users
# Description: Debug endpoint that lists all registered users in the database.
# Response: List of user objects (id, email).
@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all() # Gets all rows of User from models.py
    return users


# API Endpoint: POST /users
# Description: Registers a new user account, hashes their password, and seeds
#              their initial set of default categories (Food & Dining, etc.).
# Request Body: UserCreate schema (email, password).
# Response: Object containing user id and email.
@router.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if a user with this email already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    # 1. Create a SQLAlchemy model instance from the validated Pydantic data
    db_user = models.User(  # db_user is object instance, models.User is class from models.py
        email=user.email,
        password_hash=hash_password(user.password)  # Hash the password!
    )
    # 2. Stage it (like git add)
    db.add(db_user)
    # 3. Save it (like git commit)
    db.commit()
    # 4. Refresh to get the auto-generated id from the database
    db.refresh(db_user)

    # Seed default categories for the new user
    default_categories = [
        {"name": "Uncategorized", "icon": "📁"},
        {"name": "Food & Dining", "icon": "🍔"},
        {"name": "Transportation", "icon": "🚗"},
        {"name": "Entertainment", "icon": "🎬"},
        {"name": "Shopping", "icon": "🛍️"},
        {"name": "Bills & Utilities", "icon": "💡"},
        {"name": "Health", "icon": "💊"},
    ]

    for cat in default_categories:
        db_category = models.Category(
            name=cat["name"],
            icon=cat["icon"],
            monthly_budget=0.0,
            user_id=db_user.id
        )
        db.add(db_category)

    db.commit()

    return {"id": db_user.id, "email": db_user.email}


# API Endpoint: POST /login
# Description: Authenticates user credentials and returns a signed JWT access token.
# Request Body: LoginRequest schema (email, password).
# Response: Object with access_token and token_type.
@router.post("/login")
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
