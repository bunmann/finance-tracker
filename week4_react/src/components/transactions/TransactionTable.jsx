// ============================================================================
// File: TransactionTable.jsx
// Description: Reusable table component for rendering transactions in full or mini views.
//              Supports column sorting on dates, amounts, categories, and more.
// ============================================================================
import api from '../../api';
import useSortableData from '../../hooks/useSortableData';

/**
 * Component: TransactionTable
 * Description: Renders a list of transactions in either a detailed (full) table
 *              or a simplified (mini) table. Handles category updates, deletions,
 *              and column sorting via the useSortableData custom hook.
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
    // Utilize custom sorting hook
    const { items: sortedTransactions, requestSort, sortConfig } = useSortableData(
        transactions,
        { key: 'date', direction: 'asc' },
        categories
    );

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

    /**
     * Function: getClassNamesFor
     * Description: Returns classes for headers based on active sorting state.
     */
    const getClassNamesFor = (name) => {
        if (!sortConfig) return 'sortable-header';
        return sortConfig.key === name ? `sortable-header active ${sortConfig.direction}` : 'sortable-header';
    };

    /**
     * Function: renderSortIndicator
     * Description: Renders the appropriate sort direction arrow or placeholder indicator.
     */
    const renderSortIndicator = (name) => {
        if (!sortConfig || sortConfig.key !== name) {
            return <span className="sort-indicator">↕</span>;
        }
        return sortConfig.direction === 'asc'
            ? <span className="sort-indicator asc">▲</span>
            : <span className="sort-indicator desc">▼</span>;
    };

    if (transactions.length === 0) {
        return (
            <p className="no-transactions-text">
                No transactions logged for this period.
            </p>
        );
    }

    if (isMini) {
        return (
            <table className="mini-transactions-table">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('date')} className={getClassNamesFor('date')}>
                            Date {renderSortIndicator('date')}
                        </th>
                        <th onClick={() => requestSort('description')} className={getClassNamesFor('description')}>
                            Description {renderSortIndicator('description')}
                        </th>
                        <th onClick={() => requestSort('amount')} className={getClassNamesFor('amount')} style={{ textAlign: 'right' }}>
                            Amount {renderSortIndicator('amount')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTransactions.map(t => (
                        <tr key={t.id}>
                            <td>{t.date}</td>
                            <td>{t.description}</td>
                            <td style={{ textAlign: 'right', fontWeight: '500' }}>
                                ${Number(t.amount).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <table>
            <thead>
                <tr>
                    <th onClick={() => requestSort('id')} className={getClassNamesFor('id')}>
                        ID {renderSortIndicator('id')}
                    </th>
                    <th onClick={() => requestSort('date')} className={getClassNamesFor('date')}>
                        Date {renderSortIndicator('date')}
                    </th>
                    <th onClick={() => requestSort('description')} className={getClassNamesFor('description')}>
                        Description {renderSortIndicator('description')}
                    </th>
                    <th onClick={() => requestSort('category')} className={getClassNamesFor('category')}>
                        Category {renderSortIndicator('category')}
                    </th>
                    <th onClick={() => requestSort('type')} className={getClassNamesFor('type')}>
                        Type {renderSortIndicator('type')}
                    </th>
                    <th onClick={() => requestSort('amount')} className={getClassNamesFor('amount')}>
                        Amount {renderSortIndicator('amount')}
                    </th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedTransactions.map(t => (
                    <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.date}</td>
                        <td>{t.description}</td>
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
                        <td>{t.type}</td>
                        <td>${Number(t.amount).toFixed(2)}</td>
                        <td>
                            <button onClick={() => handleDelete(t.id)}>
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default TransactionTable;
