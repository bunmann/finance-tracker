# ============================================================================
# File: routers/stocks.py
# Description: Stock portfolio endpoints: pricing, holdings, buy/sell, watchlist, sector competence.
# ============================================================================
from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from schemas import StockTransaction, WatchlistCreate, SectorCompetenceCreate
import models
from common.stock_service import get_stock_price
from common.stock_csv_parser import validate_and_parse_brokerage_csv
import io
import hashlib

router = APIRouter(
    prefix="/stocks",
    tags=["Stocks"]
)


def _get_cad_price(ticker: str, raw_price: float | None, db: Session) -> float | None:
    """
    Private helper to convert stock prices from USD to CAD if the ticker is a US stock.
    Tickers ending in .TO or .V are traded in CAD, so no conversion is needed.
    """
    if raw_price is None or raw_price is False:
        return raw_price

    # Check system currency configuration (e.g. from .env file or default)
    # If the portfolio is configured as USD, bypass any CAD conversions.
    import os
    target_currency = os.getenv("CURRENCY", "CAD").upper().strip()
    if target_currency != "CAD":
        return raw_price
        
    ticker_clean = ticker.upper().strip()
    # Canadian exchanges (.TO for TSX, .V for TSXV) and currency tickers like USDCAD=X don't need conversion.
    if ticker_clean.endswith(".TO") or ticker_clean.endswith(".V") or "CAD" in ticker_clean:
        return raw_price

    # Fetch USDCAD exchange rate using cache-aside stock service
    try:
        rate, _, _ = get_stock_price("USDCAD=X", db)
        if rate is not None and rate is not False and rate > 0:
            return float(raw_price) * float(rate)
    except Exception:
        pass

    # Standard fallback rate (1.37 CAD/USD) if exchange query fails
    return float(raw_price) * 1.37


# ============================================================================
# 1. Market Data & Pricing
# ============================================================================

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
    if price is False:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stock symbol: '{ticker.upper()}'. Please check the ticker name."
        )
    if price is None:
        raise HTTPException(
            status_code=404,
            detail=f"Failed to fetch price for '{ticker.upper()}' at the moment. Please try again later."
        )
    price_cad = _get_cad_price(ticker, price, db)
    return {
        "ticker": ticker.upper(),
        "price": price_cad,
        "last_updated": last_updated.isoformat() if last_updated else None,
        "is_stale": is_stale
    }


# ============================================================================
# 2. Portfolio Holdings & Transaction Ledger
# ============================================================================

