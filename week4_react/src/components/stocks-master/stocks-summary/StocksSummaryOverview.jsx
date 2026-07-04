// ============================================================================
// File: StocksSummaryOverview.jsx
// Description: Route-level wrapper for the Stocks Summary page.
//              Previously owned its own API fetch; that logic has been lifted
//              to StocksMaster.jsx which passes data down as props. This file
//              is kept as a named wrapper so summary-specific state (e.g. chart
//              timeframe toggle) can be added here later without touching the
//              parent router.
// ============================================================================
import StocksSummaryContent from './StocksSummaryContent';
import '../../../styles/StockPortfolio.css';

/**
 * Component: StocksSummaryOverview
 * Description: Thin pass-through wrapper for the Stocks Summary presenter.
 *              All data fetching is handled by StocksMaster.
 * Props:
 *   - portfolio (Object|null): Live portfolio data from StocksMaster.
 *   - loading (Boolean): True while the initial portfolio fetch is in progress.
 *   - lastRefreshed (Date|null): Timestamp of the last successful API response.
 */
function StocksSummaryOverview({ portfolio, loading, lastRefreshed }) {
    return (
        <StocksSummaryContent
            portfolio={portfolio}
            loading={loading}
            lastRefreshed={lastRefreshed}
        />
    );
}

export default StocksSummaryOverview;
