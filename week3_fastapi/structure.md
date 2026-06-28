# Backend Module Structure & Coding Rules

This document outlines the architecture, database mappings, API conventions, and coding guardrails for the Python FastAPI backend.

---

## 📂 Architecture Map

* **`main.py`**: The application entry point. Configures global CORS middleware and mounts all sub-routers.
* **`database.py`**: Manages the SQLite database engine setup, connection pooling, and the local session generator `get_db`.
* **`models.py`**: Contains SQLAlchemy ORM models representing SQLite tables. All model definitions must match exact database columns.
* **`schemas.py`**: Contains Pydantic data serialization schemas for requests and responses. Defines validation rules.
* **`routers/`**: Directory containing domain-specific endpoint sub-routers (e.g. `auth.py`, `transactions.py`, `categories.py`, `stocks.py`, `screener.py`).

---

## 🗄️ SQL Database & ORM Guidelines

1. **Precision with Money**:
   * Never store currency or monetary values as floating-point numbers.
   * Always use `SQLAlchemy.Numeric(precision=18, scale=4)` (mapping to `decimal.Decimal` in Python) to prevent floating-point rounding errors.
2. **Transaction Lifecycles**:
   * Always yield database sessions cleanly via the `db: Session = Depends(get_db)` injection pattern.
   * Explicitly execute `db.commit()` and `db.refresh(item)` on all database updates to ensure state persists.
3. **Composite Unique Constraints**:
   * Use explicit `UniqueConstraint` indices on models where columns must be unique in combination (e.g. `UniqueConstraint('user_id', 'ticker', ...)` or `UniqueConstraint('user_id', 'sector', ...)`).
4. **MATERIALIZED HOLDINGS SNAPSHOTS**:
   * Holdings are calculated and cached on the holdings table on buy/sell trades to keep dashboard reads fast. Do not run heavy aggregations on raw transaction logs during read queries.

---

## 📡 API Routing & Schema Conventions

* **Decoupled Entities**: Always segregate SQLAlchemy DB models (`models.py`) from Pydantic network request/response models (`schemas.py`).
* **Sub-Router Modularization**:
  * Implement sub-routers using `APIRouter()` inside the `routers/` directory.
  * Every new router must be registered inside `main.py` using `app.include_router(router)`.
* **Private Helpers Scope**: Always prefix internal helper functions (like yfinance caches or average cost basis algorithms) with a leading underscore `_` to demarcate private scope.
* **Simple, Robust Logic**: Avoid over-fitted abstractions or complex predictive structures. Implement clear mathematical equations and spring models in quantitative logic (like relative strength percentiles and Bollinger deviation math).
