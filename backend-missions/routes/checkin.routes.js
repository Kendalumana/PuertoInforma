/**
 * checkin.routes.js — Endpoint para validación y registro de check-in presencial con GPS
 */
const express = require('express');
const router = express.Router();
const { haversineMetros } = require('../services/haversine');
const { procesarEvento } = require('../services/mision.service');
const { obtenerFechaCostaRica } = require('../services/diarias.service');

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token de autorización requerido' });
        }

        const token = authHeader.split(' ')[1];
        const supabase = req.app.get('supabaseAdmin');

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Error autenticando sesión' });
    }
}

/**
 * POST /lugar/:id/checkin
 * Body: { latitud: number, longitud: number, precision_m?: number }
 */
router.post('/:id/checkin', authMiddleware, async (req, res) => {
    try {
        const lugarId = req.params.id;
        const { latitud, longitud, precision_m } = req.body;

        if (latitud === undefined || longitud === undefined) {
            return res.status(400).json({ error: 'Coordenadas GPS requeridas (latitud, longitud)' });
        }

        const userLat = Number(latitud);
        const userLng = Number(longitud);
        const userPrecision = precision_m ? Number(precision_m) : null;

        // 1. Validar precisión GPS (máximo 100m)
        if (userPrecision !== null && userPrecision > 100) {
            return res.status(422).json({
                error: 'GPS_IMPRECISO',
                mensaje: 'La precisión de tu GPS supera los 100 metros. Intenta nuevamente al aire libre.'
            });
        }

        const supabase = req.app.get('supabaseAdmin');

        // 2. Obtener coordenadas del lugar de la base de datos
        const { data: lugar, error: errLugar } = await supabase
            .from('lugar')
            .select('id, nombre, latitud, longitud')
            .eq('id', lugarId)
            .single();

        if (errLugar || !lugar) {
            return res.status(404).json({ error: 'Lugar no encontrado' });
        }

        const placeLat = Number(lugar.latitud);
        const placeLng = Number(lugar.longitud);

        // 3. Validar distancia con Haversine (máximo 50 metros)
        const distanciaMetros = haversineMetros(userLat, userLng, placeLat, placeLng);

        if (distanciaMetros > 50) {
            return res.status(400).json({
                error: 'FUERA_DE_RANGO',
                mensaje: `Estás a ${Math.round(distanciaMetros)}m del lugar. Debes estar a menos de 50 metros.`,
                distancia_m: Math.round(distanciaMetros)
            });
        }

        // 4. Validar regla de negocio: Máximo 1 check-in por lugar al día por usuario
        const fechaHoy = obtenerFechaCostaRica();

        const { data: checkinPrevio } = await supabase
            .from('checkin_lugar')
            .select('id')
            .eq('usuario_id', req.user.id)
            .eq('lugar_id', lugarId)
            .eq('fecha', fechaHoy)
            .maybeSingle();

        if (checkinPrevio) {
            return res.status(409).json({
                error: 'YA_HECHO',
                mensaje: 'Ya realizaste un check-in en este comercio hoy. ¡Vuelve mañana!'
            });
        }

        // 5. Registrar el check-in en la base de datos
        const { error: errInsert } = await supabase
            .from('checkin_lugar')
            .insert({
                usuario_id: req.user.id,
                lugar_id: lugarId,
                fecha: fechaHoy,
                latitud: userLat,
                longitud: userLng,
                precision_m: userPrecision,
                distancia_m: Math.round(distanciaMetros * 10) / 10
            });

        if (errInsert) {
            // Manejar choque por restricción única en concurrencia
            if (errInsert.code === '23505') {
                return res.status(409).json({
                    error: 'YA_HECHO',
                    mensaje: 'Ya realizaste un check-in en este comercio hoy.'
                });
            }
            throw errInsert;
        }

        // 6. Procesar el evento 'checkin' en el motor de misiones
        const resultadoMision = await procesarEvento(supabase, req.user.id, 'checkin', lugarId);

        return res.json({
            ok: true,
            lugar: { id: lugar.id, nombre: lugar.nombre },
            distancia_m: Math.round(distanciaMetros),
            ...resultadoMision
        });

    } catch (error) {
        console.error('Error en check-in:', error);
        return res.status(500).json({ error: 'Error procesando el check-in' });
    }
});

module.exports = router;
