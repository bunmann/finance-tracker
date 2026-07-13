// ============================================================================
// File: GenericTable.jsx
// Description: Reusable sortable table container with layout transitions and built-in customizable pagination.
// ============================================================================
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSortableData from '../../../hooks/useSortableData';
import { tableRowAnimation } from '../../../utils/animations';

/**
 * Component: GenericTable
 * Description: Renders a reusable table shell with sortable column headers, transitions, and numbered pagination.
 * Props:
 *   - data (Array): Array of records to display.
 *   - columns (Array): Configurations for columns: { label, key, align }.
 *   - hiddenColumns (Array): List of column keys to omit automatically from headers and row cells.
 *   - renderRow (Function): Render prop to output individual rows: (item) => JSX.
 *   - defaultSort (Object): Default sorting config { key, direction }.
 *   - tableClass (String): Optional CSS class to apply to the table element.
 *   - categories (Array): Optional list of categories for sorting by category name.
 *   - rowKey (String): Property name to use as React key. Defaults to 'id'.
 *   - paginated (Boolean): Whether to enable pagination (defaults to true).
 *   - defaultPageSize (Number): Initial number of items per page (defaults to 10).
 *   - pageSizeOptions (Array): Available page size choices (defaults to [10, 25, 50, 'All']).
 */
function GenericTable({
    data = [],
    columns = [],
    hiddenColumns = [],
    renderRow,
    defaultSort = null,
    tableClass = '',
    categories = [],
    rowKey = 'id',
    rowClassName = () => '',
    paginated = true,
    defaultPageSize = 10,
    pageSizeOptions = [10, 25, 50, 'All']
}) {
    const visibleColumns = columns.filter(col => col && col.key ? !hiddenColumns.includes(col.key) : true);

    // Apply sorting logic using our custom hook
    const { items: sortedItems, requestSort, sortConfig } = useSortableData(
        data,
        defaultSort,
        categories
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [direction, setDirection] = useState(1);

    // Auto-reset page to 1 when data length or active sorting changes
    useEffect(() => {
        setCurrentPage(1);
    }, [data.length, sortConfig?.key, sortConfig?.direction]);

    const handlePageChange = (newPage) => {
        if (newPage === validCurrentPage || typeof newPage !== 'number') return;
        setDirection(newPage > validCurrentPage ? 1 : -1);
        setCurrentPage(newPage);
    };

    const pageVariants = {
        enter: (dir) => ({
            opacity: 0,
            x: dir > 0 ? 18 : -18
        }),
        center: {
            opacity: 1,
            x: 0
        },
        exit: (dir) => ({
            opacity: 0,
            x: dir > 0 ? -18 : 18
        })
    };

    const totalItems = sortedItems.length;
    const effectivePageSize = pageSize === 'All' ? totalItems || 1 : Number(pageSize);
    const totalPages = pageSize === 'All' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

    // Clamp current page just in case of out-of-bounds
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const paginatedItems = paginated && pageSize !== 'All'
        ? sortedItems.slice((validCurrentPage - 1) * effectivePageSize, validCurrentPage * effectivePageSize)
        : sortedItems;

    const startItemIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * effectivePageSize + 1;
    const endItemIndex = pageSize === 'All' ? totalItems : Math.min(totalItems, validCurrentPage * effectivePageSize);

    // Generate numbered page buttons (with ellipsis for large page counts)
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (validCurrentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }
        if (validCurrentPage >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages];
    };

    const pageNumbers = getPageNumbers();

    const getClassNamesFor = (name) => {
        if (!name) return '';
        if (!sortConfig) return 'sortable-header sortable-header-cell';
        return sortConfig.key === name ? `sortable-header sortable-header-cell active ${sortConfig.direction}` : 'sortable-header sortable-header-cell';
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
        <div className="generic-table-container">
            <table className={tableClass}>
                <thead>
                    <tr>
                        {visibleColumns.map((col, index) => {
                            const style = col.align ? { textAlign: col.align } : undefined;
                            if (col.key) {
                                return (
                                    <th 
                                        key={index} 
                                        onClick={() => requestSort(col.key)} 
                                        className={getClassNamesFor(col.key)}
                                        style={style}
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
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                    <motion.tbody
                        key={paginated ? `${validCurrentPage}-${pageSize}` : 'all'}
                        custom={direction}
                        variants={pageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                    >
                        {paginatedItems.map((item, index) => {
                            const key = item[rowKey] || index;
                            let rawCells = renderRow(item, { hiddenColumns });
                            let cellElements = rawCells;
                            if (hiddenColumns.length > 0 && rawCells && rawCells.props && rawCells.props.children) {
                                const childrenArray = React.Children.toArray(rawCells.props.children);
                                if (childrenArray.length === columns.length) {
                                    cellElements = childrenArray.filter((_, colIdx) => {
                                        const col = columns[colIdx];
                                        return col && col.key ? !hiddenColumns.includes(col.key) : true;
                                    });
                                }
                            }
                            return (
                                <tr key={key} className={rowClassName(item)}>
                                    {cellElements}
                                </tr>
                            );
                        })}
                    </motion.tbody>
                </AnimatePresence>
            </table>

            {paginated && totalItems > 0 && (
                <div className="table-pagination-bar">
                    <div className="pagination-info">
                        <span>Showing {startItemIndex} to {endItemIndex} of {totalItems} entries</span>
                        <div className="page-size-selector">
                            <label htmlFor="pageSizeSelect">Rows per page:</label>
                            <select
                                id="pageSizeSelect"
                                className="page-size-dropdown"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value));
                                    handlePageChange(1);
                                }}
                            >
                                {pageSizeOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button
                                type="button"
                                className="pagination-btn"
                                disabled={validCurrentPage === 1}
                                onClick={() => handlePageChange(Math.max(1, validCurrentPage - 1))}
                            >
                                Prev
                            </button>
                            {pageNumbers.map((p, idx) => (
                                p === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
                                ) : (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`pagination-btn ${p === validCurrentPage ? 'active' : ''}`}
                                        onClick={() => handlePageChange(p)}
                                    >
                                        {p}
                                    </button>
                                )
                            ))}
                            <button
                                type="button"
                                className="pagination-btn"
                                disabled={validCurrentPage === totalPages}
                                onClick={() => handlePageChange(Math.min(totalPages, validCurrentPage + 1))}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default GenericTable;
