// ============================================================================
// File: StockForm.jsx
// Description: Renders Buy/Sell stock transaction inputs and logs trades.
// ============================================================================
import { useState } from 'react';
import api from '../../api';
import NonNegativeInput from '../common/inputs/NonNegativeInput';
import { CURRENCY } from '../../utils/config';

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

        const rawShares = parseFloat(shares);
        const rawPrice = parseFloat(price);
        const sanitizedShares = !isNaN(rawShares) ? Math.abs(rawShares) : 0;
        const sanitizedPrice = !isNaN(rawPrice) ? Math.abs(rawPrice) : 0;

        const payload = {
            ticker: ticker.trim().toUpperCase(),
            shares: sanitizedShares,
            price: sanitizedPrice,
            date: date || null,
        };

        // Double Defensive: Validate ticker symbol via price check endpoint first
        api.get(`/stocks/price/${payload.ticker}`)
            .then((res) => {
                if (res.data.price === false) {
                    const errorMsg = `Invalid stock symbol: '${payload.ticker}'. Please check the ticker name.`;
                    setError(errorMsg);
                    showToast?.(errorMsg, 'error');
                    setSubmitting(false);
                    return;
                }

                // Proceed with logging transaction since ticker is verified
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
            })
            .catch(err => {
                console.error(`Ticker validation failed:`, err);
                let errorMsg = `Invalid stock symbol: '${payload.ticker}'. Please check the ticker name.`;
                if (err.response?.data?.detail) {
                    errorMsg = err.response.data.detail;
                } else if (err.message && err.message.toLowerCase().includes('network')) {
                    errorMsg = `Failed to fetch price for '${payload.ticker}' at the moment. Please try again later.`;
                }
                setError(errorMsg);
                showToast?.(errorMsg, 'error');
                setSubmitting(false);
            });
    };

    const isBuy = type === 'buy';

    return (
        <form onSubmit={handleSubmit} className="stock-form" noValidate>
            <h2>{isBuy ? 'Buy Stock' : 'Sell Stock'}</h2>
            {error && <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div>}
            
            <div className="form-grid">
                <div className="form-group">
                    <label>Ticker</label>
                    <input
                        type="text"
                        placeholder="e.g. AAPL"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        required
                    />
                </div>

                <div className="form-grid-two-col">
                    <div className="form-group">
                        <label>Shares</label>
                        <NonNegativeInput
                            step="any"
                            min={0.000001}
                            placeholder="e.g. 10"
                            value={shares}
                            onChange={(e) => setShares(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Price ({CURRENCY})</label>
                        <NonNegativeInput
                            step="0.01"
                            min={0.01}
                            placeholder="e.g. 150.25"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                className={isBuy ? 'btn-buy' : 'btn-sell'} 
                disabled={submitting}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {isBuy ? 'add_shopping_cart' : 'sell'}
                </span>
                {submitting ? 'Submitting...' : isBuy ? 'Buy Shares' : 'Sell Shares'}
            </button>
        </form>
    );
}

export default StockForm;
