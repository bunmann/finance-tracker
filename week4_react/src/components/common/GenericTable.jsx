// ============================================================================
// File: GenericTable.jsx
// Description: Reusable sortable table container with layout transitions.
// ============================================================================
import { motion, AnimatePresence } from 'framer-motion';
import useSortableData from '../../hooks/useSortableData';
import { tableRowAnimation } from '../../utils/animations';

/**
 * Component: GenericTable
 * Description: Renders a reusable table shell with sortable column headers and layout transitions.
 * Props:
 *   - data (Array): Array of records to display.
 *   - columns (Array): Configurations for columns: { label, key, align }.
 *                      - `key` is the sort key. If null, column is not sortable.
 *                      - `align` can be 'right' or 'center' or 'left' (default).
 *   - renderRow (Function): Render prop to output individual rows: (item) => JSX.
 *   - defaultSort (Object): Default sorting config { key, direction }.
 *   - tableClass (String): Optional CSS class to apply to the table element.
 *   - categories (Array): Optional list of categories for sorting by category name.
 *   - rowKey (String): Property name to use as React key. Defaults to 'id'.
 */
function GenericTable({
    data = [],
    columns = [],
    renderRow,
    defaultSort = null,
    tableClass = '',
    categories = [],
    rowKey = 'id'
}) {
    // Apply sorting logic using our custom hook
    const { items: sortedItems, requestSort, sortConfig } = useSortableData(
        data,
        defaultSort,
        categories
    );

    const getClassNamesFor = (name) => {
        if (!name) return '';
        if (!sortConfig) return 'sortable-header';
        return sortConfig.key === name ? `sortable-header active ${sortConfig.direction}` : 'sortable-header';
    };

    const renderSortIndicator = (name) => {
        if (!name) return null;
        if (!sortConfig || sortConfig.key !== name) {
            return <span className="sort-indicator">↕</span>;
        }
        return sortConfig.direction === 'asc'
            ? <span className="sort-indicator asc">▲</span>
            : <span className="sort-indicator desc">▼</span>;
    };

    return (
        <table className={tableClass}>
            <thead>
                <tr>
                    {columns.map((col, index) => {
                        const style = col.align ? { textAlign: col.align } : {};
                        if (col.key) {
                            return (
                                <th 
                                    key={index} 
                                    onClick={() => requestSort(col.key)} 
                                    className={getClassNamesFor(col.key)}
                                    style={{ ...style, cursor: 'pointer', userSelect: 'none' }}
                                >
                                    {col.label} {renderSortIndicator(col.key)}
                                </th>
                            );
                        } else {
                            return (
                                <th key={index} style={style}>
                                    {col.label}
                                </th>
                            );
                        }
                    })}
                </tr>
            </thead>
            <tbody>
                <AnimatePresence initial={false}>
                    {sortedItems.map((item, index) => {
                        const key = item[rowKey] || index;
                        return (
                            <motion.tr
                                key={key}
                                variants={tableRowAnimation}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                layout
                            >
                                {renderRow(item)}
                            </motion.tr>
                        );
                    })}
                </AnimatePresence>
            </tbody>
        </table>
    );
}

export default GenericTable;
