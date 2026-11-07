/**
 * mision.routes.js — Endpoints para consulta de misiones de nivel y diarias
 */
const express = require('express');
const router = express.Router();
const { obtenerMisionesNivel } = require('../services/mision.service');
const { obtenerMisionesDiariasUsuario } = require('../services/diarias.service');

/**
 * Middleware para extraer el usuario desde el JWT de Supabase
 * En la arquitectura existente de PuertoInforma, el token Bearer se valida con supabase.auth.getUser()
 */
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
        return res.status(401).json({ error: 'Error autenticando token' });
    }
}

/**
 * GET /mision
 * Retorna las misiones de nivel disponibles para el usuario autenticado agrupadas por nivel.
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const supabase = req.app.get('supabaseAdmin');
        const niveles = await obtenerMisionesNivel(supabase, req.user.id);
        res.json({ niveles });
    } catch (error) {
        console.error('Error en GET /mision:', error);
        res.status(500).json({ error: 'Error al obtener misiones de nivel' });
    }
});

/**
 * GET /mision/diarias
 * Retorna las 5 misiones diarias del día con su progreso y timestamp de renovación (00:00 UTC-6).
 */
router.get('/diarias', authMiddleware, async (req, res) => {
    try {
        const supabase = req.app.get('supabaseAdmin');
        const diarias = await obtenerMisionesDiariasUsuario(supabase, req.user.id);
        res.json(diarias);
    } catch (error) {
        console.error('Error en GET /mision/diarias:', error);
        res.status(500).json({ error: 'Error al obtener misiones diarias' });
    }
});

/**
 * GET /mision/historial/:perfilId
 * Conserva la compatibilidad con el endpoint existente
 */
router.get('/historial/:perfilId', authMiddleware, async (req, res) => {
    try {
        const supabase = req.app.get('supabaseAdmin');
        const { data, error } = await supabase
            .from('progreso_mision')
            .select('id, completada_en, mision(*)')
            .eq('completada', true)
            .order('completada_en', { ascending: false })
            .limit(30);

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error en GET /mision/historial:', error);
        res.status(500).json({ error: 'Error al obtener historial de misiones' });
    }
});

/**
 * GET /mision/visitados/:perfilId
 * Conserva la compatibilidad con el endpoint existente
 */
router.get('/visitados/:perfilId', authMiddleware, async (req, res) => {
    try {
        const supabase = req.app.get('supabaseAdmin');
        const { data, error } = await supabase
            .from('checkin_lugar')
            .select('id, fecha, creado_en, lugar_id')
            .eq('usuario_id', req.user.id)
            .order('creado_en', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error en GET /mision/visitados:', error);
        res.status(500).json({ error: 'Error al obtener sitios visitados' });
    }
});

module.exports = router;
