// ============================================================================
// File: TransactionsContent.jsx
// Description: Presenter component that renders the transactions forms, CSV upload,
//              and transaction history list.
// ============================================================================
import React from 'react';
import TransactionForm from './components/TransactionForm';
import TransactionCsvUpload from './components/TransactionCsvUpload';
import TransactionList from './components/TransactionList';
import PeriodSelector from '../../common/inputs/PeriodSelector';
import CollapsibleFormSection from '../../common/layout/CollapsibleFormSection';
import '../../../styles/Transactions.css';
import { CURRENCY } from '../../../utils/config';

/**
 * Component: TransactionsContent
 * Description: Dumb presenter component layout for transactions with synchronized period filtering.
 */
function TransactionsContent({
    periodMode = 'month',
    onModeChange,
    month = new Date().getMonth() + 1,
    onMonthChange,
    year = new Date().getFullYear(),
    onYearChange,
    transactions,
    loading,
    onTransactionAdded,
    onTransactionDeleted,
    onTransactionUpdated,
    onTransactionImportComplete,
    showToast
}) {
    // Filter transactions by selected period scope
    const filteredTransactions = (transactions || []).filter(t => {
        if (periodMode === 'all') return true;
        if (!t.date) return false;
        const [tYear, tMonth] = t.date.split('-');
        if (periodMode === 'year') {
            return parseInt(tYear) === year;
        }
        return parseInt(tYear) === year && parseInt(tMonth) === month;
    });

    return (
        <div className="transactions-page page-container">
            <div className="dashboard-header">
                <h2 className="dashboard-title">Transaction Overview ({CURRENCY})</h2>
                <div className="dashboard-controls">
                    <PeriodSelector
                        mode={periodMode}
                        month={month}
                        year={year}
                        onModeChange={onModeChange}
                        onPeriodChange={(m, y) => {
                            if (m !== undefined) onMonthChange?.(m);
                            if (y !== undefined) onYearChange?.(y);
                        }}
                    />
                </div>
            </div>
            <CollapsibleFormSection
                title="Add or Import Transactions"
                activeTitle="Hide Add & Import Tools"
                icon="add_card"
                activeIcon="remove_circle"
                defaultOpen={false}
            >
                <div className="transactions-forms">
                    <TransactionForm
                        onTransactionAdded={(tx) => {
                            onTransactionAdded(tx);
                            showToast('Transaction added successfully!');
                        }}
                        showToast={showToast}
                    />
                    <TransactionCsvUpload onTransactionImportComplete={onTransactionImportComplete} />
                </div>
            </CollapsibleFormSection>
            <TransactionList
                transactions={filteredTransactions}
                loading={loading}
                onDelete={(id) => {
                    onTransactionDeleted(id);
                    showToast('Transaction deleted successfully!', 'warning');
                }}
                onUpdate={(updatedTx) => {
                    onTransactionUpdated(updatedTx);
                    showToast('Category updated successfully!');
                }}
                showToast={showToast}
            />
        </div>
    );
}

export default TransactionsContent;
