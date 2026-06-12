# Week 5 — Lesson 5: Budget Tracking

Your `categories` table already has a `monthly_budget` column — we just haven't used it yet. In this lesson, we'll add a **budget overview page** that shows how much you've spent vs. your budget limit per category, with color-coded progress bars.

---

## 1. The Budget Feature Plan

```
User sets a monthly budget for each category (e.g., Food: $300, Transport: $100)
                    ↓
Dashboard shows progress bars:   Food:  $245 / $300  ██████████░░░  82% (yellow)
                                 Transport: $42 / $100  ████░░░░░░░░  42% (green)
                                 Entertainment: $180 / $150  ████████████████ 120% (RED!)
```

We need:
1. **Backend**: A `PUT /categories/{id}` endpoint to update budget amounts, and enhanced dashboard data
2. **Frontend**: A `BudgetOverview.jsx` component with progress bars

---

## 2. Backend — Update Category Endpoint

We already have `POST` and `DELETE` for categories, but no way to **update** an existing one. Add a `PUT` endpoint to **`main.py`**:

```python
@app.put("/categories/{category_id}")
def update_category(
    category_id: int,
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id
    ).first()

    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    db_category.name = category.name
    db_category.icon = category.icon
    db_category.monthly_budget = category.monthly_budget
    db.commit()
    db.refresh(db_category)
    return db_category
```

### PUT vs POST vs PATCH

| Method | Purpose | Example |
|---|---|---|
| **POST** | Create a new resource | `POST /categories` → creates a new category |
| **PUT** | Replace an existing resource entirely | `PUT /categories/3` → replaces all fields of category 3 |
| **PATCH** | Update some fields of an existing resource | `PATCH /categories/3` → updates only the fields you send |

We're using `PUT` here. In practice, the difference between PUT and PATCH isn't critical for this app — just know that PUT means "here's the full updated object."

---

## 3. Backend — Enhanced Dashboard Data

Update the dashboard endpoint in **`main.py`** to include budget information per category:

```python
@app.get("/dashboard")
def get_dashboard_summary(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Total income
    income_val = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "income",
        models.Transaction.user_id == current_user.id,
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).scalar()
    total_income = float(income_val) if income_val is not None else 0.0

    # 2. Total expenses
    expense_val = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "expense",
        models.Transaction.user_id == current_user.id,
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).scalar()
    total_expense = float(expense_val) if expense_val is not None else 0.0

    # 3. Spending by category (with budget info)
    category_data = db.query(
        models.Category.name,
        models.Category.monthly_budget,
        func.sum(models.Transaction.amount)
    ).join(
        models.Transaction, models.Transaction.category_id == models.Category.id
    ).filter(
        models.Transaction.type == "expense",
        models.Transaction.user_id == current_user.id,
        func.extract('month', models.Transaction.date) == month,
        func.extract('year', models.Transaction.date) == year
    ).group_by(
        models.Category.name,
        models.Category.monthly_budget
    ).all()

    by_category = [
        {
            "category_name": name,
            "budget": float(budget) if budget else 0.0,
            "amount": float(amount),
        }
        for name, budget, amount in category_data
    ]

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_savings": total_income - total_expense,
        "by_category": by_category
    }
```

The key change: we now include `models.Category.monthly_budget` in the query and return it in the response. Each category entry now has both `amount` (how much was spent) and `budget` (the limit).

---

## 4. Frontend — Budget Overview Component

Create **`src/components/BudgetOverview.jsx`**:

