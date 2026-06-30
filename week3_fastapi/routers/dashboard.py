# ============================================================================
# File: routers/dashboard.py
# Description: Defines dashboard monthly summary routes using APIRouter.
# ============================================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import get_current_user
import models

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

# API Endpoint: GET /dashboard
# Description: Generates monthly summary metrics including total income, total expense,
#              net savings, and a category-by-category breakdown of expense amounts and budgets.
# Query Params:
#   - month (int): Target calendar month (1-12).
#   - year (int): Target calendar year.
# Response: Dictionary containing total_income, total_expense, net_savings, and by_category array.
@router.get("")
def get_dashboard_summary(
    month: int = 0,
    year: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # =========================================================================
    # PERIOD FILTERING LOGIC (month=0 and year=0 handling):
    # - If both month == 0 and year == 0: No date restrictions applied (All Time mode).
    # - If month == 0 and year > 0: Aggregates across the full specified year (Year mode).
    # - If month > 0 and year > 0: Aggregates for the exact specified calendar month (Month mode).
    # =========================================================================
    date_filters = []
    if year > 0:
        date_filters.append(func.extract('year', models.Transaction.date) == year)
    if month > 0:
        date_filters.append(func.extract('month', models.Transaction.date) == month)

    # 1. Total income
    income_val = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "income",
        models.Transaction.user_id == current_user.id,
        *date_filters
    ).scalar()
    total_income = float(income_val) if income_val is not None else 0.0

    # 2. Total expenses
    expense_val = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "expense",
        models.Transaction.user_id == current_user.id,
        *date_filters
    ).scalar()
    total_expense = float(expense_val) if expense_val is not None else 0.0

    # 3. Spending by category (with budget info and outer join for Uncategorized)
    category_data = db.query(
        models.Category.name,
        models.Category.monthly_budget,
        func.sum(models.Transaction.amount)
    ).select_from(models.Transaction).outerjoin(
        models.Category, models.Transaction.category_id == models.Category.id
    ).filter(
        models.Transaction.type == "expense",
        models.Transaction.user_id == current_user.id,
        *date_filters
    ).group_by(
        models.Category.name,
        models.Category.monthly_budget
    ).all()

    by_category = [
        {
            "category_name": name if name is not None else "Uncategorized",
            "budget": float(budget) if budget is not None else 0.0,
            "amount": float(amount),
        }
        for name, budget, amount in category_data
    ]

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_savings": total_income - total_expense,
        "by_category": by_category
    }
