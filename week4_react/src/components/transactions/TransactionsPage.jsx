import TransactionForm from './TransactionForm';
import TransactionCsvUpload from './TransactionCsvUpload';
import TransactionList from './TransactionList';

/**
 * Component: TransactionsPage
 * Description: Orchestrates the transaction forms, CSV upload component, and transaction list
 *              into a single unified transactions page view.
 * Props:
 *   - transactions (Array): List of transaction objects.
 *   - loading (Boolean): Fetch status indicator.
 *   - onTransactionAdded (Function): Callback for adding a transaction.
 *   - onTransactionDeleted (Function): Callback for deleting a transaction.
 *   - onTransactionUpdated (Function): Callback for updating a transaction's category.
 *   - onTransactionImportComplete (Function): Callback for successful CSV imports.
 *   - showToast (Function): Toast message trigger callback.
 */
function TransactionsPage({ 
    transactions, 
    loading, 
    onTransactionAdded, 
    onTransactionDeleted, 
    onTransactionUpdated, 
    onTransactionImportComplete, 
    showToast 
}) {
    return (
        <div className="transactions-page">
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

export default TransactionsPage;
