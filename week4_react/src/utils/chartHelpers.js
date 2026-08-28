// ============================================================================
// File: chartHelpers.js
// Description: Universal Recharts XAxis and YAxis computation utilities.
//              Provides clean, rounded interval scaling, accurate continuous time projection,
//              and timeframe-adaptive date/price formatting for both single-stock and portfolio charts.
// ============================================================================

/**
 * Computes a clean Y-axis domain and rounded tick steps with nice numerical intervals.
 * Supports evaluating multiple dataKeys (e.g. ['portfolio_value', 'total_cost']) across the dataset.
 * 
 * @param {Array} chartData List of data objects
 * @param {string|string[]} dataKeys Single key or array of keys to find min/max range
 * @returns {Object} { domain: [min, max], ticks: Array, step: number }
 */
export function computeCleanYAxis(chartData, dataKeys = ['price']) {
    if (!chartData || chartData.length === 0) {
        return { domain: ['auto', 'auto'], ticks: undefined, step: 1 };
    }

    const keys = Array.isArray(dataKeys) ? dataKeys : [dataKeys];
    let minVal = Infinity;
    let maxVal = -Infinity;

    chartData.forEach((d) => {
        keys.forEach((k) => {
            const val = Number(d[k]);
            if (!isNaN(val) && val !== null && val !== undefined) {
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            }
        });
    });

    if (!isFinite(minVal) || !isFinite(maxVal) || minVal === maxVal) {
        return { domain: ['auto', 'auto'], ticks: undefined, step: 1 };
    }

    const range = maxVal - minVal;
    const targetSteps = 5;
    const roughStep = range / targetSteps;

    // Nice round numerical increments ranging from tenths to hundreds of thousands
    const niceIncrements = [
        0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 500,
        1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 500000, 1000000
    ];
    let step = niceIncrements[0];
    for (const inc of niceIncrements) {
        if (roughStep <= inc) {
            step = inc;
            break;
        }
    }

    const domainMin = Math.floor(minVal / step) * step;
    const domainMax = Math.ceil(maxVal / step) * step;

    const ticks = [];
    for (let val = domainMin; val <= domainMax + (step * 0.01); val += step) {
        ticks.push(Number(val.toFixed(2)));
    }

    return {
        domain: [domainMin, domainMax],
        ticks,
        step
    };
}

/**
 * Computes clean X-axis ticks tailored for each timeframe.
 * For 1D and ALL (continuous time scale), returns exact timeMs coordinates so Recharts
 * projects every milestone down to its true physical position along the timeline.
 * For 1W, 1M, 3M, 1Y (categorical scale), returns exact milestone timestamps without clumping.
 * 
 * @param {Array} chartData List of data objects containing .timestamp
 * @param {string} period Active timeframe ('1D', '1W', '1M', '3M', '1Y', 'ALL', 'MAX')
 * @returns {Array|undefined} Array of tick coordinates or undefined for auto
 */
