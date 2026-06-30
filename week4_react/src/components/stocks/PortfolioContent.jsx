// ============================================================================
// File: PortfolioContent.jsx
// Description: Presenter component rendering portfolio statistics, holdings table,
//              buy/sell forms, and historical trade transactions.
// ============================================================================
import React from 'react';
import { motion } from 'framer-motion';
import MetricCard from '../common/data-display/MetricCard';
import AlertBanner from '../common/feedback/AlertBanner';
import BrokerageCsvUpload from './BrokerageCsvUpload';
import StockHoldings from './StockHoldings';
import StockForm from './StockForm';
import StockTransactions from './StockTransactions';
import EmptyState from '../common/data-display/EmptyState';
import { CURRENCY } from '../../utils/config';
import { staggerContainer } from '../../utils/animations';

/**
 * Component: PortfolioContent
 * Description: Dumb presenter for stock portfolio.
 */
function PortfolioContent({
    portfolio,
    loading,
    refreshTransactionsTrigger,
    handleTradeComplete,
    showToast
}) {
    // Determine color class for P&L card
    let gainClass = '';
    if (portfolio && portfolio.total_gain !== null) {
        gainClass = portfolio.total_gain >= 0 ? 'gain-text' : 'loss-text';
    }

    return (
        <div className="stocks-page page-container">
            {/* Title Header - renders instantly on tab click */}
            <div className="dashboard-header">
                <h2 className="dashboard-title">Stock Portfolio ({CURRENCY})</h2>
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
                            className={gainClass}
                            prefix={portfolio.total_gain !== null && portfolio.total_gain >= 0 ? '+$' : '$'}
                        />
                        <MetricCard
                            title={`Realized P&L (${CURRENCY})`}
                            value={portfolio.total_realized_gain}
                            className={portfolio.total_realized_gain >= 0 ? 'gain-text' : 'loss-text'}
                            prefix={portfolio.total_realized_gain !== null && portfolio.total_realized_gain >= 0 ? '+$' : '$'}
                        />
                    </motion.div>

                    {/* Holdings Table */}
                    <StockHoldings holdings={portfolio.holdings} />

                    {/* Buy/Sell Forms */}
                    <div className="stock-forms">
                        <StockForm type="buy" onComplete={handleTradeComplete} showToast={showToast} />
                        <StockForm type="sell" onComplete={handleTradeComplete} showToast={showToast} />
                    </div>

                    {/* CSV Import */}
                    <BrokerageCsvUpload onBrokerageImportComplete={handleTradeComplete} />

                    {/* Transaction History */}
                    <StockTransactions refreshTrigger={refreshTransactionsTrigger} showToast={showToast} />
                </>
            )}
        </div>
    );
}

export default PortfolioContent;
