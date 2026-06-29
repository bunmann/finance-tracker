// ============================================================================
// File: ValueGapAlerts.jsx
// Description: Specialized presenter rendering Value Gap divergence anomalies.
// ============================================================================
import React from 'react';
import GenericAlertList from '../common/data-display/GenericAlertList';

/**
 * Component: ValueGapAlerts
 * Description: Renders cards for Strategy 2 alerts using GenericAlertList.
 * Props:
 *   - alerts (Array): List of Value Gap anomaly objects.
 *   - renderSourceBadge (Function): Delegate returning source badge JSX.
 */
function ValueGapAlerts({ alerts = [], renderSourceBadge }) {
    const renderMetrics = (alert) => (
        <>
            <div className="anomaly-metric-item">
                <span className="anomaly-metric-label">Current Price</span>
                <span className="anomaly-metric-value">
                    C${alert.current_price !== undefined ? alert.current_price.toFixed(2) : '—'}
                </span>
            </div>
            <div className="anomaly-metric-item">
                <span className="anomaly-metric-label">30d Price Return</span>
                <span className="anomaly-metric-value loss-text">
                    {alert.performance_30d !== undefined ? `${(alert.performance_30d * 100).toFixed(1)}%` : '—'}
                </span>
            </div>
            <div className="anomaly-metric-item">
                <span className="anomaly-metric-label">QoQ Revenue Growth</span>
                <span className="anomaly-metric-value gain-text">
                    {alert.qoq_revenue_growth !== null && alert.qoq_revenue_growth !== undefined
                        ? `+${(alert.qoq_revenue_growth * 100).toFixed(1)}%`
                        : '—'}
                </span>
            </div>
        </>
    );

    return (
        <GenericAlertList
            items={alerts}
            renderMetrics={renderMetrics}
            renderSourceBadge={renderSourceBadge}
            emptyTitle="No Fundamental Anomalies Detected"
            emptyMessage="All monitored portfolio and watchlist holdings are trading within normal fundamental-to-price bounds."
            emptyIcon="verified_user"
        />
    );
}

export default ValueGapAlerts;
