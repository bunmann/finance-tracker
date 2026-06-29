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
        <div className="screener-empty-state" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <span
                className="material-symbols-outlined screener-empty-state-icon"
                style={{ color: iconColor, fontSize: '48px', marginBottom: '12px', display: 'inline-block' }}
            >
                {icon}
            </span>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--on-surface)' }}>{title}</h3>
            <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '14px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                {message}
            </p>
        </div>
    );
}

export default EmptyState;
