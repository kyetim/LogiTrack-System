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

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // withCredentials is included in the axios instance setup, or we pass it directly
                // Here we call the full URL using axios to bypass the main instance interceptors, but add withCredentials
                await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });

                // Retry the original request (cookies and withCredentials will be used automatically)
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
