// ============================================================================
// File: HoldingMiniCard.jsx
// Description: Pure, modular presentation component for a single stock holding row.
//              Displays live price badges, share/cost details, and formatted P&L.
// ============================================================================
import React from 'react';
import { getPnlClass } from '../../../../utils/helpers';

/**
 * Component: HoldingMiniCard
 * Description: Modularized mini info card for individual stock holdings.
 * Props:
 *   - holding (Object): Stock holding details ({ ticker, shares, cost_basis, market_value, current_price, unrealized_gain, gain_percent, is_stale })
 */
function HoldingMiniCard({ holding, onOpenModal }) {
    if (!holding) return null;

    const pnl = holding.unrealized_gain !== null && holding.unrealized_gain !== undefined
        ? holding.unrealized_gain
        : (holding.market_value || 0) - (holding.cost_basis || 0);
    const pnlClass = getPnlClass(pnl);
    const hasPrice = holding.current_price !== null && holding.current_price !== undefined;
    const fmt = (num, decimals = 2) => parseFloat((num || 0).toFixed(decimals)).toString();

    return (
        <div className="top-holding-row">
            <div className="top-holding-left">
                <div>
                    <div className="top-holding-ticker-row">
                        <button
                            type="button"
                            className="ticker-link-btn top-holding-ticker"
                            onClick={() => onOpenModal && onOpenModal(holding.ticker)}
                            title="Click to view historical research & performance chart"
                        >
                            {holding.ticker}
                        </button>
                        {hasPrice && (
                            <span className={`top-holding-price-badge ${holding.is_stale ? 'stale' : ''}`}>
                                ${holding.current_price.toFixed(2)} / sh
                                {holding.is_stale && <span className="material-symbols-outlined top-holding-stale-icon">history</span>}
                            </span>
                        )}
                    </div>
                    <div className="top-holding-details-sub">
                        {fmt(holding.shares || 0, 4)} shares &middot; Cost ${(holding.cost_basis || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>
            <div className="top-holding-right">
                <div className="top-holding-val">
                    ${(holding.market_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`${pnlClass} top-holding-pnl-row`}>
                    <span>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span>
                    {holding.gain_percent !== null && holding.gain_percent !== undefined && (
                        <span>({holding.gain_percent >= 0 ? '+' : ''}{holding.gain_percent.toFixed(2)}%)</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HoldingMiniCard;
