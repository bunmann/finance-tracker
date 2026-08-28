// ============================================================================
// File: ChartTooltip.jsx
// Description: Universal glassmorphic Recharts tooltip component.
//              Accepts configurable rows and custom date formatting so all charts
//              share identical institutional design and layout logic without duplication.
// ============================================================================
import React from 'react';
import './ChartTooltip.css';

/**
 * Component: ChartTooltip
 * Props:
 *   - active (boolean): Recharts active hover state
 *   - payload (Array): Recharts data points payload
 *   - rows (Array): Configuration array of row objects:
 *       [{ label: string, getValue: (data) => string|null, valueClass: string|((data) => string), topBorder: boolean }]
 *   - getDateLabel (function): Optional custom date formatter (timestamp, data) => string
 */
function ChartTooltip({ active, payload, rows = [], getDateLabel }) {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload || {};

    // Format header date string
    let dateStr = '';
    if (getDateLabel) {
        dateStr = getDateLabel(data.timestamp, data);
    } else if (data.timestamp) {
        try {
            const dt = new Date(data.timestamp);
            if (!isNaN(dt.getTime())) {
                dateStr = dt.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: typeof data.timestamp === 'string' && data.timestamp.length > 10 && data.timestamp.includes('T') ? '2-digit' : undefined,
                    minute: typeof data.timestamp === 'string' && data.timestamp.length > 10 && data.timestamp.includes('T') ? '2-digit' : undefined
                });
            } else {
                dateStr = String(data.timestamp);
            }
        } catch {
            dateStr = String(data.timestamp);
        }
    }

    return (
        <div className="universal-chart-tooltip">
            {dateStr && <div className="universal-tooltip-header">{dateStr}</div>}
            
            {rows.map((row, idx) => {
                const val = typeof row.getValue === 'function' ? row.getValue(data) : data[row.valueKey];
                if (val === null || val === undefined || val === '') return null;

                const valClass = typeof row.valueClass === 'function' ? row.valueClass(data) : (row.valueClass || '');
                const rowClasses = ['universal-tooltip-row'];
                if (row.topBorder) rowClasses.push('universal-tooltip-row--top-border');

                return (
                    <div key={idx} className={rowClasses.join(' ')}>
                        <span className="universal-tooltip-label">{row.label}</span>
                        <span className={`universal-tooltip-value ${valClass}`}>
                            {val}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default ChartTooltip;
