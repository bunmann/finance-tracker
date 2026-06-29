// ============================================================================
// File: useSortableData.js
// Description: Custom React hook to manage sorting state and logic for tabular data.
// ============================================================================
import { useState, useMemo } from 'react';

/**
 * Hook: useSortableData
 * Description: Manages three-state sorting (ascending, descending, unsorted)
 *              for tabular datasets. Handles dates, strings, numbers, and category lookups.
 * Parameters:
 *   - items (Array): The list of items to sort.
 *   - config (Object): Default sort configuration { key, direction }.
 *   - categories (Array): List of categories for looking up names during sorting.
 * Returns:
 *   - items (Array): The sorted items.
 *   - requestSort (Function): Function to trigger sorting on a specific key.
 *   - sortConfig (Object): The current sort state { key, direction }.
 */
function useSortableData(items, config = null, categories = []) {
    const [sortConfig, setSortConfig] = useState(config);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aVal, bVal;

                if (sortConfig.key === 'category') {
                    // Resolve category names from category_id for accurate sorting
                    aVal = categories.find(c => c.id === a.category_id)?.name || (a.type === 'income' ? 'Income' : 'Uncategorized');
                    bVal = categories.find(c => c.id === b.category_id)?.name || (b.type === 'income' ? 'Income' : 'Uncategorized');
                } else {
                    aVal = a[sortConfig.key];
                    bVal = b[sortConfig.key];
                }

                // Handle undefined or null values
                if (aVal === undefined || aVal === null) aVal = '';
                if (bVal === undefined || bVal === null) bVal = '';

                // Protocol 1: Automatic Duck-Typing (Dynamic Numeric Detection)
                // Inspect cell values at runtime. If values parse cleanly as numbers, sort mathematically.
                const isANum = typeof aVal === 'number' || (aVal !== '' && aVal !== '—' && !isNaN(Number(aVal)));
                const isBNum = typeof bVal === 'number' || (bVal !== '' && bVal !== '—' && !isNaN(Number(bVal)));

                if (isANum || isBNum) {
                    const aNum = isANum ? Number(aVal) : -Infinity;
                    const bNum = isBNum ? Number(bVal) : -Infinity;
                    return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
                }

                // Fallback: Case-insensitive string comparison using localeCompare
                const aStr = String(aVal);
                const bStr = String(bVal);
                return sortConfig.direction === 'asc'
                    ? aStr.localeCompare(bStr, undefined, { sensitivity: 'base' })
                    : bStr.localeCompare(aStr, undefined, { sensitivity: 'base' });
            });
        }
        return sortableItems;
    }, [items, sortConfig, categories]);

    /**
     * Function: requestSort
     * Description: Triggers or updates the sort configuration. Cycles through
     *              asc -> desc -> unsorted.
     */
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig && sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
                setSortConfig({ key, direction });
            } else if (sortConfig.direction === 'desc') {
                setSortConfig(null);
            }
        } else {
            setSortConfig({ key, direction });
        }
    };

    return { items: sortedItems, requestSort, sortConfig };
}

export default useSortableData;
