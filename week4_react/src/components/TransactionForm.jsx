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
                    const detail = err.response.data.detail;
                    if (typeof detail === 'string') {
                        setError(detail);
                    } else if (Array.isArray(detail)) {
                        const msg = detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
                        setError(msg);
                    } else {
                        setError(JSON.stringify(detail));
                    }
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