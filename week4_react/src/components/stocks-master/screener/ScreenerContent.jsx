// ============================================================================
// File: ScreenerContent.jsx
// Description: Presenter component rendering quantitative screening UI controls,
//              tab selectors, momentum tables, and value gap anomaly alerts.
// ============================================================================
import React from 'react';
import FilterSidebar from '../../common/layout/FilterSidebar';
import MomentumTable from './components/MomentumTable';
import ValueGapAlerts from './components/ValueGapAlerts';
import ScreenerOverviewPreview from './components/ScreenerOverviewPreview';
import AlertBanner from '../../common/feedback/AlertBanner';

/**
 * Component: ScreenerContent
 * Description: Pure presenter rendering the screener workspace.
 */
function ScreenerContent({
    activeTab,
    setActiveTab,
    minFcfGrowth,
    setMinFcfGrowth,
    minProfitMargin,
    setMinProfitMargin,
    maxDebtEquity,
    setMaxDebtEquity,
    maxPe,
    setMaxPe,
    circleOfCompetenceOnly,
    setCircleOfCompetenceOnly,
    results,
    loading,
    error,
    competenceSectors,
    handleRunScan,
    renderSourceBadge,
    onOpenModal
}) {
    // Helper slider configuration
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

    const activeSliders = (activeTab === 'overview' || activeTab === 'screener') ? sliderConfigs : [];
    const sidebarTitle = activeTab === 'overview' ? 'Global Scan Parameters' : (activeTab === 'screener' ? 'Momentum Parameters' : 'Value Gap Settings');
    const sidebarInfo = activeTab === 'overview'
        ? 'Running the scan evaluates Momentum Quality screening thresholds alongside automatic Value Gap divergence checks across all assets simultaneously.'
        : (activeTab === 'alerts'
            ? 'Value Gap Alerts automatically evaluate 30d return and revenue divergence across your active Portfolio & Watchlist holdings.'
            : null);

    return (
        <div className="screener-page page-container">
            {/* Title Header - renders instantly */}
            <div className="screener-title-section">
                <div>
                    <h2 className="dashboard-title">Quantitative Screener & Anomalies</h2>
                    <p className="screener-subtitle">
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
                    buttonText="Reset Parameters"
                    loadingText="Resetting..."
                    buttonIcon="restart_alt"
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
                        <ScreenerOverviewPreview
                            results={null}
                            competenceSectors={competenceSectors}
                            renderSourceBadge={renderSourceBadge}
                            onSelectTab={setActiveTab}
                            onOpenModal={onOpenModal}
                        />
                    ) : activeTab === 'overview' ? (
                        <ScreenerOverviewPreview
                            results={results}
                            competenceSectors={competenceSectors}
                            renderSourceBadge={renderSourceBadge}
                            onSelectTab={setActiveTab}
                            onOpenModal={onOpenModal}
                        />
                    ) : activeTab === 'screener' ? (
                        <div className="screener-table-card">
                            <MomentumTable
                                candidates={results.momentum_quality}
                                competenceSectors={competenceSectors}
                                renderSourceBadge={renderSourceBadge}
                                onOpenModal={onOpenModal}
                            />
                        </div>
                    ) : (
                        <div className="alerts-list">
                            <ValueGapAlerts
                                alerts={results.value_gap}
                                renderSourceBadge={renderSourceBadge}
                                onOpenModal={onOpenModal}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ScreenerContent;
