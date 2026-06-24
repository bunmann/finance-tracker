// ============================================================================
// File: MetricCard.jsx
// Description: Renders a KPI / metric summary card with defensive null handling.
// ============================================================================

/**
 * Component: MetricCard
 * Description: Displays a structured card representing a financial metric.
 * Props:
 *   - title (String): The label or header of the metric.
 *   - value (Number | String | null): The value to display.
 *   - prefix (String): Optional symbol before the value (e.g., "$"). Defaults to "$".
 *   - className (String): Optional CSS class to style the card value container.
 */
function MetricCard({ title, value, prefix = '$', className = '' }) {
    const renderValue = () => {
        if (value === null || value === undefined) {
            return '—';
        }
        if (typeof value === 'number') {
            const isNegative = value < 0;
            const absoluteValue = Math.abs(value);
            const formatted = absoluteValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `${isNegative ? '-' : ''}${prefix}${formatted}`;
        }
        return `${prefix}${value}`;
    };

    return (
        <div className="summary-card">
            <h3>{title}</h3>
            <p className={`amount ${className}`}>
                {renderValue()}
            </p>
        </div>
    );
}

export default MetricCard;