@router.get("/portfolio")
def get_portfolio(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all stock holdings for the authenticated user with current prices and unrealized P&L.
    
    Parameters:
    - db (Session): The database session dependency.
    - current_user (User): The currently authenticated user.
    
    Returns:
    - dict: A dictionary containing the holdings list, total market value, total cost basis, 
            total unrealized gain, and warning metadata if any pricing fails.
    """
    holdings = db.query(models.Holding).filter(
        models.Holding.user_id == current_user.id
    ).all()

    portfolio = []
    total_value = Decimal("0")
    total_cost = Decimal("0")
    failed_tickers = []

    for holding in holdings:
        price, last_updated, is_stale = get_stock_price(holding.ticker, db)
        price_cad = _get_cad_price(holding.ticker, price, db)
        
        market_value = Decimal(str(price_cad)) * holding.shares if price_cad is not None else None
        cost_basis = holding.avg_cost * holding.shares
        unrealized_gain = market_value - cost_basis if market_value is not None else None
        gain_percent = (unrealized_gain / cost_basis * 100) if unrealized_gain is not None and cost_basis else None

        portfolio.append({
            "ticker": holding.ticker,
            "shares": float(holding.shares),
            "avg_cost": float(holding.avg_cost),
            "current_price": float(price_cad) if price_cad is not None else None,
            "last_updated": last_updated.isoformat() if last_updated else None,
            "is_stale": is_stale,
            "market_value": float(market_value) if market_value is not None else None,
            "cost_basis": float(cost_basis),
            "unrealized_gain": float(unrealized_gain) if unrealized_gain is not None else None,
            "gain_percent": float(gain_percent) if gain_percent is not None else None,
        })

        if price is None:
            failed_tickers.append(holding.ticker)
            
        if market_value is not None:
            total_value += market_value
        total_cost += cost_basis

    has_failures = len(failed_tickers) > 0
    warning_msg = (
        f"Could not retrieve current prices for: {', '.join(failed_tickers)}. Portfolio totals are unavailable."
        if has_failures
        else None
    )

    total_realized = db.query(func.sum(models.StockTransaction.realized_gain)).filter(
        models.StockTransaction.user_id == current_user.id,
        models.StockTransaction.type == "sell"
    ).scalar() or Decimal("0")

    return {
        "holdings": portfolio,
        "total_value": float(total_value) if not has_failures else None,
        "total_cost": float(total_cost),
        "total_gain": float(total_value - total_cost) if not has_failures else None,
        "total_realized_gain": float(total_realized),
        "warning": warning_msg,
        "failed_tickers": failed_tickers
    }


@router.get("/transactions")
def get_stock_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get stock transaction history.
    
    Parameters:
    - db (Session): The database session dependency.
    - current_user (User): The currently authenticated user.
    
    Returns:
    - list[StockTransaction]: Chronological list of user stock purchases and sales.
    """
    transactions = db.query(models.StockTransaction).filter(
        models.StockTransaction.user_id == current_user.id
    ).order_by(models.StockTransaction.date.desc()).all()
    return transactions


def _update_holding_buy(db: Session, user_id: int, ticker: str, shares: Decimal, price: Decimal) -> models.Holding:
    """Update or create a holding after a buy trade."""
    holding = db.query(models.Holding).filter(
        models.Holding.user_id == user_id,
        models.Holding.ticker == ticker
    ).first()

    total = shares * price
    if holding:
        old_total = holding.shares * holding.avg_cost
        holding.shares = holding.shares + shares
        holding.avg_cost = (old_total + total) / holding.shares
    else:
        holding = models.Holding(
            user_id=user_id,
            ticker=ticker,
            shares=shares,
            avg_cost=price
        )
        db.add(holding)
        db.flush()
    return holding


def _update_holding_sell(db: Session, user_id: int, ticker: str, shares: Decimal, price: Decimal) -> tuple[Decimal, bool]:
    """
    Update a holding after a sell trade.
    Raises ValueError if the holding does not exist or has insufficient shares.
    Returns:
        tuple[realized_gain, was_holding_deleted]
    """
    holding = db.query(models.Holding).filter(
        models.Holding.user_id == user_id,
        models.Holding.ticker == ticker
    ).first()

    if not holding:
        raise ValueError(f"You don't hold any shares of {ticker} to sell.")

    if holding.shares < shares:
        raise ValueError(f"Insufficient shares of {ticker} (holding {holding.shares.normalize()}, trying to sell {shares.normalize()}).")

    realized_gain = (price - holding.avg_cost) * shares
    holding.shares = holding.shares - shares

    deleted = False
    if holding.shares == 0:
        db.delete(holding)
        db.flush()
        deleted = True
    return realized_gain, deleted


@router.post("/upload-csv")
def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Upload and parse a brokerage statement CSV (Questrade or Wealthsimple).
    Auto-detects the brokerage format, filters duplicates, validates tickers,
    updates holdings, and logs transactions.
    """
    try:
        parsed_txs = validate_and_parse_brokerage_csv(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    imported = 0
    duplicates = 0
    errors = []

    # Sort parsed transactions by date ascending so we process buys before sells chronologically
    parsed_txs.sort(key=lambda t: t["date"])

    for idx, tx in enumerate(parsed_txs, start=2):
        ticker = tx["ticker"].upper().strip()
        # Normalize Canadian ticker suffixes
        if ticker.endswith(".TO"):
            ticker = ticker[:-3]

        tx_type = tx["type"]
        shares = tx["shares"]
        price = tx["price"]
        total = tx["total"]
        tx_date = tx["date"]

        # Generate unique fingerprint for deduplication
        raw_str = f"{current_user.id}:{ticker}:{tx_type}:{shares}:{price}:{tx_date}"
        fingerprint = hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

        # Check for duplicates
        existing = db.query(models.StockTransaction).filter(
            models.StockTransaction.user_id == current_user.id,
            models.StockTransaction.fingerprint == fingerprint
        ).first()

        if existing:
            duplicates += 1
            continue

        # Validate ticker symbol
        price_val, _, _ = get_stock_price(ticker, db)
        if price_val is False:
            errors.append(f"Row {idx}: Invalid stock symbol '{ticker}'. Please check the ticker name.")
            continue
        elif price_val is None:
            errors.append(f"Row {idx}: Failed to fetch price for '{ticker}' at the moment. Please try again later.")
            continue

        # Database processing based on action type
        realized_gain = None

        if tx_type == "buy":
            _update_holding_buy(db, current_user.id, ticker, shares, price)

        elif tx_type == "sell":
            try:
                realized_gain, _ = _update_holding_sell(db, current_user.id, ticker, shares, price)
            except ValueError as e:
                errors.append(f"Row {idx}: {str(e)}")
                continue

        # Log the transaction
        db_transaction = models.StockTransaction(
            user_id=current_user.id,
            ticker=ticker,
            type=tx_type,
            shares=shares,
            price=price,
            total=total,
            date=tx_date,
            fingerprint=fingerprint,
            realized_gain=realized_gain
        )
        db.add(db_transaction)
        imported += 1

    if imported > 0:
        db.commit()

    return {
        "imported": imported,
        "duplicates": duplicates,
        "errors": errors
    }


# ============================================================================
# 3. Buy & Sell Trading Endpoints
# ============================================================================

@router.post("/buy")
def buy_stock(
    trade: StockTransaction,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Log a stock purchase transaction and update or create the user's holding.
    
    Parameters:
    - trade (StockTransaction): The transaction input schema containing ticker, shares, price, and date.
    - db (Session): The database session dependency.
    - current_user (User): The currently authenticated user.
    
    Returns:
    - StockTransaction: The newly created stock transaction record.
    """
    ticker = trade.ticker.upper().strip()
    
    # Verify the stock symbol exists
    price_val, _, _ = get_stock_price(ticker, db)
    if price_val is False:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stock symbol: '{ticker}'. Please check the ticker name."
        )
    elif price_val is None:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch price for '{ticker}' at the moment. Please try again later."
        )

    shares = Decimal(str(trade.shares))
    price = Decimal(str(trade.price))
    total = shares * price

    # 1. Log the transaction
    tx_date = trade.date if trade.date else date.today()
    
    db_transaction = models.StockTransaction(
        user_id=current_user.id,
        ticker=ticker,
        type="buy",
        shares=shares,
        price=price,
        total=total,
        date=tx_date
    )
    db.add(db_transaction)

    # 2. Update or create the holding
    _update_holding_buy(db, current_user.id, ticker, shares, price)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.post("/sell")
