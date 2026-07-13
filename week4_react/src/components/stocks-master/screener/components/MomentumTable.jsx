// ============================================================================
// File: MomentumTable.jsx
// Description: Presenter component rendering the cross-sectional Momentum
//              Quality candidate table with formatted financial ratios.
// ============================================================================
import React from 'react';
import GenericTable from '../../../common/data-display/GenericTable';
import EmptyState from '../../../common/data-display/EmptyState';

/**
 * Component: MomentumTable
 * Description: Renders the table of stocks passed through the Momentum Quality screen.
 * Props:
 *   - candidates (Array): List of screened stock candidate objects.
 *   - competenceSectors (Array): User's active Circle of Competence sectors (lowercase).
 *   - renderSourceBadge (Function): Delegate returning badge JSX.
 */
function MomentumTable({ candidates = [], competenceSectors = [], renderSourceBadge }) {
    if (!candidates || candidates.length === 0) {
        return (
            <EmptyState
                icon="filter_alt_off"
                title="No Stocks Match Filter Thresholds"
                message="Try adjusting your fundamental sliders on the sidebar to broaden your quantitative screening criteria."
            />
        );
    }

    // Table Column Configuration
    const columns = [
        { label: 'Ticker', key: 'ticker' },
        { label: 'Name', key: 'name' },
        { label: 'Sector', key: 'sector' },
        { label: 'Price', key: 'price', align: 'right' },
        { label: 'P/E', key: 'pe', align: 'right' },
        { label: 'FCF Growth', key: 'fcf_growth', align: 'right' },
        { label: 'Margin', key: 'profit_margin', align: 'right' },
        { label: 'Debt/Eq', key: 'debt_to_equity', align: 'right' },
        { label: '30d Return', key: 'performance_30d', align: 'right' },
        { label: 'Rel. Strength', key: 'relative_strength', align: 'right' },
        { label: 'Source', key: 'source', align: 'center' }
    ];

    // Table Row Render Prop
    const renderRow = (item) => (
        <>
            <td className="ticker-cell">{item.ticker}</td>
            <td>{item.name}</td>
            <td>{item.sector}</td>
            <td className="screener-cell-mono">
                C${item.price.toFixed(2)}
            </td>
            <td className="screener-cell-mono">
                {item.pe ? item.pe.toFixed(1) : '—'}
            </td>
            <td className="screener-cell-mono">
                {item.fcf_growth !== null && item.fcf_growth !== undefined ? `${(item.fcf_growth * 100).toFixed(1)}%` : '—'}
            </td>
            <td className="screener-cell-mono">
                {item.profit_margin !== null && item.profit_margin !== undefined ? `${(item.profit_margin * 100).toFixed(1)}%` : '—'}
            </td>
            <td className="screener-cell-mono">
                {item.debt_to_equity !== null && item.debt_to_equity !== undefined ? item.debt_to_equity.toFixed(2) : '—'}
            </td>
            <td className={`screener-cell-mono ${item.performance_30d >= 0 ? 'screener-text-gain' : 'screener-text-loss'}`}>
                {item.performance_30d !== null && item.performance_30d !== undefined ? `${item.performance_30d >= 0 ? '+' : ''}${(item.performance_30d * 100).toFixed(1)}%` : '—'}
            </td>
            <td className="screener-cell-mono-bold">
                {item.relative_strength ? `${item.relative_strength.toFixed(1)}%` : '—'}
            </td>
            <td className="screener-cell-center">
                {renderSourceBadge && renderSourceBadge(item.source)}
            </td>
        </>
    );

    // Determine row highlighting class if sector matches user's Circle of Competence
    const getRowClassName = (item) => {
        if (!item || !item.sector) return '';
        const sectorClean = item.sector.toLowerCase().trim();
        return competenceSectors.includes(sectorClean) ? 'competence-highlight-row' : '';
    };

    return (
        <GenericTable
            data={candidates}
            columns={columns}
            renderRow={renderRow}
            defaultSort={{ key: 'relative_strength', direction: 'desc' }}
            rowKey="ticker"
            rowClassName={getRowClassName}
        />
    );
}

export default MomentumTable;
