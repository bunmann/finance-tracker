// ============================================================================
// File: StocksSummaryOverview.jsx
// Description: Pass-through wrapper for Stocks Summary presenter, forwarding
//              consolidated portfolio, watchlist, and sector state from StocksMaster.
// ============================================================================
import React from 'react';
import StocksSummaryContent from './StocksSummaryContent';
import '../stocks/StockPortfolio.css';

/**
 * Component: StocksSummaryOverview
 * Description: Thin pass-through wrapper for the Stocks Summary presenter.
 *              All data fetching and mutation handling is owned by StocksMaster.
 */
function StocksSummaryOverview({
    portfolio,
    loading,
    lastRefreshed,
    watchlistItems,
    competenceSectors,
    onAddToWatchlist,
    onRemoveFromWatchlist,
    onAddCompetenceSector,
    onRemoveCompetenceSector,
    extraLoading
}) {
    return (
        <StocksSummaryContent
            portfolio={portfolio}
            loading={loading}
            lastRefreshed={lastRefreshed}
            watchlistItems={watchlistItems}
            competenceSectors={competenceSectors}
            onAddToWatchlist={onAddToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            onAddCompetenceSector={onAddCompetenceSector}
            onRemoveCompetenceSector={onRemoveCompetenceSector}
            extraLoading={extraLoading}
        />
    );
}

export default StocksSummaryOverview;
