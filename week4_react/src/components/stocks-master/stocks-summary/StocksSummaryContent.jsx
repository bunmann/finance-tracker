// ============================================================================
// File: StocksSummaryContent.jsx
// Description: Pure presenter rendering KPI cards, top holdings overview, and
//              screener highlights for the Stocks Summary view.
// ============================================================================
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import MetricCard from '../../common/data-display/MetricCard';
import AlertBanner from '../../common/feedback/AlertBanner';
import EmptyState from '../../common/data-display/EmptyState';
import { CURRENCY } from '../../../utils/config';
import { staggerContainer } from '../../../utils/animations';
import { getRefreshLabel, getPnlClass } from '../../../utils/helpers';

/**
 * Component: StocksSummaryContent
 * Description: Dumb presenter for stock summary dashboard.
 */
function StocksSummaryContent({ portfolio, loading, lastRefreshed }) {
    const refreshLabel = getRefreshLabel(lastRefreshed);

    const holdings = portfolio?.holdings || [];
    const topHoldings = [...holdings].sort((a, b) => (b.current_value || 0) - (a.current_value || 0)).slice(0, 5);

    return (
        <div className="stocks-page page-container">
            {/* Title Header - renders instantly */}
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="dashboard-title">Stocks & Investments Summary ({CURRENCY})</h2>
                    <p style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        High-level capital compounding performance and asset allocation overview.
                        {refreshLabel && (
                            <span style={{ fontSize: '11px', fontStyle: 'italic', opacity: 0.55 }}>
                                &middot; Prices refreshed {refreshLabel}
                            </span>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link to="/stocks/portfolio" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <span className="material-symbols-outlined">monitoring</span>
                        <span>Manage Holdings</span>
                    </Link>
                    <Link to="/stocks/screener" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <span className="material-symbols-outlined">saved_search</span>
                        <span>Quantitative Scan</span>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="spinner-container" style={{ marginTop: '40px' }}>
                    <div className="spinner"></div>
                </div>
            ) : !portfolio ? (
                <EmptyState
                    icon="trending_up"
                    title="No Portfolio Data Available"
                    message="Failed to load portfolio details."
                />
            ) : (
                <>
                    {portfolio.warning && (
                        <AlertBanner
                            type="warning"
                            message={portfolio.warning}
                            icon="warning"
                        />
                    )}

                    <motion.div
                        className="portfolio-totals"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                    >
                        <MetricCard
                            title={`Total Value (${CURRENCY})`}
                            value={portfolio.total_value}
                        />
                        <MetricCard
                            title={`Total Cost (${CURRENCY})`}
                            value={portfolio.total_cost}
                        />
                        <MetricCard
                            title={`Total P&L (${CURRENCY})`}
                            value={portfolio.total_gain}
                            className={getPnlClass(portfolio.total_gain)}
                            prefix={portfolio.total_gain !== null && portfolio.total_gain >= 0 ? '+$' : '$'}
                        />
                        <MetricCard
                            title={`Realized P&L (${CURRENCY})`}
                            value={portfolio.total_realized_gain}
                            className={getPnlClass(portfolio.total_realized_gain)}
                            prefix={portfolio.total_realized_gain !== null && portfolio.total_realized_gain >= 0 ? '+$' : '$'}
                        />
                    </motion.div>

                    {/* Quick Overview Sections */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                        {/* Left Card: Top Holdings Breakdown */}
                        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--on-surface)' }}>Top Allocation Holdings</h3>
                                <Link to="/stocks/portfolio" style={{ fontSize: '13px', color: 'var(--primary-container)', textDecoration: 'none', fontWeight: '600' }}>View All ({holdings.length}) →</Link>
                            </div>
                            {topHoldings.length === 0 ? (
                                <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', margin: '20px 0' }}>No active stock holdings found. Add trades or upload a CSV in the Stocks management view.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {topHoldings.map(item => {
                                        const pnl = (item.current_value || 0) - (item.total_cost || 0);
                                        const pnlClass = getPnlClass(pnl);
                                        return (
                                            <div key={item.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--surface-container)', borderRadius: '8px' }}>
                                                <div>
                                                    <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--on-surface)' }}>{item.ticker}</span>
                                                    <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginLeft: '8px' }}>{item.shares} shares</span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '600', color: 'var(--on-surface)' }}>${(item.current_value || 0).toFixed(2)}</div>
                                                    <div className={pnlClass} style={{ fontSize: '12px', fontWeight: '600' }}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right Card: Screening & Multi-Strategy Intelligence */}
                        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', fontSize: '28px' }}>troubleshoot</span>
                                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--on-surface)' }}>Quantitative Anomaly Intelligence</h3>
                                </div>
                                <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', lineHeight: '1.6' }}>
                                    Your portfolio holdings are continuously evaluated against fundamental momentum criteria (FCF Growth, Profit Margins, Debt/Equity) and checked for short-term price/revenue divergence (Value Gaps).
                                </p>
                                <div style={{ background: 'var(--surface-container)', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface)', fontWeight: '600', fontSize: '14px' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary-container)' }}>verified</span>
                                        <span>Automated Strategy Scan Ready</span>
                                    </div>
                                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                                        Run multi-strategy scans across TSX/US blue chips to identify mispriced quality assets within your Circle of Competence.
                                    </p>
                                </div>
                            </div>
                            <div style={{ marginTop: '24px', textAlign: 'right' }}>
                                <Link to="/stocks/screener" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Launch Screener Terminal</span>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default StocksSummaryContent;
