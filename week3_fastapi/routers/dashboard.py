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

@router.get("")
def get_dashboard_summary(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Total income
    income_val = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "income",
        models.Transaction.user_id == current_user.id,
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).scalar()
    total_income = float(income_val) if income_val is not None else 0.0

    # 2. Total expenses
    expense_val = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "expense",
        models.Transaction.user_id == current_user.id,
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
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
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
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
