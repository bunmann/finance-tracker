from pydantic import BaseModel, Field
from typing import Optional
from datetime import date as DateType

class TransactionCreate(BaseModel):
    amount: float = Field(gt=0, description="Amount must be positive")
    category_id: int
    description: str
    type: str = Field(description="Must be 'income' or 'expense'")
    date: Optional[DateType] = None  # Optional field, defaults to None

class UserCreate(BaseModel):
    email: str
    password: str