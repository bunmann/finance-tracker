# Major Feature 5: Systematic Backtesting Framework (Deferred TO-DO ⏸️)

A quantitative research simulation sandbox testing algorithmic trading criteria against historical market benchmarks.

---

## 📋 Feature 5 Tasks Checklist

### ⚙️ Task 1: Python Backtester Engine (`routers/backtest.py`)
- [ ] Create `/backtest` APIRouter structure.
- [ ] Implement **Trend Following (Momentum)**: Simple Moving Average (SMA) crossover signal processing logic (e.g. 50-day fast vs. 200-day slow SMA).
- [ ] Implement **Mean Reversion (Spring / Bollinger Band)**: Z-Score rolling standard deviation state triggers.
- [ ] Fetch multi-year historical price tables from `yfinance`.

### 📐 Task 2: Institutional Risk Analytics
- [ ] Compute entry/exit trade execution arrays and historical equity curves.
- [ ] Calculate institutional risk metrics: Total Return %, Sharpe Ratio, and Maximum Drawdown (MDD).
- [ ] Fetch S&P 500 (`^GSPC`) historical performance as a baseline benchmark comparison curve.

### 🖥️ Task 3: Interactive Backtester Panel (`StockBacktester.jsx`)
- [ ] Build strategy parameter configuration controls (ticker, start/end dates, strategy indicators, filter thresholds).
- [ ] Render interactive Recharts comparison line chart (Strategy Equity Curve vs. S&P 500 Buy-and-Hold benchmark).
- [ ] Display summary KPI cards for risk/return metrics.
