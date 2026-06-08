# Week 4 — Lesson 5: Add Transaction Form

Your transaction list can display and delete data. Now let's build a **form** that lets users **create new transactions** by sending a `POST` request to your FastAPI backend.

---

## 1. How Forms Work in React

In React, forms are **controlled** — meaning the form's input values are stored in state, and the state is the "single source of truth."

The flow looks like this:
```
User types in input  →  onChange fires  →  State updates  →  React re-renders input with new value
```

This is different from plain HTML forms where the browser manages input values internally. In React, **you** manage them with `useState`.

---

## 2. Creating the Form Component

Create a new file: **`src/components/TransactionForm.jsx`**

```jsx
import { useState, useEffect } from 'react';
import api from '../api';

function TransactionForm({ onTransactionAdded }) {
    // Form state — each input field gets its own state variable
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('expense');
    const [date, setDate] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');

    // Fetch categories from API on load (for the dropdown)
    useEffect(() => {
        api.get('/categories')
            .then(response => setCategories(response.data))
            .catch(err => console.error('Error fetching categories:', err));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();  // Prevent the browser from refreshing the page
        setError('');  // Clear any previous error

        // Build the request body matching our Pydantic schema
        const transactionData = {
            amount: parseFloat(amount),
            description: description,
            type: type,
            date: date || null,
            category_id: categoryId ? parseInt(categoryId) : null,
        };

        // Send POST request to the API
        api.post('/transactions', transactionData)
            .then(response => {
                // Clear the form
                setAmount('');
                setDescription('');
                setType('expense');
                setDate('');
                setCategoryId('');
                // Notify the parent component that a new transaction was added
                if (onTransactionAdded) {
                    onTransactionAdded(response.data);
                }
            })
            .catch(err => {
                // Display the error message from the API
                if (err.response && err.response.data && err.response.data.detail) {
                    setError(err.response.data.detail);
                } else {
                    setError('Failed to create transaction.');
                }
            });
    };

    return (
        <div>
            <h2>Add Transaction</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Amount: </label>
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Description: </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Type: </label>
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                </div>

                <div>
                    <label>Date: </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div>
                    <label>Category: </label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">-- None --</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <button type="submit">Add Transaction</button>
            </form>
        </div>
    );
}

export default TransactionForm;
```

---

## 3. Breaking Down the New Concepts

### `e.preventDefault()` — Stopping the Page Refresh

By default, when you submit an HTML form, the browser refreshes the entire page (old-school web behavior). We don't want that — we want React to handle the submission via JavaScript. `e.preventDefault()` stops the browser's default behavior.

### `onChange` — Updating State on Every Keystroke

Every input has an `onChange` handler:
```jsx
<input value={amount} onChange={(e) => setAmount(e.target.value)} />
```

- `e` is the **event object** (like an event in C++ GUI programming).
- `e.target` is the HTML input element.
- `e.target.value` is the current text the user has typed.
- We call `setAmount(...)` to update state, which triggers React to re-render with the new value.

### `onTransactionAdded` — Child-to-Parent Communication

Remember, **props flow DOWN** (parent → child). But sometimes the child needs to tell the parent "something happened." We do this by passing a **callback function** as a prop:

```
Parent (App.jsx)                    Child (TransactionForm.jsx)
    │                                      │
    │  passes function as prop             │
    │  onTransactionAdded={fn}  ─────►     │
    │                                      │
    │  ◄────── calls onTransactionAdded()  │
    │          when form submits           │
```

---

## 4. Wiring It All Together in App.jsx

Update **`src/App.jsx`** to include the form and connect it to the transaction list:

```jsx
import { useState, useEffect } from 'react';
import api from './api';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import './App.css';

function App() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch transactions when App loads
    useEffect(() => {
        api.get('/transactions')
            .then(response => {
                setTransactions(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching transactions:', error);
                setLoading(false);
            });
    }, []);

    // Called when a new transaction is created via the form
    const handleTransactionAdded = (newTransaction) => {
        setTransactions([...transactions, newTransaction]);
    };

    // Called when a transaction is deleted
    const handleTransactionDeleted = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

    return (
        <div className="App">
            <h1>Finance Tracker</h1>
            <TransactionForm onTransactionAdded={handleTransactionAdded} />
            <TransactionList
                transactions={transactions}
                loading={loading}
                onDelete={handleTransactionDeleted}
            />
        </div>
    );
}

export default App;
```

### What changed:
- **State was "lifted up"** — `transactions` now lives in `App.jsx` instead of `TransactionList.jsx`. This is because **both** `TransactionForm` and `TransactionList` need access to the same list.
- **`handleTransactionAdded`** — Adds the new transaction to the state array using the spread operator `[...transactions, newTransaction]` (creates a new array with the old items plus the new one).
- **`handleTransactionDeleted`** — Removes the transaction from state.

---

## 5. Updating TransactionList to Accept Props

Since we lifted the state up to `App.jsx`, `TransactionList` no longer fetches its own data. Update it to receive `transactions`, `loading`, and `onDelete` as props:

Update **`src/components/TransactionList.jsx`**:

```jsx
import api from '../api';

function TransactionList({ transactions, loading, onDelete }) {
    const handleDelete = (id) => {
        api.delete(`/transactions/${id}`)
            .then(() => onDelete(id))
            .catch(error => console.error('Error deleting:', error));
    };

    if (loading) return <p>Loading transactions...</p>;
    if (transactions.length === 0) return <p>No transactions yet. Add one!</p>;

    return (
        <div>
            <h2>Transactions</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(transaction => (
                        <tr key={transaction.id}>
                            <td>{transaction.id}</td>
                            <td>{transaction.date}</td>
                            <td>{transaction.description}</td>
                            <td>{transaction.type}</td>
                            <td>${Number(transaction.amount).toFixed(2)}</td>
                            <td>
                                <button onClick={() => handleDelete(transaction.id)}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TransactionList;
```

---

## 6. State Lifting — Why Did We Move State Up?

This is a key React pattern called **"lifting state up"**:

**Before (Lesson 4):** `TransactionList` fetched and managed its own data. This worked fine when it was the only component.

**Problem:** When we added `TransactionForm`, the form needs to tell the list "hey, I added a new transaction — update yourself!" But sibling components can't talk to each other directly.

**Solution:** Move the shared state to the **nearest common parent** (`App.jsx`), and pass it down to both children as props:

```
        App.jsx (owns transactions state)
       /                                \
TransactionForm                   TransactionList
(calls onTransactionAdded)        (reads transactions prop)
```

---

## 7. Your Task

1. Create `src/components/TransactionForm.jsx` with the form code.
2. Update `src/App.jsx` to include both components with lifted state.
3. Update `src/components/TransactionList.jsx` to accept props instead of fetching its own data.
4. Test it:
   - Fill out the form and click "Add Transaction."
   - The new transaction should appear in the table **instantly** (without refreshing the page).
   - Click "Delete" on a transaction — it should disappear instantly.
   - Refresh the page — the data should persist (it's saved in PostgreSQL!).
