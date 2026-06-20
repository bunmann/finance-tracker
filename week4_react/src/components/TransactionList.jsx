// ============================================================================
// File: TransactionList.jsx
// Description: Displays a tabular record of transactions and handles deletions.
// ============================================================================
import api from '../api';

function TransactionList({ transactions, loading, onDelete, showToast }) {
    const handleDelete = (id) => {
        api.delete(`/transactions/${id}`)
            .then(() => onDelete(id))
            .catch(error => {
                console.error('Error deleting:', error);
                showToast?.('Failed to delete transaction.', 'error');
            });
    };

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