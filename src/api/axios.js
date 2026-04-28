import axios from 'axios';
import { supabase } from '../lib/supabase';

// const BASE_URL = 'https://puertoinforma-backend.onrender.com/api/v1';
const BASE_URL = 'https://puertoInforma-backend-production.up.railway.app/api/v1';

// Instancia pública (sin token)
export default axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Instancia privada (con token automático)
export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// ── Función auxiliar: obtiene el token más fresco posible ──
async function obtenerToken() {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
            // Si el token vence en menos de 60 segundos, refrescarlo proactivamente
            const ahora = Math.floor(Date.now() / 1000);
            if (session.expires_at && session.expires_at - ahora < 60) {
                const { data: { session: newSession } } = await supabase.auth.refreshSession();
                if (newSession?.access_token) return newSession.access_token;
            }
            return session.access_token;
        }
    } catch (err) {
        console.warn('[axiosPrivate] No se pudo obtener sesión de Supabase:', err?.message);
    }

    // Fallback: token guardado manualmente en localStorage (login clásico)
    return localStorage.getItem('token');
}

// ── Interceptor de REQUEST: adjunta el token ──
axiosPrivate.interceptors.request.use(
    async (config) => {
        const token = await obtenerToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn('[axiosPrivate] Sin token disponible');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Interceptor de RESPONSE: maneja 401 y 403 ──
axiosPrivate.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // Si es 401 o 403 y no hemos reintentado ya
        if ((status === 401 || status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Intentar refrescar la sesión de Supabase
                const { data: { session } } = await supabase.auth.refreshSession();
                if (session?.access_token) {
                    // Reintentar la petición original con el nuevo token
                    originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
                    return axiosPrivate(originalRequest);
                }
            } catch (refreshErr) {
                console.warn('[axiosPrivate] No se pudo refrescar el token:', refreshErr?.message);
            }

            // Si el refresh falló → mandar al login
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);