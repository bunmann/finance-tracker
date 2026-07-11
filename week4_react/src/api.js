// ============================================================================
// File: api.js
// Description: Configures Axios instance and attaches JWT token automatically to outgoing requests.
// ============================================================================
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

// Silently intercept sliding token renewal headers and update stored JWT
api.interceptors.response.use(
    (response) => {
        const refreshedToken = response.headers['x-token-refresh'] || response.headers['X-Token-Refresh'];
        if (refreshedToken) {
            localStorage.setItem('token', refreshedToken);
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;