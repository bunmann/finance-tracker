# ============================================================================
# File: scratch_test_scan.py
# Description: Verification script with mocked yfinance responses to test
#              Value Gap anomaly trigger logic.
# ============================================================================
import os
import sys
import pandas as pd
from unittest.mock import patch, MagicMock

# Ensure backend directory is in the path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
from schemas import ScreenerRequest
from routers.screener import run_multi_strategy_scan

# Keep a reference to the real yf.Ticker class
import yfinance as yf
real_ticker_class = yf.Ticker

def mocked_ticker_constructor(symbol):
    symbol_upper = symbol.upper().strip()
    if symbol_upper == "SHOP.TO":
        mock = MagicMock()
        # Mock Ticker.info dictionary
        mock.info = {
            "longName": "Shopify Inc.",
            "shortName": "Shopify",
            "sector": "Technology",
            "currentPrice": 165.70,
            "regularMarketPrice": 165.70,
            "trailingPE": 50.0,
            "profitMargins": 0.108,
            "debtToEquity": 10.0,
            "revenueGrowth": 0.15
        }
        
        # Mock quarterly_income_stmt DataFrame (Index: metrics, Columns: dates)
        # We simulate latest quarter revenue = 2.0M, previous = 1.5M (33.3% QoQ growth)
        mock.quarterly_income_stmt = pd.DataFrame(
            data={"2026-03-31": [2000000.0], "2025-12-31": [1500000.0]},
            index=["Total Revenue"]
        )
        mock.quarterly_financials = mock.quarterly_income_stmt

        # Mock cashflow for FCF calculations
        mock.cashflow = pd.DataFrame()
        
        # Mock history DataFrame to return -17.15% return (Start: 200.00, End: 165.70)
        mock.history.return_value = pd.DataFrame(
            data={"Close": [200.00, 165.70]},
            index=pd.date_range(start="2026-05-28", periods=2, freq="15D")
        )
        return mock
    else:
        # For all other tickers, use the real yfinance class to pull live quotes
        return real_ticker_class(symbol)

@patch("yfinance.Ticker", side_effect=mocked_ticker_constructor)
def test_unified_scan(mock_yf):
    print("Initializing Database Session...")
    db = SessionLocal()

    try:
        # Retrieve the first user in the database to act as current user
        test_user = db.query(models.User).first()
        if not test_user:
            print("No test user found. Creating a temporary user for testing...")
            test_user = models.User(email="joe123@gmail.com", password="hashed_test_password")
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        print(f"Running multi-strategy scan for user: {test_user.email}")

        # Seed some watchlist items for the test user to scan
        seed_tickers = ["SHOP.TO", "RY.TO", "CNR.TO"]
        
        # Remove existing watchlist records for these symbols to prevent conflicts
        db.query(models.Watchlist).filter(
            models.Watchlist.user_id == test_user.id
        ).delete()
        db.commit()

        # Add watchlist items
        for ticker in seed_tickers:
            new_item = models.Watchlist(user_id=test_user.id, ticker=ticker)
            db.add(new_item)
        db.commit()
        print(f"Seeded watchlist with: {seed_tickers}")

        # Construct a default ScreenerRequest
        req = ScreenerRequest(
            min_fcf_growth=-1.0,      # Lenient for test matches
            min_profit_margin=-1.0,   # Lenient for test matches
            max_debt_equity=100.0,    # Lenient for test matches
            max_pe=1000.0,            # Lenient for test matches
            circle_of_competence_only=False
        )

        print("\n--- RUNNING MULTI-STRATEGY SCAN ENGINE (WITH MOCKED SHOP.TO) ---")
        # Run scan directly
        results = run_multi_strategy_scan(req=req, db=db, current_user=test_user)

        print(f"\nScan completed successfully!")
        
        # Display Momentum Quality Candidates
        print(f"\n=======================================================")
        print(f"STRATEGY 1: MOMENTUM QUALITY CANDIDATES ({len(results.momentum_quality)} matched)")
        print(f"=======================================================")
        for idx, stock in enumerate(results.momentum_quality):
            print(f"  [{idx + 1}] {stock.ticker} ({stock.name})")
            print(f"      Price: C${stock.price:.2f} | RS Percentile: {stock.relative_strength:.1f}%")
            print(f"      30d Return: {stock.performance_30d * 100:.2f}% | Margin: {stock.profit_margin * 100 if stock.profit_margin else 0:.1f}%")
            print(f"      Message: {stock.message} | Source: {stock.source}")

        # Display Value Gap Alerts
        print(f"\n=======================================================")
        print(f"STRATEGY 2: VALUE GAP ALERTS ({len(results.value_gap)} matched)")
        print(f"=======================================================")
        for idx, alert in enumerate(results.value_gap):
            print(f"  [{idx + 1}] {alert.ticker} ({alert.name})")
            print(f"      Alert Message: {alert.message}")
            print(f"      30d Return: {alert.performance_30d * 100:.2f}% | QoQ Revenue Growth: {alert.qoq_revenue_growth * 100 if alert.qoq_revenue_growth else 0:.1f}%")
            print(f"      Source: {alert.source} | Price: C${alert.current_price:.2f}")

    finally:
        db.close()

if __name__ == "__main__":
    test_unified_scan()
