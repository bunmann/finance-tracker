// ============================================================================
// File: App.jsx
// Description: Main frontend React component that sets up routing, handles state,
//              and structures the overall page layouts.
// ============================================================================
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import api from './api';
import Navbar from './components/common/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import TransactionsPage from './components/transactions/TransactionsPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
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
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

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
     * Hook: useEffect (Global 401 Interceptor)
     * Description: Mounts a global Axios response interceptor to detect 401 Unauthorized
     *              responses (e.g. expired tokens) and trigger automatic logout.
     */
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    handleLogout();
                }
                return Promise.reject(error);
            }
        );
        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

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
     * Function: handleTransactionImportComplete
     * Description: Re-fetches the full transaction list after a CSV upload completes.
     * Passed to: TransactionsPage component (via onTransactionImportComplete prop)
     */
    const handleTransactionImportComplete = () => {
        api.get('/transactions')
            .then(response => setTransactions(response.data))
            .catch(error => {
                console.error('Error fetching transactions after import:', error);
                showToast('Failed to sync transactions after import.', 'error');
            });
    };

    return (
        <Router>
            <div className={`App ${!isLoggedIn ? 'logged-out' : ''}`}>
                <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
                <main className="main-content">
                    <ErrorBoundary>
                        <Routes>
                            {isLoggedIn ? (
                                <>
                                    <Route path="/" element={<Dashboard transactions={transactions} showToast={showToast} />} />
                                    <Route path="/transactions" element={
                                        <TransactionsPage
                                            transactions={transactions}
                                            loading={loading}
                                            onTransactionAdded={handleTransactionAdded}
                                            onTransactionDeleted={handleTransactionDeleted}
                                            onTransactionUpdated={handleTransactionUpdated}
                                            onTransactionImportComplete={handleTransactionImportComplete}
                                            showToast={showToast}
                                        />
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
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </Router>
    );
}

export default App;