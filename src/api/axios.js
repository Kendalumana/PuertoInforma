import axios from 'axios';
import { supabase } from '../lib/supabase';  // 👈 Importamos Supabase

const BASE_URL = 'https://puertoinforma-backend.onrender.com/api/v1';
// const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

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

// 🔥 Interceptor MODIFICADO: obtiene el token de Supabase automáticamente
axiosPrivate.interceptors.request.use(
    async (config) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor: si el token expira (401), redirige al login
axiosPrivate.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // No usamos localStorage.removeItem porque el token no está ahí
            // Opcional: puedes cerrar sesión en Supabase
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);