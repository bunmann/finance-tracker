// ============================================================================
// File: StockHoldings.jsx
// Description: Renders the active stock holdings table with sortable columns.
// ============================================================================
import GenericTable from '../common/GenericTable';

/**
 * Component: StockHoldings
 * Description: Renders a list of the user's current stock positions,
 *              supporting header sorting.
 * Props:
 *   - holdings (Array): List of current stock holdings.
 */
function StockHoldings({ holdings = [] }) {
    // Strip trailing zeros: 30.0000 → "30", 170.08 → "170.08", 294.30 → "294.3"
    const fmt = (num, decimals = 2) => parseFloat(num.toFixed(decimals)).toString();
    const columns = [
        { label: 'Ticker', key: 'ticker' },
        { label: 'Shares', key: 'shares' },
        { label: 'Avg Cost', key: 'avg_cost' },
        { label: 'Current Price', key: 'current_price' },
        { label: 'Market Value', key: 'market_value' },
        { label: 'P&L', key: 'unrealized_gain' },
        { label: 'P&L %', key: 'gain_percent' }
    ];

    return (
        <div className="card">
            <h3>Holdings</h3>
            {holdings.length > 0 ? (
                <GenericTable
                    data={holdings}
                    columns={columns}
                    tableClass="holdings-table"
                    defaultSort={{ key: 'ticker', direction: 'asc' }}
                    renderRow={(h) => {
                        const isGain = h.unrealized_gain >= 0;
                        const pnlClass = h.unrealized_gain !== null ? (isGain ? 'gain-text' : 'loss-text') : '';
                        const isPercentGain = h.gain_percent >= 0;
                        const percentClass = h.gain_percent !== null ? (isPercentGain ? 'gain-text' : 'loss-text') : '';
                        
                        return (
                            <tr key={h.ticker}>
                                <td className="ticker-cell">{h.ticker}</td>
                                <td>{fmt(h.shares, 4)}</td>
                                <td>${h.avg_cost.toFixed(2)}</td>
                                <td>{h.current_price !== null && h.current_price !== undefined ? `$${h.current_price.toFixed(2)}` : '—'}</td>
                                <td>{h.market_value !== null && h.market_value !== undefined ? `$${h.market_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</td>
                                <td className={pnlClass}>
                                    {h.unrealized_gain !== null && h.unrealized_gain !== undefined
                                        ? `${h.unrealized_gain >= 0 ? '+' : ''}$${h.unrealized_gain.toFixed(2)}`
                                        : '—'}
                                </td>
                                <td className={percentClass}>
                                    {h.gain_percent !== null && h.gain_percent !== undefined
                                        ? `${h.gain_percent >= 0 ? '+' : ''}${h.gain_percent.toFixed(2)}%`
                                        : '—'}
                                </td>
                            </tr>
                        );
                    }}
                />
            ) : (
                <div className="empty-state">
                    <p>📭 No holdings yet. Buy your first stock below!</p>
                </div>
            )}
        </div>
    );
}

export default StockHoldings;
