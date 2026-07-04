// ============================================================================
// File: useTimerTick.js
// Description: Custom React hook to trigger periodic, metronome-like re-renders
//              at a configured time interval.
// ============================================================================
import { useState, useEffect } from 'react';

/**
 * Hook: useTimerTick
 * Description: Sets up a repeating background timer that increments a counter state,
 *              forcing the calling component to periodically re-render.
 *              Cleans up the interval timer automatically on component unmount.
 * Parameters:
 *   - intervalMs (Number): Time in milliseconds between ticks. Defaults to 60000 (1 minute).
 * Returns:
 *   - Number: The current tick iteration count.
 */
function useTimerTick(intervalMs = 60000) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs]);

    return tick;
}

export default useTimerTick;
