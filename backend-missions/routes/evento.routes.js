/**
 * evento.routes.js — Recepción y procesamiento seguro de eventos en el servidor
 */
const express = require('express');
const router = express.Router();
const { procesarEvento, verificarRateLimit } = require('../services/mision.service');

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
 * Eventos válidos admitidos por el sistema de misiones
 */
const EVENTOS_VALIDOS = new Set([
    'perfil_ver',
    'perfil_avatar',
    'lugar_ver_detalle',
    'favorito_agregar',
    'favoritos_filtrar',
    'lugar_buscar',
    'mapa_filtro_categoria',
    'mapa_recentrar',
    'bus_consultar',
    'bus_ver_mapa',
    'ferry_ver_horarios',
    'noticia_abrir',
    'noticias_filtro_categoria',
    'noticias_buscar',
    'checkin'
]);

/**
 * POST /mision/evento
 * Body: { evento: string, referencia?: string }
 */
router.post('/evento', authMiddleware, async (req, res) => {
    try {
        const { evento, referencia } = req.body;

        if (!evento || typeof evento !== 'string' || !EVENTOS_VALIDOS.has(evento)) {
            return res.status(400).json({ error: 'Evento inválido o no reconocido' });
        }

        const supabase = req.app.get('supabaseAdmin');

        // 1. Rate Limiting: Máximo 60 eventos/minuto por usuario
        const excedeRateLimit = await verificarRateLimit(supabase, req.user.id);
        if (excedeRateLimit) {
            return res.status(429).json({
                error: 'Demasiadas solicitudes. Límite de 60 eventos por minuto alcanzado.'
            });
        }

        // 2. Procesar el evento y actualizar progresos
        const resultado = await procesarEvento(supabase, req.user.id, evento, referencia);

        return res.json({
            ok: true,
            ...resultado
        });
    } catch (error) {
        console.error('Error procesando evento:', error);
        return res.status(500).json({ error: 'Error interno al procesar evento' });
    }
});

module.exports = router;
