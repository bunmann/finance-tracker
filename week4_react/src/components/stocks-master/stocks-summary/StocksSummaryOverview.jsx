// ============================================================================
// File: StocksSummaryOverview.jsx
// Description: Smart container managing API fetching for the top-level Stocks Summary.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../../../api';
import StocksSummaryContent from './StocksSummaryContent';
import '../../../styles/StockPortfolio.css';

/**
 * Component: StocksSummaryOverview
 * Description: Smart container fetching overall stock portfolio metrics and status.
 */
function StocksSummaryOverview({ showToast }) {
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPortfolio = () => {
        api.get('/stocks/portfolio')
            .then(response => {
                setPortfolio(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching portfolio summary:', error);
                showToast?.('Failed to load stock summary.', 'error');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    return (
        <StocksSummaryContent
            portfolio={portfolio}
            loading={loading}
        />
    );
}

export default StocksSummaryOverview;
