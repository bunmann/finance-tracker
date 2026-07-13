// ============================================================================
// File: WatchlistManager.jsx
// Description: Reusable presentation component encapsulating the Watchlist
//              ticker input form and sortable GenericTable display.
// ============================================================================
import React, { useState } from 'react';
import GenericTable from '../../../common/data-display/GenericTable';
import EmptyState from '../../../common/data-display/EmptyState';
import { CURRENCY } from '../../../../utils/config';

/**
 * Component: WatchlistManager
 * Description: Pure presentation layer for monitoring stock tickers.
 * Props:
 *   - items (Array): List of watchlist records [{ id, ticker, current_price, last_updated, is_stale }].
 *   - onAddTicker (Function): Callback invoked when adding a ticker symbol.
 *   - onRemoveTicker (Function): Callback invoked when removing a ticker symbol.
 *   - loading (Boolean): Loading indicator status during network operations.
 */
function WatchlistManager({ items = [], onAddToWatchlist, onRemoveFromWatchlist, loading = false }) {
    const [tickerInput, setTickerInput] = useState('');

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const cleanTicker = tickerInput.trim().toUpperCase();
        if (!cleanTicker) return;
        if (onAddToWatchlist) {
            onAddToWatchlist(cleanTicker);
            setTickerInput('');
        }
    };

    const columns = [
        { label: 'Ticker Symbol', key: 'ticker', align: 'left' },
        { label: `Live Price (${CURRENCY})`, key: 'current_price', align: 'right' },
        { label: 'Data Status', key: 'is_stale', align: 'center' },
        { label: 'Action', key: null, align: 'center' }
    ];

    const renderRow = (item) => {
        const priceDisplay = item.current_price !== null && item.current_price !== undefined
            ? `$${Number(item.current_price).toFixed(2)}`
            : '—';

        return (
            <>
                <td className="watchlist-ticker-mono">{item.ticker}</td>
                <td className="watchlist-price-mono watchlist-cell-right">{priceDisplay}</td>
                <td className="watchlist-cell-center">
                    {item.is_stale ? (
                        <span className="watchlist-status-badge stale" title="Price may be cached or delayed">
                            <span className="material-symbols-outlined">history</span>
                            Stale
                        </span>
                    ) : (
                        <span className="watchlist-status-badge live" title="Live exchange price">
                            <span className="material-symbols-outlined">bolt</span>
                            Live
                        </span>
                    )}
                </td>
                <td className="watchlist-cell-center">
                    <button
                        type="button"
                        className="watchlist-delete-btn"
                        onClick={() => onRemoveFromWatchlist && onRemoveFromWatchlist(item.ticker)}
                        title={`Remove ${item.ticker} from Watchlist`}
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                </td>
            </>
        );
    };

    return (
        <div className="card watchlist-card">
            <div className="manager-header">
                <h3 className="manager-title">
                    <span className="material-symbols-outlined watchlist-empty-icon">visibility</span>
                    <span>Active Watchlist</span>
                </h3>
                <p className="manager-subtitle">
                    Monitor target tickers and track live {CURRENCY} market pricing in real time.
                </p>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="manager-form-bar">
                <input
                    type="text"
                    className="manager-input"
                    placeholder="Enter ticker (e.g. SHOP.TO, AAPL, GOOG.NE)..."
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    disabled={loading}
                    maxLength={10}
                />
                <button type="submit" className="manager-submit-btn" disabled={loading || !tickerInput.trim()}>
                    {loading ? (
                        <>
                            <span className="material-symbols-outlined spin watchlist-action-icon">sync</span>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined watchlist-action-icon">add</span>
                            <span>Add Ticker</span>
                        </>
                    )}
                </button>
            </form>

            {/* Table or Empty State */}
            {items.length === 0 ? (
                <EmptyState
                    icon="saved_search"
                    title="No Monitored Stocks"
                    message="Add stock symbols above to begin tracking live prices and anomaly alerts."
                />
            ) : (
                <div className="watchlist-table-wrapper">
                    <GenericTable
                        data={items}
                        columns={columns}
                        renderRow={renderRow}
                        rowKey="ticker"
                        tableClass="watchlist-table"
                        defaultSort={{ key: 'ticker', direction: 'asc' }}
                    />
                </div>
            )}
        </div>
    );
}

export default WatchlistManager;