export function computeCleanXAxisTicks(chartData, period) {
    if (!chartData || chartData.length === 0) return undefined;

    const periodUpper = (period || '1M').toUpperCase().strip ? period.toUpperCase().trim() : period.toUpperCase();

    if (periodUpper === '1D') {
        const minMs = new Date(chartData[0].timestamp).getTime();
        const maxMs = new Date(chartData[chartData.length - 1].timestamp).getTime();
        if (isNaN(minMs) || isNaN(maxMs)) return undefined;

        // Project exact top-of-hour milestones (`10:00 AM`, `11:00 AM`, `12:00 PM`, `1:00 PM`, `2:00 PM`, `3:00 PM`)
        const ticks = [];
        const baseDate = new Date(minMs);
        for (let hr = 10; hr <= 15; hr++) {
            const target = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hr, 0, 0, 0).getTime();
            if (target >= minMs && target <= maxMs) {
                ticks.push(target);
            }
        }
        return ticks.length > 0 ? ticks : undefined;
    }

    if (periodUpper === '1W') {
        // Exactly one real timestamp per calendar trading day (first candle of that day)
        const seenDays = new Set();
        const ticks = [];
        chartData.forEach((item) => {
            if (!item.timestamp) return;
            const dt = new Date(item.timestamp);
            if (isNaN(dt.getTime())) return;
            const dayKey = dt.toDateString();
            if (!seenDays.has(dayKey)) {
                seenDays.add(dayKey);
                ticks.push(item.timestamp);
            }
        });
        return ticks.length > 0 ? ticks : undefined;
    }

    if (periodUpper === '1M') {
        // Collect exact first candle of each unique calendar day, then pick roughly every 5th trading day
        const seenDays = new Set();
        const dayTimestamps = [];
        chartData.forEach((item) => {
            if (!item.timestamp) return;
            const dt = new Date(item.timestamp);
            if (isNaN(dt.getTime())) return;
            const dayKey = dt.toDateString();
            if (!seenDays.has(dayKey)) {
                seenDays.add(dayKey);
                dayTimestamps.push(item.timestamp);
            }
        });
        const step = Math.max(1, Math.floor(dayTimestamps.length / 5));
        const ticks = [];
        for (let i = 0; i < dayTimestamps.length; i += step) {
            ticks.push(dayTimestamps[i]);
        }
        return ticks.length > 0 ? ticks : undefined;
    }

    if (periodUpper === '3M' || periodUpper === '1Y') {
        // Collect the exact first trading day of each calendar month (`May`, `Jun`, `Jul`)
        const seenMonths = new Set();
        const ticks = [];
        chartData.forEach((item) => {
            if (!item.timestamp) return;
            const dt = new Date(item.timestamp);
            if (isNaN(dt.getTime())) return;
            const monthKey = dt.getFullYear() + '-' + dt.getMonth();
            if (!seenMonths.has(monthKey)) {
                seenMonths.add(monthKey);
                ticks.push(item.timestamp);
            }
        });
        return ticks.length > 0 ? ticks : undefined;
    }

    if (periodUpper === 'ALL' || periodUpper === 'MAX') {
        const minMs = new Date(chartData[0].timestamp).getTime();
        const maxMs = new Date(chartData[chartData.length - 1].timestamp).getTime();
        if (isNaN(minMs) || isNaN(maxMs)) return undefined;

        const spanYears = (new Date(maxMs).getFullYear() - new Date(minMs).getFullYear());
        const ticks = [];
        const startDt = new Date(minMs);
        if (spanYears >= 2) {
            // Project exact Jan 1 of each calendar year (`2022`, `2023`, `2024`...)
            let curr = new Date(startDt.getFullYear() + (startDt.getMonth() === 0 && startDt.getDate() === 1 ? 0 : 1), 0, 1, 0, 0, 0, 0);
            while (curr.getTime() <= maxMs) {
                ticks.push(curr.getTime());
                curr = new Date(curr.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
            }
        } else {
            // Project exact 1st of each month if range is under 2 years
            let curr = new Date(startDt.getFullYear(), startDt.getMonth(), 1, 0, 0, 0, 0);
            while (curr.getTime() <= maxMs) {
                if (curr.getTime() >= minMs) ticks.push(curr.getTime());
                curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1, 0, 0, 0, 0);
            }
        }
        return ticks.length > 0 ? ticks : undefined;
    }

    return undefined;
}

/**
 * Formats X-axis date or time ticks cleanly according to the active timeframe.
 * 
 * @param {string|number} timestamp Date string or epoch millisecond
 * @param {string} period Active timeframe
 * @returns {string} Formatted label (e.g. "10 AM", "Jul 7", "May", "2024")
 */
export function formatXAxisTick(timestamp, period) {
    if (!timestamp && timestamp !== 0) return '';
    try {
        const dt = new Date(timestamp);
        if (isNaN(dt.getTime())) return String(timestamp);

        const periodUpper = (period || '1M').toUpperCase().strip ? period.toUpperCase().trim() : period.toUpperCase();

        if (periodUpper === '1D') {
            return dt.toLocaleTimeString('en-US', { hour: 'numeric' }); // e.g. "10 AM", "1 PM"
        }
        if (periodUpper === '1W' || periodUpper === '1M') {
            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Jul 7", "Jul 15"
        }
        if (periodUpper === '3M' || periodUpper === '1Y') {
            return dt.toLocaleDateString('en-US', { month: 'short' }); // e.g. "May", "Jun", "Jul"
        }
        // ALL or MAX
        return dt.toLocaleDateString('en-US', { year: 'numeric' }); // e.g. "2024", "2026"
    } catch {
        return String(timestamp);
    }
}
