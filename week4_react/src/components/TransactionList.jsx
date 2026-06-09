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

    // Deleting row Function
    const handleDelete = (id) => {
    api.delete(`/transactions/${id}`)
        .then(() => {
            // Remove the deleted transaction from state (no need to refetch)
            setTransactions(transactions.filter(t => t.id !== id));
        })
        .catch(error => console.error('Error deleting transaction:', error));
    };

    
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