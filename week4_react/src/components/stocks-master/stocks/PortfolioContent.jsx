// ============================================================================
// File: PortfolioContent.jsx
// Description: Presenter component rendering portfolio statistics, holdings table,
//              buy/sell forms, and historical trade transactions.
// ============================================================================
import React from 'react';
import { motion } from 'framer-motion';
import MetricCard from '../../common/data-display/MetricCard';
import AlertBanner from '../../common/feedback/AlertBanner';
import BrokerageCsvUpload from './components/BrokerageCsvUpload';
import StockHoldings from './components/StockHoldings';
import StockForm from './components/StockForm';
import StockTransactions from './components/StockTransactions';
import EmptyState from '../../common/data-display/EmptyState';
import CollapsibleFormSection from '../../common/layout/CollapsibleFormSection';
import { CURRENCY } from '../../../utils/config';
import { staggerContainer } from '../../../utils/animations';
import { getRefreshLabel, getPnlClass } from '../../../utils/helpers';

/**
 * Component: PortfolioContent
 * Description: Dumb presenter for stock portfolio.
 */
function PortfolioContent({
    portfolio,
    loading,
    lastRefreshed,
    refreshTransactionsTrigger,
    handleTradeComplete,
    showToast,
    onOpenModal
}) {
    const refreshLabel = getRefreshLabel(lastRefreshed);

    return (
        <div className="stocks-page page-container">
            {/* Title Header - renders instantly on tab click */}
            <div className="dashboard-header">
                <div>
                    <h2 className="dashboard-title">Stock Portfolio ({CURRENCY})</h2>
                    {refreshLabel && (
                        <p className="portfolio-note">
                            Prices refreshed {refreshLabel} &middot; auto-updates every 15 min
                        </p>
                    )}
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
                    {/* Warning Banner */}
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

                    {/* Holdings Table */}
                    <StockHoldings holdings={portfolio.holdings} onOpenModal={onOpenModal} />

                    {/* Buy/Sell & CSV Import Forms */}
                    <CollapsibleFormSection
                        title="Buy, Sell or Import Stocks"
                        activeTitle="Hide Trade & Import Tools"
                        icon="trending_up"
                        activeIcon="remove_circle"
                        defaultOpen={false}
                    >
                        <div className="stock-forms">
                            <StockForm type="buy" onComplete={handleTradeComplete} showToast={showToast} />
                            <StockForm type="sell" onComplete={handleTradeComplete} showToast={showToast} />
                        </div>
                        <BrokerageCsvUpload onBrokerageImportComplete={handleTradeComplete} />
                    </CollapsibleFormSection>

                    {/* Transaction History */}
                    <StockTransactions refreshTrigger={refreshTransactionsTrigger} showToast={showToast} />
                </>
            )}
        </div>
    );
}

export default PortfolioContent;
