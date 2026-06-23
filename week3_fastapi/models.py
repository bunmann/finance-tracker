# ============================================================================
# File: models.py
# Description: Defines SQLAlchemy database tables, columns, constraints, and relationships.
# ============================================================================
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

# ============================================================================
# Core & Authentication Models
# ============================================================================


class User(Base):
    """
    Represents a registered system user.
    Handles user credentials and separates per-user tenant data.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)


# ============================================================================
# Cash Flow & Categorization Models
# ============================================================================


class Category(Base):
    """
    Represents a transaction category (e.g., 'Food & Dining', 'Transportation').
    Supports customized category names, icons, and monthly budgets per user.
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    icon = Column(String(255), default="📁")
    monthly_budget = Column(Numeric(10, 2), default=0.0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Ensure name is unique per user
    __table_args__ = (UniqueConstraint('user_id', 'name', name='_user_category_uc'),)


class Transaction(Base):
    """
    Represents an income or expense ledger transaction.
    Logs amounts, descriptions, dates, and fingerprints for import deduplication.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)
    type = Column(String(10), nullable=False)  # 'income' or 'expense'
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    fingerprint = Column(String(64), nullable=True, index=True)  # SHA256 hash for dedup


class CategoryRule(Base):
    """
    Represents a user-trained rule for auto-categorization (Tier 2).
    Maps a user-specific keyword to a target category ID for automated assignment.
    """
    __tablename__ = "category_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    keyword = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    # Each user can only have one rule per keyword
    __table_args__ = (UniqueConstraint('user_id', 'keyword', name='_user_keyword_uc'),)


# ============================================================================
# Stock Portfolio Models
# ============================================================================


class Holding(Base):
    """
    Represents a user's current share balance and average cost basis for a stock ticker.
    Pre-computes portfolio state to avoid on-the-fly transaction aggregation.
    """
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String(10), nullable=False)
    shares = Column(Numeric(12, 4), nullable=False)
    avg_cost = Column(Numeric(12, 4), nullable=False)

    # Each user can only have one holding per ticker
    __table_args__ = (UniqueConstraint('user_id', 'ticker', name='_user_ticker_uc'),)


class StockTransaction(Base):
    """
    Represents a historical ledger entry of a stock transaction (buy, sell, or dividend).
    Tracks quantity, per-share price, total cost/proceeds, and transaction date.
    """
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String(10), nullable=False)
    type = Column(String(10), nullable=False)             # "buy", "sell", or "dividend"
    shares = Column(Numeric(12, 4), nullable=False)
    price = Column(Numeric(12, 4), nullable=False)
    total = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False)
    fingerprint = Column(String(64), nullable=True, index=True)  # for CSV import dedup


class PriceCache(Base):
    """
    Represents a shared cache of current stock ticker prices and their retrieval timestamps.
    Prevents exceeding third-party API rate limits by sharing prices globally across users.
    """
    __tablename__ = "price_cache"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), unique=True, nullable=False)
    price = Column(Numeric(12, 4), nullable=False)
    last_updated = Column(DateTime, nullable=False)


class Watchlist(Base):
    """
    Represents a stock ticker in a user's customized watch list.
    Allows users to track security performance and fundamental screeners.
    """
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String(10), nullable=False)

    # Ensure a user cannot watch the same ticker multiple times
    __table_args__ = (UniqueConstraint('user_id', 'ticker', name='_user_watchlist_uc'),)


class SectorCompetence(Base):
    """
    Represents a market sector inside a user's Circle of Competence.
    Used for filtering investment opportunities to areas of user domain expertise.
    """
    __tablename__ = "sector_competence"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sector = Column(String(100), nullable=False)

    # Ensure a user cannot add the same sector multiple times
    __table_args__ = (UniqueConstraint('user_id', 'sector', name='_user_sector_competence_uc'),)