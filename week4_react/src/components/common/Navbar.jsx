// ============================================================================
// File: Navbar.jsx
// Description: Application header navigation bar providing links to dashboard and transactions.
// ============================================================================
import { Link } from 'react-router-dom';

/**
 * Component: Navbar
 * Description: Renders the site-wide main navigation bar, showing links depending on
 *              authentication status and exposing a logout trigger.
 * Props:
 *   - isLoggedIn (Boolean): User session state.
 *   - onLogout (Function): Navbar logout handler that clears local browser tokens.
 */
function Navbar({ isLoggedIn, onLogout }) {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <h1>💰 Finance Tracker</h1>
            </div>
            <div className="navbar-links">
                {isLoggedIn ? (
                    <>
                        <Link to="/">Dashboard</Link>
                        <Link to="/transactions">Transactions</Link>
                        <Link to="/budgets">Budgets</Link>
                        <Link to="/stocks">Stocks</Link>
                        <button onClick={onLogout} className="logout-btn">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/signup">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;