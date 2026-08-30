# ============================================================================
# File: routers/stocks.py
# Description: Stock portfolio endpoints: pricing, holdings, buy/sell, watchlist, sector competence.
# ============================================================================
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from schemas import StockTransaction, WatchlistCreate, SectorCompetenceCreate
import models
from common.stock_service import (
    get_stock_price,
    normalize_ticker_symbol,
    detect_ticker_currency,
    get_stock_history,
    get_multiple_stocks_history,
    _get_cad_price,
    calculate_portfolio_historical_curve,
    calculate_exact_holding_cost,
)
from common.stock_csv_parser import validate_and_parse_brokerage_csv
import io
import hashlib

router = APIRouter(
    prefix="/stocks",
    tags=["Stocks"]
)


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
    Get the current market price for a stock ticker, converted to the portfolio's display currency.

    Parameters:
    - ticker (str): Raw ticker symbol (e.g. 'XEQT', 'GOOG', 'AAPL').
    
    Returns:
    - dict: Resolved ticker, CAD price, timestamp, and is_stale flag.
    """
    # Resolve to the correct exchange-suffixed symbol first (e.g. XEQT → XEQT.TO).
    # This also handles CDR detection (GOOG → GOOG.NE) before we check pricing.
    norm_ticker, _ = normalize_ticker_symbol(ticker, db)
    price, last_updated, is_stale = get_stock_price(norm_ticker, db)

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

    # Detect the native currency of the resolved ticker for correct conversion.
    currency = detect_ticker_currency(norm_ticker)
    price_cad = _get_cad_price(price, currency, db, ticker=norm_ticker)

    return {
        "ticker": norm_ticker,
        "price": price_cad,
        "currency": currency,
        "last_updated": last_updated.isoformat() if last_updated else None,
        "is_stale": is_stale
    }


# ============================================================================
# 2. Historical Chart & Portfolio Performance Endpoints
# ============================================================================

@router.get("/portfolio/chart")
def get_portfolio_chart(
    period: Literal["1M", "3M", "1Y", "ALL", "MAX"] = "1M",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieves the historical portfolio valuation curve vs cost basis over time.
    Delegates calculation to calculate_portfolio_historical_curve in common.stock_service.
    """
    return calculate_portfolio_historical_curve(period, current_user.id, db)


