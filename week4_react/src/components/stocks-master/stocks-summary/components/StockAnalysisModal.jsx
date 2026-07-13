// ============================================================================
// File: StockAnalysisModal.jsx
// Description: Interactive Stock Research & Charting Modal.
//              Fetches real-time yfinance historical series and fundamental ratios,
//              rendering a dynamic Recharts canvas with Veridian Flow color intelligence.
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip
} from 'recharts';
import api from '../../../../api';
import './StockAnalysisModal.css';

/**
 * Custom Tooltip Component for Recharts canvas
 */
function CustomTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const price = parseFloat(data.price || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const volume = (data.volume || 0).toLocaleString();

    // Format timestamp cleanly
    let dateStr = data.timestamp;
    try {
        if (dateStr && dateStr.length >= 10) {
            const dt = new Date(dateStr);
            if (!isNaN(dt.getTime())) {
                dateStr = dt.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: dateStr.length > 10 ? '2-digit' : undefined,
                    minute: dateStr.length > 10 ? '2-digit' : undefined
                });
            }
        }
    } catch {
        // Fallback to raw timestamp
    }

    return (
        <div className="stock-modal-tooltip">
            <div className="stock-modal-tooltip-date">{dateStr}</div>
            <div className="stock-modal-tooltip-price">${price}</div>
            {data.volume > 0 && (
                <div className="stock-modal-tooltip-vol">Vol: {volume}</div>
            )}
        </div>
    );
}

/**
 * Component: StockAnalysisModal
 * Props:
 *   - isOpen (boolean): Whether modal is visible
 *   - symbol (string): Stock symbol to analyze (e.g. 'XEQT.TO', 'GOOG.NE')
 *   - onClose (function): Callback to close modal
 */
function StockAnalysisModal({ isOpen, symbol, onClose }) {
    const [chartData, setChartData] = useState([]);
    const [metadata, setMetadata] = useState({});
    const [period, setPeriod] = useState('1M');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Fetch chart data whenever modal opens or period changes
    useEffect(() => {
        if (!isOpen || !symbol) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        api.get(`/stocks/${encodeURIComponent(symbol)}/chart`, {
            params: { period }
        })
            .then((res) => {
                if (!isMounted) return;
                setChartData(res.data.chart || []);
                setMetadata(res.data.metadata || {});
                setLoading(false);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error('[StockAnalysisModal] Chart fetch failed:', err);
                setError(err.response?.data?.detail || 'Failed to load historical chart data.');
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, symbol, period]);

    if (!isOpen || !symbol) return null;

    const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

    // Determine color intelligence (#00D166 vs #FF3B3B) based on start/end chart prices or 1D metadata
    let isPositive = true;
    if (chartData.length >= 2) {
        const firstPrice = chartData[0].price || 0;
        const lastPrice = chartData[chartData.length - 1].price || 0;
        isPositive = lastPrice >= firstPrice;
    } else if (metadata && metadata.change_pct !== undefined && metadata.change_pct !== null) {
        isPositive = metadata.change_pct >= 0;
    }

    const themeColor = isPositive ? '#00D166' : '#FF3B3B';
    const gradientId = isPositive ? 'chartPositiveGrad' : 'chartNegativeGrad';

    // Formatted current price badge
    const currentPriceVal = metadata?.current_price || (chartData.length > 0 ? chartData[chartData.length - 1].price : 0);
    const formattedPrice = parseFloat(currentPriceVal || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Formatted change percentage
    const changePctVal = metadata?.change_pct;
    const formattedChangePct = changePctVal !== undefined && changePctVal !== null
        ? `${changePctVal >= 0 ? '+' : ''}${changePctVal.toFixed(2)}%`
        : null;

    // Formatted ratios
    const fmtRatio = (val, suffix = '') => {
        if (val === undefined || val === null || isNaN(val) || val === 0) return 'N/A';
        return `${parseFloat(val).toFixed(2)}${suffix}`;
    };

    const fmtRange = (low, high) => {
        if (!low || !high || low === 0 || high === 0) return 'N/A';
        return `$${parseFloat(low).toFixed(2)} – $${parseFloat(high).toFixed(2)}`;
    };

    return (
        <div
            className="stock-modal-backdrop"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="stock-modal-container">
                {/* Header */}
                <div className="stock-modal-header">
                    <div className="stock-modal-title-area">
                        <div className="stock-modal-ticker-row">
                            <span className="stock-modal-ticker">{metadata?.ticker || symbol}</span>
                            {metadata?.currency && (
                                <span className="stock-modal-currency-badge">{metadata.currency}</span>
                            )}
                        </div>
                        <div className="stock-modal-company-name">
                            {metadata?.name || 'Equity Research & Historical Performance'}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="stock-modal-close-btn"
                        onClick={onClose}
                        title="Close modal (Esc)"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Subnav: Price display and Timeframe pills */}
                <div className="stock-modal-subnav">
                    <div className="stock-modal-price-area">
                        <span className="stock-modal-price">${formattedPrice}</span>
                        {formattedChangePct && (
                            <span className={`stock-modal-change-pill ${changePctVal >= 0 ? 'positive' : 'negative'}`}>
                                {formattedChangePct}
                            </span>
                        )}
                    </div>
                    <div className="stock-modal-timeframe-pills">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf}
                                type="button"
                                className={`stock-modal-tf-btn ${period === tf ? 'active' : ''}`}
                                onClick={() => setPeriod(tf)}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart Section */}
                <div className="stock-modal-chart-section">
                    {loading && (
                        <div className="stock-modal-loading-overlay">
                            <div className="stock-modal-spinner" />
                            <span>Loading historical data for {period}...</span>
                        </div>
                    )}
                    {error && (
                        <div className="stock-modal-error-overlay">
                            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
                                error
                            </span>
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && !error && chartData.length === 0 && (
                        <div className="stock-modal-loading-overlay">
                            <span>No historical data available for {symbol} ({period}).</span>
                        </div>
                    )}

                    {chartData.length > 0 && (
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart
                                data={chartData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={themeColor} stopOpacity={0.35} />
                                        <stop offset="95%" stopColor={themeColor} stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="timestamp"
                                    hide={true}
                                />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    hide={true}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: 'rgba(226, 232, 240, 0.25)', strokeWidth: 1 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke={themeColor}
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill={`url(#${gradientId})`}
                                    isAnimationActive={true}
                                    animationDuration={600}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Fundamental Ratios Grid */}
                <div className="stock-modal-ratios-grid">
                    <div className="stock-modal-ratio-card">
                        <span className="stock-modal-ratio-label">P/E Ratio</span>
                        <span className="stock-modal-ratio-val">{fmtRatio(metadata?.pe_ratio)}</span>
                    </div>
                    <div className="stock-modal-ratio-card">
                        <span className="stock-modal-ratio-label">Profit Margin</span>
                        <span className="stock-modal-ratio-val">
                            {metadata?.profit_margin ? `${(metadata.profit_margin * 100).toFixed(2)}%` : 'N/A'}
                        </span>
                    </div>
                    <div className="stock-modal-ratio-card">
                        <span className="stock-modal-ratio-label">Debt / Equity</span>
                        <span className="stock-modal-ratio-val">{fmtRatio(metadata?.debt_to_equity)}</span>
                    </div>
                    <div className="stock-modal-ratio-card">
                        <span className="stock-modal-ratio-label">52W Range</span>
                        <span className="stock-modal-ratio-val">
                            {fmtRange(metadata?.low_52w, metadata?.high_52w)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StockAnalysisModal;
