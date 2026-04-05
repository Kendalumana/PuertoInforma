import axios from 'axios';

const BASE_URL = 'https://puertoinforma-backend.onrender.com/api/v1';
/*const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';*/

// ── Instancia pública (login, lugares, etc.) ───────────────
export default axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// ── Instancia privada (rutas que requieren token) ──────────
export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor: agrega el token en cada request automáticamente
axiosPrivate.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor: si el token expira (401), manda al login
axiosPrivate.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);