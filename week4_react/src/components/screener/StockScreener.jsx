// ============================================================================
// File: StockScreener.jsx
// Description: Multi-strategy quantitative market screener and anomalies panel.
// ============================================================================
import { useState, useEffect } from 'react';
import api from '../../api';
import AlertBanner from '../common/feedback/AlertBanner';
import FilterSidebar from '../common/layout/FilterSidebar';
import MomentumTable from './MomentumTable';
import ValueGapAlerts from './ValueGapAlerts';
import ScreenerOverview from './ScreenerOverview';
import '../../styles/Screener.css';

/**
 * Component: StockScreener
 * Description: Main quantitative screener container coordinating state, API scans, and modular sub-views.
 * Props:
 *   - showToast (Function): Toast notification delegate.
 */
function StockScreener({ showToast }) {
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
    const [competenceSectors, setCompetenceSectors] = useState([]);

    // Fetch user's Circle of Competence sectors on mount for table highlighting
    useEffect(() => {
        api.get('/stocks/competence')
            .then(res => {
                if (Array.isArray(res.data)) {
                    setCompetenceSectors(res.data.map(c => c.sector.toLowerCase().trim()));
                }
            })
            .catch(err => console.error('Error loading competence sectors:', err));
    }, []);

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

    // Configuration arrays for the modular FilterSidebar
    const sliderConfigs = [
        { id: 'fcf', label: 'Min FCF Growth', value: minFcfGrowth, min: -50, max: 100, step: 5, unit: '%', onChange: setMinFcfGrowth },
        { id: 'margin', label: 'Min Profit Margin', value: minProfitMargin, min: -20, max: 50, step: 5, unit: '%', onChange: setMinProfitMargin },
        { id: 'debt', label: 'Max Debt/Equity', value: maxDebtEquity, min: 0.0, max: 5.0, step: 0.1, unit: '', onChange: setMaxDebtEquity },
        { id: 'pe', label: 'Max P/E Ratio', value: maxPe, min: 5.0, max: 100.0, step: 5.0, unit: '', onChange: setMaxPe }
    ];

    const checkboxConfigs = [
        { id: 'competence', label: 'Circle of Competence Only', checked: circleOfCompetenceOnly, onChange: setCircleOfCompetenceOnly }
    ];

    const alertCount = results?.value_gap?.length || 0;
    const candidateCount = results?.momentum_quality?.length || 0;

    // Dynamic sidebar configurations per active strategy
    const activeSliders = (activeTab === 'overview' || activeTab === 'screener') ? sliderConfigs : [];
    const sidebarTitle = activeTab === 'overview' ? 'Global Scan Parameters' : (activeTab === 'screener' ? 'Momentum Parameters' : 'Value Gap Settings');
    const sidebarInfo = activeTab === 'overview'
        ? 'Running the scan evaluates Momentum Quality screening thresholds alongside automatic Value Gap divergence checks across all assets simultaneously.'
        : (activeTab === 'alerts'
            ? 'Value Gap Alerts automatically evaluate 30d return and revenue divergence across your active Portfolio & Watchlist holdings.'
            : null);

    return (
        <div className="screener-page page-container">
            <div className="screener-title-section">
                <div>
                    <h2 className="dashboard-title">Quantitative Screener & Anomalies</h2>
                    <p style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '14px' }}>
                        Multi-strategy signal processing across holdings, watchlists, and market leaders.
                    </p>
                </div>
            </div>

            {error && <AlertBanner type="error" message={error} icon="error" />}

            <div className="screener-layout">
                {/* Modular Reusable Sidebar */}
                <FilterSidebar
                    title={sidebarTitle}
                    sliders={activeSliders}
                    checkboxes={checkboxConfigs}
                    infoMessage={sidebarInfo}
                    onSubmit={handleRunScan}
                    loading={loading}
                    buttonText="Run Market Scan"
                    loadingText="Scanning Market..."
                    buttonIcon="troubleshoot"
                />

                {/* Right Results Panel */}
                <div className="screener-results-container">
                    <div className="screener-tabs">
                        <button
                            type="button"
                            className={`screener-tab ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <span>All Strategies</span>
                            <span className="tab-badge">{results ? candidateCount + alertCount : '—'}</span>
                        </button>
                        <button
                            type="button"
                            className={`screener-tab ${activeTab === 'screener' ? 'active' : ''}`}
                            onClick={() => setActiveTab('screener')}
                        >
                            <span>Momentum Quality</span>
                            <span className="tab-badge">{results ? candidateCount : '—'}</span>
                        </button>
                        <button
                            type="button"
                            className={`screener-tab ${activeTab === 'alerts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('alerts')}
                        >
                            <span>Value Gap Alerts</span>
                            <span className="tab-badge">{results ? alertCount : '—'}</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="screener-loading-state">
                            <div className="screener-loading-spinner"></div>
                            <span className="screener-loading-text">Analyzing quantitative indicators across TSX/US blue chips...</span>
                        </div>
                    ) : !results ? (
                        <ScreenerOverview
                            results={null}
                            competenceSectors={competenceSectors}
                            renderSourceBadge={renderSourceBadge}
                            onSelectTab={setActiveTab}
                        />
                    ) : activeTab === 'overview' ? (
                        <ScreenerOverview
                            results={results}
                            competenceSectors={competenceSectors}
                            renderSourceBadge={renderSourceBadge}
                            onSelectTab={setActiveTab}
                        />
                    ) : activeTab === 'screener' ? (
                        <div className="screener-table-card">
                            <MomentumTable
                                candidates={results.momentum_quality}
                                competenceSectors={competenceSectors}
                                renderSourceBadge={renderSourceBadge}
                            />
                        </div>
                    ) : (
                        <div className="alerts-list">
                            <ValueGapAlerts
                                alerts={results.value_gap}
                                renderSourceBadge={renderSourceBadge}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StockScreener;
