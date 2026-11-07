/**
 * diarias.service.js — Gestión de misiones diarias renovadas a las 00:00 UTC-6 (Costa Rica)
 */

/**
 * Obtiene la fecha actual en zona horaria de Costa Rica (UTC-6) formato YYYY-MM-DD
 */
function obtenerFechaCostaRica() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Costa_Rica',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(new Date());
}

/**
 * Calcula la fecha de ayer en Costa Rica
 */
function obtenerFechaAyerCostaRica() {
    const hoy = new Date();
    // Restamos 24 horas
    const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Costa_Rica',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(ayer);
}

/**
 * Calcula el timestamp ISO del próximo 00:00:00 en UTC-6
 */
function calcularRenuevaEn() {
    const ahora = new Date();
    // Desplazamiento Costa Rica: UTC-6 (-360 minutos)
    const offsetCR = -6 * 60;
    const utcTime = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
    const crTime = new Date(utcTime + offsetCR * 60000);

    // Próxima medianoche en CR
    const proxMedianocheCR = new Date(crTime);
    proxMedianocheCR.setDate(crTime.getDate() + 1);
    proxMedianocheCR.setHours(0, 0, 0, 0);

    // Convertir de vuelta a UTC global
    const diff = proxMedianocheCR.getTime() - crTime.getTime();
    const renuevaEn = new Date(ahora.getTime() + diff);
    return renuevaEn.toISOString();
}

/**
 * Genera o asegura la existencia de las 5 misiones de hoy en `mision_diaria_dia`
 */
async function asegurarMisionesDelDia(supabaseAdmin) {
    const fechaHoy = obtenerFechaCostaRica();

    // 1. Verificar si ya existen las misiones para hoy
    const { data: existentes, error: errExist } = await supabaseAdmin
        .from('mision_diaria_dia')
        .select('orden, mision_id, mision(*)')
        .eq('fecha', fechaHoy)
        .order('orden', { ascending: true });

    if (errExist) {
        throw new Error(`Error al consultar misiones diarias del día: ${errExist.message}`);
    }

    if (existentes && existentes.length === 5) {
        return { fechaHoy, misiones: existentes.map(e => e.mision) };
    }

    // 2. Si no existen, obtener las misiones de ayer para no repetirlas
    const fechaAyer = obtenerFechaAyerCostaRica();
    const { data: deAyer } = await supabaseAdmin
        .from('mision_diaria_dia')
        .select('mision_id')
        .eq('fecha', fechaAyer);

    const idsAyer = new Set((deAyer || []).map(d => d.mision_id));

    // 3. Obtener el catálogo de misiones diarias activas
    const { data: poolDiarias, error: errPool } = await supabaseAdmin
        .from('mision')
        .select('*')
        .eq('es_diaria', true)
        .eq('activa', true);

    if (errPool || !poolDiarias || poolDiarias.length < 5) {
        throw new Error('No hay suficiente cantidad de misiones en el pool diario');
    }

    // Candidatas que no se usaron ayer (si hay suficientes)
    let candidatas = poolDiarias.filter(m => !idsAyer.has(m.id));
    if (candidatas.length < 5) {
        candidatas = poolDiarias; // fallback si el pool es justo
    }

    // Barajar aleatoriamente
    candidatas = candidatas.sort(() => Math.random() - 0.5);

    // Regla de negocio: Máximo 1 misión de tipo VISITA
    const seleccionadas = [];
    let visitasContadas = 0;

    for (const m of candidatas) {
        if (m.tipo === 'VISITA') {
            if (visitasContadas >= 1) continue;
            visitasContadas++;
        }
        seleccionadas.push(m);
        if (seleccionadas.length === 5) break;
    }

    // Si no se completaron 5 por la restricción de visita, rellenar con cualquier otra no-visita o disponible
    if (seleccionadas.length < 5) {
        for (const m of candidatas) {
            if (!seleccionadas.some(s => s.id === m.id)) {
                seleccionadas.push(m);
                if (seleccionadas.length === 5) break;
            }
        }
    }

    // 4. Insertar en mision_diaria_dia con orden 1 a 5
    const filasParaInsertar = seleccionadas.map((m, index) => ({
        fecha: fechaHoy,
        mision_id: m.id,
        orden: index + 1
    }));

    const { error: errInsert } = await supabaseAdmin
        .from('mision_diaria_dia')
        .upsert(filasParaInsertar, { onConflict: 'fecha,mision_id' });

    if (errInsert) {
        console.warn('Nota en inserción de diarias (posible colisión concurrente):', errInsert.message);
    }

    // Volver a consultar ordenadas
    const { data: recargadas } = await supabaseAdmin
        .from('mision_diaria_dia')
        .select('orden, mision_id, mision(*)')
        .eq('fecha', fechaHoy)
        .order('orden', { ascending: true });

    return {
        fechaHoy,
        misiones: (recargadas || []).map(r => r.mision)
    };
}

/**
 * Obtiene las 5 misiones diarias del día junto con el progreso del usuario
 */
async function obtenerMisionesDiariasUsuario(supabaseAdmin, usuarioId) {
    const { fechaHoy, misiones } = await asegurarMisionesDelDia(supabaseAdmin);
    const renuevaEn = calcularRenuevaEn();

    const idsMisiones = misiones.map(m => m.id);

    // Consultar progreso del usuario para estas 5 misiones hoy
    const { data: progresos } = await supabaseAdmin
        .from('progreso_mision')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('fecha_ref', fechaHoy)
        .in('mision_id', idsMisiones);

    const mapProgreso = new Map();
    (progresos || []).forEach(p => {
        mapProgreso.set(p.mision_id, p);
    });

    const misionesFormateadas = misiones.map(m => {
        const prog = mapProgreso.get(m.id);
        const completada = Boolean(prog?.completada);
        const progresoActual = prog ? prog.progreso : 0;
        return {
            id: m.id,
            codigo: m.codigo,
            titulo: m.titulo,
            instrucciones: m.instrucciones,
            tipo: m.tipo,
            evento: m.evento,
            meta: m.meta,
            xp: m.xp,
            es_diaria: true,
            progreso: completada ? m.meta : Math.min(progresoActual, m.meta),
            completada,
            completada_en: prog?.completada_en || null
        };
    });

    return {
        fecha: fechaHoy,
        renueva_en: renuevaEn,
        misiones: misionesFormateadas
    };
}

module.exports = {
    obtenerFechaCostaRica,
    calcularRenuevaEn,
    asegurarMisionesDelDia,
    obtenerMisionesDiariasUsuario
};
