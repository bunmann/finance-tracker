# Major Feature 3: Financial Statements & Net Worth Tracking

Comprehensive accounting engines generating standard corporate-style financial reports for personal cash flow.

---

## 📋 Feature 3 Tasks Checklist

### 📑 Task 1: Balance Sheet Engine
- [ ] Implement backend endpoint aggregating cash accounts and investment holdings against total liabilities.
- [ ] Calculate live Net Worth snapshot (`Assets - Liabilities`).
- [ ] Build UI presentation comparing liquid assets against debt liabilities.

### 💰 Task 2: Income Statement Engine
- [ ] Implement date-range `GROUP BY` queries rolling up revenue vs. categorized expenses over monthly, quarterly, or annual periods.
- [ ] Compute Net Operating Surplus / Savings Rate.
- [ ] Render interactive Income Statement grid in the frontend.

### 🌊 Task 3: Cash Flow Statement Engine
- [ ] Categorize cash movements into Operating, Investing, and Financing flows.
- [ ] Render period-over-period flow comparisons.

### 📈 Task 4: Net Worth Snapshots & PDF Export
- [ ] Automate periodic snapshots stored in `net_worth_snapshots` table.
- [ ] Implement PDF report generation (WeasyPrint or ReportLab) for personal accounting audits.
