// ============================================================================
// File: WatchlistOverview.jsx
// Description: Pass-through wrapper for Watchlist and Sector Competence presenter,
//              forwarding consolidated state and mutation callbacks from StocksMaster.
// ============================================================================
import React from 'react';
import WatchlistContent from './WatchlistContent';

/**
 * Component: WatchlistOverview
 * Description: Thin pass-through container for Watchlist & Sectors view.
 *              All data fetching and mutation handling is owned by StocksMaster.
 */
function WatchlistOverview({
    watchlistItems,
    competenceSectors,
    onAddToWatchlist,
    onRemoveFromWatchlist,
    onAddCompetenceSector,
    onRemoveCompetenceSector,
    loading,
    error
}) {
    return (
        <WatchlistContent
            watchlistItems={watchlistItems}
            competenceSectors={competenceSectors}
            onAddToWatchlist={onAddToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            onAddCompetenceSector={onAddCompetenceSector}
            onRemoveCompetenceSector={onRemoveCompetenceSector}
            loading={loading}
            error={error}
        />
    );
}

export default WatchlistOverview;
