// ============================================================================
// File: TransactionTable.jsx
// Description: Reusable table component for rendering transactions in full or mini views.
//              Leverages GenericTable to handle sorting and base table shell markup.
// ============================================================================
import api from '../../api';
import GenericTable from '../common/GenericTable';

/**
 * Component: TransactionTable
 * Description: Renders a list of transactions in either a detailed (full) table
 *              or a simplified (mini) table by wrapping GenericTable.
 * Props:
 *   - transactions (Array): Filtered transactions to display.
 *   - isMini (Boolean): If true, renders a simplified 3-column view without actions.
 *   - categories (Array): List of category options for the edit dropdown.
 *   - onDelete (Function): Callback function triggered when a transaction is deleted.
 *   - onCategoryChange (Function): Callback function triggered when a category is updated.
 *   - showToast (Function): Callback function to trigger UI notifications.
 */
function TransactionTable({
    transactions,
    isMini = false,
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

    if (isMini) {
        const miniColumns = [
            { label: 'Date', key: 'date' },
            { label: 'Description', key: 'description' },
            { label: 'Amount', key: 'amount', align: 'right' }
        ];

        return (
            <GenericTable
                data={transactions}
                columns={miniColumns}
                tableClass="mini-transactions-table"
                defaultSort={{ key: 'date', direction: 'asc' }}
                renderRow={(t) => (
                    <>
                        <td>{t.date}</td>
                        <td>{t.description}</td>
                        <td className={`amount-cell ${t.type === 'income' ? 'amount-gain' : 'amount-loss'}`} style={{ textAlign: 'right' }}>
                            {t.type === 'income' ? '+' : '-'}${Number(Math.abs(t.amount)).toFixed(2)}
                        </td>
                    </>
                )}
            />
        );
    }

    const fullColumns = [
        { label: 'Date', key: 'date' },
        { label: 'Description', key: 'description' },
        { label: 'Category', key: 'category' },
        { label: 'Type', key: 'type' },
        { label: 'Amount', key: 'amount' },
        { label: 'Actions', key: null }
    ];

    return (
        <GenericTable
            data={transactions}
            columns={fullColumns}
            categories={categories}
            defaultSort={{ key: 'date', direction: 'asc' }}
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
                    <td className={`amount-cell ${t.type === 'income' ? 'amount-gain' : 'amount-loss'}`}>
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
