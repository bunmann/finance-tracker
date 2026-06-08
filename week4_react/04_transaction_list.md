# Week 4 — Lesson 4: Transaction List Page

Now that your React frontend is connected to your FastAPI backend, let's build the first real page — a **transaction list** that fetches data from your API and displays it in a table.

---

## 1. Planning the Component

We need a component that:
1. **Fetches** all transactions from `GET /transactions` when it loads.
2. **Stores** the transactions in state.
3. **Displays** them in a clean table.
4. **Handles** empty states (no transactions yet).

---

## 2. Creating the Component File

Create a new folder and file: **`src/components/TransactionList.jsx`**

```jsx
import { useState, useEffect } from 'react';
import api from '../api';

function TransactionList() {
    // State: holds the list of transactions
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch transactions from the API when the component loads
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

    // Show loading message while waiting for API response
    if (loading) {
        return <p>Loading transactions...</p>;
    }

    // Show message if no transactions exist
    if (transactions.length === 0) {
        return <p>No transactions yet. Add one!</p>;
    }

    // Render the table
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

## 3. Breaking Down the New Concepts

### `.map()` — Looping in JSX

In React, you **cannot** use a `for` loop inside JSX. Instead, you use JavaScript's `.map()` method to transform an array of data into an array of JSX elements:

```jsx
{transactions.map(transaction => (
    <tr key={transaction.id}>
        <td>{transaction.description}</td>
    </tr>
))}
```

**How it works:**
- `transactions` is an array like `[{id: 1, description: "Pizza"}, {id: 2, description: "Rent"}]`
- `.map()` loops through each item, runs the arrow function, and returns a new array of `<tr>` elements.
- It's like Python's list comprehension: `[f(item) for item in list]`

### The `key` Prop

React requires a **unique `key`** on each element in a list. This helps React efficiently update the DOM when items change (add, remove, reorder).

```jsx
<tr key={transaction.id}>  {/* Use a unique identifier like the DB id */}
```

> **Never use the array index as a key** if items can be reordered or deleted — it causes rendering bugs.

### Conditional Rendering

We use early returns to handle different states:

```jsx
if (loading) return <p>Loading...</p>;       // Show while fetching
if (transactions.length === 0) return <p>No data</p>;  // Show if empty
return <table>...</table>;                    // Show when data is ready
```

This is equivalent to guard clauses in Python/C++ — handle edge cases first, then proceed with the main logic.

---

## 4. Using the Component in App.jsx

Now, import and use `TransactionList` in your main app:

Update **`src/App.jsx`**:

```jsx
import TransactionList from './components/TransactionList';
import './App.css';

function App() {
    return (
        <div className="App">
            <h1>Finance Tracker</h1>
            <TransactionList />
        </div>
    );
}

export default App;
```

---

## 5. Your Task

1. Create the folder `src/components/`.
2. Create `src/components/TransactionList.jsx` with the code above.
3. Update `src/App.jsx` to import and render `TransactionList`.
4. Make sure both servers are running (FastAPI + Vite).
5. Open `http://localhost:5173` in your browser.

You should see your transactions from the database displayed in a table! If there are no transactions yet, you should see the "No transactions yet" message.

> **Tip:** You can use the Swagger UI (`http://localhost:8000/docs`) to add a few test transactions first, then refresh your React page to see them appear.

---

## 6. Adding a Delete Button

Let's add a delete button to each row so users can remove transactions directly from the UI:

Update the table body in `TransactionList.jsx`:

```jsx
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
```

And add the `handleDelete` function inside the component (above the `return`):

```jsx
const handleDelete = (id) => {
    api.delete(`/transactions/${id}`)
        .then(() => {
            // Remove the deleted transaction from state (no need to refetch)
            setTransactions(transactions.filter(t => t.id !== id));
        })
        .catch(error => console.error('Error deleting transaction:', error));
};
```

### How this works:
1. When the user clicks "Delete", `handleDelete` is called with that transaction's `id`.
2. It sends a `DELETE /transactions/{id}` request to your FastAPI backend.
3. On success, it **filters out** the deleted transaction from the current state array.
4. React sees the state changed → re-renders the table → the row disappears instantly.

> **Note:** We don't need to call `api.get('/transactions')` again to refresh the list. By updating the state directly, React re-renders immediately without an extra network request. This makes the UI feel fast and responsive.
