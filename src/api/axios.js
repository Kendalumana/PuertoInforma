import axios from 'axios';

// Aquí pones la URL que te dio Render (sin la barra al final)
const BASE_URL = 'https://tu-proyecto-en-render.onrender.com/api/v1';

export default axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Este lo usaremos más adelante para las rutas que ocupan TOKEN (Login/Visitas)
export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});