# ============================================================================
# File: main.py
# Description: Main entry point & routing for the FastAPI application.
#              Registers CORS middleware and mounts all APIRouter modules.
# ============================================================================
from fastapi import FastAPI
from dotenv import load_dotenv

# Load configuration and secrets from the local .env file
load_dotenv()

from database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, transactions, categories, dashboard, stocks

# Create all tables in the database (if they don't exist yet)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow the React frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],       # Allow all HTTP methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],       # Allow all headers
)

# Include all modular sub-routers
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(dashboard.router)
app.include_router(stocks.router)


@app.get("/")
def read_root():
    return {"message": "Hello World! Welcome to your Finance API."}


#  =====================RESET & SEED ENDPOINTS ====================

@app.post("/debug/reset-db")
def reset_db():
    # Drop all existing tables
    Base.metadata.drop_all(bind=engine)
    # Recreate all tables with new schema/constraints
    Base.metadata.create_all(bind=engine)
    return {"message": "Database reset successfully! All tables recreated with new schemas."}

@app.post("/debug/seed-prices")
def seed_prices():
    import models
    from database import SessionLocal
    from datetime import datetime
    db = SessionLocal()
    try:
        db.query(models.PriceCache).filter(models.PriceCache.ticker.in_(["AAPL", "TSLA", "MSFT"])).delete(synchronize_session=False)
        price_aapl = models.PriceCache(ticker="AAPL", price=150.00, last_updated=datetime.now())
        price_tsla = models.PriceCache(ticker="TSLA", price=200.00, last_updated=datetime.now())
        db.add_all([price_aapl, price_tsla])
        db.commit()
        return {"message": "Prices seeded successfully!"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()