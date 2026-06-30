// ============================================================================
// File: AppContent.jsx
// Description: Nested high-level layout component that manages route transitions,
//              navigation layout frames, and floating notifications toast.
// ============================================================================
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/common/layout/Navbar';
import TransactionsMaster from './components/transactions-master/TransactionsMaster';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import StocksMaster from './components/stocks-master/StocksMaster';
import Toast from './components/common/feedback/Toast';
import ErrorBoundary from './components/common/feedback/ErrorBoundary';
import { pageTransition } from './utils/animations';

/**
 * Component: AppContent
 * Description: Renders the authenticated sidebar layout, main page routes wrapped 
 *              in AnimatePresence transitions, and notifications toast overlay.
 */
function AppContent({
    isLoggedIn,
    handleLogin,
    handleLogout,
    showToast,
    toast,
    setToast
}) {
    const location = useLocation();

    // Domain scoping prevents master containers from unmounting during sub-tab navigation
    const getDomainKey = (path) => {
        // Global Master domain
        if (path === '/') {
            return 'global-master';
        }
        // Cash Flow Master domain
        if (path.startsWith('/cashflow')) {
            return 'cashflow-master';
        }
        // Stocks Master domain (future-proofing)
        if (path.startsWith('/stocks') || path.startsWith('/screener')) {
            return 'stocks-master';
        }
        // Financial Statements Master domain (future-proofing)
        if (path.startsWith('/statements') || path.startsWith('/reports')) {
            return 'statements-master';
        }
        // Auth paths
        if (path.startsWith('/login') || path.startsWith('/signup')) {
            return 'auth-master';
        }
        return path;
    };

    return (
        <div className={`App ${!isLoggedIn ? 'logged-out' : ''}`}>
            <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            <main className="main-content">
                <ErrorBoundary>
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={getDomainKey(location.pathname)}>
                            {isLoggedIn ? (
                                <>
                                    <Route path="/" element={<Navigate to="/cashflow" replace />} />
                                    <Route path="/stocks/*" element={
                                        <StocksMaster showToast={showToast} />
                                    } />
                                    <Route path="/cashflow/*" element={
                                        <TransactionsMaster showToast={showToast} />
                                    } />
                                </>
                            ) : (
                                <>
                                    <Route path="/login" element={
                                        <motion.div {...pageTransition} className="auth-page-wrapper">
                                            <LoginPage onLogin={handleLogin} />
                                        </motion.div>
                                    } />
                                    <Route path="/signup" element={
                                        <motion.div {...pageTransition} className="auth-page-wrapper">
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
