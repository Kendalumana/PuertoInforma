/**
 * mision.service.js — Motor de reglas, procesamiento de eventos, cálculo de XP y niveles
 */
const { obtenerFechaCostaRica } = require('./diarias.service');

const XP_POR_NIVEL = 500;

function calcularNivel(xpTotal) {
    const xp = Math.max(0, Number(xpTotal) || 0);
    return Math.floor(xp / XP_POR_NIVEL) + 1;
}

/**
 * Verifica si el usuario excedió el rate limit (máximo 60 eventos en el último minuto)
 */
async function verificarRateLimit(supabaseAdmin, usuarioId) {
    const unMinutoAtras = new Date(Date.now() - 60 * 1000).toISOString();

    const { count, error } = await supabaseAdmin
        .from('evento_usuario')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .gte('creado_en', unMinutoAtras);

    if (error) {
        console.warn('Error comprobando rate limit:', error.message);
        return false;
    }

    return (count || 0) >= 60;
}

/**
 * Obtiene el perfil del usuario (XP actual y nivel)
 */
async function obtenerPerfilUsuario(supabaseAdmin, usuarioId) {
    const { data: perfil, error } = await supabaseAdmin
        .from('perfil')
        .select('*')
        .eq('usuario_id', usuarioId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(`Error obteniendo perfil: ${error.message}`);
    }

    const xpActual = perfil?.experiencia_xp || perfil?.experienciaXp || 0;
    return {
        perfil,
        xpActual,
        nivelActual: calcularNivel(xpActual)
    };
}

/**
 * Actualiza la racha del usuario si el evento califica (ej. checkin)
 */
async function actualizarRacha(supabaseAdmin, usuarioId, fechaHoy) {
    const { data: rachaActual } = await supabaseAdmin
        .from('racha_usuario')
        .select('*')
        .eq('usuario_id', usuarioId)
        .single();

    if (!rachaActual) {
        await supabaseAdmin.from('racha_usuario').insert({
            usuario_id: usuarioId,
            dias_actuales: 1,
            ultimo_dia: fechaHoy
        });
        return 1;
    }

    if (rachaActual.ultimo_dia === fechaHoy) {
        return rachaActual.dias_actuales;
    }

    // Calcular si el último día fue ayer
    const fechaAyer = new Date();
    fechaAyer.setDate(fechaAyer.getDate() - 1);
    const formatoAyer = fechaAyer.toISOString().split('T')[0];

    let nuevaRacha = 1;
    if (rachaActual.ultimo_dia === formatoAyer) {
        nuevaRacha = (rachaActual.dias_actuales || 0) + 1;
    }

    await supabaseAdmin
        .from('racha_usuario')
        .update({
            dias_actuales: nuevaRacha,
            ultimo_dia: fechaHoy,
            actualizado_en: new Date().toISOString()
        })
        .eq('usuario_id', usuarioId);

    return nuevaRacha;
}

/**
 * Obtiene las misiones de nivel disponibles para el usuario (nivel_requerido <= nivel_actual)
 * agrupadas por nivel con su progreso.
 */
