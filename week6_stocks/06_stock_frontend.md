# Week 6 — Lesson 6: Stock Portfolio — Frontend Integration

Time to build the React pages for the stock portfolio. We'll add a portfolio overview page, buy/sell forms, a transaction history view, and wire everything into the existing navigation. This lesson reuses most of the component patterns you already know from the finance tracker — forms, lists, API calls, conditional rendering.

---

## 1. What We're Building

Three new components + navigation updates:

| Component | Purpose |
|---|---|
| `StockPortfolio.jsx` | Main portfolio page: holdings table, total value, buy/sell forms |
| `StockForm.jsx` | Form to buy or sell stocks |
| `StockTransactions.jsx` | History of all stock trades |

Plus updates to:
- `Navbar.jsx` — add a "Stocks" tab
- `App.jsx` — add the `/stocks` route
- `App.css` — styles for the portfolio page

---

## 2. The Portfolio Page

Create **`week4_react/src/components/StockPortfolio.jsx`**:

```jsx
// ============================================================================
// File: StockPortfolio.jsx
// Description: Main stock portfolio page with holdings, buy/sell forms,
//              and transaction history.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../api';
import StockForm from './StockForm';
import StockTransactions from './StockTransactions';

function StockPortfolio({ showToast }) {
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPortfolio = () => {
        api.get('/stocks/portfolio')
            .then(response => {
                setPortfolio(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching portfolio:', error);
                showToast?.('Failed to load portfolio.', 'error');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const handleTradeComplete = () => {
        fetchPortfolio();
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="stocks-page">
            <div className="portfolio-header">
                <h2>📈 Stock Portfolio</h2>
                {portfolio && (
                    <div className="portfolio-totals">
                        <div className="total-card">
                            <span className="total-label">Total Value</span>
                            <span className="total-amount">
                                ${portfolio.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="total-card">
                            <span className="total-label">Total Cost</span>
                            <span className="total-amount">
                                ${portfolio.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className={`total-card ${portfolio.total_gain >= 0 ? 'gain' : 'loss'}`}>
                            <span className="total-label">Total P&L</span>
                            <span className="total-amount">
                                {portfolio.total_gain >= 0 ? '+' : ''}
                                ${portfolio.total_gain.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Holdings Table */}
            <div className="card">
                <h3>Holdings</h3>
                {portfolio?.holdings?.length > 0 ? (
                    <table className="holdings-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Shares</th>
                                <th>Avg Cost</th>
                                <th>Current Price</th>
                                <th>Market Value</th>
                                <th>P&L</th>
                                <th>P&L %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {portfolio.holdings.map(h => (
                                <tr key={h.ticker}>
                                    <td className="ticker-cell">{h.ticker}</td>
                                    <td>{h.shares.toFixed(2)}</td>
                                    <td>${h.avg_cost.toFixed(2)}</td>
                                    <td>{h.current_price ? `$${h.current_price.toFixed(2)}` : '—'}</td>
                                    <td>{h.market_value ? `$${h.market_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</td>
                                    <td className={h.unrealized_gain >= 0 ? 'gain-text' : 'loss-text'}>
                                        {h.unrealized_gain !== null
                                            ? `${h.unrealized_gain >= 0 ? '+' : ''}$${h.unrealized_gain.toFixed(2)}`
                                            : '—'}
                                    </td>
                                    <td className={h.gain_percent >= 0 ? 'gain-text' : 'loss-text'}>
                                        {h.gain_percent !== null
                                            ? `${h.gain_percent >= 0 ? '+' : ''}${h.gain_percent.toFixed(2)}%`
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <p>📭 No holdings yet. Buy your first stock below!</p>
                    </div>
                )}
            </div>

            {/* Buy/Sell Forms */}
            <div className="stock-forms">
                <StockForm type="buy" onComplete={handleTradeComplete} showToast={showToast} />
                <StockForm type="sell" onComplete={handleTradeComplete} showToast={showToast} />
            </div>

            {/* Transaction History */}
            <StockTransactions />
        </div>
    );
}

export default StockPortfolio;
```

### Key Patterns

**Color-coded P&L:** We use CSS classes `gain-text` and `loss-text` to make profits green and losses red. The ternary `h.unrealized_gain >= 0 ? 'gain-text' : 'loss-text'` picks the right class.

**The `?.` operator again:** `portfolio?.holdings?.length > 0` — safely check if portfolio exists, then if holdings exists, then if it has items. Without this, the page would crash if the API hasn't responded yet.

**`toLocaleString`:** `value.toLocaleString('en-US', { minimumFractionDigits: 2 })` formats numbers with commas and 2 decimal places: `1234.5` → `"1,234.50"`.

---

## 3. The Stock Form

Create **`week4_react/src/components/StockForm.jsx`**:

```jsx
// ============================================================================
// File: StockForm.jsx
// Description: Reusable form for buying or selling stocks.
// ============================================================================
import { useState } from 'react';
import api from '../api';

