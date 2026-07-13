// ============================================================================
// File: StockAnalysisModalContent.jsx
// Description: Dumb Presenter component for the Stock Research & Charting Modal.
//              Renders Recharts canvas with adaptive axes, timeframe pills, and ratios grid.
// ============================================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';
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
 * Dedicated helper: compute clean Y-axis domain and round tick values
 * with single-digit decimal (or whole numbers) precision.
 */
function computeCleanYAxis(chartData) {
    if (!chartData || chartData.length === 0) {
        return { domain: ['auto', 'auto'], ticks: undefined, step: 1 };
    }

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    chartData.forEach((d) => {
        const p = Number(d.price);
        if (!isNaN(p)) {
            if (p < minPrice) minPrice = p;
            if (p > maxPrice) maxPrice = p;
        }
    });

    if (!isFinite(minPrice) || !isFinite(maxPrice) || minPrice === maxPrice) {
        return { domain: ['auto', 'auto'], ticks: undefined, step: 1 };
    }

    const range = maxPrice - minPrice;
    const targetSteps = 5;
    const roughStep = range / targetSteps;

    // Nice round intervals focusing on clean single-digit decimals or whole dollars
    const niceIncrements = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000];
    let step = niceIncrements[0];
    for (const inc of niceIncrements) {
        if (roughStep <= inc) {
            step = inc;
            break;
        }
    }

    const domainMin = Math.floor(minPrice / step) * step;
    const domainMax = Math.ceil(maxPrice / step) * step;

    const ticks = [];
    for (let val = domainMin; val <= domainMax + (step * 0.01); val += step) {
        ticks.push(Number(val.toFixed(2)));
    }

    return {
        domain: [domainMin, domainMax],
        ticks,
        step
    };
}

/**
 * Dedicated helper: compute clean X-axis ticks tailored for each mode.
 * For 1D and ALL (continuous time projection), returns exact timeMs coordinates so
 * Recharts projects every hourly/yearly milestone down to its true physical position along the axis
 * even if certain exact timestamps aren't in the received dataset (just like yfinance).
 */
function computeCleanXAxisTicks(chartData, period) {
    if (!chartData || chartData.length === 0) return undefined;

    if (period === '1D') {
        const minMs = new Date(chartData[0].timestamp).getTime();
        const maxMs = new Date(chartData[chartData.length - 1].timestamp).getTime();
        if (isNaN(minMs) || isNaN(maxMs)) return undefined;

        // Project exact top-of-hour milestones (`10:00 AM`, `11:00 AM`, `12:00 PM`, `1:00 PM`, `2:00 PM`, `3:00 PM`)
        const ticks = [];
        const baseDate = new Date(minMs);
        for (let hr = 10; hr <= 15; hr++) {
            const target = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hr, 0, 0, 0).getTime();
            if (target >= minMs && target <= maxMs) {
                ticks.push(target);
            }
        }
        return ticks.length > 0 ? ticks : undefined;
    }

    if (period === '1W') {
        // Exactly one real timestamp per calendar trading day (first candle of that day)
        const seenDays = new Set();
        const ticks = [];
        chartData.forEach((item) => {
            if (!item.timestamp) return;
            const dt = new Date(item.timestamp);
            if (isNaN(dt.getTime())) return;
            const dayKey = dt.toDateString();
            if (!seenDays.has(dayKey)) {
                seenDays.add(dayKey);
                ticks.push(item.timestamp);
            }
        });
        return ticks.length > 0 ? ticks : undefined;
    }

    if (period === '1M') {
        // Collect exact first candle of each unique calendar day, then pick roughly every 5th trading day
        const seenDays = new Set();
        const dayTimestamps = [];
        chartData.forEach((item) => {
            if (!item.timestamp) return;
            const dt = new Date(item.timestamp);
            if (isNaN(dt.getTime())) return;
            const dayKey = dt.toDateString();
            if (!seenDays.has(dayKey)) {
                seenDays.add(dayKey);
                dayTimestamps.push(item.timestamp);
            }
        });
        const step = Math.max(1, Math.floor(dayTimestamps.length / 5));
        const ticks = [];
        for (let i = 0; i < dayTimestamps.length; i += step) {
            ticks.push(dayTimestamps[i]);
        }
        return ticks.length > 0 ? ticks : undefined;
    }

    if (period === '3M' || period === '1Y') {
        // Collect the exact first trading day of each calendar month (`May`, `Jun`, `Jul`)
        const seenMonths = new Set();
        const ticks = [];
        chartData.forEach((item) => {
            if (!item.timestamp) return;
            const dt = new Date(item.timestamp);
            if (isNaN(dt.getTime())) return;
            const monthKey = dt.getFullYear() + '-' + dt.getMonth();
            if (!seenMonths.has(monthKey)) {
                seenMonths.add(monthKey);
                ticks.push(item.timestamp);
            }
        });
        return ticks.length > 0 ? ticks : undefined;
    }

    if (period === 'ALL') {
        const minMs = new Date(chartData[0].timestamp).getTime();
        const maxMs = new Date(chartData[chartData.length - 1].timestamp).getTime();
        if (isNaN(minMs) || isNaN(maxMs)) return undefined;

        const spanYears = (new Date(maxMs).getFullYear() - new Date(minMs).getFullYear());
        const ticks = [];
        const startDt = new Date(minMs);
        if (spanYears >= 2) {
            // Project exact Jan 1 of each calendar year (`2022`, `2023`, `2024`...)
            let curr = new Date(startDt.getFullYear() + (startDt.getMonth() === 0 && startDt.getDate() === 1 ? 0 : 1), 0, 1, 0, 0, 0, 0);
            while (curr.getTime() <= maxMs) {
                ticks.push(curr.getTime());
                curr = new Date(curr.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
            }
        } else {
            // Project exact 1st of each month
            let curr = new Date(startDt.getFullYear(), startDt.getMonth(), 1, 0, 0, 0, 0);
            while (curr.getTime() <= maxMs) {
                if (curr.getTime() >= minMs) ticks.push(curr.getTime());
                curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1, 0, 0, 0, 0);
            }
        }
        return ticks.length > 0 ? ticks : undefined;
    }

    return undefined;
}

