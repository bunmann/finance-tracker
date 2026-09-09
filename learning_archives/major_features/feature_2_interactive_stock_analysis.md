# Major Feature 2: Interactive Stock Analysis & Portfolio Charting Module

This module transforms static stock listings into interactive, drill-down equity research terminals and provides overarching portfolio equity visualizations.

---

## 📋 Feature 2 Tasks Checklist

### 🔗 Task 1: Clickable Ticker Hyperlinks across UI
- [x] Update `StockHoldings.jsx` table rows so ticker symbols act as clickable interactive links.
- [x] Update `MomentumTable.jsx` and `ValueGapAlerts.jsx` so clicking a ticker triggers a detailed modal view.
- [x] Update `Watchlist` grids to support quick-view ticker clicks.

### 📊 Task 2: Backend Historical Price & Aggregation API (`GET /stocks/{symbol}/chart`)
- [x] Implement endpoint accepting query parameters `period` (`1D`, `1W`, `1M`, `3M`, `1Y`, `ALL`).
- [x] Integrate `yfinance` history retrieval with appropriate interval resolution (e.g., 5-minute bars for `1D`, daily bars for `1Y`).
- [x] Return structured JSON arrays containing `[timestamp, price, volume]` for frontend chart rendering.

### 📈 Task 3: Interactive Stock Detail View / Modal (`StockAnalysisModal.jsx`)
- [x] Create interactive modal displaying key company metadata, real-time price, and day change %.
- [x] Render interactive `Recharts` line/area chart with timeframe selector toggle buttons (`1D`, `1W`, `1M`, `3M`, `1Y`, `MAX`).
- [x] Display core financial ratios grid (PE Ratio, Profit Margin, Debt/Equity, 52-Week High/Low).

### 💼 Task 4: Aggregated Portfolio Performance Chart
- [x] Create endpoint aggregating historical price trajectories across all active shares held in the user's `Holding` table.
- [x] Render an overall portfolio valuation curve over time strictly on the **Portfolio Page** (`StockPortfolio.jsx`).

---

## 🧠 Behavioral Finance & UX Architecture Rationale

### The "Mental Accounting" Separation Principle
To prevent cognitive fatigue and financial anxiety, the platform enforces strict domain separation based on behavioral economics (Richard Thaler's Mental Accounting theory):
1. **Operating Cash Flow Domain (`Dashboard` & `Transactions` & `Budgets`)**: Focused strictly on short-term defensive daily/monthly cash management (checking balances, grocery expenses, monthly budgeting). Volatile equity investments are intentionally omitted from this view so users can focus on operating habits without market noise.
2. **Capital Compounding Domain (`Portfolio` & `Screener`)**: Focused strictly on long-term wealth compounding and quantitative research (holdings valuation, interactive multi-timeframe ticker charts, and aggregated portfolio equity curves).
3. **Unified Accounting Bridge (`Financial Statements / Net Worth` - Feature 3)**: Serves as the formal periodic audit layer where Liquid Cash and Investment Holdings are united into an official Balance Sheet Net Worth snapshot.