```jsx
import { useState, useEffect } from 'react';
import api from '../api';

function BudgetOverview() {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [categories, setCategories] = useState([]);
    const [budgetData, setBudgetData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch categories and dashboard data
    useEffect(() => {
        setLoading(true);

        Promise.all([
            api.get('/categories'),
            api.get(`/dashboard?month=${month}&year=${year}`)
        ])
            .then(([catResponse, dashResponse]) => {
                setCategories(catResponse.data);
                setBudgetData(dashResponse.data.by_category);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching budget data:', error);
                setLoading(false);
            });
    }, [month, year]);

    const handleBudgetUpdate = (categoryId, newBudget) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        api.put(`/categories/${categoryId}`, {
            name: category.name,
            icon: category.icon,
            monthly_budget: parseFloat(newBudget) || 0
        })
            .then(response => {
                setCategories(categories.map(c =>
                    c.id === categoryId ? response.data : c
                ));
            })
            .catch(error => console.error('Error updating budget:', error));
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return 'over-budget';
        if (percentage >= 75) return 'warning';
        return 'on-track';
    };

    if (loading) return <p>Loading budget data...</p>;

    return (
        <div>
            <h2>Budget Overview</h2>

            {/* Month/Year selector */}
            <div className="budget-controls">
                <label>Month: </label>
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                    {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {new Date(2026, i).toLocaleString('default', { month: 'long' })}
                        </option>
                    ))}
                </select>

                <label> Year: </label>
                <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                />
            </div>

            {/* Budget cards for each category */}
            <div className="budget-list">
                {categories.map(category => {
                    const spending = budgetData.find(
                        b => b.category_name === category.name
                    );
                    const spent = spending ? spending.amount : 0;
                    const budget = parseFloat(category.monthly_budget) || 0;
                    const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

                    return (
                        <div key={category.id} className="budget-card">
                            <div className="budget-header">
                                <span className="budget-category">
                                    {category.icon} {category.name}
                                </span>
                                <span className="budget-amounts">
                                    ${spent.toFixed(2)} / ${budget.toFixed(2)}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="progress-bar-container">
                                <div
                                    className={`progress-bar-fill ${getProgressColor(percentage)}`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>

                            <div className="budget-footer">
                                <span className={`budget-percentage ${getProgressColor(percentage)}`}>
                                    {budget > 0 ? `${percentage}%` : 'No budget set'}
                                </span>
                                <div className="budget-input-group">
                                    <label>Budget: $</label>
                                    <input
                                        type="number"
                                        defaultValue={budget}
                                        onBlur={(e) => handleBudgetUpdate(category.id, e.target.value)}
                                        step="10"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {categories.length === 0 && (
                <p>No categories yet. Create categories in the Transactions page first.</p>
            )}
        </div>
    );
}

export default BudgetOverview;
```

### `Promise.all` — Parallel API Calls

```js
Promise.all([
    api.get('/categories'),
    api.get(`/dashboard?month=${month}&year=${year}`)
])
    .then(([catResponse, dashResponse]) => { ... });
```

`Promise.all` takes an array of promises and waits for **all of them** to finish. This is faster than calling them one after another because both requests run simultaneously. The `.then` receives an array of responses in the same order.

### `onBlur` — Triggered When User Leaves an Input

```jsx
<input
    type="number"
    defaultValue={budget}
    onBlur={(e) => handleBudgetUpdate(category.id, e.target.value)}
/>
```

`onBlur` fires when the user clicks away from the input (leaves focus). This is better than `onChange` for budget amounts because we only want to save when the user is done typing, not on every keystroke.

### `defaultValue` vs `value`

| `value` (controlled) | `defaultValue` (uncontrolled) |
|---|---|
| React controls the input value | Browser controls the input value |
| Needs `onChange` to update state | Just sets the initial value |
| Re-renders on every keystroke | Only updates on blur/submit |

We use `defaultValue` here because we don't need to track every keystroke — we just need the final value when the user finishes editing.

### Dynamic `style` for Progress Bar Width

```jsx
style={{ width: `${Math.min(percentage, 100)}%` }}
```

We cap the progress bar at 100% width (even if spending is 150% of budget) so the bar doesn't overflow its container. The color changes to red to indicate over-budget.

---

## 5. Adding the Route and Navbar Link

In **`App.jsx`**, add the route (inside the logged-in routes):

```jsx
import BudgetOverview from './components/BudgetOverview';

// Inside <Routes>:
<Route path="/budgets" element={<BudgetOverview />} />
```

In **`Navbar.jsx`**, add the link:

```jsx
<Link to="/budgets">Budgets</Link>
```

---

## 6. Adding Budget Styles

Add to **`src/App.css`**:

