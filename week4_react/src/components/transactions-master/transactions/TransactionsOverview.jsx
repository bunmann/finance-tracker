// ============================================================================
// File: TransactionsOverview.jsx
// Description: Parent container orchestrating transactions page data passing.
// ============================================================================
import React from 'react';
import TransactionsContent from './TransactionsContent';

/**
 * Component: TransactionsOverview
 * Description: Smart container wrapping transactions layout content.
 */
function TransactionsOverview({
    periodMode,
    onModeChange,
    month,
    onMonthChange,
    year,
    onYearChange,
    transactions,
    loading,
    onTransactionAdded,
    onTransactionDeleted,
    onTransactionUpdated,
    onTransactionImportComplete,
    showToast
}) {
    return (
        <TransactionsContent
            periodMode={periodMode}
            onModeChange={onModeChange}
            month={month}
            onMonthChange={onMonthChange}
            year={year}
            onYearChange={onYearChange}
            transactions={transactions}
            loading={loading}
            onTransactionAdded={onTransactionAdded}
            onTransactionDeleted={onTransactionDeleted}
            onTransactionUpdated={onTransactionUpdated}
            onTransactionImportComplete={onTransactionImportComplete}
            showToast={showToast}
        />
    );
}

export default TransactionsOverview;
