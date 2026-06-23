# ============================================================================
# File: routers/stocks.py
# Description: Stock portfolio endpoints: portfolio, transactions, buy/sell, watchlist, sector competence.
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from schemas import StockTransactionCreate, WatchlistCreate, SectorCompetenceCreate
import models
from stock_service import get_stock_price

router = APIRouter(
    prefix="/stocks",
    tags=["Stocks"]
)


@router.get("/price/{ticker}")
def get_price(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get the current market price for a stock ticker.
    Utilizes the global cache-aside mechanism (PriceCache) and Alpha Vantage quote endpoint.
    """
    price, last_updated, is_stale = get_stock_price(ticker, db)
    if price is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch price for stock symbol: {ticker.upper()}"
        )
    return {
        "ticker": ticker.upper(),
        "price": price,
        "last_updated": last_updated.isoformat() if last_updated else None,
        "is_stale": is_stale
    }


@router.get("/portfolio")
def get_portfolio(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all holdings with current prices and P&L."""
    # TODO: Implement in Lesson 5
    holdings = db.query(models.Holding).filter(
        models.Holding.user_id == current_user.id
    ).all()
    return holdings


@router.get("/transactions")
def get_stock_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get stock transaction history."""
    transactions = db.query(models.StockTransaction).filter(
        models.StockTransaction.user_id == current_user.id
    ).order_by(models.StockTransaction.date.desc()).all()
    return transactions


@router.post("/buy")
def buy_stock(
    trade: StockTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Log a stock purchase."""
    # TODO: Implement in Lesson 5
    pass


@router.post("/sell")
def sell_stock(
    trade: StockTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Log a stock sale."""
    # TODO: Implement in Lesson 5
    pass


# --- Watchlist Endpoints ---

@router.post("/watchlist")
def add_to_watchlist(
    item: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add a stock ticker to the user's watchlist."""
    # TODO: Implement in Lesson 5
    pass


@router.get("/watchlist")
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get the user's watchlist of stock tickers."""
    # TODO: Implement in Lesson 5
    pass


@router.delete("/watchlist/{ticker}")
def remove_from_watchlist(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove a stock ticker from the user's watchlist."""
    # TODO: Implement in Lesson 5
    pass


# --- Circle of Competence (Sector) Endpoints ---

@router.post("/competence")
def add_sector_competence(
    item: SectorCompetenceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add a sector to the user's Circle of Competence."""
    # TODO: Implement in Lesson 5
    pass


@router.get("/competence")
def get_sector_competence(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get the user's Circle of Competence sectors."""
    # TODO: Implement in Lesson 5
    pass


@router.delete("/competence/{sector}")
def remove_sector_competence(
    sector: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove a sector from the user's Circle of Competence."""
    # TODO: Implement in Lesson 5
    pass
