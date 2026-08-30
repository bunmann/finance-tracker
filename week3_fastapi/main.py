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
from routers import auth, transactions, categories, dashboard, stocks, screener, wealth, ai_chat

# Create all tables in the database (if they don't exist yet)
Base.metadata.create_all(bind=engine)


from fastapi import Request

app = FastAPI()

# Allow the React frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],       # Allow all HTTP methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],       # Allow all headers
    expose_headers=["X-Token-Refresh"],  # Expose token refresh header to browser Axios
)

@app.middleware("http")
async def token_refresh_middleware(request: Request, call_next):
    """Intercept responses to emit X-Token-Refresh header if sliding renewal was triggered."""
    response = await call_next(request)
    if getattr(request.state, "needs_token_refresh", False):
        payload = getattr(request.state, "token_payload", {})
        if payload and "sub" in payload:
            from auth import create_access_token
            new_token = create_access_token(
                {"sub": payload["sub"]},
                login_ts=payload.get("login_ts")
            )
            response.headers["X-Token-Refresh"] = new_token
    return response

# Include all modular sub-routers
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(dashboard.router)
app.include_router(stocks.router)
app.include_router(screener.router)
app.include_router(wealth.router)
app.include_router(ai_chat.router)


import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Mount static React bundle if built
react_dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "week4_react", "dist"))
if os.path.exists(react_dist_dir):
    assets_dir = os.path.join(react_dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="react_assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # Exclude API endpoints from static file catch-all
        api_prefixes = ["auth", "transactions", "categories", "dashboard", "stocks", "screener", "wealth", "ai", "debug"]
        if any(full_path.startswith(prefix) for prefix in api_prefixes):
            return None
        target_file = os.path.join(react_dist_dir, full_path)
        if os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(react_dist_dir, "index.html"))
else:
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