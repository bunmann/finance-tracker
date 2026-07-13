// ============================================================================
// File: Navbar.jsx
// Description: Application header navigation sidebar providing links to main views.
// ============================================================================
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

/**
 * Component: Navbar
 * Description: Renders the site-wide navigation sidebar (when logged in) or top-bar
 *              (when logged out), displaying links depending on auth status.
 * Props:
 *   - isLoggedIn (Boolean): User session state.
 *   - onLogout (Function): Navbar logout handler.
 */
function Navbar({ isLoggedIn, onLogout }) {
    if (!isLoggedIn) {
        return null;
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <h1>Veridian Finance</h1>
                <p>Pro Edition</p>
            </div>
            <nav className="sidebar-links">
                {/* Part 1: Personal Transactions */}
                <div className="sidebar-section">
                    <NavLink to="/cashflow" end className={({ isActive }) => `sidebar-link-primary ${isActive ? 'active' : ''}`}>
                        <span className="material-symbols-outlined">dashboard</span>
                        <span>Cash Flow Dashboard</span>
                    </NavLink>
                    <div className="sidebar-sublinks">
                        <NavLink to="/cashflow/transactions" className={({ isActive }) => `sidebar-link-secondary ${isActive ? 'active' : ''}`}>
                            <span className="material-symbols-outlined">payments</span>
                            <span>Transactions</span>
                        </NavLink>
                        <NavLink to="/cashflow/budgets" className={({ isActive }) => `sidebar-link-secondary ${isActive ? 'active' : ''}`}>
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                            <span>Budgets</span>
                        </NavLink>
                    </div>
                </div>

                {/* Part 2: Stocks & Capital */}
                <div className="sidebar-section">
                    <NavLink to="/stocks" end className={({ isActive }) => `sidebar-link-primary ${isActive ? 'active' : ''}`}>
                        <span className="material-symbols-outlined">pie_chart</span>
                        <span>Stocks Summary</span>
                    </NavLink>
                    <div className="sidebar-sublinks">
                        <NavLink to="/stocks/portfolio" className={({ isActive }) => `sidebar-link-secondary ${isActive ? 'active' : ''}`}>
                            <span className="material-symbols-outlined">monitoring</span>
                            <span>Portfolio Holdings</span>
                        </NavLink>
                        <NavLink to="/stocks/screener" className={({ isActive }) => `sidebar-link-secondary ${isActive ? 'active' : ''}`}>
                            <span className="material-symbols-outlined">saved_search</span>
                            <span>Screener</span>
                        </NavLink>
                        <NavLink to="/stocks/watchlist" className={({ isActive }) => `sidebar-link-secondary ${isActive ? 'active' : ''}`}>
                            <span className="material-symbols-outlined">visibility</span>
                            <span>Watchlist & Sectors</span>
                        </NavLink>
                    </div>
                </div>

                {/* Part 3: Financial Statements */}
                <div className="sidebar-section">
                    <div className="sidebar-link-disabled" title="Coming Soon: Balance Sheet & Net Worth Bridge">
                        <span className="material-symbols-outlined">account_balance</span>
                        <span>Financial Statements</span>
                        <span className="badge-soon">Soon</span>
                    </div>
                </div>
            </nav>
            <div className="sidebar-footer">
                <button onClick={onLogout} className="sidebar-logout-btn">
                    <span className="material-symbols-outlined">logout</span>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}

export default Navbar;