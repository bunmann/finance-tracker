// ============================================================================
// File: TransactionList.jsx
// Description: Displays a tabular record of transactions and handles deletions.
// ============================================================================
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