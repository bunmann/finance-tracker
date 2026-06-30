// ============================================================================
// File: TransactionsContent.jsx
// Description: Presenter component that renders the transactions forms, CSV upload,
//              and transaction history list.
// ============================================================================
import React from 'react';
import TransactionForm from './TransactionForm';
import TransactionCsvUpload from './TransactionCsvUpload';
import TransactionList from './TransactionList';
import '../../styles/Transactions.css';
import { CURRENCY } from '../../utils/config';

/**
 * Component: TransactionsContent
 * Description: Dumb presenter component layout for transactions.
 */
function TransactionsContent({
    transactions,
    loading,
    onTransactionAdded,
    onTransactionDeleted,
    onTransactionUpdated,
    onTransactionImportComplete,
    showToast
}) {
    return (
        <div className="transactions-page page-container">
            <div className="dashboard-header">
                <h2 className="dashboard-title">Transaction Overview ({CURRENCY})</h2>
            </div>
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
            <TransactionList
                transactions={transactions}
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
