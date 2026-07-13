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
import WatchlistOverview from './watchlist/WatchlistOverview';
import StockAnalysisModal from './stocks-summary/components/stock-analysis-modal/StockAnalysisModal';
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

    // Shared watchlist & sector competence state
    const [watchlistItems, setWatchlistItems] = useState([]);
    const [competenceSectors, setCompetenceSectors] = useState([]);
    const [extrasLoading, setExtrasLoading] = useState(true);

    // Cached raw quantitative screener candidates (evaluated on mount, interval, and trade updates)
    const [screenerCandidates, setScreenerCandidates] = useState([]);
    const [screenerLoading, setScreenerLoading] = useState(true);

    // Timestamp of the last successful fetch — passed to children so they
    // can display a "Prices refreshed X min ago" label without managing time state
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Bumped after a trade to tell PortfolioContent to re-fetch its own
    // transaction history list (which StocksMaster does not need to own)
    const [refreshTransactionsTrigger, setRefreshTransactionsTrigger] = useState(0);

    // Global active ticker for the interactive StockAnalysisModal research view
    const [activeModalSymbol, setActiveModalSymbol] = useState(null);

    // Stable ref to the interval handle so we can clear on unmount
    const intervalRef = useRef(null);

    // Dynamic 60-second ticking loop to force parent-level React re-renders,
    // which cascades down to active child components and updates their relative
    // timestamp labels automatically without maintaining separate child timers.
    useTimerTick(60000);

    /**
     * Function: fetchPortfolio
     * Description: Fetches /stocks/portfolio from the API and updates shared state.
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

    /**
     * Function: fetchExtras
     * Description: Fetches /stocks/watchlist and /stocks/competence concurrently.
     */
    const fetchExtras = useCallback((isBackground = false) => {
        if (!isBackground) setExtrasLoading(true);

        Promise.all([
            api.get('/stocks/watchlist'),
            api.get('/stocks/competence')
        ])
            .then(([watchlistRes, competenceRes]) => {
                setWatchlistItems(Array.isArray(watchlistRes.data) ? watchlistRes.data : []);
                setCompetenceSectors(Array.isArray(competenceRes.data) ? competenceRes.data : []);
            })
            .catch(error => {
                console.error('StocksMaster: extras fetch error:', error);
                if (!isBackground) showToast?.('Failed to load watchlist and sector data.', 'error');
            })
            .finally(() => {
                if (!isBackground) setExtrasLoading(false);
            });
    }, [showToast]);

    /**
     * Function: fetchScreenerCandidates
     * Description: Fetches /screener/candidates to cache raw candidate calculations
     *              (metrics + relative strength) across the entire domain.
     */
    const fetchScreenerCandidates = useCallback((isBackground = false) => {
        if (!isBackground) setScreenerLoading(true);

        api.get('/screener/candidates')
            .then(res => {
                setScreenerCandidates(Array.isArray(res.data?.candidates) ? res.data.candidates : []);
            })
            .catch(err => {
                console.error('StocksMaster: screener candidates fetch error:', err);
                if (!isBackground) showToast?.('Failed to load quantitative screener dataset.', 'error');
            })
            .finally(() => {
                if (!isBackground) setScreenerLoading(false);
            });
    }, [showToast]);

    // Initial load + 15-minute background refresh timer
    useEffect(() => {
        fetchPortfolio(false);
        fetchExtras(false);
        fetchScreenerCandidates(false);

        intervalRef.current = setInterval(() => {
            fetchPortfolio(true);          // Silent background poll
            fetchExtras(true);             // Silent background poll
            fetchScreenerCandidates(true); // Silent background poll for fresh relative strength
        }, REFRESH_INTERVAL_MS);

        // Clear the interval when the user navigates away from /stocks entirely
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchPortfolio, fetchExtras, fetchScreenerCandidates]);

    /**
     * Function: handleTradeComplete
     * Description: Called by PortfolioContent after a buy, sell, or CSV import.
     */
    const handleTradeComplete = useCallback(() => {
        fetchPortfolio(false);
        fetchExtras(false);
        fetchScreenerCandidates(true);
        setRefreshTransactionsTrigger(prev => prev + 1);
    }, [fetchPortfolio, fetchExtras, fetchScreenerCandidates]);

    // Centralized mutation handlers for Watchlist & Circle of Competence
    const handleAddToWatchlist = useCallback((tickerSymbol) => {
        setExtrasLoading(true);
        api.post('/stocks/watchlist', { ticker: tickerSymbol })
            .then(() => {
                showToast?.(`Added ${tickerSymbol} to Watchlist!`, 'success');
                fetchExtras(false);
            })
            .catch(err => {
                console.error('Add ticker error:', err);
                const detail = err.response?.data?.detail || `Could not add ${tickerSymbol} to watchlist.`;
                showToast?.(detail, 'error');
                setExtrasLoading(false);
            });
    }, [fetchExtras, showToast]);

    const handleRemoveFromWatchlist = useCallback((tickerSymbol) => {
        setExtrasLoading(true);
        api.delete(`/stocks/watchlist/${encodeURIComponent(tickerSymbol)}`)
            .then(() => {
                showToast?.(`Removed ${tickerSymbol} from Watchlist.`, 'info');
                fetchExtras(false);
            })
            .catch(err => {
                console.error('Remove ticker error:', err);
                const detail = err.response?.data?.detail || `Could not remove ${tickerSymbol}.`;
                showToast?.(detail, 'error');
                setExtrasLoading(false);
            });
    }, [fetchExtras, showToast]);

    const handleAddCompetenceSector = useCallback((sectorName) => {
        setExtrasLoading(true);
        api.post('/stocks/competence', { sector: sectorName })
            .then(() => {
                showToast?.(`Added '${sectorName}' to Circle of Competence!`, 'success');
                fetchExtras(false);
            })
            .catch(err => {
                console.error('Add sector error:', err);
                const detail = err.response?.data?.detail || `Could not add sector '${sectorName}'.`;
                showToast?.(detail, 'error');
                setExtrasLoading(false);
            });
    }, [fetchExtras, showToast]);

    const handleRemoveCompetenceSector = useCallback((sectorName) => {
        setExtrasLoading(true);
        api.delete(`/stocks/competence/${encodeURIComponent(sectorName)}`)
            .then(() => {
                showToast?.(`Removed '${sectorName}' from Circle of Competence.`, 'info');
                fetchExtras(false);
            })
            .catch(err => {
                console.error('Remove sector error:', err);
                const detail = err.response?.data?.detail || `Could not remove sector '${sectorName}'.`;
                showToast?.(detail, 'error');
                setExtrasLoading(false);
            });
    }, [fetchExtras, showToast]);

    return (
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
            <Routes location={location} key={location.pathname}>

                {/* Stocks Summary — receives shared portfolio and watchlist data */}
                <Route path="/" element={
                    <motion.div {...pageTransition}>
                        <StocksSummaryOverview
                            portfolio={portfolio}
                            loading={portfolioLoading}
                            lastRefreshed={lastRefreshed}
                            watchlistItems={watchlistItems}
                            competenceSectors={competenceSectors}
                            onAddToWatchlist={handleAddToWatchlist}
                            onRemoveFromWatchlist={handleRemoveFromWatchlist}
                            onAddCompetenceSector={handleAddCompetenceSector}
                            onRemoveCompetenceSector={handleRemoveCompetenceSector}
                            extraLoading={extrasLoading}
                            onOpenModal={setActiveModalSymbol}
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
                            onOpenModal={setActiveModalSymbol}
                        />
                    </motion.div>
                } />

                {/* Quantitative Screener — consumes synchronized competence sectors & cached candidates */}
                <Route path="/screener" element={
                    <motion.div {...pageTransition}>
                        <ScreenerOverview
                            showToast={showToast}
                            competenceSectors={competenceSectors}
                            rawCandidates={screenerCandidates}
                            screenerLoading={screenerLoading}
                            onRefreshCandidates={() => fetchScreenerCandidates(false)}
                            onOpenModal={setActiveModalSymbol}
                        />
                    </motion.div>
                } />

                {/* Watchlist & Circle of Competence */}
                <Route path="/watchlist" element={
                    <motion.div {...pageTransition}>
                        <WatchlistOverview
                            showToast={showToast}
                            watchlistItems={watchlistItems}
                            competenceSectors={competenceSectors}
                            onAddToWatchlist={handleAddToWatchlist}
                            onRemoveFromWatchlist={handleRemoveFromWatchlist}
                            onAddCompetenceSector={handleAddCompetenceSector}
                            onRemoveCompetenceSector={handleRemoveCompetenceSector}
                            loading={extrasLoading}
                            onOpenModal={setActiveModalSymbol}
                        />
                    </motion.div>
                } />

            </Routes>
            <StockAnalysisModal
                isOpen={!!activeModalSymbol}
                symbol={activeModalSymbol}
                onClose={() => setActiveModalSymbol(null)}
            />
        </AnimatePresence>
    );
}

export default StocksMaster;
