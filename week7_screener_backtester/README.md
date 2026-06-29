# Week 7 — Quantitative Research: Screeners & Systematic Backtester

Welcome to Week 7. In this phase, we transition from basic CRUD asset management to building automated quantitative engines, converting the portfolio tracker into a professional research terminal. We approach these strategies as signal-processing systems and state-logic control loops.

---

## 📋 Week 7 Features Checklist

### 🔍 Feature 1: Fundamental Screener & Anomalous Price Action Engine
- [x] **Task 1: Backend: Fundamental Screener API**
  - [x] Create `/screener` APIRouter structure in `routers/screener.py` and register it in `main.py`.
  - [x] Implement `POST /screener/run` using `yfinance` to fetch financial stats (FCF growth, net margins, Debt/Equity, P/E).
  - [x] Fetch recent 30-day price trends to support relative performance metrics (Cross-Sectional Ranking).
  - [x] Add filtering logic matching user-defined thresholds.
  - [x] Integrate user's **Circle of Competence** sectors to tag matching opportunities.
- [x] **Task 2: Backend: Anomalous Price Action Engine**
  - [x] Implement unified multi-strategy quantitative scan engine `POST /screener/scan` covering watchlist, holdings, and general recommendations.
  - [x] Calculate recent 30-day price trends and compare them against quarterly fundamental growth rates.
  - [x] Flag price-to-fundamental divergence alerts.
- [x] **Task 3: Frontend: Screener & Anomalies Dashboard**
  - [x] Create `StockScreener.jsx` to render the unified screener control panel.
  - [x] Build the Anomaly Alerts panel showcasing real-time price divergence warnings.
  - [x] Integrate a results table with sorting, sector badges, "In Circle of Competence" highlights, and Cross-Sectional relative rankings.
  - [x] Connect routes in `App.jsx` and add sidebar navigation links in `Navbar.jsx`.

### 📊 Feature 2: Systematic Backtester Framework
- [ ] **Task 4: Backend: Python Backtester Engine**
  - [ ] Create `/backtest` APIRouter structure in `routers/backtest.py`.
  - [ ] Implement **Trend Following (Momentum)**: Simple Moving Average (SMA) crossover signal processing logic (e.g. 50-day fast vs. 200-day slow SMA).
  - [ ] Implement **Mean Reversion (Spring / Bollinger Band)**: Z-Score rolling standard deviation state triggers.
  - [ ] Fetch multi-year historical price tables from `yfinance`.
  - [ ] Compute entry/exit trades, equity curve growth over time, total returns, Sharpe ratio, and Max Drawdown.
  - [ ] Fetch S&P 500 (`^GSPC`) historical performance as a baseline benchmark.
- [ ] **Task 5: Frontend: Interactive Backtester Panel**
  - [ ] Create `StockBacktester.jsx` strategy config panel.
  - [ ] Build strategy parameters form (ticker, start/end dates, strategy indicators, filter limits).
  - [ ] Implement an interactive Recharts line chart comparing the Strategy Equity Curve against the S&P 500 Buy-and-Hold benchmark.
  - [ ] Display backtest risk/return metrics summaries (Sharpe Ratio, Max Drawdown, Net Profit %).
  - [ ] Connect routes in `App.jsx` and sidebar menu links in `Navbar.jsx`.

---

## 📐 ECE & Quantitative Logic Reference

### 1. Fundamental Screener Filters
* **Profit Margin**: $\text{Net Profit Margin} = \frac{\text{Net Income}}{\text{Total Revenue}}$ (Threshold: $>15\%$)
* **Debt to Equity**: $\text{D/E} = \frac{\text{Total Liabilities}}{\text{Total Shareholders' Equity}}$ (Threshold: $< 1.0$)
* **Free Cash Flow (FCF) Growth**: Year-over-year growth in operating cash flow minus capital expenditures.

### 2. Cross-Sectional Momentum (Relative Strength Sorting)
Exploits relative performance across an array of symbols rather than absolute stock momentum.
* **Logic**: Extract the 30-day percentage return for all watchlist assets:
$$\text{Return}_{30d} = \frac{\text{Price}_{\text{today}} - \text{Price}_{30d\_ago}}{\text{Price}_{30d\_ago}} \times 100$$
* **Sorting**: Rank the resulting array in descending order, identifying the top 10% highest performers.

### 3. Anomalous Divergence Logic
An anomaly is triggered if a stock shows diverging vector directions between operations and market valuation:
$$\text{Revenue Growth (QoQ)} > 10\% \quad \text{AND} \quad \text{Price Change (30 days)} < -10\%$$

### 4. Trend Following (Moving Average Crossover Signal Filter)
Filters out daily high-frequency noise using moving averages to identify low-frequency inertial direction changes.
* **Filter Calculations**: Fast moving average (SMA-50) and slow moving average (SMA-200) over historical price array $P$:
$$\text{SMA}_{n}(t) = \frac{1}{n} \sum_{i=0}^{n-1} P(t - i)$$
* **State Trigger**:
$$\text{State}(t) = \begin{cases} \text{BUY / LONG} & \text{if } \text{SMA}_{\text{fast}}(t) > \text{SMA}_{\text{slow}}(t) \\ \text{HOLD CASH / EXIT} & \text{if } \text{SMA}_{\text{fast}}(t) \le \text{SMA}_{\text{slow}}(t) \end{cases}$$

### 5. Mean Reversion (Z-Score Spring Deviation System)
Treats price deviations as a mechanical spring (Hooke's Law: $F = -kx$). When the signal moves standard deviations away from the baseline, a restorative return is anticipated.
* **Baseline & Standard Deviation**: Rolling 20-day mean $\mu_{20}$ and standard deviation $\sigma_{20}$:
$$\mu_{20}(t) = \frac{1}{20} \sum_{i=0}^{19} P(t - i), \quad \sigma_{20}(t) = \sqrt{\frac{1}{20} \sum_{i=0}^{19} (P(t - i) - \mu_{20}(t))^2}$$
* **Z-Score Calculation**:
$$Z(t) = \frac{P(t) - \mu_{20}(t)}{\sigma_{20}(t)}$$
* **State Trigger**:
$$\text{State}(t) = \begin{cases} \text{BUY / OVERSOLD} & \text{if } Z(t) < -2.5 \\ \text{SELL / REVERTED} & \text{if } Z(t) \ge 0.0 \end{cases}$$

### 6. Backtest Metrics
* **Total Return %**: $\frac{\text{Ending Capital} - \text{Starting Capital}}{\text{Starting Capital}} \times 100$
* **Max Drawdown (MDD)**: The maximum peak-to-trough decline in equity curve value:
$$\text{Drawdown} = \frac{\text{Trough Value} - \text{Peak Value}}{\text{Peak Value}} \quad \Rightarrow \quad \text{MDD} = \min(\text{Drawdowns})$$
* **Sharpe Ratio**: A measure of risk-adjusted return (using 0% risk-free rate for simplicity):
$$\text{Sharpe} = \frac{\text{Average Strategy Return}}{\text{Standard Deviation of Returns}}$$
