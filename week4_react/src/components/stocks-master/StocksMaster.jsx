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
import { useFinance } from '../../contexts/FinanceContext';
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
 * Description: The primary layout wrapper for all stocks-related sub-routes.
 *              It provides shared caching, timestamping, and centralized 
 *              mutation handlers (watchlist/competence) to all children.
 */
function StocksMaster({ showToast }) {
    const location = useLocation();

    const {
        portfolioData: portfolio,
        watchlistData: watchlistItems,
        competenceData: competenceSectors,
        screenerData: screenerCandidates,
        isStocksLoading: portfolioLoading,
        fetchStocksData
    } = useFinance();

    const extrasLoading = portfolioLoading;
    const screenerLoading = portfolioLoading;

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

    // Centralized cache initialization
    useEffect(() => {
        fetchStocksData(false);
    }, [fetchStocksData]);

    /**
     * Function: handleTradeComplete
     * Description: Called by PortfolioContent after a buy, sell, or CSV import.
     */
    const handleTradeComplete = useCallback(() => {
        fetchStocksData(true);
        setRefreshTransactionsTrigger(prev => prev + 1);
    }, [fetchStocksData]);

    // Centralized mutation handlers for Watchlist & Circle of Competence
    const handleAddToWatchlist = useCallback((tickerSymbol) => {
        api.post('/stocks/watchlist', { ticker: tickerSymbol })
            .then(() => {
                showToast?.(`Added ${tickerSymbol} to Watchlist!`, 'success');
                fetchStocksData(true);
            })
            .catch(err => {
                console.error('Add ticker error:', err);
                const detail = err.response?.data?.detail || `Could not add ${tickerSymbol} to watchlist.`;
                showToast?.(detail, 'error');
            });
    }, [fetchStocksData, showToast]);

    const handleRemoveFromWatchlist = useCallback((tickerSymbol) => {
        api.delete(`/stocks/watchlist/${encodeURIComponent(tickerSymbol)}`)
            .then(() => {
                showToast?.(`Removed ${tickerSymbol} from Watchlist.`, 'info');
                fetchStocksData(true);
            })
            .catch(err => {
                console.error('Remove ticker error:', err);
                const detail = err.response?.data?.detail || `Could not remove ${tickerSymbol}.`;
                showToast?.(detail, 'error');
            });
    }, [fetchStocksData, showToast]);

    const handleAddCompetenceSector = useCallback((sectorName) => {
        api.post('/stocks/competence', { sector: sectorName })
            .then(() => {
                showToast?.(`Added '${sectorName}' to Circle of Competence!`, 'success');
                fetchStocksData(true);
            })
            .catch(err => {
                console.error('Add sector error:', err);
                const detail = err.response?.data?.detail || `Could not add sector '${sectorName}'.`;
                showToast?.(detail, 'error');
            });
    }, [fetchStocksData, showToast]);

    const handleRemoveCompetenceSector = useCallback((sectorName) => {
        api.delete(`/stocks/competence/${encodeURIComponent(sectorName)}`)
            .then(() => {
                showToast?.(`Removed '${sectorName}' from Circle of Competence.`, 'info');
                fetchStocksData(true);
            })
            .catch(err => {
                console.error('Remove sector error:', err);
                const detail = err.response?.data?.detail || `Could not remove sector '${sectorName}'.`;
                showToast?.(detail, 'error');
            });
    }, [fetchStocksData, showToast]);

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
                            onRefreshCandidates={() => fetchStocksData(true)}
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
