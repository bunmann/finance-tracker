// ============================================================================
// File: SignupPage.jsx
// Description: Handles new user registration. Performs client-side validation and submissions.
// ============================================================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Client-side validation: check passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        api.post('/users', { email, password })
            .then(() => {
                setSuccess('Account created! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1500);
            })
            .catch(err => {
                if (err.response && err.response.data && err.response.data.detail) {
                    const detail = err.response.data.detail;
                    if (typeof detail === 'string') {
                        setError(detail);
                    } else if (Array.isArray(detail)) {
                        setError(detail.map(d => d.msg).join(', '));
                    } else {
                        setError(JSON.stringify(detail));
                    }
                } else {
                    setError('Signup failed. Please try again.');
                }
            });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Sign Up</h2>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
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
                    <div>
                        <label>Confirm Password:</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Create Account</button>
                </form>
                <p className="auth-switch">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default SignupPage;