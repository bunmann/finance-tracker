# Week 5 — Lesson 2: JWT Authentication (Frontend)

Your backend now requires a JWT token for every request. In this lesson, we'll build **login and signup pages** in React, store the token, and automatically attach it to all API calls.

---

## 1. The Authentication Flow (Frontend Perspective)

```
User opens app → No token? → Redirect to /login
                              ↓
                  User enters email + password
                              ↓
                  POST /login → Server returns JWT token
                              ↓
                  Store token in localStorage
                              ↓
                  Redirect to / (Dashboard)
                              ↓
                  All future API calls include token in header
```

---

## 2. Updating `api.js` to Attach the Token

Every API call needs to include the token. Instead of adding it manually to every request, we configure Axios to do it automatically.

Update **`src/api.js`**:

```js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
});

// Automatically attach the JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
```

### What is an Interceptor?

An **interceptor** is middleware for HTTP requests. It runs before every request is sent. Our interceptor:
1. Checks if a token exists in `localStorage`
2. If yes, adds the `Authorization: Bearer <token>` header
3. Passes the request through

This means we don't need to change any existing component code — `TransactionForm`, `TransactionList`, and `Dashboard` will automatically send the token with their API calls.

### What is `localStorage`?

`localStorage` is a browser-provided key-value store that persists across page refreshes and browser restarts. It's like a tiny local database built into every browser:

```js
localStorage.setItem('token', 'eyJhbG...');   // Save
localStorage.getItem('token');                  // Read → 'eyJhbG...'
localStorage.removeItem('token');               // Delete
```

---

## 3. Creating the Login Page

Create **`src/components/LoginPage.jsx`**:

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
```

### `useNavigate` — React Router's Redirect Function

```js
const navigate = useNavigate();
navigate('/');  // Redirect to the dashboard
```

`useNavigate` is a React Router hook that lets you programmatically change pages in JavaScript (rather than the user clicking a `<Link>`). After login, we use it to send the user to the dashboard.

### The `onLogin` Prop

The login page calls `onLogin()` to notify the parent `App` component that the user has logged in. This triggers `App` to update its state and re-render (showing the navbar, loading transactions, etc.).

---

## 4. Creating the Signup Page

Create **`src/components/SignupPage.jsx`**:

```jsx
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
```

### Confirm Password — Client-Side Validation

```js
if (password !== confirmPassword) {
    setError('Passwords do not match.');
    return;  // Stop here — don't send the request
}
```

This is **client-side validation** — we check before even calling the API. The `return` statement exits the function early so the API request never fires. This gives instant feedback without a network round-trip.

### `setTimeout` for Redirect Delay

```js
setTimeout(() => navigate('/login'), 1500);
```

After signup succeeds, we show a success message for 1.5 seconds before redirecting. This gives the user a moment to see the confirmation.

---

## 5. Updating App.jsx with Auth State

Update **`src/App.jsx`** to manage authentication state:

```jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './api';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import './App.css';

