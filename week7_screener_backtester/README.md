# Week 7 — Quantitative Research: Screeners & Systematic Backtester

Welcome to Week 7. In this phase, we transition from basic CRUD asset management to building automated quantitative engines, converting the portfolio tracker into a professional research terminal.

---

## 📋 Week 7 Features Checklist

### 🔍 Feature 1: Fundamental Screener & Anomalous Price Action Engine
- [ ] **Task 1: Backend: Fundamental Screener API**
  - [ ] Create `/screener` APIRouter structure in `routers/screener.py` and register it in `main.py`.
  - [ ] Implement `POST /screener/run` using `yfinance` to fetch financial stats (FCF growth, net margins, Debt/Equity, P/E).
  - [ ] Add filtering logic matching user-defined thresholds.
  - [ ] Integrate user's **Circle of Competence** sectors to tag matching opportunities.
- [ ] **Task 2: Backend: Anomalous Price Action Engine**
  - [ ] Implement `GET /screener/anomalies` to scan watchlist and portfolio holdings.
  - [ ] Calculate recent 30-day price trends and compare them against quarterly fundamental growth rates.
  - [ ] Flag price-to-fundamental divergence alerts.
- [ ] **Task 3: Frontend: Screener & Anomalies Dashboard**
  - [ ] Create `StockScreener.jsx` to render the unified screener control panel.
  - [ ] Build the Anomaly Alerts panel showcasing real-time price divergence warnings.
  - [ ] Integrate a results table with sorting, sector badges, and "In Circle of Competence" highlights.
  - [ ] Connect routes in `App.jsx` and add sidebar navigation links in `Navbar.jsx`.

### 📊 Feature 2: Systematic Backtester Framework
- [ ] **Task 4: Backend: Python Backtester Engine**
  - [ ] Create `/backtest` APIRouter structure in `routers/backtest.py`.
  - [ ] Implement strategy rule parsing (e.g. Simple Moving Average Crossover logic: 50-day SMA vs 200-day SMA).
  - [ ] Fetch multi-year historical price tables from `yfinance`.
  - [ ] Compute entry/exit trades, equity curve growth over time, total returns, Sharpe ratio, and Max Drawdown.
  - [ ] Fetch S&P 500 (`^GSPC`) historical performance as a baseline benchmark.
- [ ] **Task 5: Frontend: Interactive Backtester Panel**
  - [ ] Create `StockBacktester.jsx` strategy config panel.
  - [ ] Build strategy parameters form (ticker, start/end dates, strategy indicators, filter limits).
  - [ ] Implement an interactive Recharts line chart comparing the Strategy Equity Curve against the S&P 500 Buy-and-Hold benchmark.
  - [ ] Display backtest metrics summaries (Sharpe Ratio, Max Drawdown, Net Profit %).
  - [ ] Connect routes in `App.jsx` and sidebar menu links in `Navbar.jsx`.

---

## 📐 Math & Logic Reference

### 1. Fundamental Screener Filters
* **Profit Margin**: $\text{Net Profit Margin} = \frac{\text{Net Income}}{\text{Total Revenue}}$ (Threshold: $>15\%$)
* **Debt to Equity**: $\text{D/E} = \frac{\text{Total Liabilities}}{\text{Total Shareholders' Equity}}$ (Threshold: $< 1.0$ or $<100\%$)
* **Free Cash Flow (FCF) Growth**: Year-over-year growth in operating cash flow minus capital expenditures.

### 2. Anomalous Divergence Logic
An anomaly is triggered if a stock shows diverging vector directions between operations and market valuation:
$$\text{Revenue Growth (QoQ)} > 10\% \quad \text{AND} \quad \text{Price Change (30 days)} < -10\%$$

### 3. Backtest Metrics
* **Total Return %**: $\frac{\text{Ending Capital} - \text{Starting Capital}}{\text{Starting Capital}} \times 100$
* **Max Drawdown (MDD)**: The maximum peak-to-trough decline in equity curve value:
$$\text{Drawdown} = \frac{\text{Trough Value} - \text{Peak Value}}{\text{Peak Value}} \quad \Rightarrow \quad \text{MDD} = \min(\text{Drawdowns})$$
* **Sharpe Ratio**: A measure of risk-adjusted return (using 0% risk-free rate for simplicity):
$$\text{Sharpe} = \frac{\text{Average Strategy Return}}{\text{Standard Deviation of Returns}}$$