def sell_stock(
    trade: StockTransaction,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Log a stock sale transaction, verify share balances, calculate realized P&L, and update the holding.
    
    Parameters:
    - trade (StockTransaction): The transaction input schema containing ticker, shares, price, and date.
    - db (Session): The database session dependency.
    - current_user (User): The currently authenticated user.
    
    Returns:
    - dict: A dictionary containing the created transaction record and the realized gain/loss.
    """
    ticker = trade.ticker.upper().strip()
    shares = Decimal(str(trade.shares))
    price = Decimal(str(trade.price))
    total = shares * price

    # 1. Update the holding (which checks for sufficient shares and calculates realized gain)
    try:
        realized_gain, _ = _update_holding_sell(db, current_user.id, ticker, shares, price)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Log the transaction
    tx_date = trade.date if trade.date else date.today()

    db_transaction = models.StockTransaction(
        user_id=current_user.id,
        ticker=ticker,
        type="sell",
        shares=shares,
        price=price,
        total=total,
        date=tx_date,
        realized_gain=realized_gain
    )
    db.add(db_transaction)

    db.commit()
    db.refresh(db_transaction)
    return {
        "transaction": db_transaction,
        "realized_gain": float(realized_gain)
    }


# ============================================================================
# 4. Watchlist Management
# ============================================================================

@router.post("/watchlist")
def add_to_watchlist(
    item: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Add a stock ticker symbol to the user's watchlist.
    
    Parameters:
    - item (WatchlistCreate): The watchlist item creation schema containing the ticker symbol.
    - db (Session): The database session dependency.
    - current_user (User): The currently authenticated user.
    
    Returns:
    - Watchlist: The newly created watchlist record.
    """
    ticker = item.ticker.upper().strip()
    
    # Verify the stock symbol exists
    price_val, _, _ = get_stock_price(ticker, db)
    if price_val is False:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stock symbol: '{ticker}'. Please check the ticker name."
        )
    elif price_val is None:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch price for '{ticker}' at the moment. Please try again later."
        )
    
    # Check if user is already watching this ticker
    existing = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id,
        models.Watchlist.ticker == ticker
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"You are already watching {ticker}"
        )
        
    db_item = models.Watchlist(
        user_id=current_user.id,
        ticker=ticker
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/watchlist")
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieve the user's watchlist of stock tickers, along with live prices and metadata.
    
    Parameters:
    - db (Session): The database session dependency.
    - current_user (User): The currently authenticated user.
    
    Returns:
    - list: A list of watchlist items, each enriched with current_price, last_updated, and is_stale properties.
    """
    items = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id
    ).all()
    
    watchlist_enriched = []
    for item in items:
        price, last_updated, is_stale = get_stock_price(item.ticker, db)
        price_cad = _get_cad_price(item.ticker, price, db)
        watchlist_enriched.append({
            "id": item.id,
            "ticker": item.ticker,
            "current_price": float(price_cad) if price_cad is not None else None,
            "last_updated": last_updated.isoformat() if last_updated else None,
            "is_stale": is_stale
        })
    return watchlist_enriched


@router.delete("/watchlist/{ticker}")
def remove_from_watchlist(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Remove a stock ticker symbol from the user's watchlist.
    
    Parameters:
    - ticker (str): The stock symbol to remove.
    - db (Session): The database session dependency.
    - current_user (User): The currently authenticated user.
    
    Returns:
    - dict: A success message confirmation.
    """
    ticker_clean = ticker.upper().strip()
    item = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id,
        models.Watchlist.ticker == ticker_clean
    ).first()
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"Watchlist item {ticker_clean} not found"
        )
    db.delete(item)
    db.commit()
    return {"message": f"Successfully removed {ticker_clean} from watchlist"}


