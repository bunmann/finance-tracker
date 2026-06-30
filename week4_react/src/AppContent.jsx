// ============================================================================
// File: AppContent.jsx
// Description: Nested high-level layout component that manages route transitions,
//              navigation layout frames, and floating notifications toast.
// ============================================================================
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/common/layout/Navbar';
import DashboardOverview from './components/dashboard/DashboardOverview';
import TransactionsOverview from './components/transactions/TransactionsOverview';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import BudgetOverview from './components/budgets/BudgetOverview';
import PortfolioOverview from './components/stocks/PortfolioOverview';
import ScreenerOverview from './components/screener/ScreenerOverview';
import Toast from './components/common/feedback/Toast';
import ErrorBoundary from './components/common/feedback/ErrorBoundary';
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
                                            <DashboardOverview transactions={transactions} showToast={showToast} />
                                        </motion.div>
                                    } />
                                    <Route path="/transactions" element={
                                        <motion.div {...pageTransition}>
                                            <TransactionsOverview
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
                                            <PortfolioOverview showToast={showToast} />
                                        </motion.div>
                                    } />
                                    <Route path="/screener" element={
                                        <motion.div {...pageTransition}>
                                            <ScreenerOverview showToast={showToast} />
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
