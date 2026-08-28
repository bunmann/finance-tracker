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
import HoldingMiniCard from './components/HoldingMiniCard';
import PortfolioHistoryChart from './components/portfolio-history-chart/PortfolioHistoryChart';
import WatchlistManager from '../watchlist/components/WatchlistManager';
import SectorCompetenceManager from '../watchlist/components/SectorCompetenceManager';
import '../watchlist/Watchlist.css';
import './StocksSummary.css';

/**
 * Component: StocksSummaryContent
 * Description: Dumb presenter for stock summary dashboard.
 */
function StocksSummaryContent({
    portfolio,
    loading,
    lastRefreshed,
    watchlistItems = [],
    competenceSectors = [],
    onAddToWatchlist,
    onRemoveFromWatchlist,
    onAddCompetenceSector,
    onRemoveCompetenceSector,
    extraLoading,
    onOpenModal
}) {
    const refreshLabel = getRefreshLabel(lastRefreshed);

    const holdings = portfolio?.holdings || [];
    const topHoldings = [...holdings].sort((a, b) => (b.market_value || 0) - (a.market_value || 0)).slice(0, 5);

    return (
        <div className="stocks-page stocks-summary-page page-container">
            {/* Title Header - renders instantly */}
            <div className="dashboard-header summary-header-row">
                <div>
                    <h2 className="dashboard-title">Stocks & Investments Summary ({CURRENCY})</h2>
                    <p className="summary-header-sub">
                        High-level capital compounding performance and asset allocation overview.
                        {refreshLabel && (
                            <span className="summary-refresh-note">
                                &middot; Prices refreshed {refreshLabel}
                            </span>
                        )}
                    </p>
                </div>
                <div className="summary-action-btns">
                    <Link to="/stocks/portfolio" className="btn btn-primary summary-action-btn">
                        <span className="material-symbols-outlined">monitoring</span>
                        <span>Manage Holdings</span>
                    </Link>
                    <Link to="/stocks/screener" className="btn btn-secondary summary-action-btn">
                        <span className="material-symbols-outlined">saved_search</span>
                        <span>Quantitative Scan</span>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="spinner-container spinner-container--page">
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

                    {/* Aggregated Portfolio Valuation & Compounding Chart */}
                    {/* TEMPORARILY DISABLED: Historical Capital Compounding feature is currently broken.
                        TODO: Fix backend currency/deduplication issue before re-enabling. */}
                    {/* <PortfolioHistoryChart /> */}

                    {/* Quick Overview Sections */}
                    <div className="summary-grid">
                        {/* Left Card: Top Holdings Breakdown */}
                        <div className="card summary-section-card">
                            <div className="summary-card-header">
                                <h3 className="summary-card-title">Top Allocation Holdings</h3>
                                <Link to="/stocks/portfolio" className="summary-card-link">View All ({holdings.length}) →</Link>
                            </div>
                            {topHoldings.length === 0 ? (
                                <p className="summary-no-holdings-note">No active stock holdings found. Add trades or upload a CSV in the Stocks management view.</p>
                            ) : (
                                <div className="top-holdings-list">
                                    {topHoldings.map(item => (
                                        <HoldingMiniCard key={item.ticker} holding={item} onOpenModal={onOpenModal} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Card: Screening & Multi-Strategy Intelligence */}
                        <div className="card summary-section-card summary-card-right">
                            <div>
                                <div className="strategy-icon-heading">
                                    <span className="material-symbols-outlined strategy-main-icon">troubleshoot</span>
                                    <h3 className="summary-card-title">Quantitative Anomaly Intelligence</h3>
                                </div>
                                <p className="strategy-description">
                                    Your portfolio holdings are continuously evaluated against fundamental momentum criteria (FCF Growth, Profit Margins, Debt/Equity) and checked for short-term price/revenue divergence (Value Gaps).
                                </p>
                                <div className="strategy-status-box">
                                    <div className="strategy-status-header">
                                        <span className="material-symbols-outlined strategy-verified-icon">verified</span>
                                        <span>Automated Strategy Scan Ready</span>
                                    </div>
                                    <p className="strategy-status-text">
                                        Run multi-strategy scans across TSX/US blue chips to identify mispriced quality assets within your Circle of Competence.
                                    </p>
                                </div>
                            </div>
                            <div className="strategy-cta-wrapper">
                                <Link to="/stocks/screener" className="btn btn-primary summary-action-btn">
                                    <span>Launch Screener Terminal</span>
                                    <span className="material-symbols-outlined summary-arrow-sm">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Second Grid: Active Watchlist & Circle of Competence */}
                    <div className="watchlist-grid summary-watchlist-grid">
                        <WatchlistManager
                            items={watchlistItems}
                            onAddToWatchlist={onAddToWatchlist}
                            onRemoveFromWatchlist={onRemoveFromWatchlist}
                            loading={extraLoading}
                            onOpenModal={onOpenModal}
                        />
                        <SectorCompetenceManager
                            sectors={competenceSectors}
                            onAddCompetenceSector={onAddCompetenceSector}
                            onRemoveCompetenceSector={onRemoveCompetenceSector}
                            loading={extraLoading}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default StocksSummaryContent;
