// ============================================================================
// File: StockTransactions.jsx
// Description: Renders the transaction ledger for historical stock trades.
//              Leverages GenericTable to handle sorting and base table shell markup.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../../../../api';
import GenericTable from '../../../common/data-display/GenericTable';

/**
 * Component: StockTransactions
 * Description: Fetches and displays a tabular log of all stock trade entries by wrapping GenericTable.
 * Props:
 *   - refreshTrigger (Boolean/Number): State trigger to force re-fetch from backend.
 *   - showToast (Function): Toast notification delegate.
 */
function StockTransactions({ refreshTrigger, showToast }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/stocks/transactions')
            .then(response => {
                setTransactions(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching stock transactions:', error);
                showToast?.('Failed to load transaction history.', 'error');
                setLoading(false);
            });
    }, [refreshTrigger, showToast]);

    if (loading) {
        return (
            <div className="spinner-container">
                <div className="spinner"></div>
            </div>
        );
    }

    const columns = [
        { label: 'Date', key: 'date' },
        { label: 'Ticker', key: 'ticker' },
        { label: 'Action', key: 'type' },
        { label: 'Shares', key: 'shares', align: 'right' },
        { label: 'Price', key: 'price', align: 'right' },
        { label: 'Total', key: 'total', align: 'right' }
    ];

    return (
        <div className="stock-transactions">
            <h3>Trade Ledger</h3>
            {transactions.length === 0 ? (
                <div className="empty-state" style={{ margin: '15px 0' }}>
                    <div className="material-symbols-outlined empty-icon">trending_up</div>
                    <h3>No trades logged</h3>
                    <p>Log a buy/sell trade or import a brokerage statement to construct the ledger.</p>
                </div>
            ) : (
                <div className="table-container">
                    <GenericTable
                        data={transactions}
                        columns={columns}
                        defaultSort={{ key: 'date', direction: 'desc' }}
                        renderRow={(tx) => {
                            const isBuy = tx.type === 'buy';
                            return (
                                <>
                                    <td>{tx.date}</td>
                                    <td className="ticker-cell">{tx.ticker}</td>
                                    <td>
                                        <span className={`transaction-type-badge ${isBuy ? 'type-buy' : 'type-sell'}`}>
                                            {tx.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="amount-cell" style={{ textAlign: 'right' }}>{parseFloat(Number(tx.shares).toFixed(4))}</td>
                                    <td className="amount-cell" style={{ textAlign: 'right' }}>${Number(tx.price).toFixed(2)}</td>
                                    <td className="amount-cell" style={{ textAlign: 'right', fontWeight: '600' }}>${Number(tx.total).toFixed(2)}</td>
                                </>
                            );
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default StockTransactions;
