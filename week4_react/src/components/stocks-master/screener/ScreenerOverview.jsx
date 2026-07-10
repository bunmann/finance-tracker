// ============================================================================
// File: ScreenerOverview.jsx
// Description: Parent container component coordinating state, API scans,
//              and delegating visual layout rendering to ScreenerContent.
// ============================================================================
import { useState } from 'react';
import api from '../../../api';
import ScreenerContent from './ScreenerContent';
import '../../../styles/Screener.css';

/**
 * Component: ScreenerOverview (Container)
 * Description: Coordinates quantitative parameters, loading states, and network
 *              requests for stock scan results. Consumes synchronized competence
 *              sectors from StocksMaster via props.
 */
function ScreenerOverview({ showToast, competenceSectors = [] }) {
    // Screener Slider States
    const [minFcfGrowth, setMinFcfGrowth] = useState(20);       // Percentage (20 = 20%)
    const [minProfitMargin, setMinProfitMargin] = useState(15);  // Percentage (15 = 15%)
    const [maxDebtEquity, setMaxDebtEquity] = useState(1.0);     // Ratio
    const [maxPe, setMaxPe] = useState(25.0);                    // Ratio
    const [circleOfCompetenceOnly, setCircleOfCompetenceOnly] = useState(false);

    // Navigation & Data States
    const [activeTab, setActiveTab] = useState('overview');      // 'overview' | 'screener' | 'alerts'
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Normalize incoming competenceSectors prop for table row matching
    const formattedCompetenceSectors = competenceSectors
        .map(c => (typeof c === 'object' ? c.sector : c)?.toLowerCase().trim())
        .filter(Boolean);

    const handleRunScan = (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            min_fcf_growth: parseFloat(minFcfGrowth) / 100.0,
            min_profit_margin: parseFloat(minProfitMargin) / 100.0,
            max_debt_equity: parseFloat(maxDebtEquity),
            max_pe: parseFloat(maxPe),
            circle_of_competence_only: circleOfCompetenceOnly
        };

        api.post('/screener/scan', payload)
            .then(res => {
                setResults(res.data);
                setLoading(false);
                showToast?.('Quantitative market scan completed successfully!', 'success');
            })
            .catch(err => {
                console.error('Scan failed:', err);
                setError('Failed to execute quantitative scan. Please try again.');
                showToast?.('Market scan failed.', 'error');
                setLoading(false);
            });
    };

    // Helper to render colored badges for stock relationship sources
    const renderSourceBadge = (source) => {
        const clean = (source || 'recommendation').toLowerCase();
        return <span className={`source-badge badge-${clean}`}>{clean}</span>;
    };

    return (
        <ScreenerContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            minFcfGrowth={minFcfGrowth}
            setMinFcfGrowth={setMinFcfGrowth}
            minProfitMargin={minProfitMargin}
            setMinProfitMargin={setMinProfitMargin}
            maxDebtEquity={maxDebtEquity}
            setMaxDebtEquity={setMaxDebtEquity}
            maxPe={maxPe}
            setMaxPe={setMaxPe}
            circleOfCompetenceOnly={circleOfCompetenceOnly}
            setCircleOfCompetenceOnly={setCircleOfCompetenceOnly}
            results={results}
            loading={loading}
            error={error}
            competenceSectors={formattedCompetenceSectors}
            handleRunScan={handleRunScan}
            renderSourceBadge={renderSourceBadge}
        />
    );
}

export default ScreenerOverview;
