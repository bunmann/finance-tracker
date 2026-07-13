// ============================================================================
// File: WatchlistContent.jsx
// Description: Pure presenter component arranging WatchlistManager and
//              SectorCompetenceManager in a responsive two-column grid.
// ============================================================================
import React from 'react';
import WatchlistManager from './components/WatchlistManager';
import SectorCompetenceManager from './components/SectorCompetenceManager';
import AlertBanner from '../../common/feedback/AlertBanner';
import './Watchlist.css';

/**
 * Component: WatchlistContent
 * Description: Layout shell for the Watchlist & Sectors domain.
 * Props:
 *   - watchlistItems (Array): List of watchlist records.
 *   - competenceSectors (Array): List of sector records.
 *   - onAddTicker (Function): Handler for adding a watchlist ticker.
 *   - onRemoveTicker (Function): Handler for deleting a watchlist ticker.
 *   - onAddSector (Function): Handler for adding a competence sector.
 *   - onRemoveSector (Function): Handler for deleting a competence sector.
 *   - loading (Boolean): Network operation status.
 *   - error (String|null): Error message string if any operation failed.
 */
function WatchlistContent({
    watchlistItems = [],
    competenceSectors = [],
    onAddToWatchlist,
    onRemoveFromWatchlist,
    onAddCompetenceSector,
    onRemoveCompetenceSector,
    loading = false,
    error = null,
    onOpenModal
}) {
    return (
        <div className="watchlist-page page-container">
            {/* Title Header */}
            <div className="dashboard-header">
                <div>
                    <h2 className="dashboard-title">Watchlist & Circle of Competence</h2>
                    <p className="watchlist-header-subtitle">
                        Curate target tickers for live price tracking and define domain expertise sectors for quantitative screening.
                    </p>
                </div>
            </div>

            {/* Error / Feedback Banner */}
            {error && (
                <AlertBanner
                    type="error"
                    message={error}
                    icon="error"
                />
            )}

            {/* Main Grid (align-items: start; prevents vertical stretching) */}
            <div className="watchlist-grid">
                <WatchlistManager
                    items={watchlistItems}
                    onAddToWatchlist={onAddToWatchlist}
                    onRemoveFromWatchlist={onRemoveFromWatchlist}
                    loading={loading}
                    onOpenModal={onOpenModal}
                />
                <SectorCompetenceManager
                    sectors={competenceSectors}
                    onAddCompetenceSector={onAddCompetenceSector}
                    onRemoveCompetenceSector={onRemoveCompetenceSector}
                    loading={loading}
                />
            </div>
        </div>
    );
}

export default WatchlistContent;
