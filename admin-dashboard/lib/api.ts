import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
api.interceptors.request.use((config) => {
    // Let browser handle Content-Type for FormData (multipart/form-data + boundary)
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    return config;
});

// Handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh logic for auth endpoints to prevent infinite loops
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/refresh') ||
            originalRequest?.url?.includes('/auth/me') ||
            originalRequest?.url?.includes('/auth/login');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // Let AuthContext handle the redirect — do NOT use window.location.href
                // (hard reload causes infinite loop by re-triggering checkAuth)
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
