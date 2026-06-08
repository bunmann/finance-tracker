# Week 4 — Lesson 6: Dashboard & Charts

Now let's build the most visually impressive part of your app — a **dashboard page** that displays financial summaries and charts using data from your `GET /dashboard` endpoint.

---

## 1. Installing Recharts

**Recharts** is a popular React charting library built on D3.js. It provides simple, declarative chart components that fit perfectly into React's component model.

Install it:
```bash
npm install recharts
```

---

## 2. Planning the Dashboard

Our dashboard will display:
1. **Summary cards** — Total Income, Total Expenses, Net Savings (big numbers at the top).
2. **Pie chart** — Spending breakdown by category.
3. **Month/Year selector** — So users can view different months.

All of this data comes from your `GET /dashboard?month=6&year=2026` endpoint.

---

## 3. Creating the Dashboard Component

Create a new file: **`src/components/Dashboard.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';

// Colors for the pie chart slices
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4'];

function Dashboard() {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1); // JS months are 0-indexed
    const [year, setYear] = useState(today.getFullYear());
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch dashboard data whenever month or year changes
    useEffect(() => {
        setLoading(true);
        api.get(`/dashboard?month=${month}&year=${year}`)
            .then(response => {
                setDashboardData(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching dashboard:', error);
                setLoading(false);
            });
    }, [month, year]);  // Re-fetch when month or year changes!

    if (loading) return <p>Loading dashboard...</p>;
    if (!dashboardData) return <p>Error loading dashboard data.</p>;

    return (
        <div>
            <h2>Dashboard</h2>

            {/* Month/Year selector */}
            <div>
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

            {/* Summary Cards */}
            <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
                <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                    <h3>Income</h3>
                    <p style={{ fontSize: '24px', color: 'green' }}>
                        ${dashboardData.total_income.toFixed(2)}
                    </p>
                </div>
                <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                    <h3>Expenses</h3>
                    <p style={{ fontSize: '24px', color: 'red' }}>
                        ${dashboardData.total_expense.toFixed(2)}
                    </p>
                </div>
                <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                    <h3>Net Savings</h3>
                    <p style={{ fontSize: '24px', color: dashboardData.net_savings >= 0 ? 'green' : 'red' }}>
                        ${dashboardData.net_savings.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Pie Chart — Spending by Category */}
            {dashboardData.by_category.length > 0 ? (
                <div>
                    <h3>Spending by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={dashboardData.by_category}
                                dataKey="amount"
                                nameKey="category_name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ category_name, amount }) =>
                                    `${category_name}: $${amount.toFixed(2)}`
                                }
                            >
                                {dashboardData.by_category.map((entry, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p>No expense data for this month.</p>
            )}
        </div>
    );
}

export default Dashboard;
```

---

## 4. Breaking Down the New Concepts

### The `useEffect` Dependency Array: `[month, year]`

In Lesson 2, we used an empty array `[]` to mean "run once on mount." Here we pass `[month, year]`:

```jsx
useEffect(() => {
    // Fetch data...
}, [month, year]);
```

This means: "Run this effect every time `month` or `year` changes." So when the user selects a different month from the dropdown, React automatically re-fetches the dashboard data for that month.

### Recharts Components

| Component | What it does |
|---|---|
| `<PieChart>` | The chart container |
| `<Pie>` | The actual pie with slices |
| `<Cell>` | Controls the color of each slice |
| `<Tooltip>` | Shows data when hovering over a slice |
| `<Legend>` | Shows the color-coded labels below the chart |
| `<ResponsiveContainer>` | Makes the chart resize with the browser window |

### Inline Styles in React

Notice we use `style={{ color: 'green' }}` instead of CSS classes. In React, inline styles are written as **JavaScript objects** with camelCase properties:

| CSS | React inline style |
|---|---|
| `background-color: red;` | `backgroundColor: 'red'` |
| `font-size: 24px;` | `fontSize: '24px'` |
| `border-radius: 8px;` | `borderRadius: '8px'` |

> **Why double curly braces?** The outer `{}` enters JavaScript mode in JSX. The inner `{}` is the JavaScript object literal. So `style={{ color: 'red' }}` means "set the style attribute to the JS object `{ color: 'red' }`."

---

## 5. Conditional Rendering with Ternary Operator

We use a ternary expression to show the chart only if there's data:

```jsx
{dashboardData.by_category.length > 0 ? (
    <div>Chart goes here</div>
) : (
    <p>No expense data for this month.</p>
)}
```

This is React's version of an if/else inside JSX:
- `condition ? <ShowThis /> : <ShowThat />`

---

## 6. Your Task

1. Install Recharts: `npm install recharts`
2. Create `src/components/Dashboard.jsx` with the code above.
3. Update `src/App.jsx` to include the Dashboard component (below the transaction list for now):

```jsx
import Dashboard from './components/Dashboard';

// Inside the App return:
<div className="App">
    <h1>Finance Tracker</h1>
    <Dashboard />
    <TransactionForm onTransactionAdded={handleTransactionAdded} />
    <TransactionList
        transactions={transactions}
        loading={loading}
        onDelete={handleTransactionDeleted}
    />
</div>
```

4. Make sure you have some transactions in your database (add them via the form or Swagger).
5. Open `http://localhost:5173` — you should see the summary cards and a pie chart!
6. Try changing the month/year dropdown to see different data.
