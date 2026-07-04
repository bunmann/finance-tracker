// ============================================================================
// File: StocksMaster.jsx
// Description: Smart container managing the Stocks & Investments domain.
//              Owns the single shared /stocks/portfolio fetch so all child
//              routes (Summary, Portfolio) receive data via props and never
//              re-fetch independently on tab switches.
//
// Data Flow:
//   - fetchPortfolio() is called once on mount (shows spinner).
//   - A 15-minute setInterval silently re-fetches in the background to keep
//     prices reasonably current without hammering yfinance. 15 minutes matches
//     the server-side PriceCache TTL, so every background poll is guaranteed
//     to actually retrieve fresh prices from the exchange.
//   - handleTradeComplete forces an immediate non-background refresh after a
//     buy, sell, or CSV import so the user sees updated holdings right away.
//   - ScreenerOverview is self-contained (no portfolio data needed) and is
//     unchanged by this refactor.
// ============================================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import StocksSummaryOverview from './stocks-summary/StocksSummaryOverview';
import PortfolioOverview from './stocks/PortfolioOverview';
import ScreenerOverview from './screener/ScreenerOverview';
import useTimerTick from '../../hooks/useTimerTick';

// 15 minutes — matches the server-side PriceCache TTL so every background
// poll is guaranteed to return fresh prices rather than cached DB values.
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

const pageTransition = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.25, ease: 'easeInOut' }
};

/**
 * Component: StocksMaster
 * Description: Router and shared data owner for the Stocks & Investments domain.
 *              Fetches portfolio data once on mount and auto-refreshes every 15
 *              minutes in the background. Child routes receive data as props so
 *              tab navigation is instant with no redundant API calls.
 * Props:
 *   - showToast (Function): Toast notification callback from App.
 */
function StocksMaster({ showToast }) {
    const location = useLocation();

    // Shared portfolio state — single source of truth for all child routes
    const [portfolio, setPortfolio] = useState(null);
    const [portfolioLoading, setPortfolioLoading] = useState(true);

    // Timestamp of the last successful fetch — passed to children so they
    // can display a "Prices refreshed X min ago" label without managing time state
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Bumped after a trade to tell PortfolioContent to re-fetch its own
    // transaction history list (which StocksMaster does not need to own)
    const [refreshTransactionsTrigger, setRefreshTransactionsTrigger] = useState(0);

    // Stable ref to the interval handle so we can clear on unmount
    const intervalRef = useRef(null);

    // Dynamic 60-second ticking loop to force parent-level React re-renders,
    // which cascades down to active child components and updates their relative
    // timestamp labels automatically without maintaining separate child timers.
    useTimerTick(60000);

    /**
     * Function: fetchPortfolio
     * Description: Fetches /stocks/portfolio from the API and updates shared state.
     *              The isBackground flag prevents showing the full-page spinner and
     *              error toast during silent background polls — those are reserved for
     *              the initial load and user-triggered refreshes (e.g. after a trade).
     * Parameters:
     *   - isBackground (Boolean): If true, suppresses loading spinner and error toast.
     */
    const fetchPortfolio = useCallback((isBackground = false) => {
        if (!isBackground) setPortfolioLoading(true);

        api.get('/stocks/portfolio')
            .then(response => {
                setPortfolio(response.data);
                setLastRefreshed(new Date());
            })
            .catch(error => {
                console.error('StocksMaster: portfolio fetch error:', error);
                if (!isBackground) showToast?.('Failed to load stock portfolio.', 'error');
            })
            .finally(() => {
                if (!isBackground) setPortfolioLoading(false);
            });
    }, [showToast]);

    // Initial load + 15-minute background refresh timer
    useEffect(() => {
        fetchPortfolio(false);

        intervalRef.current = setInterval(() => {
            fetchPortfolio(true); // Silent background poll
        }, REFRESH_INTERVAL_MS);

        // Clear the interval when the user navigates away from /stocks entirely
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchPortfolio]);

    /**
     * Function: handleTradeComplete
     * Description: Called by PortfolioContent after a buy, sell, or CSV import.
     *              Forces an immediate non-background portfolio refresh so the
     *              updated holdings are visible right away, and bumps the
     *              transaction history trigger so that list also re-fetches.
     */
    const handleTradeComplete = useCallback(() => {
        fetchPortfolio(false);
        setRefreshTransactionsTrigger(prev => prev + 1);
    }, [fetchPortfolio]);

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>

                {/* Stocks Summary — receives shared portfolio data, no independent fetch */}
                <Route path="/" element={
                    <motion.div {...pageTransition}>
                        <StocksSummaryOverview
                            portfolio={portfolio}
                            loading={portfolioLoading}
                            lastRefreshed={lastRefreshed}
                        />
                    </motion.div>
                } />

                {/* Portfolio Management — receives shared data + trade callbacks */}
                <Route path="/portfolio" element={
                    <motion.div {...pageTransition}>
                        <PortfolioOverview
                            portfolio={portfolio}
                            loading={portfolioLoading}
                            lastRefreshed={lastRefreshed}
                            refreshTransactionsTrigger={refreshTransactionsTrigger}
                            handleTradeComplete={handleTradeComplete}
                            showToast={showToast}
                        />
                    </motion.div>
                } />

                {/* Quantitative Screener — self-contained, no portfolio data needed */}
                <Route path="/screener" element={
                    <motion.div {...pageTransition}>
                        <ScreenerOverview showToast={showToast} />
                    </motion.div>
                } />

            </Routes>
        </AnimatePresence>
    );
}

export default StocksMaster;
