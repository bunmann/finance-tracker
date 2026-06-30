// ============================================================================
// File: ScreenerOverview.jsx
// Description: Executive dashboard summary previewing multi-strategy results.
// ============================================================================
import React from 'react';
import { motion } from 'framer-motion';
import MomentumTable from './MomentumTable';
import ValueGapAlerts from './ValueGapAlerts';
import EmptyState from '../common/data-display/EmptyState';
import { fadeInUp } from '../../utils/animations';

/**
 * Component: ScreenerOverview
 * Description: Displays a preview of top Momentum Quality leaders (top 3) and
 *              active Value Gap alerts (top 3) with quick action links to view all.
 * Props:
 *   - results (Object): Scan output containing momentum_quality and value_gap arrays.
 *   - competenceSectors (Array): Active user circle of competence sectors.
 *   - renderSourceBadge (Function): Delegate returning badge JSX.
 *   - onSelectTab (Function): Handler to switch active tab view.
 */
function ScreenerOverviewPreview({ results, competenceSectors = [], renderSourceBadge, onSelectTab }) {
    if (!results) {
        return (
            <EmptyState
                icon="query_stats"
                title="Ready to Scan Market Universe"
                message="Configure your strategy parameters on the sidebar and click 'Run Market Scan' to execute multi-strategy quantitative screening across TSX and US blue chips."
                iconColor="var(--primary)"
            />
        );
    }

    const topCandidates = results.momentum_quality?.slice(0, 3) || [];
    const topAlerts = results.value_gap?.slice(0, 3) || [];
    const totalCandidates = results.momentum_quality?.length || 0;
    const totalAlerts = results.value_gap?.length || 0;

    return (
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="screener-overview" style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {/* Section 1: Top Momentum Leaders */}
            <div className="overview-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>trending_up</span>
                            <span>Top Momentum Quality Leaders</span>
                            <span className="tab-badge">{totalCandidates}</span>
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                            Highest relative strength rankings meeting fundamental FCF, margin, and debt thresholds.
                        </p>
                    </div>
                    {totalCandidates > 0 && (
                        <button
                            type="button"
                            onClick={() => onSelectTab('screener')}
                            style={{
                                background: 'var(--surface-container-high)',
                                border: '1px solid var(--outline-variant)',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                color: 'var(--primary)',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span>View All ({totalCandidates})</span>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                        </button>
                    )}
                </div>

                <MomentumTable
                    candidates={topCandidates}
                    competenceSectors={competenceSectors}
                    renderSourceBadge={renderSourceBadge}
                />
            </div>

            {/* Section 2: Active Value Gap Divergences */}
            <div className="overview-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>warning</span>
                            <span>Active Value Gap Alerts</span>
                            <span className="tab-badge">{totalAlerts}</span>
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                            Holdings & watchlists exhibiting strong revenue growth but negative recent price action.
                        </p>
                    </div>
                    {totalAlerts > 0 && (
                        <button
                            type="button"
                            onClick={() => onSelectTab('alerts')}
                            style={{
                                background: 'var(--surface-container-high)',
                                border: '1px solid var(--outline-variant)',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                color: 'var(--primary)',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span>View All ({totalAlerts})</span>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                        </button>
                    )}
                </div>

                <ValueGapAlerts
                    alerts={topAlerts}
                    renderSourceBadge={renderSourceBadge}
                />
            </div>
        </motion.div>
    );
}

export default ScreenerOverviewPreview;
