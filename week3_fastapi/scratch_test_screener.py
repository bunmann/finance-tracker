# ============================================================================
# File: scratch_test_screener.py
# Description: Verification script for testing the fundamental screener router.
# ============================================================================
import os
import sys

# Ensure backend directory is in the path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
from schemas import ScreenerRequest
from routers.screener import run_screener

def test_screener():
    print("Initializing Database Session...")
    db = SessionLocal()

    try:
        # Retrieve the first user in the database to act as the current user
        test_user = db.query(models.User).first()
        if not test_user:
            print("No test user found. Creating a temporary user for screening...")
            test_user = models.User(email="screener_test@example.com", password="hashed_test_password")
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        print(f"Running screener with test user: {test_user.email}")

        # --------------------------------------------------------------------
        # Test 1: Run Screener with Standard/Permissive Filters
        # --------------------------------------------------------------------
        print("\n--- TEST 1: Running screener with default parameters ---")
        req1 = ScreenerRequest(
            min_fcf_growth=-10.0,      # very permissive
            min_profit_margin=0.0,     # very permissive
            max_debt_equity=100.0,     # very permissive
            max_pe=500.0,              # very permissive
            circle_of_competence_only=False
        )
        
        results1 = run_screener(req=req1, db=db, current_user=test_user)
        print(f"Screener returned {len(results1)} candidates.")
        
        # Display top 5 candidates ranked by momentum (relative strength)
        for idx, item in enumerate(results1[:5]):
            print(f"  [{idx + 1}] {item.ticker} ({item.name}) - Sector: {item.sector}")
            print(f"      30d Return: {item.performance_30d*100:.2f}% | Relative Strength Percentile: {item.relative_strength:.1f}%")
            print(f"      Profit Margin: {item.profit_margin*100 if item.profit_margin else 0:.1f}% | D/E: {item.debt_to_equity if item.debt_to_equity else 'N/A'} | PE: {item.pe if item.pe else 'N/A'}")

        # --------------------------------------------------------------------
        # Test 2: Run Screener with Circle of Competence Enabled
        # --------------------------------------------------------------------
        print("\n--- TEST 2: Testing Circle of Competence filtering ---")
        # Let's seed a competence sector for the test user
        competence_sector = "technology"
        
        # Remove if already exists
        db.query(models.SectorCompetence).filter(
            models.SectorCompetence.user_id == test_user.id,
            models.SectorCompetence.sector == competence_sector
        ).delete()
        
        # Add tech competence
        new_comp = models.SectorCompetence(user_id=test_user.id, sector=competence_sector)
        db.add(new_comp)
        db.commit()
        print(f"Seeded sector competence: '{competence_sector}' for {test_user.email}")

        req2 = ScreenerRequest(
            min_fcf_growth=-10.0,
            min_profit_margin=0.0,
            max_debt_equity=100.0,
            max_pe=500.0,
            circle_of_competence_only=True
        )

        results2 = run_screener(req=req2, db=db, current_user=test_user)
        print(f"Screener returned {len(results2)} candidates under '{competence_sector}' competence.")
        for idx, item in enumerate(results2):
            print(f"  [{idx + 1}] {item.ticker} ({item.name}) - Sector: {item.sector}")

        # --------------------------------------------------------------------
        # Test 3: Run Screener with High Fundamental Quality Filters
        # --------------------------------------------------------------------
        print("\n--- TEST 3: Running screener with high-quality fundamental threshold filters ---")
        req3 = ScreenerRequest(
            min_fcf_growth=0.05,       # 5% YoY growth
            min_profit_margin=0.15,    # 15% profit margin
            max_debt_equity=1.5,       # conservative leverage
            max_pe=30.0,               # reasonable valuation
            circle_of_competence_only=False
        )

        results3 = run_screener(req=req3, db=db, current_user=test_user)
        print(f"Screener returned {len(results3)} high-quality candidates.")
        for idx, item in enumerate(results3):
            pm_str = f"{item.profit_margin*100:.1f}%" if item.profit_margin is not None else "N/A"
            de_str = f"{item.debt_to_equity:.2f}" if item.debt_to_equity is not None else "N/A"
            pe_str = f"{item.pe:.1f}" if item.pe is not None else "N/A"
            fcf_str = f"{item.fcf_growth*100:.1f}%" if item.fcf_growth is not None else "N/A"
            print(f"  [{idx + 1}] {item.ticker} ({item.name})")
            print(f"      PM: {pm_str} | D/E: {de_str} | PE: {pe_str} | FCF YoY: {fcf_str}")

    finally:
        db.close()

if __name__ == "__main__":
    test_screener()
