# Major Feature 3: Net Worth & Wealth Health Dashboard

> **Pivot Decision (Jul 4, 2026):** Reframed from corporate-style Financial Statements to a
> user-friendly **Net Worth & Wealth Health** suite. GAAP/IFRS balance sheets and 3-statement
> accounting are cut — they added complexity without adding value for a personal finance user.
> The focus is now: *"What is my total wealth?"* and *"Am I saving enough each month?"*

---

## 📋 Feature 3 Tasks Checklist

### 💰 Task 1: Live Net Worth Snapshot (Backend)
- [x] Create `GET /net-worth` endpoint that aggregates:
  - **Cash/Spending Balance**: sum of all income minus all expenses across transaction history.
  - **Live Stock Portfolio Value**: pulled from the existing portfolio holdings value (already in CAD).
  - **Manual Liabilities Input**: simple user-editable "Debts & Liabilities" total (e.g. credit card balance, student loans).
- [x] Formula: `Net Worth = Cash Balance + Stock Portfolio Value − Total Liabilities`
- [x] Store periodic net worth snapshots in a `net_worth_snapshots` table (timestamp + value) for trend tracking.

### 📊 Task 2: Monthly Savings Rate & Cash Flow Pulse (Backend)
- [x] Create `GET /wealth-health?month=X&year=Y` endpoint returning:
  - `total_income`: sum of income transactions in period.
  - `total_expenses`: sum of expense transactions in period.
  - `net_savings`: `income − expenses`.
  - `savings_rate`: `(net_savings / income) * 100` as a percentage.
  - `biggest_expense_category`: the top spending bucket for the period.
- [x] Support `month=0, year=0` for all-time view.

### 🖥️ Task 3: Net Worth & Wealth Health UI (Frontend)
- [x] **Net Worth Card** at the top of a new "Wealth" page:
  - Three sub-figures shown clearly: Cash Balance · Stock Value · Liabilities.
  - Large single headline **Net Worth** number in CAD.
  - Sparkline trend chart of net worth over last 12 snapshots.
- [x] **Monthly Cash Flow Pulse Card**:
  - Horizontal bar visual: `Income` (green) vs `Expenses` (red/orange).
  - **Savings Rate** shown as a large percentage badge (green if >20%, orange if 10–20%, red if <10%).
  - Biggest expense category callout.
- [x] Period selector (Month / Year / All Time) synced with existing PeriodSelector component.

### 🗑️ Explicitly Cut (Not Building)
- ~~Corporate Balance Sheet (Assets vs. Liabilities in GAAP format)~~
- ~~Income Statement grid (Revenue, COGS, EBIT, EBT)~~
- ~~Cash Flow Statement (Operating / Investing / Financing breakdown)~~
- ~~PDF report generation (WeasyPrint / ReportLab)~~

---

## Why This Pivot

| Old Plan (Cut) | New Plan (Building) |
|---|---|
| GAAP Balance Sheet | Simple Net Worth = Cash + Stocks − Debts |
| Income Statement with EBIT/EBT | Monthly Savings Rate % in plain English |
| Operating vs. Investing Cash Flows | Cash Flow Pulse bar (Income vs. Expenses) |
| PDF audit report export | Net worth sparkline trend chart |
| Accounting jargon | Plain numbers people actually understand |

Regular people don't think like accountants. They think: *"Am I saving money this month?"* and *"Is my net worth going up?"* — this feature answers those questions directly.
