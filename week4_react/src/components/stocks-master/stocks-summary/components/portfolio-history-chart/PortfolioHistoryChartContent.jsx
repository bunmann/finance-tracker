// ============================================================================
// File: PortfolioHistoryChartContent.jsx
// Description: Pure Presenter component for the Aggregated Portfolio Compounding Chart.
//              Renders Recharts area curves with adaptive axes and custom hover tooltips.
// ============================================================================
import React, { useMemo } from 'react';
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
import './PortfolioHistoryChart.css';

const TIMEFRAMES = ['1M', '3M', '1Y', 'ALL'];

/**
 * Component: PortfolioHistoryChartContent
 * Description: Dumb presenter for portfolio compounding history.
 */
function PortfolioHistoryChartContent({
    chartData = [],
    period = '1M',
    onSelectPeriod,
    loading = false,
    error = null
}) {
    // Preprocess dataset with numeric timeMs coordinates for Recharts time projection
    const processedChart = useMemo(() => {
        return (chartData || []).map(item => ({
            ...item,
            timeMs: new Date(item.timestamp).getTime()
        })).filter(item => !isNaN(item.timeMs));
    }, [chartData]);

    // Compute clean bounds across both portfolio value and cost basis
    const yAxisConfig = useMemo(() => {
        return computeCleanYAxis(processedChart, ['portfolio_value', 'total_cost']);
    }, [processedChart]);

    const xAxisTicks = useMemo(() => {
        return computeCleanXAxisTicks(processedChart, period);
    }, [processedChart, period]);

    // Summary header calculations from the latest data point
    const latestPoint = processedChart.length > 0 ? processedChart[processedChart.length - 1] : null;
    const firstPoint = processedChart.length > 0 ? processedChart[0] : null;

    const latestValue = latestPoint ? parseFloat(latestPoint.portfolio_value || 0) : 0;
    const latestCost = latestPoint ? parseFloat(latestPoint.total_cost || 0) : 0;
    const totalPnl = latestValue - latestCost;
    const totalPnlPct = latestCost > 0 ? (totalPnl / latestCost) * 100 : 0;

    const pnlSign = totalPnl >= 0 ? '+' : '';
    const pnlClass = totalPnl >= 0 ? 'positive' : 'negative';

    return (
        <div className="portfolio-history-card">
            {/* Header Row */}
            <div className="portfolio-history-header">
                <div className="portfolio-history-title-area">
                    <h3 className="portfolio-history-title">
                        <span className="material-symbols-outlined" style={{ color: '#00D166' }}>monitoring</span>
                        <span>Historical Capital Compounding</span>
                    </h3>
                    <p className="portfolio-history-sub">
                        Daily portfolio market valuation curve compared against cumulative cost basis over time.
                    </p>
                </div>

                <div className="portfolio-history-timeframes">
                    {TIMEFRAMES.map(tf => (
                        <button
                            key={tf}
                            type="button"
                            className={`portfolio-timeframe-btn ${period === tf ? 'active' : ''}`}
                            onClick={() => onSelectPeriod && onSelectPeriod(tf)}
                            disabled={loading}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Headline Statistics Box */}
            <div className="portfolio-history-summary-stats">
                <div className="portfolio-stat-item">
                    <span className="portfolio-stat-label">Current Market Value</span>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="portfolio-stat-value">
                            ${latestValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <div className="portfolio-stat-item" style={{ borderLeft: '1px solid rgba(226, 232, 240, 0.1)', paddingLeft: '24px' }}>
                    <span className="portfolio-stat-label">Invested Cost Basis</span>
                    <span className="portfolio-stat-value" style={{ color: '#818CF8' }}>
                        ${latestCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="portfolio-stat-item" style={{ borderLeft: '1px solid rgba(226, 232, 240, 0.1)', paddingLeft: '24px' }}>
                    <span className="portfolio-stat-label">All-Time Unrealized P&L</span>
                    <span className="portfolio-stat-value" style={{ color: totalPnl >= 0 ? '#00D166' : '#FF3B3B' }}>
                        {pnlSign}${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', marginLeft: '6px' }}>
                            ({pnlSign}{totalPnlPct.toFixed(2)}%)
                        </span>
                    </span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="portfolio-chart-canvas-area">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '340px' }}>
                        <div className="spinner"></div>
                    </div>
                ) : error ? (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '340px', color: '#FF3B3B' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '36px', marginBottom: '8px' }}>error</span>
                        <p style={{ margin: 0 }}>{error}</p>
                    </div>
                ) : processedChart.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '340px', color: '#94A3B8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '36px', marginBottom: '8px' }}>show_chart</span>
                        <p style={{ margin: 0 }}>No historical portfolio valuation data yet. Add stock holdings to generate your compounding curve.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={340}>
                        <AreaChart
                            data={processedChart}
                            margin={{ top: 15, right: 15, left: 0, bottom: 15 }}
                        >
                            <defs>
                                <linearGradient id="portfolioValGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00D166" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#00D166" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.08)" />
                            
                            <XAxis
                                dataKey={period === 'ALL' || period === 'MAX' ? 'timeMs' : 'timestamp'}
                                type={period === 'ALL' || period === 'MAX' ? 'number' : 'category'}
                                scale={period === 'ALL' || period === 'MAX' ? 'time' : 'auto'}
                                domain={period === 'ALL' || period === 'MAX' ? ['dataMin', 'dataMax'] : undefined}
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
                                tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
                                tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                                axisLine={false}
                                tickLine={false}
                                width={65}
                            />

                            <Tooltip
                                content={
                                    <ChartTooltip
                                        getDateLabel={(ts) => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                        rows={[
                                            { label: 'Portfolio Value:', getValue: (d) => `$${Number(d.portfolio_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valueClass: 'tooltip-val--total' },
                                            { label: 'Total Cost Basis:', getValue: (d) => `$${Number(d.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valueClass: 'tooltip-val--cost' },
                                            {
                                                label: 'Unrealized P&L:',
                                                getValue: (d) => {
                                                    const pnl = Number(d.portfolio_value || 0) - Number(d.total_cost || 0);
                                                    const pct = Number(d.total_cost || 0) > 0 ? (pnl / Number(d.total_cost || 0)) * 100 : 0;
                                                    const sign = pnl >= 0 ? '+' : '';
                                                    return `${sign}$${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${Number(d.total_cost || 0) > 0 ? ` (${sign}${pct.toFixed(2)}%)` : ''}`;
                                                },
                                                valueClass: (d) => (Number(d.portfolio_value || 0) - Number(d.total_cost || 0)) >= 0 ? 'positive' : 'negative'
                                            },
                                            { label: 'Total Dividends:', getValue: (d) => Number(d.total_dividends || 0) > 0 ? `+$${Number(d.total_dividends).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null, valueClass: 'tooltip-val--div', topBorder: true }
                                        ]}
                                    />
                                }
                                cursor={{ stroke: 'rgba(226, 232, 240, 0.25)', strokeWidth: 1 }}
                            />

                            {/* Invested Cost Basis Baseline (Indigo Dash) */}
                            <Area
                                type="monotone"
                                dataKey="total_cost"
                                stroke="#6366F1"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                fill="transparent"
                                isAnimationActive={true}
                                animationDuration={600}
                            />

                            {/* Total Market Value Curve (Emerald Green Fill) */}
                            <Area
                                type="monotone"
                                dataKey="portfolio_value"
                                stroke="#00D166"
                                strokeWidth={2.5}
                                fill="url(#portfolioValGrad)"
                                isAnimationActive={true}
                                animationDuration={600}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Chart Legend */}
            {processedChart.length > 0 && (
                <div className="portfolio-chart-legend">
                    <div className="legend-item">
                        <span className="legend-dot legend-dot--val"></span>
                        <span>Portfolio Market Value</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot legend-dot--cost"></span>
                        <span>Total Invested Cost Basis</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PortfolioHistoryChartContent;
