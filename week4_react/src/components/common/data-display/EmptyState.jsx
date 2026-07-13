// ============================================================================
// File: EmptyState.jsx
// Description: Reusable empty state display with icon, title, and message.
// ============================================================================
import React from 'react';

/**
 * Component: EmptyState
 * Description: Standardized placeholder displayed when tables or card lists contain zero results.
 * Props:
 *   - icon (string): Material symbol icon name.
 *   - title (string): Main heading text.
 *   - message (string): Explanatory subtitle paragraph.
 *   - iconColor (string): CSS color for the icon. Defaults to var(--primary).
 */
function EmptyState({
    icon = 'inbox',
    title = 'No Data Found',
    message = 'There are currently no items matching your criteria.',
    iconColor = 'var(--primary)'
}) {
    return (
        <div className="screener-empty-state empty-state-wrapper">
            <span
                className="material-symbols-outlined screener-empty-state-icon empty-state-icon"
                style={{ color: iconColor }}
            >
                {icon}
            </span>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-message">
                {message}
            </p>
        </div>
    );
}

export default EmptyState;
