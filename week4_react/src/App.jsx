// ============================================================================
// File: App.jsx
// Description: Main frontend React component that sets up routing, handles state,
//              and structures the overall page layouts.
// ============================================================================
import { BrowserRouter as Router } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from './api';
import AppContent from './AppContent';
import './App.css';

const INACTIVITY_CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds

/**
 * Component: App
 * Description: The main application root component that initializes global state,
 *              coordinates page routing, manages authentication status, and handles 
 *              outbound API syncs along with 60-minute inactivity tracking.
 */
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [toast, setToast] = useState(null);
    const lastActivityTime = useRef(Date.now());

    /**
     * Function: showToast
     * Description: Triggers a state update to show a floating alert notification.
     */
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

    /**
     * Function: handleLogin
     * Description: Sets user authentication state to true (triggered on login form submission).
     */
    const handleLogin = () => {
        lastActivityTime.current = Date.now();
        setIsLoggedIn(true);
    };

    /**
     * Function: handleLogout
     * Description: Clears authentication tokens and resets login state.
     */
    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
    };

    /**
     * Hook: useEffect (Global 401 Interceptor)
     * Description: Mounts a global Axios response interceptor to detect 401 Unauthorized
     *              responses (e.g. expired tokens) and trigger automatic logout.
     */
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    handleLogout();
                    const detailMessage = error.response.data?.detail || 'Your session has expired. Please log in again.';
                    showToast(detailMessage, 'warning');
                }
                return Promise.reject(error);
            }
        );
        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, [showToast]);

    /**
     * Hook: useEffect (Global 1-Hour Inactivity Monitor)
     * Description: Tracks user interaction across mouse, keyboard, and touch events.
     *              If no activity occurs for 60 consecutive minutes while logged in,
     *              automatically clears the session and alerts the user.
     */
    useEffect(() => {
        if (!isLoggedIn) return;

        const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 consecutive minutes

        const recordActivity = () => {
            const now = Date.now();
            // Throttled: only update the timestamp if at least INACTIVITY_CHECK_INTERVAL_MS has passed
            if (now - lastActivityTime.current > INACTIVITY_CHECK_INTERVAL_MS) {
                lastActivityTime.current = now;
            }
        };

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));

        // Check periodically if the user has exceeded the 60-minute idle window
        const interval = setInterval(() => {
            if (Date.now() - lastActivityTime.current >= IDLE_TIMEOUT_MS) {
                handleLogout();
                showToast('You have been logged out due to 60 minutes of inactivity.', 'warning');
            }
        }, INACTIVITY_CHECK_INTERVAL_MS);

        return () => {
            events.forEach((event) => window.removeEventListener(event, recordActivity));
            clearInterval(interval);
        };
    }, [isLoggedIn, showToast]);

    return (
        <Router>
            <AppContent
                isLoggedIn={isLoggedIn}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
                showToast={showToast}
                toast={toast}
                setToast={setToast}
            />
        </Router>
    );
}

export default App;