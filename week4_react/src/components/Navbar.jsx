import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <h1>💰 Finance Tracker</h1>
            </div>
            <div className="navbar-links">
                <Link to="/">Dashboard</Link>
                <Link to="/transactions">Transactions</Link>
            </div>
        </nav>
    );
}

export default Navbar;