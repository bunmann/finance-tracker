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

---

## 📈 Quantitative Stock Algorithms Reference

This section catalogs the investment algorithms used across our terminal views to flag trade signals:

### 1. Cross-Sectional Momentum (Relative Strength Ranking)
* **Formulas**:
  * Return (30d) = [(Price_today - Price_30d_ago) / Price_30d_ago] * 100
  * Percentile Rank = (Rank / Total Tickers) * 100
* **Investment Purpose**: Isolates current relative performance leaders across the TSX/US stock universes. Leverages the "momentum anomaly"—the empirical tendency for recently winning assets to continue outperforming in the short-to-intermediate term.

### 2. Anomalous Price Action (Fundamental-to-Price Divergence)
* **Divergence Logic**:
  * Revenue Growth (QoQ) > 10% AND Price Change (30 days) < -10%
* **Investment Purpose**: Signals a high-probability "value gap." When corporate operations expand (Revenue > 10%) but the stock price retreats (Price < -10%), it isolates a discrepancy between business value and market price. This acts as an oversold buying signal, identifying high-quality growing assets trading at a discount.

### 3. Trend Following (SMA Crossover Signal Filter)
* **Moving Averages & State Logic**:
  * SMA_n(t) = Average of closing prices over the last n days
  * State(t) = BUY / LONG (if SMA_fast > SMA_slow) or HOLD CASH / EXIT (if SMA_fast <= SMA_slow)
* **Investment Purpose**: Smooths high-frequency daily price volatility (noise) to capture the underlying low-frequency market trend. Prevents catching a falling knife by ensuring entry only occurs when prices demonstrate momentum.

### 4. Mean Reversion (Z-Score Spring Deviation System)
* **Z-Score Calculation & State Triggers**:
  * Z(t) = [P(t) - Mean_20(t)] / StdDev_20(t)
  * State(t) = BUY / OVERSOLD (if Z(t) < -2.5) or SELL / REVERTED (if Z(t) >= 0.0)
* **Investment Purpose**: Models price extremes as a mechanical spring (Hooke's Law: F = -kx). Assumes that large standard-deviation price extensions away from the rolling 20-day average are statistical anomalies that will quickly snap back (revert) to the mean.