```css
/* ========== Budget Overview ========== */
.budget-controls {
    margin-bottom: 20px;
}

.budget-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.budget-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.budget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.budget-category {
    font-weight: 600;
    font-size: 16px;
}

.budget-amounts {
    color: #666;
    font-size: 14px;
}

/* Progress Bar */
.progress-bar-container {
    width: 100%;
    height: 12px;
    background: #e9ecef;
    border-radius: 6px;
    overflow: hidden;
    margin: 10px 0;
}

.progress-bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.3s ease;
}

.progress-bar-fill.on-track { background: #2ed573; }
.progress-bar-fill.warning { background: #ffa502; }
.progress-bar-fill.over-budget { background: #ff4757; }

.budget-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
}

.budget-percentage {
    font-weight: 600;
    font-size: 14px;
}

.budget-percentage.on-track { color: #2ed573; }
.budget-percentage.warning { color: #ffa502; }
.budget-percentage.over-budget { color: #ff4757; }

.budget-input-group {
    display: flex;
    align-items: center;
    gap: 5px;
}

.budget-input-group input {
    width: 100px;
    padding: 4px 8px;
    font-size: 13px;
}
```

---

## 7. Dashboard Budget Alerts

In addition to the dedicated Budget page, we want **alert banners** right on the Dashboard so users immediately see if they're over budget without navigating away.

Add this section to your **`Dashboard.jsx`**, right after the summary cards and before the pie chart:

```jsx
{/* Budget Alerts */}
{dashboardData.by_category
    .filter(cat => cat.budget > 0 && cat.amount >= cat.budget * 0.75)
    .map((cat, i) => {
        const percentage = Math.round((cat.amount / cat.budget) * 100);
        const isOver = cat.amount >= cat.budget;
        return (
            <div
                key={i}
                className={`budget-alert ${isOver ? 'alert-danger' : 'alert-warning'}`}
            >
                {isOver
                    ? `⚠️ Over budget! ${cat.category_name}: $${cat.amount.toFixed(2)} / $${cat.budget.toFixed(2)} (${percentage}%)`
                    : `⚡ Approaching limit: ${cat.category_name}: $${cat.amount.toFixed(2)} / $${cat.budget.toFixed(2)} (${percentage}%)`
                }
            </div>
        );
    })
}
```

### How the Filter Works

```js
.filter(cat => cat.budget > 0 && cat.amount >= cat.budget * 0.75)
```

This filters to only show categories that:
1. Have a budget set (`cat.budget > 0`) — no point alerting if there's no budget
2. Have spent at least 75% of the budget (`cat.amount >= cat.budget * 0.75`)

Categories under 75% don't generate any alert.

### Alert Styles

Add to **`App.css`**:

```css
/* ========== Budget Alerts on Dashboard ========== */
.budget-alert {
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 10px;
    font-weight: 500;
    font-size: 14px;
}

.alert-warning {
    background: #fff3e0;
    color: #e65100;
    border-left: 4px solid #ffa502;
}

.alert-danger {
    background: #fce4ec;
    color: #c62828;
    border-left: 4px solid #ff4757;
}
```

---

## 8. Your Task

1. Add `PUT /categories/{id}` endpoint to `main.py`.
2. Update the `GET /dashboard` endpoint to include `monthly_budget` data.
3. Create `src/components/BudgetOverview.jsx`.
4. Add the `/budgets` route to `App.jsx` and a "Budgets" link to `Navbar.jsx`.
5. Add the budget styles to `App.css`.
6. Test:
   - Navigate to `/budgets`
   - Set budgets for your categories (click the number input, type a value, click away)
   - Add some transactions to those categories
   - Verify the progress bars update correctly
   - Verify color changes: green (< 75%), yellow (75–100%), red (> 100%)

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **`PUT` method** | HTTP method for updating an existing resource |
| **`Promise.all`** | Runs multiple API calls in parallel, waits for all |
| **`onBlur`** | Fires when user clicks away from an input field |
| **`defaultValue`** | Sets initial value without React controlling the input |
| **Progress bar** | CSS div with dynamic `width` percentage and color |
| **`Math.min(percentage, 100)`** | Caps progress bar at 100% to prevent overflow |
