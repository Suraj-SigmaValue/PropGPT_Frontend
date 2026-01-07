/**
 * API Client Configuration
 * Axios instance with base URL and interceptors
 */

import axios from 'axios';

// Vite uses import.meta.env.VITE_ for environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.55:8000/api';

// Helper function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,  // For session cookies and CSRF
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Add timestamp to bypass cache if needed
        if (config.method === 'get') {
            config.params = {
                ...config.params,
                _t: new Date().getTime(),
            };
        }

        // Add CSRF token for POST/PUT/PATCH/DELETE requests
        if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
            const csrfToken = getCookie('csrftoken');
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error:', error.request);
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default apiClient;
