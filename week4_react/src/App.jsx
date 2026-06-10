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