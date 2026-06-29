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


# ============================================================================
# Quantitative Algorithmic Screener Schemas
# ============================================================================

class ScreenerRequest(BaseModel):
    min_fcf_growth: Optional[float] = Field(default=0.20, description="Minimum Free Cash Flow growth rate (0.20 is 20%)")
    min_profit_margin: Optional[float] = Field(default=0.15, description="Minimum Net Profit Margin (0.15 is 15%)")
    max_debt_equity: Optional[float] = Field(default=1.0, description="Maximum Debt-to-Equity ratio")
    max_pe: Optional[float] = Field(default=25.0, description="Maximum trailing Price-to-Earnings ratio")
    circle_of_competence_only: Optional[bool] = Field(default=False, description="Filter for sectors in user's circle of competence")


class ScreenerResponseItem(BaseModel):
    ticker: str
    name: str
    sector: str
    price: float
    pe: Optional[float]
    fcf_growth: Optional[float]
    profit_margin: Optional[float]
    debt_to_equity: Optional[float]
    performance_30d: float
    relative_strength: float


class AnomalyResponseItem(BaseModel):
    ticker: str
    name: str
    sector: str
    current_price: float
    performance_30d: float
    qoq_revenue_growth: Optional[float]
    message: str
    source: str  # "watchlist", "portfolio", or "both"


from typing import List
class MultiStrategyScanResponse(BaseModel):
    momentum_quality: List[ScreenerResponseItem]
    value_gap: List[AnomalyResponseItem]