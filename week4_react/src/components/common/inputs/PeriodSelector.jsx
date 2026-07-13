// ============================================================================
// File: PeriodSelector.jsx
// Description: Unified period selection control supporting three modes:
//              View All (all time), By Year, and By Month (with combined strings e.g. "June 2026").
// ============================================================================
import React from 'react';

/**
 * Component: PeriodSelector
 * Description: Renders a segmented mode selector alongside a contextual dropdown
 *              for picking specific years or combined month-year strings.
 * Props:
 *   - mode (String): Current filter mode ('all', 'year', 'month').
 *   - month (Number): Current selected month (1-12, or 0 if all/year mode).
 *   - year (Number): Current selected year (e.g. 2026, or 0 if all time).
 *   - onModeChange (Function): Callback fired when mode switches ('all' | 'year' | 'month').
 *   - onPeriodChange (Function): Callback fired when specific date changes (newMonth, newYear).
 */
function PeriodSelector({
    mode = 'month',
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear(),
    onModeChange,
    onPeriodChange
}) {
    const currentYear = new Date().getFullYear();

    // Generate list of available years (2023 to currentYear + 1)
    const availableYears = [];
    for (let y = currentYear + 1; y >= 2023; y--) {
        availableYears.push(y);
    }

    // Generate combined month-year options (last 3 years up to next year)
    const availableMonths = [];
    for (let y = currentYear + 1; y >= 2024; y--) {
        for (let m = 12; m >= 1; m--) {
            const dateObj = new Date(y, m - 1);
            const monthName = dateObj.toLocaleString('default', { month: 'long' });
            availableMonths.push({
                value: `${m}-${y}`,
                label: `${monthName} ${y}`,
                m,
                y
            });
        }
    }

    const handleModeClick = (newMode) => {
        onModeChange?.(newMode);
        if (newMode === 'all') {
            onPeriodChange?.(0, 0);
        } else if (newMode === 'year') {
            onPeriodChange?.(0, year || currentYear);
        } else if (newMode === 'month') {
            onPeriodChange?.(month || new Date().getMonth() + 1, year || currentYear);
        }
    };

    return (
        <div className="period-selector-container">
            {/* Mode Segmented Controls */}
            <div className="period-mode-toggle">
                <button
                    type="button"
                    onClick={() => handleModeClick('all')}
                    className={`period-mode-btn ${mode === 'all' ? 'active' : ''}`}
                >
                    View All
                </button>
                <button
                    type="button"
                    onClick={() => handleModeClick('year')}
                    className={`period-mode-btn ${mode === 'year' ? 'active' : ''}`}
                >
                    By Year
                </button>
                <button
                    type="button"
                    onClick={() => handleModeClick('month')}
                    className={`period-mode-btn ${mode === 'month' ? 'active' : ''}`}
                >
                    By Month
                </button>
            </div>

            {/* Contextual Dropdowns */}
            {mode === 'year' && (
                <select
                    value={year}
                    onChange={(e) => onPeriodChange?.(0, parseInt(e.target.value))}
                    className="period-dropdown"
                >
                    {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            )}

            {mode === 'month' && (
                <select
                    value={`${month}-${year}`}
                    onChange={(e) => {
                        const [mStr, yStr] = e.target.value.split('-');
                        onPeriodChange?.(parseInt(mStr), parseInt(yStr));
                    }}
                    className="period-dropdown"
                >
                    {availableMonths.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            )}
        </div>
    );
}

export default PeriodSelector;
