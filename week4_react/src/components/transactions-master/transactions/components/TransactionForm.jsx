// ============================================================================
// File: TransactionForm.jsx
// Description: Renders the input form for recording new transactions.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../../../../api';
import NonNegativeInput from '../../../common/inputs/NonNegativeInput';
import { sortCategories } from '../../../../utils/helpers';
import { CURRENCY } from '../../../../utils/config';

/**
 * Component: TransactionForm
 * Description: Renders an input form allowing users to manually create new transactions.
 * Props:
 *   - onTransactionAdded (Function): Parent callback handler triggered after a transaction is successfully created.
 *   - showToast (Function): Global toast callback to display alerts/success messages.
 */
function TransactionForm({ onTransactionAdded, showToast }) {
    // Form state — each input field gets its own state variable
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('expense');
    const [date, setDate] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');

    /**
     * Hook: useEffect (Categories Loader)
     * Description: Fetches all category definitions on page mount to populate the
     *              category selection dropdown options.
     */
    useEffect(() => {
        api.get('/categories')
            .then(response => setCategories(sortCategories(response.data)))
            .catch(err => {
                console.error('Error fetching categories:', err);
                showToast?.('Failed to load categories.', 'error');
            });
    }, [showToast]);

    /**
     * Function: handleSubmit
     * Description: Triggered upon form submission. Formats state values, validates inputs,
     *              submits an API POST request to save the transaction, resets the form
     *              state, and updates the parent component state.
     * Parameters:
     *   - e (Event): Standard submit event.
     */
    const handleSubmit = (e) => {
        e.preventDefault();  // Prevent the browser from refreshing the page
        setError('');  // Clear any previous error

        // Build the request body matching our Pydantic schema
        const rawAmount = parseFloat(amount);
        const sanitizedAmount = !isNaN(rawAmount) ? Math.abs(rawAmount) : 0;

        const transactionData = {
            amount: sanitizedAmount,
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
                onTransactionAdded?.(response.data);
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
        <form onSubmit={handleSubmit} noValidate>
            <h2>Add Transaction</h2>
            {error && <p className="form-error">{error}</p>}
            
            <div className="form-grid">
                <div className="form-group">
                    <label>Amount ({CURRENCY})</label>
                    <NonNegativeInput
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        placeholder="0.00"
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        placeholder="e.g. Grocery Store"
                    />
                </div>

                <div className="form-grid-two-col">
                    <div className="form-group">
                        <label>Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Category</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">-- None --</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button type="submit" className="btn btn-primary form-submit-full">
                <span className="material-symbols-outlined">add_card</span>
                Add Transaction
            </button>
        </form>
    );
}

export default TransactionForm;