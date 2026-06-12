import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './api';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import './App.css';

function App() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/transactions')
            .then(response => {
                setTransactions(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error:', error);
                setLoading(false);
            });
    }, []);

    const handleTransactionAdded = (newTransaction) => {
        setTransactions([...transactions, newTransaction]);
    };

    const handleTransactionDeleted = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

    return (
        <Router>
            <div className="App">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard transactions={transactions} />} />
                        <Route path="/transactions" element={
                            <div>
                                <TransactionForm onTransactionAdded={handleTransactionAdded} />
                                <TransactionList
                                    transactions={transactions}
                                    loading={loading}
                                    onDelete={handleTransactionDeleted}
                                />
                            </div>
                        } />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;