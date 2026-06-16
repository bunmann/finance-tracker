# ============================================================================
# File: database.py
# Description: Configures SQLAlchemy database engine and session management.
# ============================================================================
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://localhost/finance_tracker"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency generator that opens and automatically closes DB sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()