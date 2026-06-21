// ============================================================================
// File: LoginPage.jsx
// Description: Handles user authentication (login). Submits credentials to POST /login,
//              stores the returned JWT token in localStorage, and redirects to dashboard.
// ============================================================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

/**
 * Component: LoginPage
 * Description: Renders the user login page. Authenticates credentials against the API
 *              and stores JWT tokens to local storage before navigating to root dashboard.
 * Props:
 *   - onLogin (Function): App parent login callback to toggle auth state.
 */
function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    /**
     * Function: handleSubmit
     * Description: Submits the user's email and password to POST /login,
     *              saves the signed JWT, updates app state, and redirects to dashboard.
     * Parameters:
     *   - e (Event): Standard submit event.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        api.post('/login', { email, password })
            .then(response => {
                // Store the token
                localStorage.setItem('token', response.data.access_token);
                // Notify App that user is logged in
                onLogin();
                // Redirect to dashboard
                navigate('/');
            })
            .catch(err => {
                if (err.response && err.response.data && err.response.data.detail) {
                    setError(err.response.data.detail);
                } else {
                    setError('Login failed. Please try again.');
                }
            });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Login</h2>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>
                <p className="auth-switch">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;