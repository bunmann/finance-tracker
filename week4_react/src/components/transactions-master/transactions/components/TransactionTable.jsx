// ============================================================================
// File: TransactionTable.jsx
// Description: Reusable table component for rendering transactions in full or mini views.
//              Leverages GenericTable to handle sorting and base table shell markup.
// ============================================================================
import api from '../../../../api';
import GenericTable from '../../../common/data-display/GenericTable';

/**
 * Component: TransactionTable
 * Description: Renders a paginated, sortable list of transactions by wrapping GenericTable.
 * Props:
 *   - transactions (Array): Filtered transactions to display.
 *   - hiddenColumns (Array): List of column keys to omit (e.g., ['category', 'type', 'actions']).
 *   - defaultPageSize (Number): Initial rows per page (default: 10).
 *   - pageSizeOptions (Array): Available rows per page options.
 *   - categories (Array): List of category options for the edit dropdown.
 *   - onDelete (Function): Callback function triggered when a transaction is deleted.
 *   - onCategoryChange (Function): Callback function triggered when a category is updated.
 *   - showToast (Function): Callback function to trigger UI notifications.
 */
function TransactionTable({
    transactions,
    hiddenColumns = [],
    defaultPageSize = 10,
    pageSizeOptions = [10, 25, 50, 'All'],
    categories = [],
    onDelete,
    onCategoryChange,
    showToast
}) {
    /**
     * Function: handleDelete
     * Description: Sends an API delete request and triggers the parent onDelete callback.
     */
    const handleDelete = (id) => {
        api.delete(`/transactions/${id}`)
            .then(() => onDelete?.(id))
            .catch(error => {
                console.error('Error deleting:', error);
                showToast?.('Failed to delete transaction.', 'error');
            });
    };

    /**
     * Function: handleCategoryChange
     * Description: Sends an API PUT request to update category and triggers onCategoryChange.
     */
    const handleCategoryChange = (transactionId, newCategoryId) => {
        api.put(`/transactions/${transactionId}?category_id=${newCategoryId}`)
            .then(response => {
                onCategoryChange?.(response.data);
            })
            .catch(error => {
                console.error('Error updating category:', error);
                showToast?.('Failed to update category.', 'error');
            });
    };

    if (transactions.length === 0) {
        return (
            <p className="no-transactions-text">
                No transactions logged for this period.
            </p>
        );
    }

    const allColumns = [
        { label: 'Date', key: 'date' },
        { label: 'Description', key: 'description' },
        { label: 'Category', key: 'category' },
        { label: 'Type', key: 'type' },
        { label: 'Amount', key: 'amount', align: hiddenColumns.includes('actions') ? 'right' : 'left' },
        { label: 'Actions', key: 'actions' }
    ];

    return (
        <GenericTable
            data={transactions}
            columns={allColumns}
            hiddenColumns={hiddenColumns}
            categories={categories}
            defaultSort={{ key: 'date', direction: 'asc' }}
            paginated={true}
            defaultPageSize={defaultPageSize}
            pageSizeOptions={pageSizeOptions}
            renderRow={(t) => (
                <>
                    <td>{t.date}</td>
                    <td style={{ fontWeight: '500' }}>{t.description}</td>
                    <td>
                        {t.type === 'expense' ? (
                            <select
                                value={t.category_id || ''}
                                onChange={(e) => handleCategoryChange(t.id, parseInt(e.target.value))}
                                className="category-select"
                            >
                                {!t.category_id && <option value="">Select Category</option>}
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="income-category-label">Income</span>
                        )}
                    </td>
                    <td>
                        <span className={`chip ${t.type === 'income' ? 'chip-gain' : 'chip-loss'}`}>
                            {t.type}
                        </span>
                    </td>
                    <td className={`amount-cell ${t.type === 'income' ? 'amount-gain' : 'amount-loss'}`} style={{ textAlign: hiddenColumns.includes('actions') ? 'right' : 'left' }}>
                        {t.type === 'income' ? '+' : '-'}${Number(Math.abs(t.amount)).toFixed(2)}
                    </td>
                    <td>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'none', border: '1px solid var(--secondary-container)', color: 'var(--secondary)' }}
                            onClick={() => handleDelete(t.id)}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>delete</span>
                            Delete
                        </button>
                    </td>
                </>
            )}
        />
    );
}

export default TransactionTable;