@router.get("/{symbol}/chart")
def get_stock_chart(
    symbol: str,
    period: Literal["1D", "1W", "1M", "3M", "1Y", "ALL", "MAX"] = "1M",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieves individual stock chart history and company ratios for modal display.
    Uses 15-minute SQLite ChartCache to guarantee instant open (<50ms).
    """
    period_upper = period.upper().strip()
    if period_upper == "1D":
        yf_period, interval = "1d", "5m"
    elif period_upper == "1W":
        yf_period, interval = "5d", "15m"
    elif period_upper == "1M":
        yf_period, interval = "1mo", "1d"
    elif period_upper == "3M":
        yf_period, interval = "3mo", "1d"
    elif period_upper == "1Y":
        yf_period, interval = "1y", "1d"
    else:  # ALL / MAX
        period_upper = "ALL"
        yf_period, interval = "max", "1wk"

    norm_ticker, _ = normalize_ticker_symbol(symbol, db)
    chart_data, metadata, is_stale = get_stock_history(norm_ticker, yf_period, interval, db)

    if chart_data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Chart history unavailable for '{norm_ticker.upper()}'. Please try again later."
        )

    # Determine currency
    holding = db.query(models.Holding).filter(
        models.Holding.user_id == current_user.id,
        models.Holding.ticker == norm_ticker
    ).first()
    curr = holding.currency if holding else detect_ticker_currency(norm_ticker)

    # Convert chart points to CAD if needed
    converted_chart = []
    for pt in chart_data:
        p_cad = _get_cad_price(pt["price"], curr, db, ticker=norm_ticker)
        converted_chart.append({
            "timestamp": pt["timestamp"],
            "price": round(float(p_cad if p_cad is not None else pt["price"]), 4),
            "volume": pt["volume"]
        })

    # Compute period % change
    if len(converted_chart) >= 2:
        first_p = converted_chart[0]["price"]
        last_p = converted_chart[-1]["price"]
        metadata["change_pct"] = round(((last_p - first_p) / first_p) * 100, 2) if first_p > 0 else 0.0
    else:
        metadata["change_pct"] = 0.0

    return {
        "ticker": norm_ticker,
        "period": period_upper,
        "interval": interval,
        "chart": converted_chart,
        "metadata": metadata,
        "is_stale": is_stale
    }

# ============================================================================
# 3. Portfolio Holdings & Transaction Ledger
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
    # Exchange suffixes that unambiguously identify a Canadian-listed stock.
    # Bare symbols without these (e.g. "CCO", "GOOG") may collide with US tickers.
    canadian_suffixes = (".TO", ".NE", ".V", ".TRT")

    for holding in holdings:
        ticker = holding.ticker

        # ── Self-healing ticker resolution ──
        # If a CAD holding was stored with a bare symbol (e.g. "CCO"), resolve it
        # to the canonical exchange-suffixed form ("CCO.TO") and WRITE IT BACK to
        # both the Holding record and all matching StockTransaction rows.
        #
        # WHY WRITE-BACK INSTEAD OF JUST CORRECTING AT VIEW TIME?
        #   - The suffixed ticker (CCO.TO, GOOG.NE) is the single unambiguous ID.
        #     Storing it avoids repeated re-normalization on every portfolio load.
        #   - Transaction history and any future features (alerts, screener) will
        #     also see the correct symbol without special-casing.
        #   - The write-back condition becomes False after the first fix, so it runs
        #     at most once per holding.
        if holding.currency == "CAD" and not any(ticker.endswith(s) for s in canadian_suffixes):
            resolved, _ = normalize_ticker_symbol(ticker, db, currency_hint="CAD")

            if resolved != ticker and any(resolved.endswith(s) for s in canadian_suffixes):
                old_ticker = ticker

                # 1. Update the Holding record
                holding.ticker = resolved
                ticker = resolved

                # 2. Update all StockTransaction records that used the old bare ticker.
                #    This keeps the transaction history consistent with the resolved symbol.
                db.query(models.StockTransaction).filter(
                    models.StockTransaction.user_id == current_user.id,
                    models.StockTransaction.ticker == old_ticker
                ).update({"ticker": resolved}, synchronize_session=False)

                db.commit()

        price, last_updated, is_stale = get_stock_price(ticker, db)
        # Use the stored currency directly — no ticker-suffix guessing.
        # holding.currency was recorded at import time and is the ground truth.
        price_cad = _get_cad_price(price, holding.currency, db, ticker=ticker)

        market_value = Decimal(str(price_cad)) * holding.shares if price_cad is not None else None
        cost_basis = calculate_exact_holding_cost(current_user.id, ticker, db)
        exact_avg_cost = cost_basis / holding.shares if holding.shares > 0 else holding.avg_cost
        unrealized_gain = market_value - cost_basis if market_value is not None else None
        gain_percent = (unrealized_gain / cost_basis * 100) if unrealized_gain is not None and cost_basis else None

        portfolio.append({
            "ticker": ticker,
            "shares": float(holding.shares),
            "avg_cost": float(exact_avg_cost),
            "current_price": float(price_cad) if price_cad is not None else None,
            "last_updated": last_updated.isoformat() if last_updated else None,
            "is_stale": is_stale,
            "market_value": float(market_value) if market_value is not None else None,
            "cost_basis": float(cost_basis),
            "unrealized_gain": float(unrealized_gain) if unrealized_gain is not None else None,
            "gain_percent": float(gain_percent) if gain_percent is not None else None,
        })

        if price is None:
            failed_tickers.append(ticker)

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


def _update_holding_buy(
    db: Session,
    user_id: int,
    ticker: str,
    shares: Decimal,
    price: Decimal,
    currency: str = "CAD"
) -> models.Holding:
    """
    Update or create a Holding record after a buy trade.

    Uses a weighted-average cost basis calculation for the avg_cost field:
        new_avg = (old_shares * old_avg + new_shares * new_price) / total_shares

    Args:
        db (Session): Database session.
        user_id (int): The authenticated user's ID.
        ticker (str): Resolved Yahoo Finance ticker (e.g. 'XEQT.TO', 'GOOG.NE').
        shares (Decimal): Number of shares purchased.
        price (Decimal): Per-share purchase price.
        currency (str): ISO 4217 currency code of the trade ('CAD' or 'USD').
                        Stored on the Holding so _get_cad_price never needs to guess.

    Returns:
        models.Holding: The updated or newly created holding record.
    """
    holding = db.query(models.Holding).filter(
        models.Holding.user_id == user_id,
        models.Holding.ticker == ticker
    ).first()

    total = shares * price
    if holding:
        # Weighted-average cost basis update
        old_total = holding.shares * holding.avg_cost
        holding.shares = holding.shares + shares
        holding.avg_cost = (old_total + total) / holding.shares
        # Update currency in case it changed (e.g. first import had no info)
        holding.currency = currency
    else:
        holding = models.Holding(
            user_id=user_id,
            ticker=ticker,
            shares=shares,
            avg_cost=price,
            currency=currency
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
    Upload and parse a Wealthsimple brokerage statement CSV.
    Auto-detects the Wealthsimple format, filters duplicates, validates tickers,
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
        raw_ticker = tx["ticker"].upper().strip()

        # Pull currency and name from the parsed CSV row.
        # These come from the broker's 'currency' and 'name' columns and are
        # the most reliable signals for exchange resolution:
        #   - currency='CAD' tells us to check TSX/NEO before US exchanges.
        #   - name='Alphabet CDR (CAD Hedged)' tells us to check .NE first.
        currency_hint = tx.get("currency", "").upper().strip()
        name_hint = tx.get("name", "")

        # Resolve to the correct Yahoo Finance symbol and validate it exists.
        # e.g. 'GOOG' + 'CAD' + 'CDR' → 'GOOG.NE'; 'XEQT' + 'CAD' → 'XEQT.TO'
        ticker, price_val = normalize_ticker_symbol(
            raw_ticker, db,
            currency_hint=currency_hint,
            name_hint=name_hint
        )

        # The trade's settlement currency is the ground truth for pricing.
        # Default to CAD if not present (all Wealthsimple TFSA trades are CAD).
        currency = currency_hint if currency_hint in ("CAD", "USD") else "CAD"

        tx_type = tx["type"]
        shares = tx["shares"]
        price = tx["price"]
        total = tx["total"]
        tx_date = tx["date"]

        # Generate unique fingerprint for deduplication.
        # Uses the RESOLVED ticker so reimporting after a symbol fix doesn't duplicate.
        raw_str = f"{current_user.id}:{ticker}:{tx_type}:{shares}:{price}:{tx_date}"
        fingerprint = hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

        # Check for duplicates by exact fingerprint OR fuzzy match (within ±2 days for exact same share quantity and action)
        existing = db.query(models.StockTransaction).filter(
            models.StockTransaction.user_id == current_user.id,
            models.StockTransaction.fingerprint == fingerprint
        ).first()

        if not existing:
            fuzzy_existing = db.query(models.StockTransaction).filter(
                models.StockTransaction.user_id == current_user.id,
                models.StockTransaction.type == tx_type,
                models.StockTransaction.shares == shares,
                models.StockTransaction.ticker.in_([ticker, raw_ticker.upper().strip()]),
                models.StockTransaction.date >= tx_date - timedelta(days=2),
                models.StockTransaction.date <= tx_date + timedelta(days=2)
            ).first()
            if fuzzy_existing:
                existing = fuzzy_existing

        if existing:
            duplicates += 1
            continue

        # Validate the resolved ticker symbol
        if price_val is False:
            errors.append(f"Row {idx}: Invalid stock symbol '{raw_ticker}'. Please check the ticker name.")
            continue
        elif price_val is None:
            errors.append(f"Row {idx}: Could not fetch price for '{raw_ticker}' right now. Please try again later.")
            continue

        # Database processing based on action type
        realized_gain = None

        if tx_type == "buy":
            # Pass currency so the Holding record stores it for future pricing calls
            _update_holding_buy(db, current_user.id, ticker, shares, price, currency=currency)

        elif tx_type == "sell":
            try:
                realized_gain, _ = _update_holding_sell(db, current_user.id, ticker, shares, price)
            except ValueError as e:
                errors.append(f"Row {idx}: {str(e)}")
                continue

        # Log the transaction with the resolved ticker and settlement currency
        db_transaction = models.StockTransaction(
            user_id=current_user.id,
            ticker=ticker,
            type=tx_type,
            shares=shares,
            price=price,
            total=total,
            date=tx_date,
            fingerprint=fingerprint,
            realized_gain=realized_gain,
            currency=currency
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
# 4. Buy & Sell Trading Endpoints
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
    raw_ticker = trade.ticker.upper().strip()

    # Resolve the ticker to the correct exchange symbol (e.g. XEQT → XEQT.TO).
    # No currency_hint here because the user typed the ticker manually;
    # we rely on yfinance to detect the correct exchange.
    ticker, price_val = normalize_ticker_symbol(raw_ticker, db)

    # Validate that the resolved symbol actually exists
    if price_val is False:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stock symbol: '{raw_ticker}'. Please check the ticker name."
        )
    elif price_val is None:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch price for '{raw_ticker}' at the moment. Please try again later."
        )

    # Detect the native trading currency of this stock via yfinance.
    # This is stored on the Holding and StockTransaction so _get_cad_price
    # never has to guess from ticker suffixes at portfolio view time.
    currency = detect_ticker_currency(ticker)

    shares = Decimal(str(trade.shares))
    price = Decimal(str(trade.price))
    total = shares * price
    tx_date = trade.date if trade.date else date.today()

    # 1. Log the transaction with the resolved ticker and detected currency
    db_transaction = models.StockTransaction(
        user_id=current_user.id,
        ticker=ticker,
        type="buy",
        shares=shares,
        price=price,
        total=total,
        date=tx_date,
        currency=currency
    )
    db.add(db_transaction)

    # 2. Update or create the holding, passing currency so it's persisted
    _update_holding_buy(db, current_user.id, ticker, shares, price, currency=currency)

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
# 5. Watchlist Management
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
    raw_ticker = item.ticker.upper().strip()
    ticker, price_val = normalize_ticker_symbol(raw_ticker, db)
    
    # Verify the stock symbol exists
    if price_val is False:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stock symbol: '{raw_ticker}'. Please check the ticker name."
        )
    elif price_val is None:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch price for '{raw_ticker}' at the moment. Please try again later."
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
        currency = detect_ticker_currency(item.ticker)
        price_cad = _get_cad_price(price, currency, db, ticker=item.ticker)
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
# 6. Circle of Competence (Sector Tracking)
# ============================================================================

VALID_SECTORS = {
    "Technology",
    "Financial Services",
    "Healthcare",
    "Energy",
    "Industrials",
    "Consumer Discretionary",
    "Consumer Staples",
    "Utilities",
    "Real Estate",
    "Basic Materials",
    "Communication Services"
}

@router.post("/competence")
def add_sector_competence(
    item: SectorCompetenceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Add a sector to the user's Circle of Competence.
    """
    raw_sector = item.sector.strip()
    
    # Match case-insensitively against valid GICS/Yahoo Finance sectors
    matched_sector = next(
        (s for s in VALID_SECTORS if s.lower() == raw_sector.lower()),
        None
    )
    if not matched_sector:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sector: '{raw_sector}'. Must be a standard GICS/exchange sector."
        )
    
    # Check if user already has this sector in their Circle of Competence
    existing = db.query(models.SectorCompetence).filter(
        models.SectorCompetence.user_id == current_user.id,
        models.SectorCompetence.sector == matched_sector
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Sector '{matched_sector}' is already in your Circle of Competence"
        )
        
    db_item = models.SectorCompetence(
        user_id=current_user.id,
        sector=matched_sector
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
