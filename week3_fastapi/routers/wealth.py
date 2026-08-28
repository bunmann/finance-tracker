# ============================================================================
# File: routers/wealth.py
# Description: Endpoints for calculating net worth, wealth health metrics, and saving snapshots.
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
import calendar
from typing import Optional

from database import get_db
from auth import get_current_user
import models
import schemas
from common.stock_service import get_stock_price, _get_cad_price, calculate_portfolio_historical_curve
from decimal import Decimal

router = APIRouter(
    prefix="/wealth",
    tags=["Wealth"]
)

@router.get("/net-worth", response_model=schemas.NetWorthResponse)
def get_net_worth(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns current net worth (Cash + Stocks - Liabilities) and the last 12 historical snapshots.
    Automatically generates a snapshot for today if one doesn't exist.
    """
    # 1. Calculate Cash Balance
    income_res = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "income"
    ).scalar() or 0.0

    expense_res = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "expense"
    ).scalar() or 0.0

    cash_balance = Decimal(str(income_res)) - Decimal(str(expense_res))

    # 2. Calculate Live Stock Portfolio Value
    holdings = db.query(models.Holding).filter(models.Holding.user_id == current_user.id).all()
    stock_value = Decimal("0")
    for h in holdings:
        price, _, _ = get_stock_price(h.ticker, db)
        if price:
            p_cad = _get_cad_price(price, h.currency, db, ticker=h.ticker)
            val = h.shares * Decimal(str(p_cad if p_cad is not None else price))
            stock_value += val

    # 3. Get Liabilities
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    liabilities = Decimal(str(profile.liabilities)) if profile else Decimal("0.0")

    # 4. Net Worth
    net_worth = cash_balance + stock_value - liabilities

    today = date.today()

    # 5. Save Snapshot for Today if missing
    existing_snapshot = db.query(models.NetWorthSnapshot).filter(
        models.NetWorthSnapshot.user_id == current_user.id,
        models.NetWorthSnapshot.date == today
    ).first()

    if existing_snapshot:
        # Update it so it's always accurate for the current day
        existing_snapshot.cash_balance = cash_balance
        existing_snapshot.stock_value = stock_value
        existing_snapshot.liabilities = liabilities
        existing_snapshot.net_worth = net_worth
    else:
        new_snap = models.NetWorthSnapshot(
            user_id=current_user.id,
            date=today,
            cash_balance=cash_balance,
            stock_value=stock_value,
            liabilities=liabilities,
            net_worth=net_worth
        )
        db.add(new_snap)
    
    db.commit()

    # 6. Fetch Last 12 Snapshots for Sparkline
    history_records = db.query(models.NetWorthSnapshot).filter(
        models.NetWorthSnapshot.user_id == current_user.id
    ).order_by(models.NetWorthSnapshot.date.desc()).limit(12).all()

    history = [
        {"date": rec.date.isoformat(), "net_worth": float(rec.net_worth)}
        for rec in reversed(history_records)
    ]

    return {
        "cash_balance": float(cash_balance),
        "stock_value": float(stock_value),
        "liabilities": float(liabilities),
        "net_worth": float(net_worth),
        "history": history
    }

@router.put("/liabilities", response_model=schemas.NetWorthResponse)
def update_liabilities(
    data: schemas.LiabilitiesUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Updates user's manual liabilities and returns refreshed net worth."""
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if profile:
        profile.liabilities = data.amount
    else:
        profile = models.UserProfile(user_id=current_user.id, liabilities=data.amount)
        db.add(profile)
    db.commit()
    # Call get_net_worth to return updated numbers
    return get_net_worth(db, current_user)

@router.get("/health", response_model=schemas.WealthHealthResponse)
def get_wealth_health(
    month: int = 0,
    year: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns total income, total expenses, net savings, savings rate %, and biggest expense category.
    If month/year are 0, computes all-time stats.
    """
    query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)
    
    if month > 0 and year > 0:
        start_date = date(year, month, 1)
        _, last_day = calendar.monthrange(year, month)
        end_date = date(year, month, last_day)
        query = query.filter(models.Transaction.date >= start_date, models.Transaction.date <= end_date)
    elif year > 0:
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        query = query.filter(models.Transaction.date >= start_date, models.Transaction.date <= end_date)

    txs = query.all()

    total_income = sum((float(t.amount) for t in txs if t.type == "income"), 0.0)
    total_expenses = sum((float(t.amount) for t in txs if t.type == "expense"), 0.0)
    net_savings = total_income - total_expenses
    
    savings_rate = 0.0
    if total_income > 0:
        savings_rate = (net_savings / total_income) * 100.0

    # Find biggest expense category
    expense_categories = {}
    for t in txs:
        if t.type == "expense" and t.category_id:
            expense_categories[t.category_id] = expense_categories.get(t.category_id, 0.0) + float(t.amount)
    
    biggest_category_name = None
    if expense_categories:
        top_cat_id = max(expense_categories, key=expense_categories.get)
        top_cat = db.query(models.Category).filter(models.Category.id == top_cat_id).first()
        if top_cat:
            biggest_category_name = top_cat.name

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_savings": net_savings,
        "savings_rate": savings_rate,
        "biggest_expense_category": biggest_category_name
    }