# ============================================================================
# 5. Circle of Competence (Sector Tracking)
# ============================================================================

@router.post("/competence")
def add_sector_competence(
    item: SectorCompetenceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Add a sector to the user's Circle of Competence.
    
    Parameters:
    - item (SectorCompetenceCreate): The competence creation schema containing the sector name.
    - db (Session): The database session dependency.
    - current_user (User): The currently authenticated user.
    
    Returns:
    - SectorCompetence: The newly created sector competence record.
    """
    sector = item.sector.strip()
    
    # Check if user already has this sector in their Circle of Competence
    existing = db.query(models.SectorCompetence).filter(
        models.SectorCompetence.user_id == current_user.id,
        models.SectorCompetence.sector == sector
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Sector '{sector}' is already in your Circle of Competence"
        )
        
    db_item = models.SectorCompetence(
        user_id=current_user.id,
        sector=sector
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/competence")
def get_sector_competence(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieve all market sectors within the user's Circle of Competence.
    
    Parameters:
    - db (Session): The database session dependency.
    - current_user (User): The currently authenticated user.
    
    Returns:
    - list: A list of sector competence records.
    """
    return db.query(models.SectorCompetence).filter(
        models.SectorCompetence.user_id == current_user.id
    ).all()


@router.delete("/competence/{sector}")
def remove_sector_competence(
    sector: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Remove a sector from the user's Circle of Competence.
    
    Parameters:
    - sector (str): The name of the sector to remove.
    - db (Session): The database session dependency.
    - current_user (User): The currently authenticated user.
    
    Returns:
    - dict: A success message confirmation.
    """
    sector_clean = sector.strip()
    item = db.query(models.SectorCompetence).filter(
        models.SectorCompetence.user_id == current_user.id,
        models.SectorCompetence.sector == sector_clean
    ).first()
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"Sector competence for '{sector_clean}' not found"
        )
    db.delete(item)
    db.commit()
    return {"message": f"Successfully removed sector '{sector_clean}' from Circle of Competence"}
