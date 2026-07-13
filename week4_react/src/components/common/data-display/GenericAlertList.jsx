// ============================================================================
// File: GenericAlertList.jsx
// Description: Reusable container component for animated alert lists and cards.
// ============================================================================
import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer } from '../../../utils/animations';
import EmptyState from './EmptyState';

/**
 * Component: GenericAlertList
 * Description: Renders structured, animated cards for anomaly/alert strategies.
 *              Handles empty states, title headers, message boxes, and custom metrics.
 * Props:
 *   - items (Array): List of alert objects containing ticker, name, message, source.
 *   - renderMetrics (Function): Delegate returning JSX for card bottom metrics: (item) => JSX.
 *   - renderSourceBadge (Function): Delegate returning badge JSX for item source.
 *   - emptyTitle (string): Title for empty state when items is empty.
 *   - emptyMessage (string): Explanatory text for empty state.
 *   - emptyIcon (string): Material icon name for empty state.
 */
function GenericAlertList({
    items = [],
    renderMetrics,
    renderSourceBadge,
    onOpenModal,
    emptyTitle = 'No Anomalies Detected',
    emptyMessage = 'All monitored assets are trading within normal fundamental parameters.',
    emptyIcon = 'verified_user'
}) {
    if (!items || items.length === 0) {
        return (
            <EmptyState
                icon={emptyIcon}
                title={emptyTitle}
                message={emptyMessage}
            />
        );
    }

    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="alerts-list">
            {items.map((alert) => (
                <motion.div key={alert.ticker || Math.random()} className="anomaly-card" layout>
                    <div className="anomaly-header">
                        <div className="anomaly-title">
                            <button
                                type="button"
                                className="ticker-link-btn anomaly-symbol"
                                onClick={() => onOpenModal && onOpenModal(alert.ticker)}
                                title="Research & Chart"
                            >
                                {alert.ticker}
                            </button>
                            {alert.name && <span className="anomaly-name">({alert.name})</span>}
                        </div>
                        {renderSourceBadge && renderSourceBadge(alert.source)}
                    </div>
                    {alert.message && (
                        <div className="anomaly-message">
                            {alert.message}
                        </div>
                    )}
                    {renderMetrics && (
                        <div className="anomaly-metrics">
                            {renderMetrics(alert)}
                        </div>
                    )}
                </motion.div>
            ))}
        </motion.div>
    );
}

export default GenericAlertList;
