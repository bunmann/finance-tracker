# ============================================================================
# File: schemas.py
# Description: Defines Pydantic schemas for request validation and serialization.
# ============================================================================
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date as DateType

class TransactionCreate(BaseModel):
    amount: float = Field(gt=0, description="Amount must be positive")
    category_id: Optional[int] = None
    description: str
    type: Literal["income", "expense"]  
    date: Optional[DateType] = None  # Optional field, defaults to None

class UserCreate(BaseModel):
    email: str
    password: str

class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "📁"
    monthly_budget: Optional[float] = 0.0

class LoginRequest(BaseModel):
    email: str
    password: str