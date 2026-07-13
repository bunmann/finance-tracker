// ============================================================================
// File: ScreenerOverview.jsx
// Description: Parent container component coordinating state, instant client-side
//              strategy filtering over cached candidates, and delegating visual
//              layout rendering to ScreenerContent.
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import ScreenerContent from './ScreenerContent';
import './Screener.css';

/**
 * Component: ScreenerOverview (Container)
 * Description: Coordinates quantitative parameters and instant client-side strategy
 *              filtering. Consumes synchronized competence sectors and cached raw
 *              candidates (`rawCandidates`) from StocksMaster via props so scans
 *              never re-fetch or wipe on tab switches.
 */
function ScreenerOverview({
    showToast,
    competenceSectors = [],
    rawCandidates = [],
    screenerLoading = false,
    onRefreshCandidates,
    onOpenModal
}) {
    // Screener Slider States
    const [minFcfGrowth, setMinFcfGrowth] = useState(20);       // Percentage (20 = 20%)
    const [minProfitMargin, setMinProfitMargin] = useState(15);  // Percentage (15 = 15%)
    const [maxDebtEquity, setMaxDebtEquity] = useState(1.0);     // Ratio
    const [maxPe, setMaxPe] = useState(25.0);                    // Ratio
    const [circleOfCompetenceOnly, setCircleOfCompetenceOnly] = useState(false);

    // Navigation & Data States
    const [activeTab, setActiveTab] = useState('overview');      // 'overview' | 'screener' | 'alerts'
    const [error, setError] = useState(null);

    // Reset window scroll to top whenever the internal strategy tab changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    // Normalize incoming competenceSectors prop for table row matching
    const formattedCompetenceSectors = useMemo(() => {
        return competenceSectors
            .map(c => (typeof c === 'object' ? c.sector : c)?.toLowerCase().trim())
            .filter(Boolean);
    }, [competenceSectors]);

    /**
     * Instant Client-Side Strategy Filtering
     * Evaluates Momentum Quality thresholds and Value Gap divergence directly from
     * the background-cached `rawCandidates` dataset in <1ms.
     */
    const results = useMemo(() => {
        if (!rawCandidates || !Array.isArray(rawCandidates) || rawCandidates.length === 0) {
            return null;
        }

        const minFcf = parseFloat(minFcfGrowth) / 100.0;
        const minMargin = parseFloat(minProfitMargin) / 100.0;
        const maxDebt = parseFloat(maxDebtEquity);
        const maxPeVal = parseFloat(maxPe);

        const momentumList = [];
        const valueGapList = [];

        rawCandidates.forEach(item => {
            // Global Gatekeeper: Circle of Competence Filter
            if (circleOfCompetenceOnly && item.source === 'recommendation') {
                const itemSector = (item.sector || '').toLowerCase().trim();
                if (!formattedCompetenceSectors.includes(itemSector)) {
                    return;
                }
            }

            // --- Strategy 1: Momentum Quality ---
            let qualifiesMomentum = true;
            if (item.profit_margin !== null && item.profit_margin !== undefined) {
                if (item.profit_margin < minMargin) qualifiesMomentum = false;
            } else if (minMargin > 0) {
                qualifiesMomentum = false;
            }

            if (qualifiesMomentum && item.pe !== null && item.pe !== undefined) {
                if (item.pe > maxPeVal) qualifiesMomentum = false;
            }

            if (qualifiesMomentum && item.debt_to_equity !== null && item.debt_to_equity !== undefined) {
                if (item.debt_to_equity > maxDebt) qualifiesMomentum = false;
            }

            if (qualifiesMomentum && item.fcf_growth !== null && item.fcf_growth !== undefined) {
                if (item.fcf_growth < minFcf) qualifiesMomentum = false;
            } else if (minFcf > 0) {
                qualifiesMomentum = false;
            }

            if (qualifiesMomentum) {
                const fcfPct = (item.fcf_growth || 0) * 100.0;
                const rsRankPct = 100.0 - (item.relative_strength || 0);
                const msg = `${item.ticker} - Top ${rsRankPct.toFixed(1)}% relative strength momentum leader with ${fcfPct.toFixed(1)}% FCF growth`;
                momentumList.push({
                    ...item,
                    message: msg
                });
            }

            // --- Strategy 2: Value Gap (Divergence Anomaly) ---
            if (
                item.qoq_revenue_growth !== null &&
                item.qoq_revenue_growth !== undefined &&
                item.performance_30d !== null &&
                item.performance_30d !== undefined
            ) {
                if (item.qoq_revenue_growth > 0.10 && item.performance_30d < -0.10) {
                    const growthPct = item.qoq_revenue_growth * 100.0;
                    const returnPct = item.performance_30d * 100.0;
                    const msg = `${item.ticker} - Revenue grew ${growthPct.toFixed(1)}% QoQ but share price dropped ${Math.abs(returnPct).toFixed(1)}% in 30 days`;
                    valueGapList.push({
                        ...item,
                        current_price: item.price,
                        message: msg
                    });
                }
            }
        });

        // Sort momentum quality candidates descending by relative strength
        momentumList.sort((a, b) => (b.relative_strength || 0) - (a.relative_strength || 0));

        // Sort value gap alerts ascending by 30-day return (largest drops first)
        valueGapList.sort((a, b) => (a.performance_30d || 0) - (b.performance_30d || 0));

        return {
            momentum_quality: momentumList,
            value_gap: valueGapList
        };
    }, [
        rawCandidates,
        minFcfGrowth,
        minProfitMargin,
        maxDebtEquity,
        maxPe,
        circleOfCompetenceOnly,
        formattedCompetenceSectors
    ]);

    const handleRunScan = (e) => {
        if (e) e.preventDefault();
        setError(null);

        // Reset all quantitative slider thresholds back to their initial baseline defaults
        setMinFcfGrowth(20);
        setMinProfitMargin(15);
        setMaxDebtEquity(1.0);
        setMaxPe(25.0);
        setCircleOfCompetenceOnly(false);
        showToast?.('Screener parameters reset to default baseline criteria!', 'info');
    };

    // Helper to render colored badges for stock relationship sources
    const renderSourceBadge = (source) => {
        const clean = (source || 'recommendation').toLowerCase();
        return <span className={`source-badge badge-${clean}`}>{clean}</span>;
    };

    return (
        <ScreenerContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            minFcfGrowth={minFcfGrowth}
            setMinFcfGrowth={setMinFcfGrowth}
            minProfitMargin={minProfitMargin}
            setMinProfitMargin={setMinProfitMargin}
            maxDebtEquity={maxDebtEquity}
            setMaxDebtEquity={setMaxDebtEquity}
            maxPe={maxPe}
            setMaxPe={setMaxPe}
            circleOfCompetenceOnly={circleOfCompetenceOnly}
            setCircleOfCompetenceOnly={setCircleOfCompetenceOnly}
            results={results}
            loading={screenerLoading}
            error={error}
            competenceSectors={formattedCompetenceSectors}
            handleRunScan={handleRunScan}
            renderSourceBadge={renderSourceBadge}
            onOpenModal={onOpenModal}
        />
    );
}

export default ScreenerOverview;
