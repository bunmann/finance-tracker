# ============================================================================
# File: models.py
# Description: Defines SQLAlchemy database tables, columns, constraints, and relationships.
# ============================================================================
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    """
    Represents a registered system user.
    Handles user credentials and separates per-user tenant data.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)


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