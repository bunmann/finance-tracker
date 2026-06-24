// ============================================================================
// File: AlertBanner.jsx
// Description: Renders a reusable warning/error/info notification banner.
// ============================================================================

/**
 * Component: AlertBanner
 * Description: Renders a banner alert for warnings, limit updates, or pricing failures.
 * Props:
 *   - message (String): The text content of the warning.
 *   - type (String): The alert type ('warning', 'danger', 'info'). Defaults to 'warning'.
 *   - icon (String): Optional emoji or symbol to prepend.
 */
function AlertBanner({ message, type = 'warning', icon = '' }) {
    // Map type to the styled classes from App.css (alert-danger, alert-warning)
    const alertClass = type === 'danger' ? 'alert-danger' : type === 'warning' ? 'alert-warning' : `alert-${type}`;

    return (
        <div className={`budget-alert ${alertClass}`}>
            {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
            {message}
        </div>
    );
}

export default AlertBanner;
