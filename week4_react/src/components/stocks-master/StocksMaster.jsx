// ============================================================================
// File: StocksMaster.jsx
// Description: Smart container managing investment domain sub-routes for
//              Stocks Summary, Portfolio Management, and Quantitative Screener.
// ============================================================================
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StocksSummaryOverview from './stocks-summary/StocksSummaryOverview';
import PortfolioOverview from './stocks/PortfolioOverview';
import ScreenerOverview from './screener/ScreenerOverview';

const pageTransition = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.25, ease: 'easeInOut' }
};

/**
 * Component: StocksMaster
 * Description: Encapsulates the Stocks & Investments domain and routes between
 *              Summary, Portfolio Holdings, and Quantitative Screener overviews.
 * Props:
 *   - showToast (Function): Toast notification callback from App.
 */
function StocksMaster({ showToast }) {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                    <motion.div {...pageTransition}>
                        <StocksSummaryOverview showToast={showToast} />
                    </motion.div>
                } />
                <Route path="/portfolio" element={
                    <motion.div {...pageTransition}>
                        <PortfolioOverview showToast={showToast} />
                    </motion.div>
                } />
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
