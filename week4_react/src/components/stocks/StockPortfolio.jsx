// ============================================================================
// File: StockPortfolio.jsx
// Description: Main stock portfolio page with holdings, buy/sell forms,
//              and transaction history.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../../api';
import MetricCard from '../common/MetricCard';
import AlertBanner from '../common/AlertBanner';
import BrokerageCsvUpload from './BrokerageCsvUpload';
import StockHoldings from './StockHoldings';
import StockForm from './StockForm';
import StockTransactions from './StockTransactions';
import '../../styles/StockPortfolio.css';

/**
 * Component: StockPortfolio
 * Description: Renders the stock portfolio page including summary cards,
 *              stale price alerts, holdings tables, forms, and trade ledger.
 * Props:
 *   - showToast (Function): Global toast callback to display alerts/success messages.
 */
function StockPortfolio({ showToast }) {
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshTransactionsTrigger, setRefreshTransactionsTrigger] = useState(0);

    const fetchPortfolio = () => {
        api.get('/stocks/portfolio')
            .then(response => {
                setPortfolio(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching portfolio:', error);
                showToast?.('Failed to load portfolio.', 'error');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const handleTradeComplete = () => {
        fetchPortfolio();
        setRefreshTransactionsTrigger(prev => prev + 1);
    };

    if (loading) {
        return (
            <div className="spinner-container">
                <div className="spinner"></div>
            </div>
        );
    }

    // Determine color class for P&L card
    let gainClass = '';
    if (portfolio && portfolio.total_gain !== null) {
        gainClass = portfolio.total_gain >= 0 ? 'gain-text' : 'loss-text';
    }

    return (
        <div className="stocks-page page-container">
            <div className="portfolio-header">
                <h2>📈 Stock Portfolio</h2>
                
                {/* Warning Banner */}
                {portfolio?.warning && (
                    <AlertBanner 
                        type="warning" 
                        message={portfolio.warning} 
                        icon="warning" 
                    />
                )}

                {portfolio && (
                    <div className="portfolio-totals">
                        <MetricCard
                            title="Total Value"
                            value={portfolio.total_value}
                        />
                        <MetricCard
                            title="Total Cost"
                            value={portfolio.total_cost}
                        />
                        <MetricCard
                            title="Total P&L"
                            value={portfolio.total_gain}
                            className={gainClass}
                            prefix={portfolio.total_gain !== null && portfolio.total_gain >= 0 ? '+$' : '$'}
                        />
                        <MetricCard
                            title="Realized P&L"
                            value={portfolio.total_realized_gain}
                            className={portfolio.total_realized_gain >= 0 ? 'gain-text' : 'loss-text'}
                            prefix={portfolio.total_realized_gain !== null && portfolio.total_realized_gain >= 0 ? '+$' : '$'}
                        />
                    </div>
                )}
            </div>

            {/* Holdings Table */}
            <StockHoldings holdings={portfolio?.holdings} />

            {/* Buy/Sell Forms */}
            <div className="stock-forms">
                <StockForm type="buy" onComplete={handleTradeComplete} showToast={showToast} />
                <StockForm type="sell" onComplete={handleTradeComplete} showToast={showToast} />
            </div>

            {/* CSV Import */}
            <BrokerageCsvUpload onBrokerageImportComplete={handleTradeComplete} />

            {/* Transaction History */}
            <StockTransactions refreshTrigger={refreshTransactionsTrigger} showToast={showToast} />
        </div>
    );
}

    export default StockPortfolio;
