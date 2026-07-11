// ============================================================================
// File: LoginPage.jsx
// Description: Handles user authentication (login). Submits credentials to POST /login,
//              stores the returned JWT token in localStorage, and manages 30-day email prefill.
// ============================================================================
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { saveRememberedEmail, getRememberedEmail, clearRememberedEmail } from '../../utils/authSession';
import '../../styles/Auth.css';

/**
 * Component: LoginPage
 * Description: Renders the user login page. Authenticates credentials against the API,
 *              stores JWT tokens to local storage, and pre-fills remembered emails.
 * Props:
 *   - onLogin (Function): App parent login callback to toggle auth state.
 */
function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberEmail, setRememberEmail] = useState(false);
    const [error, setError] = useState('');
    const passwordInputRef = useRef(null);
    const navigate = useNavigate();

    /**
     * Hook: useEffect
     * Description: Checks local storage on mount for an unexpired remembered email.
     *              If present, auto-fills the email input and focuses the password field.
     */
    useEffect(() => {
        const stored = getRememberedEmail();
        if (stored) {
            setEmail(stored);
            setRememberEmail(true);
            if (passwordInputRef.current) {
                passwordInputRef.current.focus();
            }
        }
    }, []);

    /**
     * Function: handleSubmit
     * Description: Submits the user's email, password, and remember_email flag to POST /login,
     *              saves the signed JWT, records or clears remembered email, and redirects.
     * Parameters:
     *   - e (Event): Standard submit event.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        api.post('/login', { email, password, remember_email: rememberEmail })
            .then(response => {
                // Store the access token
                localStorage.setItem('token', response.data.access_token);
                
                // Save or purge remembered email based on checkbox
                if (rememberEmail) {
                    saveRememberedEmail(email);
                } else {
                    clearRememberedEmail();
                }
                
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
        <div className="auth-container login-page">
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
                            ref={passwordInputRef}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="remember-me-row">
                        <input
                            type="checkbox"
                            id="remember-email"
                            checked={rememberEmail}
                            onChange={(e) => setRememberEmail(e.target.checked)}
                        />
                        <label htmlFor="remember-email">
                            Remember my email on this device (30 days)
                        </label>
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