// ============================================================================
// File: App.jsx
// Description: Main frontend React component that sets up routing, handles state,
//              and structures the overall page layouts.
// ============================================================================
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './api';
import Navbar from './components/common/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import TransactionList from './components/transactions/TransactionList';
import TransactionForm from './components/transactions/TransactionForm';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import CsvUpload from './components/transactions/CsvUpload';
import BudgetOverview from './components/dashboard/BudgetOverview';
import StockPortfolio from './components/stocks/StockPortfolio';
import Toast from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

/**
 * Component: App
 * Description: The main application root component that initializes global state,
 *              coordinates page routing, manages authentication status, handles 
 *              outbound API syncs, and displays toasts.
 */
function App() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [toast, setToast] = useState(null);

    /**
     * Function: showToast
     * Description: Triggers a state update to show a floating alert notification.
     * Parameters:
     *   - message (String): Text to display inside the toast.
     *   - type (String): Toast style variant ('success', 'error', 'warning').
     * Passed to: Child components (Dashboard, TransactionForm, TransactionList, BudgetOverview)
     */
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    /**
     * Hook: useEffect (Initial Transaction Loader)
     * Description: Fires when login status changes. Fetches the initial list of 
     *              transactions if logged in, or resets state and loading if logged out.
     */
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
                } else {
                    showToast('Failed to load transactions.', 'error');
                }
                setLoading(false);
            });
    }, [isLoggedIn]);

    /**
     * Function: handleLogin
     * Description: Sets user authentication state to true (triggered on login form submission).
     * Passed to: LoginPage component
     */
    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    /**
     * Function: handleLogout
     * Description: Clears authentication tokens, resets state, and updates logged-out state.
     * Passed to: Navbar component (via onLogout prop)
     */
    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setTransactions([]);
    };

    /**
     * Function: handleTransactionAdded
     * Description: Dynamically appends a newly created transaction directly to 
     *              local state to prevent needing a full API page refresh.
     * Parameters:
     *   - newTransaction (Object): The database object returned by API.
     * Passed to: TransactionForm component (via onTransactionAdded prop)
     */
    const handleTransactionAdded = (newTransaction) => {
        setTransactions([...transactions, newTransaction]);
    };

    /**
     * Function: handleTransactionDeleted
     * Description: Removes a deleted transaction from local state dynamically.
     * Parameters:
     *   - id (Number): The database ID of the deleted transaction.
     * Passed to: TransactionList component (via onDelete prop)
     */
    const handleTransactionDeleted = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

    /**
     * Function: handleTransactionUpdated
     * Description: Updates an edited transaction inside local state dynamically.
     * Parameters:
     *   - updatedTransaction (Object): The updated transaction DB object.
     * Passed to: TransactionList component (via onUpdate prop)
     */
    const handleTransactionUpdated = (updatedTransaction) => {
        setTransactions(transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    };

    /**
     * Function: handleImportComplete
     * Description: Re-fetches the full transaction list after a CSV upload completes.
     * Passed to: CsvUpload component (via onImportComplete prop)
     */
    const handleImportComplete = () => {
        api.get('/transactions')
            .then(response => setTransactions(response.data))
            .catch(error => {
                console.error('Error fetching transactions after import:', error);
                showToast('Failed to sync transactions after import.', 'error');
            });
    };

    return (
        <Router>
            <div className="App">
                <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
                <main className="main-content">
                    <ErrorBoundary>
                        <Routes>
                            {isLoggedIn ? (
                                <>
                                    <Route path="/" element={<Dashboard transactions={transactions} showToast={showToast} />} />
                                    <Route path="/transactions" element={
                                        <div className="transactions-page">
                                            <div className="transactions-forms">
                                                <TransactionForm
                                                    onTransactionAdded={(tx) => {
                                                        handleTransactionAdded(tx);
                                                        showToast('Transaction added successfully!');
                                                    }}
                                                    showToast={showToast}
                                                />
                                                <CsvUpload onImportComplete={handleImportComplete} />
                                            </div>
                                            <TransactionList
                                                transactions={transactions}
                                                loading={loading}
                                                onDelete={(id) => {
                                                    handleTransactionDeleted(id);
                                                    showToast('Transaction deleted successfully!', 'warning');
                                                }}
                                                onUpdate={(updatedTx) => {
                                                    handleTransactionUpdated(updatedTx);
                                                    showToast('Category updated successfully!');
                                                }}
                                                showToast={showToast}
                                            />
                                        </div>
                                    } />
                                    <Route path="/budgets" element={<BudgetOverview transactions={transactions} showToast={showToast} />} />
                                    <Route path="/stocks" element={<StockPortfolio showToast={showToast} />} />
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
                    </ErrorBoundary>
                </main>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </Router>
    );
}

export default App;