function StockForm({ type, onComplete, showToast }) {
    const [ticker, setTicker] = useState('');
    const [shares, setShares] = useState('');
    const [price, setPrice] = useState('');

    const isBuy = type === 'buy';

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!ticker || !shares || !price) {
            showToast?.('Please fill in all fields.', 'error');
            return;
        }

        api.post(`/stocks/${type}`, {
            ticker: ticker.toUpperCase(),
            shares: parseFloat(shares),
            price: parseFloat(price)
        })
        .then(() => {
            showToast?.(`${isBuy ? 'Bought' : 'Sold'} ${shares} shares of ${ticker.toUpperCase()}!`);
            setTicker('');
            setShares('');
            setPrice('');
            onComplete?.();
        })
        .catch(error => {
            const detail = error.response?.data?.detail || `Failed to ${type} stock.`;
            showToast?.(detail, 'error');
        });
    };

    return (
        <div className="card stock-form-card">
            <h3>{isBuy ? '🟢 Buy Stock' : '🔴 Sell Stock'}</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Ticker (e.g., AAPL)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Shares"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    step="0.01"
                    min="0.01"
                />
                <input
                    type="number"
                    placeholder="Price per share"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    step="0.01"
                    min="0.01"
                />
                <button type="submit" className={isBuy ? 'btn-buy' : 'btn-sell'}>
                    {isBuy ? 'Buy' : 'Sell'}
                </button>
            </form>
        </div>
    );
}

export default StockForm;
```

### Reusable by Design

Notice we pass `type` as a prop ("buy" or "sell") and the form adapts:
- Different title: "🟢 Buy Stock" vs "🔴 Sell Stock"
- Different API endpoint: `/stocks/buy` vs `/stocks/sell`
- Different button styling: green vs red

One component, two uses. This is the React way.

---

## 4. The Transaction History

Create **`week4_react/src/components/StockTransactions.jsx`**:

```jsx
// ============================================================================
// File: StockTransactions.jsx
// Description: Displays stock transaction history (buys, sells, dividends).
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../api';

function StockTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/stocks/transactions')
            .then(response => {
                setTransactions(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching stock transactions:', error);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="card">
            <h3>📋 Trade History</h3>
            {transactions.length > 0 ? (
                <table className="holdings-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Ticker</th>
                            <th>Shares</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id}>
                                <td>{tx.date}</td>
                                <td className={`type-${tx.type}`}>
                                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                </td>
                                <td className="ticker-cell">{tx.ticker}</td>
                                <td>{parseFloat(tx.shares).toFixed(2)}</td>
                                <td>${parseFloat(tx.price).toFixed(2)}</td>
                                <td>${parseFloat(tx.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="empty-state">
                    <p>📭 No stock transactions yet.</p>
                </div>
            )}
        </div>
    );
}

export default StockTransactions;
```

---

## 5. Updating the Navigation

### Navbar.jsx

Add a "Stocks" link. Open **`Navbar.jsx`** and add after the existing links:

```jsx
<Link to="/stocks">Stocks</Link>
```

### App.jsx

Import the new component and add the route:

```jsx
import StockPortfolio from './components/StockPortfolio';
```

Add inside the logged-in routes (inside the `<>` fragment, alongside the existing routes):

```jsx
<Route path="/stocks" element={<StockPortfolio showToast={showToast} />} />
```

---

## 6. Styling

Add these styles to **`App.css`**:

```css
/* ── Stock Portfolio ── */
.stocks-page {
    max-width: 1000px;
    margin: 0 auto;
}

.portfolio-header {
    margin-bottom: 1.5rem;
}

.portfolio-totals {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.total-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    flex: 1;
    text-align: center;
}

.total-card .total-label {
    display: block;
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
}

.total-card .total-amount {
    display: block;
    font-size: 1.4rem;
    font-weight: 700;
}

.total-card.gain .total-amount { color: #4ade80; }
.total-card.loss .total-amount { color: #f87171; }

/* Holdings table */
.holdings-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

.holdings-table th,
.holdings-table td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.holdings-table th {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
}

.ticker-cell {
    font-weight: 700;
    color: var(--accent);
}

.gain-text { color: #4ade80; }
.loss-text { color: #f87171; }

.type-buy { color: #4ade80; font-weight: 600; }
.type-sell { color: #f87171; font-weight: 600; }
.type-dividend { color: #60a5fa; font-weight: 600; }

/* Stock forms */
.stock-forms {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin: 1.5rem 0;
}

.stock-form-card form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.btn-buy {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease;
}

.btn-buy:hover { transform: scale(1.02); }

.btn-sell {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease;
}

.btn-sell:hover { transform: scale(1.02); }
```

---

## 7. Your Task

1. Create `StockPortfolio.jsx` with the holdings table, portfolio totals, and empty states.
2. Create `StockForm.jsx` — the reusable buy/sell form.
3. Create `StockTransactions.jsx` — the trade history table.
4. Update `Navbar.jsx` to add the "Stocks" link.
5. Update `App.jsx` to import `StockPortfolio` and add the `/stocks` route.
6. Add the stock portfolio CSS styles to `App.css`.
7. Test the full flow: navigate to Stocks → buy a stock → see it in holdings → sell shares → check P&L colors.

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **Reusable component (StockForm)** | One component handles both buy and sell via a `type` prop |
| **`toLocaleString()`** | Formats numbers with commas and fixed decimal places |
| **Color-coded P&L** | Green for gains (`gain-text`), red for losses (`loss-text`) |
| **Grid layout** | `grid-template-columns: 1fr 1fr` for side-by-side buy/sell forms |
| **Callback props** | `onComplete` prop triggers portfolio refresh after a trade |
| **Empty states** | Show helpful messages when there's no data yet |
