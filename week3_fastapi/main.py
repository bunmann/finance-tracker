# ============================================================================
# File: main.py
# Description: Main entry point & routing for the FastAPI application.
#              Registers CORS middleware and mounts all APIRouter modules.
# ============================================================================
from fastapi import FastAPI
from database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, transactions, categories, dashboard

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


@app.get("/")
def read_root():
    return {"message": "Hello World! Welcome to your Finance API."}


#  =====================RESET ENDPOINT====================

@app.post("/debug/reset-db")
def reset_db():
    # Drop all existing tables
    Base.metadata.drop_all(bind=engine)
    # Recreate all tables with new schema/constraints
    Base.metadata.create_all(bind=engine)
    return {"message": "Database reset successfully! All tables recreated with new schemas."}