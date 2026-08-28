# ============================================================================
# File: models.py
# Description: Defines SQLAlchemy database tables, columns, constraints, and relationships.
# ============================================================================
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, UniqueConstraint, Text
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

class UserProfile(Base):
    """
    User settings and profile configuration.
    Keeps financial state separated from authentication credentials.
    """
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    liabilities = Column(Numeric(10, 2), default=0.0)


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

    The `currency` column is the canonical source of truth for pricing currency —
    it is set at import time (from the broker CSV or yfinance detection) and used
    directly by _get_cad_price to decide whether USD→CAD conversion is needed.
    Storing it here eliminates all runtime ticker-suffix guessing.
    """
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String(10), nullable=False)
    shares = Column(Numeric(12, 4), nullable=False)
    avg_cost = Column(Numeric(12, 4), nullable=False)
    # ISO 4217 currency code: 'CAD' means price is already in CAD, 'USD' triggers conversion.
    currency = Column(String(3), nullable=False, default="CAD")

    # Each user can only have one holding per ticker
    __table_args__ = (UniqueConstraint('user_id', 'ticker', name='_user_ticker_uc'),)


class StockTransaction(Base):
    """
    Represents a historical ledger entry of a stock transaction (buy, sell, or dividend).
    Tracks quantity, per-share price, total cost/proceeds, and transaction date.

    The `currency` column mirrors the same field on Holding — it records what currency
    the broker settled this transaction in (e.g. 'CAD' for a Wealthsimple TFSA trade).
    This lets the transaction history display be accurate regardless of ticker suffix.
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
    realized_gain = Column(Numeric(12, 2), nullable=True)
    # ISO 4217 currency code: 'CAD' means this trade was settled in Canadian dollars.
    currency = Column(String(3), nullable=False, default="CAD")


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


class ChartCache(Base):
    """
    Represents a shared cache of historical stock chart arrays and retrieval timestamps.
    Prevents exceeding Yahoo Finance rate limits and guarantees instant (<50ms) chart render times.
    """
    __tablename__ = "chart_cache"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(20), nullable=False, index=True)
    period = Column(String(10), nullable=False, index=True)
    interval = Column(String(10), nullable=False)
    data_json = Column(Text, nullable=False)
    last_updated = Column(DateTime, nullable=False)

    __table_args__ = (UniqueConstraint('ticker', 'period', 'interval', name='_chart_cache_uc'),)


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


# ============================================================================
# Wealth Tracking Models
# ============================================================================


class NetWorthSnapshot(Base):
    """
    Represents a periodic snapshot of a user's net worth (cash + stocks - liabilities).
    Used to generate trend lines and historical wealth tracking.
    """
    __tablename__ = "net_worth_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    cash_balance = Column(Numeric(10, 2), nullable=False)
    stock_value = Column(Numeric(10, 2), nullable=False)
    liabilities = Column(Numeric(10, 2), nullable=False)
    net_worth = Column(Numeric(10, 2), nullable=False)

    # Allow only one snapshot per user per day
    __table_args__ = (UniqueConstraint('user_id', 'date', name='_user_date_snapshot_uc'),)