async function obtenerMisionesNivel(supabaseAdmin, usuarioId) {
    const { nivelActual } = await obtenerPerfilUsuario(supabaseAdmin, usuarioId);

    // Misiones de nivel activas cuyo nivel_requerido <= nivelActual (o hasta nivelActual + 1 para previsualizar)
    const { data: misiones, error: errMisiones } = await supabaseAdmin
        .from('mision')
        .select('*')
        .eq('es_diaria', false)
        .eq('activa', true)
        .lte('nivel_requerido', Math.max(3, nivelActual))
        .order('nivel_requerido', { ascending: true })
        .order('id', { ascending: true });

    if (errMisiones) {
        throw new Error(`Error consultando misiones de nivel: ${errMisiones.message}`);
    }

    // Progresos del usuario (fecha_ref es null para nivel)
    const { data: progresos } = await supabaseAdmin
        .from('progreso_mision')
        .select('*')
        .eq('usuario_id', usuarioId)
        .is('fecha_ref', null);

    const mapProgreso = new Map();
    (progresos || []).forEach(p => mapProgreso.set(p.mision_id, p));

    // Agrupar por nivel
    const nivelesMap = new Map();

    (misiones || []).forEach(m => {
        const prog = mapProgreso.get(m.id);
        const completada = Boolean(prog?.completada);
        const progresoActual = prog ? prog.progreso : 0;
        const misionItem = {
            id: m.id,
            codigo: m.codigo,
            titulo: m.titulo,
            instrucciones: m.instrucciones,
            tipo: m.tipo,
            evento: m.evento,
            meta: m.meta,
            xp: m.xp,
            nivel_requerido: m.nivel_requerido,
            progreso: completada ? m.meta : Math.min(progresoActual, m.meta),
            completada,
            completada_en: prog?.completada_en || null,
            bloqueada: m.nivel_requerido > nivelActual
        };

        if (!nivelesMap.has(m.nivel_requerido)) {
            nivelesMap.set(m.nivel_requerido, []);
        }
        nivelesMap.get(m.nivel_requerido).push(misionItem);
    });

    const resultado = [];
    for (const [nivel, lista] of nivelesMap.entries()) {
        resultado.push({
            nivel,
            bloqueado: nivel > nivelActual,
            completadas: lista.filter(x => x.completada).length,
            total: lista.length,
            misiones: lista
        });
    }

    return resultado;
}

/**
 * Procesa un evento disparado por el usuario, valida y actualiza el progreso
 * de las misiones que coincidan con dicho evento de forma atómica.
 */
