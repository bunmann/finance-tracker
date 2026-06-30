// ============================================================================
// File: App.jsx
// Description: Main frontend React component that sets up routing, handles state,
//              and structures the overall page layouts.
// ============================================================================
import { BrowserRouter as Router } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import api from './api';
import AppContent from './AppContent';
import './App.css';

/**
 * Component: App
 * Description: The main application root component that initializes global state,
 *              coordinates page routing, manages authentication status, and handles 
 *              outbound API syncs.
 */
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [toast, setToast] = useState(null);

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
                }
                return Promise.reject(error);
            }
        );
        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

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