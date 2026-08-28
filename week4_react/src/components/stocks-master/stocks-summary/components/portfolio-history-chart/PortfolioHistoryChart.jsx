// ============================================================================
// File: PortfolioHistoryChart.jsx
// Description: Smart Container component for the Aggregated Portfolio Compounding Chart.
//              Manages active timeframe state, handles API calls to GET /stocks/portfolio/chart,
//              and passes clean data to PortfolioHistoryChartContent.
// ============================================================================
import React, { useState, useEffect } from 'react';
import api from '../../../../../api';
import PortfolioHistoryChartContent from './PortfolioHistoryChartContent';

/**
 * Component: PortfolioHistoryChart
 * Description: Smart container wrapping PortfolioHistoryChartContent.
 */
function PortfolioHistoryChart() {
    const [period, setPeriod] = useState('1M');
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        api.get('/stocks/portfolio/chart', { params: { period } })
            .then((res) => {
                if (!isMounted) return;
                const data = res.data?.chart || [];
                setChartData(data);
                setLoading(false);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error('Failed to load portfolio compounding chart:', err);
                setError(err.response?.data?.detail || 'Could not load portfolio historical valuation chart.');
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [period]);

    return (
        <PortfolioHistoryChartContent
            chartData={chartData}
            period={period}
            onSelectPeriod={setPeriod}
            loading={loading}
            error={error}
        />
    );
}

export default PortfolioHistoryChart;
