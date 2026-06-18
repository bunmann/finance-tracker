// ============================================================================
// File: App.jsx
// Description: Main frontend React component that sets up routing, handles state,
//              and structures the overall page layouts.
// ============================================================================
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './api';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import CsvUpload from './components/CsvUpload';
import BudgetOverview from './components/BudgetOverview';
import './App.css';

function App() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    // Fetch transactions only when logged in
    useEffect(() => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }

        api.get('/transactions')
            .then(response => {
                setTransactions(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error:', error);
                // If we get a 401, token is invalid — log out
                if (error.response && error.response.status === 401) {
                    handleLogout();
                }
                setLoading(false);
            });
    }, [isLoggedIn]);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setTransactions([]);
    };

    const handleTransactionAdded = (newTransaction) => {
        setTransactions([...transactions, newTransaction]);
    };

    const handleTransactionDeleted = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

    const handleImportComplete = () => {
        api.get('/transactions')
            .then(response => setTransactions(response.data))
            .catch(error => console.error('Error fetching transactions after import:', error));
    };

    return (
        <Router>
            <div className="App">
                <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
                <main className="main-content">
                    <Routes>
                        {isLoggedIn ? (
                            <>
                                <Route path="/" element={<Dashboard transactions={transactions} />} />
                                <Route path="/transactions" element={
                                    <div className="transactions-page">
                                        <div className="transactions-forms">
                                            <TransactionForm onTransactionAdded={handleTransactionAdded} />
                                            <CsvUpload onImportComplete={handleImportComplete} />
                                        </div>
                                        <TransactionList
                                            transactions={transactions}
                                            loading={loading}
                                            onDelete={handleTransactionDeleted}
                                        />
                                    </div>
                                } />
                                <Route path="/budgets" element={<BudgetOverview />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </>
                        ) : (
                            <>
                                <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                                <Route path="/signup" element={<SignupPage />} />
                                <Route path="*" element={<Navigate to="/login" />} />
                            </>
                        )}
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;