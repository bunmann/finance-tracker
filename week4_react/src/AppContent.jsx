// ============================================================================
// File: AppContent.jsx
// Description: Nested high-level layout component that manages route transitions,
//              navigation layout frames, and floating notifications toast.
// ============================================================================
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/common/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import TransactionsPage from './components/transactions/TransactionsPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import BudgetOverview from './components/dashboard/BudgetOverview';
import StockPortfolio from './components/stocks/StockPortfolio';
import Toast from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import { pageTransition } from './utils/animations';

/**
 * Component: AppContent
 * Description: Renders the authenticated sidebar layout, main page routes wrapped 
 *              in AnimatePresence transitions, and notifications toast overlay.
 */
function AppContent({
    transactions,
    loading,
    isLoggedIn,
    handleLogin,
    handleLogout,
    handleTransactionAdded,
    handleTransactionDeleted,
    handleTransactionUpdated,
    handleTransactionImportComplete,
    showToast,
    toast,
    setToast
}) {
    const location = useLocation();

    return (
        <div className={`App ${!isLoggedIn ? 'logged-out' : ''}`}>
            <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            <main className="main-content">
                <ErrorBoundary>
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            {isLoggedIn ? (
                                <>
                                    <Route path="/" element={
                                        <motion.div {...pageTransition}>
                                            <Dashboard transactions={transactions} showToast={showToast} />
                                        </motion.div>
                                    } />
                                    <Route path="/transactions" element={
                                        <motion.div {...pageTransition}>
                                            <TransactionsPage
                                                transactions={transactions}
                                                loading={loading}
                                                onTransactionAdded={handleTransactionAdded}
                                                onTransactionDeleted={handleTransactionDeleted}
                                                onTransactionUpdated={handleTransactionUpdated}
                                                onTransactionImportComplete={handleTransactionImportComplete}
                                                showToast={showToast}
                                            />
                                        </motion.div>
                                    } />
                                    <Route path="/budgets" element={
                                        <motion.div {...pageTransition}>
                                            <BudgetOverview transactions={transactions} showToast={showToast} />
                                        </motion.div>
                                    } />
                                    <Route path="/stocks" element={
                                        <motion.div {...pageTransition}>
                                            <StockPortfolio showToast={showToast} />
                                        </motion.div>
                                    } />
                                    <Route path="*" element={<Navigate to="/" />} />
                                </>
                            ) : (
                                <>
                                    <Route path="/login" element={
                                        <motion.div {...pageTransition}>
                                            <LoginPage onLogin={handleLogin} />
                                        </motion.div>
                                    } />
                                    <Route path="/signup" element={
                                        <motion.div {...pageTransition}>
                                            <SignupPage />
                                        </motion.div>
                                    } />
                                    <Route path="*" element={<Navigate to="/login" />} />
                                </>
                            )}
                        </Routes>
                    </AnimatePresence>
                </ErrorBoundary>
            </main>
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default AppContent;
