// ============================================================================
// File: PortfolioOverview.jsx
// Description: Main stock portfolio page container managing data fetching.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../../api';
import PortfolioContent from './PortfolioContent';
import '../../styles/StockPortfolio.css';

/**
 * Component: PortfolioOverview
 * Description: Smart container managing API fetching and callbacks for stock portfolio.
 */
function PortfolioOverview({ showToast }) {
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

    return (
        <PortfolioContent
            portfolio={portfolio}
            loading={loading}
            refreshTransactionsTrigger={refreshTransactionsTrigger}
            handleTradeComplete={handleTradeComplete}
            showToast={showToast}
        />
    );
}

export default PortfolioOverview;
