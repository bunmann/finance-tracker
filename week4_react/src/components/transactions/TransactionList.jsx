// ============================================================================
// File: TransactionList.jsx
// Description: Displays a tabular record of transactions and handles deletions.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../../api';
import TransactionTable from './TransactionTable';

/**
 * Component: TransactionList
 * Description: Renders a list of user transactions using the TransactionTable component.
 * Props:
 *   - transactions (Array): List of loaded transactions to display.
 *   - loading (Boolean): Loading indicator state.
 *   - onDelete (Function): Parent callback handler triggered after a transaction is deleted.
 *   - onUpdate (Function): Parent callback handler triggered after a transaction is updated.
 *   - showToast (Function): Global toast callback to display alerts/success messages.
 */
function TransactionList({ transactions, loading, onDelete, onUpdate, showToast }) {
    const [categories, setCategories] = useState([]);

    /**
     * Hook: useEffect (Categories Loader)
     * Description: Fetches all category definitions on page mount to populate the
     *              category selection dropdown options in the table.
     */
    useEffect(() => {
        api.get('/categories')
            .then(response => setCategories(response.data))
            .catch(err => {
                console.error('Error fetching categories in TransactionList:', err);
            });
    }, []);

    if (loading) return (
        <div className="spinner-container">
            <div className="spinner"></div>
        </div>
    );

    if (transactions.length === 0) return (
        <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No transactions yet</h3>
            <p>Add your first transaction using the form above, or import a CSV file.</p>
        </div>
    );

    return (
        <div>
            <h2>Transactions</h2>
            <TransactionTable
                transactions={transactions}
                categories={categories}
                onDelete={onDelete}
                onCategoryChange={onUpdate}
                showToast={showToast}
            />
        </div>
    );
}

export default TransactionList;