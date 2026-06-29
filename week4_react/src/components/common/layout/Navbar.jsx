// ============================================================================
// File: Navbar.jsx
// Description: Application header navigation sidebar providing links to main views.
// ============================================================================
import { NavLink, Link } from 'react-router-dom';
import '../../../styles/Navbar.css';

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
        return (
            <nav className="navbar-top">
                <div className="navbar-top-brand">
                    <h1 style={{ fontFamily: 'var(--font-brand)', color: 'var(--inverse-surface)' }}>Veridian Finance</h1>
                </div>
                <div className="navbar-top-links">
                    <Link to="/login">Login</Link>
                    <Link to="/signup">Sign Up</Link>
                </div>
            </nav>
        );
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <h1>Veridian Finance</h1>
                <p>Pro Edition</p>
            </div>
            <nav className="sidebar-links">
                <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                    <span className="material-symbols-outlined">dashboard</span>
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/transactions" className={({ isActive }) => isActive ? 'active' : ''}>
                    <span className="material-symbols-outlined">payments</span>
                    <span>Transactions</span>
                </NavLink>
                <NavLink to="/budgets" className={({ isActive }) => isActive ? 'active' : ''}>
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    <span>Budgets</span>
                </NavLink>
                <NavLink to="/stocks" className={({ isActive }) => isActive ? 'active' : ''}>
                    <span className="material-symbols-outlined">monitoring</span>
                    <span>Stocks</span>
                </NavLink>
                <NavLink to="/screener" className={({ isActive }) => isActive ? 'active' : ''}>
                    <span className="material-symbols-outlined">saved_search</span>
                    <span>Screener</span>
                </NavLink>
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