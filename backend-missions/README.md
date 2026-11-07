# Backend Missions — PuertoInforma

Implementación del motor de misiones (diarias y de nivel), procesamiento de eventos seguros del lado del servidor, cálculo de XP y niveles, y verificación de check-in GPS.

## Estructura

```
backend-missions/
├── routes/
│   ├── mision.routes.js   # GET /mision, GET /mision/diarias, GET /mision/historial/:id, GET /mision/visitados/:id
│   ├── evento.routes.js   # POST /mision/evento (rate-limited a 60/min)
│   └── checkin.routes.js  # POST /lugar/:id/checkin (Haversine <= 50m)
└── services/
    ├── mision.service.js   # Lógica XP, niveles (500 XP/nivel), evaluación de reglas
    ├── diarias.service.js  # Generador de 5 misiones diarias (00:00 UTC-6 Costa Rica)
    └── haversine.js        # Fórmula matemática de cálculo de distancia
```

## Integración con el Servidor Express Existente

En el archivo principal del backend (ej. `server.js` o `app.js`):

```js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// 1. Cliente Supabase con Service Role (o anon si se maneja RLS)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);
app.set('supabaseAdmin', supabaseAdmin);

// 2. Montar rutas bajo el prefijo /api/v1
const misionRoutes = require('./backend-missions/routes/mision.routes');
const eventoRoutes = require('./backend-missions/routes/evento.routes');
const checkinRoutes = require('./backend-missions/routes/checkin.routes');

app.use('/api/v1/mision', misionRoutes);
app.use('/api/v1/mision', eventoRoutes); // expone /api/v1/mision/evento
app.use('/api/v1/lugar', checkinRoutes);  // expone /api/v1/lugar/:id/checkin
```

## Endpoints Implementados

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/mision` | Misiones de nivel disponibles agrupadas por nivel con progreso y estado. |
| `GET` | `/api/v1/mision/diarias` | 5 misiones diarias activas con progreso y `renueva_en` (UTC-6). |
| `POST` | `/api/v1/mision/evento` | Reporte de evento desde el frontend. Valida, suma progreso y otorga XP. Rate limit 60/min. |
| `POST` | `/api/v1/lugar/:id/checkin` | Check-in con GPS. Valida distancia <= 50m, precisión <= 100m, máx 1 al día. |
| `GET` | `/api/v1/mision/historial/:id` | Historial de misiones completadas. |
| `GET` | `/api/v1/mision/visitados/:id` | Sitios visitados por el usuario. |
