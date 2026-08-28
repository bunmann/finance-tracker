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
import { computeCleanYAxis, computeCleanXAxisTicks, formatXAxisTick } from '../../../../../utils/chartHelpers';
import ChartTooltip from '../../../../common/data-display/ChartTooltip';
import './StockAnalysisModal.css';

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
                                    content={
                                        <ChartTooltip
                                            rows={[
                                                { label: 'Price:', getValue: (d) => `$${Number(d.price).toFixed(2)}`, valueClass: 'positive' },
                                                { label: 'Volume:', getValue: (d) => d.volume > 0 ? Number(d.volume).toLocaleString() : null, valueClass: 'tooltip-val--div' }
                                            ]}
                                        />
                                    }
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