async function procesarEvento(supabaseAdmin, usuarioId, nombreEvento, referencia = null) {
    const fechaHoy = obtenerFechaCostaRica();

    // 1. Guardar evento para auditoría y rate limiting
    await supabaseAdmin.from('evento_usuario').insert({
        usuario_id: usuarioId,
        evento: nombreEvento,
        referencia: referencia ? String(referencia) : null
    });

    // 2. Si el evento es checkin o acción diaria, actualizar racha
    let rachaDias = 0;
    if (nombreEvento === 'checkin') {
        rachaDias = await actualizarRacha(supabaseAdmin, usuarioId, fechaHoy);
    }

    // 3. Obtener el perfil y nivel actual del usuario
    const { xpActual, nivelActual, perfil } = await obtenerPerfilUsuario(supabaseAdmin, usuarioId);

    // 4. Buscar misiones activas que escuchen este evento:
    // a) Misiones de nivel disponibles (nivel_requerido <= nivelActual)
    // b) Misiones diarias asignadas hoy
    const { data: misionesNivel } = await supabaseAdmin
        .from('mision')
        .select('*')
        .eq('activa', true)
        .eq('es_diaria', false)
        .eq('evento', nombreEvento)
        .lte('nivel_requerido', nivelActual);

    // Obtener las IDs de las 5 diarias de hoy
    const { data: diariasHoy } = await supabaseAdmin
        .from('mision_diaria_dia')
        .select('mision_id, mision(*)')
        .eq('fecha', fechaHoy);

    const misionesDiariasHoy = (diariasHoy || [])
        .map(d => d.mision)
        .filter(m => m && m.activa && m.evento === nombreEvento);

    // Unir todas las misiones candidatas
    const candidatas = [
        ...(misionesNivel || []).map(m => ({ mision: m, esDiaria: false, fechaRef: null })),
        ...misionesDiariasHoy.map(m => ({ mision: m, esDiaria: true, fechaRef: fechaHoy }))
    ];

    if (candidatas.length === 0) {
        return {
            xp_ganado: 0,
            misiones_completadas: [],
            subio_nivel: false,
            nivel_nuevo: nivelActual,
            xp_total: xpActual
        };
    }

    let xpGanadoTotal = 0;
    const misionesCompletadas = [];

    // 5. Evaluar y progresar cada misión candidata
    for (const item of candidatas) {
        const { mision, fechaRef } = item;

        // Consultar progreso existente
        let queryProg = supabaseAdmin
            .from('progreso_mision')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('mision_id', mision.id);

        if (fechaRef) {
            queryProg = queryProg.eq('fecha_ref', fechaRef);
        } else {
            queryProg = queryProg.is('fecha_ref', null);
        }

        const { data: progExistente } = await queryProg.maybeSingle();

        // Si ya está completada, ignorar (idempotencia)
        if (progExistente?.completada) {
            continue;
        }

        // Regla: Para misiones de tipo VISITA que exigen distintos objetos,
        // no permitir sumar doble si la misma referencia ya se contó en el día
        if (mision.tipo === 'VISITA' && referencia) {
            const { count: vecesContado } = await supabaseAdmin
                .from('evento_usuario')
                .select('id', { count: 'exact', head: true })
                .eq('usuario_id', usuarioId)
                .eq('evento', nombreEvento)
                .eq('referencia', String(referencia))
                .gte('creado_en', `${fechaHoy}T00:00:00Z`);

            // Si ya hubo más de 1 evento con esta misma referencia hoy (incluyendo el recién insertado), no sumar
            if ((vecesContado || 0) > 1) {
                continue;
            }
        }

        let nuevoProgreso = (progExistente?.progreso || 0) + 1;
        if (mision.tipo === 'RACHA' && rachaDias > 0) {
            nuevoProgreso = rachaDias;
        }

        const seCompleto = nuevoProgreso >= mision.meta;

        // Guardar progreso de forma idempotente
        const datosUpsert = {
            usuario_id: usuarioId,
            mision_id: mision.id,
            fecha_ref: fechaRef,
            progreso: Math.min(nuevoProgreso, mision.meta),
            completada: seCompleto,
            completada_en: seCompleto ? new Date().toISOString() : null,
            actualizado_en: new Date().toISOString()
        };

        const { error: errUpsert } = await supabaseAdmin
            .from('progreso_mision')
            .upsert(datosUpsert, { onConflict: 'usuario_id,mision_id,fecha_ref' });

        if (errUpsert) {
            console.warn('Error al actualizar progreso de misión:', errUpsert.message);
            continue;
        }

        // Si se acaba de completar, acumular XP
        if (seCompleto) {
            xpGanadoTotal += mision.xp;
            misionesCompletadas.push({
                id: mision.id,
                codigo: mision.codigo,
                titulo: mision.titulo,
                xp: mision.xp
            });
        }
    }

    // 6. Si se ganó XP, sumar atómicamente al perfil
    let nuevoXpTotal = xpActual;
    let nuevoNivel = nivelActual;
    let subioNivel = false;

    if (xpGanadoTotal > 0) {
        nuevoXpTotal = xpActual + xpGanadoTotal;
        nuevoNivel = calcularNivel(nuevoXpTotal);
        subioNivel = nuevoNivel > nivelActual;

        if (perfil?.id) {
            await supabaseAdmin
                .from('perfil')
                .update({
                    experiencia_xp: nuevoXpTotal,
                    experienciaXp: nuevoXpTotal
                })
                .eq('id', perfil.id);
        } else {
            // Intentar por usuario_id
            await supabaseAdmin
                .from('perfil')
                .update({
                    experiencia_xp: nuevoXpTotal,
                    experienciaXp: nuevoXpTotal
                })
                .eq('usuario_id', usuarioId);
        }
    }

    return {
        xp_ganado: xpGanadoTotal,
        misiones_completadas: misionesCompletadas,
        subio_nivel: subioNivel,
        nivel_nuevo: nuevoNivel,
        nivel_anterior: nivelActual,
        xp_total: nuevoXpTotal
    };
}

module.exports = {
    calcularNivel,
    verificarRateLimit,
    obtenerMisionesNivel,
    procesarEvento
};
