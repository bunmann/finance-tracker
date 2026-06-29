// ============================================================================
// File: MonthSelect.jsx
// Description: Reusable month selection dropdown with dynamic width auto-sizing
//              to prevent text/arrow overlap on longer months.
// ============================================================================
import React from 'react';

const monthWidths = {
    1: 100,  // January
    2: 102,  // February
    3: 82,   // March
    4: 80,   // April
    5: 72,   // May
    6: 78,   // June
    7: 76,   // July
    8: 86,   // August
    9: 114,  // September
    10: 92,  // October
    11: 102, // November
    12: 102  // December
};

/**
 * Component: MonthSelect
 * Description: Renders a custom dropdown selector for months (1-12) with
 *              dynamic inline width mapping to prevent layout cutoff.
 * Props:
 *   - value (Number): Selected month number (1-12)
 *   - onChange (Function): Callback fired when month is changed, passing the new month number.
 */
function MonthSelect({ value, onChange }) {
    return (
        <select
            className="month-select"
            style={{ width: `${monthWidths[value] || 90}px` }}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
        >
            {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                    {new Date(2026, i).toLocaleString('default', { month: 'long' })}
                </option>
            ))}
        </select>
    );
}

export default MonthSelect;
