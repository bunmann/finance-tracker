# ============================================================================
# File: schemas.py
# Description: Defines Pydantic schemas for request validation and serialization.
# ============================================================================
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date as DateType

# ============================================================================
# Core & Authentication Schemas
# ============================================================================

class UserCreate(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str


# ============================================================================
# Cash Flow & Categorization Schemas
# ============================================================================

class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "📁"
    monthly_budget: Optional[float] = 0.0

class TransactionCreate(BaseModel):
    amount: float = Field(gt=0, description="Amount must be positive")
    category_id: Optional[int] = None
    description: str
    type: Literal["income", "expense"]  
    date: Optional[DateType] = None  # Optional field, defaults to None


# ============================================================================
# Stock Portfolio Schemas
# ============================================================================

class StockTransaction(BaseModel):
    ticker: str
    shares: float = Field(gt=0, description="Number of shares must be positive")
    price: float = Field(gt=0, description="Price per share must be positive")
    date: Optional[DateType] = None


class WatchlistCreate(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10, description="Stock ticker symbol")


class SectorCompetenceCreate(BaseModel):
    sector: str = Field(..., min_length=1, max_length=100, description="Sector name")