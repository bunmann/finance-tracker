// ============================================================================
// File: SectorCompetenceManager.jsx
// Description: Reusable presentation component encapsulating custom sector input
//              field, quick-add selector pills, and active tag management grid.
// ============================================================================
import React, { useState } from 'react';
import EmptyState from '../../../common/data-display/EmptyState';

const STANDARD_SECTORS = [
    'Technology',
    'Financial Services',
    'Healthcare',
    'Energy',
    'Industrials',
    'Consumer Discretionary',
    'Consumer Staples',
    'Utilities',
    'Real Estate',
    'Basic Materials',
    'Communication Services'
];

/**
 * Component: SectorCompetenceManager
 * Description: Pure presentation layer for managing Circle of Competence sectors.
 *              Constrains selection to standard GICS/exchange sectors so scanner matching works reliably.
 * Props:
 *   - sectors (Array): List of sector objects [{ id, sector }] or strings.
 *   - onAddCompetenceSector (Function): Callback invoked when adding a sector string.
 *   - onRemoveCompetenceSector (Function): Callback invoked when deleting a sector string.
 *   - loading (Boolean): Network operation loading status.
 */
function SectorCompetenceManager({ sectors = [], onAddCompetenceSector, onRemoveCompetenceSector, loading = false }) {
    // Normalize sector items into string list for easy lookup
    const activeSectorNames = sectors.map(item => {
        return (typeof item === 'object' ? item.sector : item)?.trim() || '';
    }).filter(Boolean);

    const handleQuickAdd = (sectorName) => {
        if (onAddCompetenceSector && !loading) {
            onAddCompetenceSector(sectorName);
        }
    };

    const handleRemove = (sectorName) => {
        if (onRemoveCompetenceSector && !loading) {
            onRemoveCompetenceSector(sectorName);
        }
    };

    // Filter available sectors that haven't been added yet
    const availableSectors = STANDARD_SECTORS.filter(
        sec => !activeSectorNames.some(a => a.toLowerCase() === sec.toLowerCase())
    );

    return (
        <div className="competence-card">
            <div className="manager-header">
                <h3 className="manager-title">
                    <span className="material-symbols-outlined" style={{ color: '#00D166', fontSize: '24px' }}>psychology</span>
                    <span>Circle of Competence (Sectors)</span>
                </h3>
                <p className="manager-subtitle">
                    Click domain expertise sectors below to intelligently filter Quantitative Screener opportunities.
                </p>
            </div>

            {/* Quick-Add Selector Pills */}
            <div className="quick-add-section">
                <span className="quick-add-label">Available Market Sectors:</span>
                <div className="quick-add-pills">
                    {availableSectors.length === 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
                            All standard GICS market sectors are added to your Circle of Competence.
                        </span>
                    ) : (
                        STANDARD_SECTORS.map(sec => {
                            const isAlreadyAdded = activeSectorNames.some(
                                a => a.toLowerCase() === sec.toLowerCase()
                            );
                            if (isAlreadyAdded) return null;
                            return (
                                <button
                                    key={sec}
                                    type="button"
                                    className="quick-add-pill"
                                    onClick={() => handleQuickAdd(sec)}
                                    disabled={loading}
                                >
                                    + {sec}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Active Sectors List or Empty State */}
            <div className="active-sectors-section">
                <span className="quick-add-label">Active Competence Sectors ({activeSectorNames.length}):</span>
                {activeSectorNames.length === 0 ? (
                    <EmptyState
                        icon="domain"
                        title="No Competence Sectors Defined"
                        message="Add sectors above or click standard sector pills to define your investment circle of competence."
                    />
                ) : (
                    <div className="active-sectors-grid">
                        {activeSectorNames.map(sectorName => (
                            <span key={sectorName} className="competence-tag">
                                <span>{sectorName}</span>
                                <button
                                    type="button"
                                    className="competence-tag-remove"
                                    onClick={() => handleRemove(sectorName)}
                                    title={`Remove ${sectorName}`}
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SectorCompetenceManager;