function App() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    // Fetch transactions only when logged in
    useEffect(() => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }

        api.get('/transactions')
            .then(response => {
                setTransactions(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error:', error);
                // If we get a 401, token is invalid — log out
                if (error.response && error.response.status === 401) {
                    handleLogout();
                }
                setLoading(false);
            });
    }, [isLoggedIn]);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setTransactions([]);
    };

    const handleTransactionAdded = (newTransaction) => {
        setTransactions([...transactions, newTransaction]);
    };

    const handleTransactionDeleted = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

    return (
        <Router>
            <div className="App">
                <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
                <main className="main-content">
                    <Routes>
                        {isLoggedIn ? (
                            <>
                                <Route path="/" element={<Dashboard transactions={transactions} />} />
                                <Route path="/transactions" element={
                                    <div>
                                        <TransactionForm onTransactionAdded={handleTransactionAdded} />
                                        <TransactionList
                                            transactions={transactions}
                                            loading={loading}
                                            onDelete={handleTransactionDeleted}
                                        />
                                    </div>
                                } />
                                <Route path="*" element={<Navigate to="/" />} />
                            </>
                        ) : (
                            <>
                                <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                                <Route path="/signup" element={<SignupPage />} />
                                <Route path="*" element={<Navigate to="/login" />} />
                            </>
                        )}
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
```

### Auth State: `isLoggedIn`

```js
const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
```

The `!!` converts a value to a boolean:
- If there's a token: `!!"eyJhbG..."` → `true`
- If there's no token: `!!null` → `false`

This means if you refresh the page with a stored token, you stay logged in.

### Protected Routes with `<Navigate>`

```jsx
<Route path="*" element={<Navigate to="/login" />} />
```

`<Navigate>` is React Router's redirect component. `path="*"` matches any URL not already matched. So:
- If logged out and visiting `/dashboard` → redirected to `/login`
- If logged in and visiting `/login` → redirected to `/`

### Conditional Rendering: `{isLoggedIn ? (...) : (...)}`

This is a **ternary operator** in JSX. If `isLoggedIn` is `true`, render the dashboard/transaction routes. If `false`, render the login/signup routes. This is the simplest form of route protection.

---

## 6. Updating Navbar for Auth

Update **`src/components/Navbar.jsx`**:

```jsx
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
```

### React Fragments: `<>...</>`

```jsx
<>
    <Link to="/">Dashboard</Link>
    <Link to="/transactions">Transactions</Link>
    <button>Logout</button>
</>
```

`<>` and `</>` are **React Fragments** — they let you return multiple elements without adding an extra `<div>` to the DOM. They're invisible wrappers. Without them, React would complain that you're returning multiple sibling elements.

---

## 7. Adding Auth Styles

Add these styles to **`src/App.css`**:

```css
/* ========== Auth Pages ========== */
.auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
}

.auth-card {
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
}

.auth-card h2 {
    text-align: center;
    margin-bottom: 20px;
    color: #1a1a2e;
}

.auth-switch {
    text-align: center;
    margin-top: 15px;
    color: #666;
}

.auth-switch a {
    color: #1a1a2e;
    font-weight: 600;
}

.error-message {
    color: #ff4757;
    background: #ffe0e3;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 15px;
    text-align: center;
}

.success-message {
    color: #2ed573;
    background: #e0ffe8;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 15px;
    text-align: center;
}

/* ========== Logout Button ========== */
.logout-btn {
    background: transparent;
    color: #e0e0e0;
    border: 1px solid #e0e0e0;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.logout-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}
```

---

## 8. Your Task

1. Update `src/api.js` with the token interceptor.
2. Create `src/components/LoginPage.jsx`.
3. Create `src/components/SignupPage.jsx`.
4. Update `src/App.jsx` with auth state and protected routes.
5. Update `src/components/Navbar.jsx` with conditional links and logout.
6. Add the auth styles to `src/App.css`.
7. Test the full flow:
   - Open `http://localhost:5173` — you should be redirected to `/login`
   - Click "Sign up" → create an account
   - Login with your credentials → you should see the dashboard
   - Refresh the page → you should stay logged in (token persists)
   - Click "Logout" → redirected back to `/login`
   - Try visiting `/transactions` while logged out → redirected to `/login`

---

## Key Concepts Summary

| Concept | What It Does |
|---|---|
| **`localStorage`** | Browser storage that persists across refreshes |
| **Axios interceptor** | Middleware that runs before every HTTP request |
| **`useNavigate()`** | React Router hook for programmatic redirects |
| **`<Navigate to="...">`** | React Router component for declarative redirects |
| **`!!value`** | Converts any value to a boolean (double negation) |
| **`<>...</>` (Fragment)** | Invisible wrapper to return multiple elements |
| **Protected routes** | Routes that redirect to login when not authenticated |
| **`isLoggedIn` state** | Single boolean that controls what the user sees |
