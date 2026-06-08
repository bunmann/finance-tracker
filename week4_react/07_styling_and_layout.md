# Week 4 — Lesson 7: Styling & Layout

Your app works but looks basic. In this lesson, we'll add a **navigation bar**, organize the pages with **React Router**, and apply **CSS styling** to make everything look clean and professional.

---

## 1. Installing React Router

Right now, everything is crammed on one page. We want separate **pages** (like `/dashboard` and `/transactions`) with a navigation bar to switch between them.

**React Router** is the standard library for page navigation in React:

```bash
npm install react-router-dom
```

---

## 2. Creating a Navigation Bar Component

Create a new file: **`src/components/Navbar.jsx`**

```jsx
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <h1>💰 Finance Tracker</h1>
            </div>
            <div className="navbar-links">
                <Link to="/">Dashboard</Link>
                <Link to="/transactions">Transactions</Link>
            </div>
        </nav>
    );
}

export default Navbar;
```

### `<Link>` vs `<a>` tags

In React Router, you use `<Link to="/path">` instead of `<a href="/path">`.

| `<a href="...">` | `<Link to="...">` |
|---|---|
| Reloads the entire page | Only updates the React component (no reload) |
| Slow — re-fetches all JS, CSS, data | Fast — instant page switch |
| Standard HTML | React Router component |

---

## 3. Setting Up Routes in App.jsx

Update **`src/App.jsx`** to use React Router:

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './api';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import './App.css';

function App() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/transactions')
            .then(response => {
                setTransactions(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error:', error);
                setLoading(false);
            });
    }, []);

    const handleTransactionAdded = (newTransaction) => {
        setTransactions([...transactions, newTransaction]);
    };

    const handleTransactionDeleted = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

    return (
        <Router>
            <div className="App">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/transactions" element={
                            <div>
                                <TransactionForm onTransactionAdded={handleTransactionAdded} />
                                <TransactionList
                                    transactions={transactions}
                                    loading={loading}
                                    onDelete={handleTransactionDeleted}
                                />
                            </div>
                        } />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
```

### How Routing Works:
| URL Path | What Renders |
|---|---|
| `localhost:5173/` | `<Dashboard />` |
| `localhost:5173/transactions` | `<TransactionForm />` + `<TransactionList />` |

The `<Navbar />` is **outside** the `<Routes>`, so it appears on every page.

---

## 4. Adding CSS Styles

Replace **`src/App.css`** with these styles:

```css
/* ========== Global Resets ========== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f5f7fa;
    color: #333;
}

/* ========== Navbar ========== */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 30px;
    background-color: #1a1a2e;
    color: white;
}

.navbar-brand h1 {
    font-size: 1.4rem;
}

.navbar-links {
    display: flex;
    gap: 20px;
}

.navbar-links a {
    color: #e0e0e0;
    text-decoration: none;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.navbar-links a:hover {
    background-color: #16213e;
    color: white;
}

/* ========== Main Content ========== */
.main-content {
    max-width: 900px;
    margin: 30px auto;
    padding: 0 20px;
}

/* ========== Tables ========== */
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

thead {
    background-color: #1a1a2e;
    color: white;
}

th, td {
    padding: 12px 16px;
    text-align: left;
}

tbody tr:nth-child(even) {
    background-color: #f8f9fa;
}

tbody tr:hover {
    background-color: #e8eaf6;
}

/* ========== Forms ========== */
form {
    background: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

form div {
    margin-bottom: 12px;
}

label {
    display: inline-block;
    width: 120px;
    font-weight: 600;
}

input, select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    width: 220px;
}

input:focus, select:focus {
    outline: none;
    border-color: #1a1a2e;
    box-shadow: 0 0 0 2px rgba(26, 26, 46, 0.1);
}

/* ========== Buttons ========== */
button {
    padding: 8px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: background-color 0.2s;
}

button[type="submit"] {
    background-color: #1a1a2e;
    color: white;
    margin-top: 10px;
}

button[type="submit"]:hover {
    background-color: #16213e;
}

/* Delete button */
tbody button {
    background-color: #ff4757;
    color: white;
    padding: 5px 12px;
    font-size: 12px;
}

tbody button:hover {
    background-color: #ff6b81;
}

/* ========== Summary Cards ========== */
.summary-cards {
    display: flex;
    gap: 20px;
    margin: 20px 0;
}

.summary-card {
    flex: 1;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.summary-card h3 {
    color: #666;
    font-size: 14px;
    text-transform: uppercase;
    margin-bottom: 8px;
}

.summary-card .amount {
    font-size: 28px;
    font-weight: 700;
}

.amount.income { color: #2ed573; }
.amount.expense { color: #ff4757; }
.amount.savings-positive { color: #2ed573; }
.amount.savings-negative { color: #ff4757; }
```

---

## 5. Updating Dashboard to Use CSS Classes

Now that we have CSS classes, update the inline styles in `Dashboard.jsx` to use them. Replace the summary cards section:

```jsx
{/* Summary Cards */}
<div className="summary-cards">
    <div className="summary-card">
        <h3>Income</h3>
        <p className="amount income">
            ${dashboardData.total_income.toFixed(2)}
        </p>
    </div>
    <div className="summary-card">
        <h3>Expenses</h3>
        <p className="amount expense">
            ${dashboardData.total_expense.toFixed(2)}
        </p>
    </div>
    <div className="summary-card">
        <h3>Net Savings</h3>
        <p className={`amount ${dashboardData.net_savings >= 0 ? 'savings-positive' : 'savings-negative'}`}>
            ${dashboardData.net_savings.toFixed(2)}
        </p>
    </div>
</div>
```

### Template Literals in JSX className

```jsx
className={`amount ${condition ? 'class-a' : 'class-b'}`}
```

This uses JavaScript template literals (backtick strings) to dynamically set the CSS class based on whether net savings is positive or negative.

---

## 6. Responsive Design Basics

Add this to the bottom of **`src/App.css`** to make the layout work on smaller screens:

```css
/* ========== Responsive ========== */
@media (max-width: 768px) {
    .navbar {
        flex-direction: column;
        gap: 10px;
    }
    
    .summary-cards {
        flex-direction: column;
    }

    label {
        display: block;
        width: 100%;
        margin-bottom: 4px;
    }

    input, select {
        width: 100%;
    }
}
```

**`@media (max-width: 768px)`** means: "Apply these styles only when the browser window is 768px wide or narrower" (roughly tablet-sized and below).

---

## 7. Your Task

1. Install React Router: `npm install react-router-dom`
2. Create `src/components/Navbar.jsx`.
3. Update `src/App.jsx` with the Router setup.
4. Replace `src/App.css` with the provided styles.
5. Update `Dashboard.jsx` to use CSS classes instead of inline styles.
6. Test the navigation:
   - Click "Dashboard" in the navbar → see summary cards and pie chart.
   - Click "Transactions" → see the form and transaction table.
   - Try resizing the browser window to test responsive layout.

You've completed Week 4! You now have a **fully functional full-stack web application** with:
- ✅ A React frontend connected to your FastAPI backend
- ✅ Transaction list with delete functionality
- ✅ Add transaction form
- ✅ Dashboard with financial summary and pie chart
- ✅ Navigation bar with page routing
- ✅ Clean, professional styling

🎉 **Congratulations — this is a real, working web application!**
