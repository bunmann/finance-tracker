// ============================================================================
// File: Navbar.jsx
// Description: Application header navigation bar providing links to dashboard and transactions.
// ============================================================================
import { Link } from 'react-router-dom';

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