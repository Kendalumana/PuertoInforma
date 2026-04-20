import axios from 'axios';
import { supabase } from '../lib/supabase';

const BASE_URL = 'https://puertoinforma-backend.onrender.com/api/v1';

// Instancia pública
export default axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Instancia privada
export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// 🔥 Interceptor OBLIGATORIO: obtiene el token de Supabase
axiosPrivate.interceptors.request.use(
    async (config) => {
        const { data: { session } } = await supabase.auth.getSession();
        let token = session?.access_token;
        
        // Si no hay sesión de Supabase (por ej, login normal), usar el token de localStorage
        if (!token) {
            token = localStorage.getItem('token');
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn('No hay token de Supabase ni de localStorage');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Manejo de 401
axiosPrivate.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirigir al login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);