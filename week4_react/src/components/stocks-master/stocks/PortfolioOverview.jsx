// ============================================================================
// File: PortfolioOverview.jsx
// Description: Route-level wrapper for the Portfolio Management page.
//              Previously owned its own API fetch and refreshTransactionsTrigger
//              state; all of that has been lifted to StocksMaster.jsx. This file
//              is kept as a named wrapper so portfolio-specific state (e.g.
//              selected holding, active detail panel) can be added here later
//              without touching the parent router.
// ============================================================================
import PortfolioContent from './PortfolioContent';
import '../../../styles/StockPortfolio.css';

/**
 * Component: PortfolioOverview
 * Description: Thin pass-through wrapper for the Portfolio Management presenter.
 *              All data fetching and refresh callbacks are handled by StocksMaster.
 * Props:
 *   - portfolio (Object|null): Live portfolio data from StocksMaster.
 *   - loading (Boolean): True while the initial portfolio fetch is in progress.
 *   - lastRefreshed (Date|null): Timestamp of the last successful API response.
 *   - refreshTransactionsTrigger (Number): Bumped by StocksMaster after a trade so
 *       PortfolioContent re-fetches its own transaction history list.
 *   - handleTradeComplete (Function): Callback to StocksMaster triggering an
 *       immediate portfolio re-fetch after a buy, sell, or CSV import.
 *   - showToast (Function): Toast notification callback from App.
 */
function PortfolioOverview({ portfolio, loading, lastRefreshed, refreshTransactionsTrigger, handleTradeComplete, showToast }) {
    return (
        <PortfolioContent
            portfolio={portfolio}
            loading={loading}
            lastRefreshed={lastRefreshed}
            refreshTransactionsTrigger={refreshTransactionsTrigger}
            handleTradeComplete={handleTradeComplete}
            showToast={showToast}
        />
    );
}

export default PortfolioOverview;