/**
 * Helper to cleanly format X-axis date/time ticks based on active timeframe
 */
function formatXAxisTick(timestamp, period) {
    if (!timestamp) return '';
    try {
        const dt = new Date(timestamp);
        if (isNaN(dt.getTime())) return timestamp;

        if (period === '1D') {
            return dt.toLocaleTimeString('en-US', { hour: 'numeric' }); // e.g. "10 AM", "1 PM"
        }
        if (period === '1W' || period === '1M') {
            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Jul 7", "Jul 15"
        }
        if (period === '3M' || period === '1Y') {
            return dt.toLocaleDateString('en-US', { month: 'short' }); // e.g. "May", "Jun", "Jul"
        }
        // ALL
        return dt.toLocaleDateString('en-US', { year: 'numeric' }); // e.g. "2024", "2026"
    } catch {
        return timestamp;
    }
}

/**
 * Component: StockAnalysisModalContent
 * Description: Pure presentation layer for the historical analysis modal.
 * Props:
 *   - symbol (string): Stock ticker
 *   - chartData (Array): Time series dataset [{ timestamp, price, volume }]
 *   - metadata (Object): Fundamental indicators and current pricing
 *   - period (string): Active timeframe ('1D', '1W', '1M', '3M', '1Y', 'ALL')
 *   - setPeriod (function): Callback to switch timeframe
 *   - loading (boolean): Network status indicator
 *   - error (string|null): Error message if API request fails
 *   - onClose (function): Callback to close modal
 */
function StockAnalysisModalContent({
    symbol,
    chartData = [],
    metadata = {},
    period = '1M',
    setPeriod,
    loading = false,
    error = null,
    onClose
}) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const currentTimeStr = currentTime.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    }).toUpperCase();

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

    const processedChartData = useMemo(() => {
        return (chartData || []).map(item => ({
            ...item,
            timeMs: new Date(item.timestamp).getTime()
        })).filter(item => !isNaN(item.timeMs));
    }, [chartData]);

    const yAxisConfig = computeCleanYAxis(processedChartData);
    const xAxisTicks = computeCleanXAxisTicks(processedChartData, period);

    return (
        <div
            className="stock-modal-backdrop"
            onClick={(e) => {
                if (e.target === e.currentTarget && onClose) onClose();
            }}
        >
            <div className="stock-modal-container">
                {/* Header */}
                <div className="stock-modal-header">
                    <div className="stock-modal-title-area">
                        <div className="stock-modal-live-clock">
                            <span className="live-dot" /> LIVE AS OF {currentTimeStr}
                        </div>
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
                                onClick={() => setPeriod && setPeriod(tf)}
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

                    {processedChartData.length > 0 && (
                        <ResponsiveContainer width="100%" height={340}>
                            <AreaChart
                                data={processedChartData}
                                margin={{ top: 15, right: 15, left: 0, bottom: 15 }}
                            >
                                <defs>
                                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={themeColor} stopOpacity={0.35} />
                                        <stop offset="95%" stopColor={themeColor} stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.08)" />
                                <XAxis
                                    dataKey={period === '1D' || period === 'ALL' ? 'timeMs' : 'timestamp'}
                                    type={period === '1D' || period === 'ALL' ? 'number' : 'category'}
                                    scale={period === '1D' || period === 'ALL' ? 'time' : 'auto'}
                                    domain={period === '1D' || period === 'ALL' ? ['dataMin', 'dataMax'] : undefined}
                                    hide={false}
                                    ticks={xAxisTicks}
                                    tickFormatter={(val) => formatXAxisTick(val, period)}
                                    minTickGap={8}
                                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                                    axisLine={{ stroke: 'rgba(226, 232, 240, 0.15)' }}
                                    tickLine={false}
                                    dy={6}
                                />
                                <YAxis
                                    domain={yAxisConfig.domain}
                                    ticks={yAxisConfig.ticks}
                                    hide={false}
                                    orientation="left"
                                    tickFormatter={(val) => `$${Number(val).toFixed(yAxisConfig.step < 1 ? 1 : 0)}`}
                                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={60}
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

export default StockAnalysisModalContent;
