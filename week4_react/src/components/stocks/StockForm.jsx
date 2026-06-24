// ============================================================================
// File: StockForm.jsx
// Description: Renders Buy/Sell stock transaction inputs and logs trades.
// ============================================================================
import { useState } from 'react';
import api from '../../api';

/**
 * Component: StockForm
 * Description: Renders form controls for purchasing or selling stock tickers.
 * Props:
 *   - type (String): Action indicator ('buy' or 'sell').
 *   - onComplete (Function): Callback that handles updating parent dashboard records.
 *   - showToast (Function): Toast feedback banner delegate.
 */
function StockForm({ type, onComplete, showToast }) {
    const [ticker, setTicker] = useState('');
    const [shares, setShares] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const payload = {
            ticker: ticker.trim().toUpperCase(),
            shares: parseFloat(shares),
            price: parseFloat(price),
            date: date || null,
        };

        api.post(`/stocks/${type}`, payload)
            .then(() => {
                showToast?.(`Successfully logged ${type} transaction for ${payload.ticker}.`, 'success');
                setTicker('');
                setShares('');
                setPrice('');
                setDate('');
                onComplete?.();
            })
            .catch(err => {
                console.error(`Error logging ${type} transaction:`, err);
                let msg = `Failed to log ${type} transaction.`;
                if (err.response?.data?.detail) {
                    const detail = err.response.data.detail;
                    if (typeof detail === 'string') {
                        msg = detail;
                    } else if (Array.isArray(detail)) {
                        msg = detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
                    } else {
                        msg = JSON.stringify(detail);
                    }
                }
                setError(msg);
                showToast?.(msg, 'error');
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    const isBuy = type === 'buy';

    return (
        <form onSubmit={handleSubmit} className="stock-form">
            <h2>{isBuy ? 'Buy Stock' : 'Sell Stock'}</h2>
            {error && <div className="error-message" style={{ margin: '0 0 15px 0' }}>{error}</div>}
            
            <div>
                <label>Ticker: </label>
                <input
                    type="text"
                    placeholder="e.g. AAPL"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    required
                />
            </div>

            <div>
                <label>Shares: </label>
                <input
                    type="number"
                    step="any"
                    min="0.000001"
                    placeholder="e.g. 10"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    required
                />
            </div>

            <div>
                <label>Price ($): </label>
                <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 150.25"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                />
            </div>

            <div>
                <label>Date: </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            <button 
                type="submit" 
                className={isBuy ? 'btn-buy' : 'btn-sell'} 
                disabled={submitting}
            >
                {submitting ? 'Submitting...' : isBuy ? 'Buy Shares' : 'Sell Shares'}
            </button>
        </form>
    );
}

export default StockForm;
