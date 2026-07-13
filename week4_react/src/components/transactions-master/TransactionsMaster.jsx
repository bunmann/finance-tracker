// ============================================================================
// File: TransactionsMaster.jsx
// Description: Smart container managing global transactions array and period
//              filtering state for Dashboard, Transactions, and Budgets.
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import DashboardOverview from './dashboard/DashboardOverview';
import TransactionsOverview from './transactions/TransactionsOverview';
import BudgetOverview from './budgets/BudgetOverview';

const pageTransition = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.25, ease: 'easeInOut' }
};

/**
 * Component: TransactionsMaster
 * Description: Encapsulates cash flow state (transactions list, loading, and period filters)
 *              and routes between Dashboard, Transactions, and Budgets overviews.
 * Props:
 *   - showToast (Function): Toast notification callback from App.
 */
function TransactionsMaster({ showToast }) {
    const today = new Date();
    const [periodMode, setPeriodMode] = useState('month');
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Fetch transactions list on mount
    useEffect(() => {
        setLoading(true);
        api.get('/transactions?limit=5000')
            .then(response => {
                setTransactions(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching transactions:', error);
                showToast?.('Failed to load transaction history.', 'error');
                setLoading(false);
            });
    }, [showToast]);

    const handleTransactionAdded = (newTx) => {
        setTransactions(prev => [newTx, ...prev]);
    };

    const handleTransactionDeleted = (id) => {
        setTransactions(prev => prev.filter(tx => tx.id !== id));
    };

    const handleTransactionUpdated = (updatedTx) => {
        setTransactions(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
    };

    const handleTransactionImportComplete = () => {
        api.get('/transactions?limit=5000')
            .then(response => setTransactions(response.data))
            .catch(error => {
                console.error('Error fetching transactions after import:', error);
                showToast?.('Failed to sync transactions after import.', 'error');
            });
    };

    return (
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                    <motion.div {...pageTransition}>
                        <DashboardOverview
                            periodMode={periodMode}
                            onModeChange={setPeriodMode}
                            month={month}
                            onMonthChange={setMonth}
                            year={year}
                            onYearChange={setYear}
                            transactions={transactions}
                            showToast={showToast}
                        />
                    </motion.div>
                } />
                <Route path="/transactions" element={
                    <motion.div {...pageTransition}>
                        <TransactionsOverview
                            periodMode={periodMode}
                            onModeChange={setPeriodMode}
                            month={month}
                            onMonthChange={setMonth}
                            year={year}
                            onYearChange={setYear}
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
                        <BudgetOverview
                            periodMode={periodMode}
                            onModeChange={setPeriodMode}
                            month={month}
                            onMonthChange={setMonth}
                            year={year}
                            onYearChange={setYear}
                            transactions={transactions}
                            showToast={showToast}
                        />
                    </motion.div>
                } />
            </Routes>
        </AnimatePresence>
    );
}

export default TransactionsMaster;
