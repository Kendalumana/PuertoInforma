-- ============================================================
-- 002_seed_misiones.sql — PuertoInforma
-- Datos iniciales (Seed): 30 Misiones de Nivel + 15 Misiones Diarias
-- ============================================================

-- Misiones de Nivel 1 (Total: 600 XP)
INSERT INTO mision (codigo, titulo, instrucciones, tipo, evento, meta, xp, nivel_requerido, es_diaria, activa) VALUES
('N1-01', 'Primer Vistazo', 'Visita tu perfil por primera vez para conocer tus estadísticas.', 'ACCION', 'perfil_ver', 1, 30, 1, FALSE, TRUE),
('N1-02', 'Mi Cara', 'Elige y personaliza tu avatar en tu perfil.', 'ACCION', 'perfil_avatar', 1, 40, 1, FALSE, TRUE),
('N1-03', 'Explorador Inicial', 'Abre y revisa el detalle de 3 lugares distintos en el mapa.', 'VISITA', 'lugar_ver_detalle', 3, 60, 1, FALSE, TRUE),
('N1-04', 'Corazón Local', 'Agrega tu primer comercio o sitio de interés a favoritos.', 'ACCION', 'favorito_agregar', 1, 30, 1, FALSE, TRUE),
('N1-05', 'Busca y Encuentra', 'Realiza tu primera búsqueda en el panel del mapa interactivo.', 'ACCION', 'lugar_buscar', 1, 20, 1, FALSE, TRUE),
('N1-06', 'Categorías', 'Filtra los lugares por cualquier categoría en el mapa.', 'ACCION', 'mapa_filtro_categoria', 1, 20, 1, FALSE, TRUE),
('N1-07', 'Rumbo Fijo', 'Consulta las rutas y horarios de autobús del puerto.', 'ACCION', 'bus_consultar', 1, 40, 1, FALSE, TRUE),
('N1-08', 'Cruzar el Golfo', 'Revisa los horarios de salida y tarifas del ferry.', 'ACCION', 'ferry_ver_horarios', 1, 50, 1, FALSE, TRUE),
('N1-09', 'Al Día', 'Abre una noticia o evento reciente de la comunidad.', 'ACCION', 'noticia_abrir', 1, 30, 1, FALSE, TRUE),
('N1-10', '¡Check-in!', 'Haz tu primer check-in presencial con GPS en cualquier comercio o sitio.', 'VISITA', 'checkin', 1, 80, 1, FALSE, TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    instrucciones = EXCLUDED.instrucciones,
    tipo = EXCLUDED.tipo,
    evento = EXCLUDED.evento,
    meta = EXCLUDED.meta,
    xp = EXCLUDED.xp,
    nivel_requerido = EXCLUDED.nivel_requerido,
    es_diaria = EXCLUDED.es_diaria,
    activa = EXCLUDED.activa;

-- Misiones de Nivel 2 (Total: 620 XP)
INSERT INTO mision (codigo, titulo, instrucciones, tipo, evento, meta, xp, nivel_requerido, es_diaria, activa) VALUES
('N2-01', 'Coleccionista', 'Explora y abre el detalle de 10 lugares distintos.', 'VISITA', 'lugar_ver_detalle', 10, 60, 2, FALSE, TRUE),
('N2-02', 'Lista de Favoritos', 'Guarda 5 comercios o puntos de interés en tus favoritos.', 'ACCION', 'favorito_agregar', 5, 50, 2, FALSE, TRUE),
('N2-03', 'Rutas Maestro', 'Abre el mapa de recorrido de 3 rutas de autobuses.', 'ACCION', 'bus_ver_mapa', 3, 60, 2, FALSE, TRUE),
('N2-04', 'Noticias del Puerto', 'Lee 5 artículos o comunicados en la sección de noticias.', 'ACCION', 'noticia_abrir', 5, 50, 2, FALSE, TRUE),
('N2-05', 'Categorías Pro', 'Explora filtrando por 5 categorías diferentes en el mapa.', 'ACCION', 'mapa_filtro_categoria', 5, 50, 2, FALSE, TRUE),
('N2-06', 'Favorito Frecuente', 'Activa el filtro de favoritos en el mapa 3 veces.', 'ACCION', 'favoritos_filtrar', 3, 40, 2, FALSE, TRUE),
('N2-07', 'Ferry Experto', 'Consulta los horarios del ferry en 5 ocasiones.', 'ACCION', 'ferry_ver_horarios', 5, 70, 2, FALSE, TRUE),
('N2-08', 'Explorador GPS', 'Realiza check-in presencial en 5 comercios o sitios diferentes.', 'VISITA', 'checkin', 5, 100, 2, FALSE, TRUE),
('N2-09', 'Periodista Local', 'Utiliza el buscador de noticias 5 veces para encontrar eventos.', 'ACCION', 'noticias_buscar', 5, 50, 2, FALSE, TRUE),
('N2-10', 'Centro del Mapa', 'Utiliza el botón de recentrar o geolocalizar en el mapa 5 veces.', 'ACCION', 'mapa_recentrar', 5, 40, 2, FALSE, TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    instrucciones = EXCLUDED.instrucciones,
    tipo = EXCLUDED.tipo,
    evento = EXCLUDED.evento,
    meta = EXCLUDED.meta,
    xp = EXCLUDED.xp,
    nivel_requerido = EXCLUDED.nivel_requerido,
    es_diaria = EXCLUDED.es_diaria,
    activa = EXCLUDED.activa;

-- Misiones de Nivel 3 (Total: 810 XP)
INSERT INTO mision (codigo, titulo, instrucciones, tipo, evento, meta, xp, nivel_requerido, es_diaria, activa) VALUES
('N3-01', 'Gran Explorador', 'Inspecciona a fondo abriendo 25 lugares distintos de Puntarenas.', 'VISITA', 'lugar_ver_detalle', 25, 100, 3, FALSE, TRUE),
('N3-02', 'Colección Completa', 'Arma tu guía definitiva guardando 15 favoritos.', 'ACCION', 'favorito_agregar', 15, 80, 3, FALSE, TRUE),
('N3-03', 'Racha Semanal', 'Haz check-in o mantén actividad continua durante 7 días seguidos.', 'RACHA', 'checkin', 7, 150, 3, FALSE, TRUE),
('N3-04', 'Embajador del Puerto', 'Realiza check-in presencial en 15 comercios o atractivos distintos.', 'VISITA', 'checkin', 15, 120, 3, FALSE, TRUE),
('N3-05', 'Redactor Estrella', 'Lee 20 noticias y mantente completamente informado de la zona.', 'ACCION', 'noticia_abrir', 20, 80, 3, FALSE, TRUE),
('N3-06', 'Bus Master', 'Consulta las rutas de autobuses 10 veces.', 'ACCION', 'bus_consultar', 10, 70, 3, FALSE, TRUE),
('N3-07', 'Rutero del Golfo', 'Inspecciona en el mapa el trayecto de 10 rutas de transporte.', 'ACCION', 'bus_ver_mapa', 10, 80, 3, FALSE, TRUE),
('N3-08', 'Experto Ferry', 'Consulta las salidas y rutas de ferry 15 veces.', 'ACCION', 'ferry_ver_horarios', 15, 80, 3, FALSE, TRUE),
('N3-09', 'Categorías Maestro', 'Aplica filtros de categorías en el mapa 15 veces.', 'ACCION', 'mapa_filtro_categoria', 15, 70, 3, FALSE, TRUE),
('N3-10', 'Guardián del Puerto', 'Completa 30 visitas presenciales con check-in en la ciudad.', 'TEMATICA', 'checkin', 30, 150, 3, FALSE, TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    instrucciones = EXCLUDED.instrucciones,
    tipo = EXCLUDED.tipo,
    evento = EXCLUDED.evento,
    meta = EXCLUDED.meta,
    xp = EXCLUDED.xp,
    nivel_requerido = EXCLUDED.nivel_requerido,
    es_diaria = EXCLUDED.es_diaria,
    activa = EXCLUDED.activa;

-- Pool de Misiones Diarias (15 misiones: D-01 a D-15)
INSERT INTO mision (codigo, titulo, instrucciones, tipo, evento, meta, xp, nivel_requerido, es_diaria, activa) VALUES
('D-01', 'Visita del Día', 'Revisa el detalle de 2 lugares hoy.', 'VISITA', 'lugar_ver_detalle', 2, 25, 1, TRUE, TRUE),
('D-02', 'Favorito Diario', 'Guarda 1 nuevo lugar en tus favoritos hoy.', 'ACCION', 'favorito_agregar', 1, 20, 1, TRUE, TRUE),
('D-03', 'Noticias Frescas', 'Lee 2 noticias de actualidad porteña.', 'ACCION', 'noticia_abrir', 2, 20, 1, TRUE, TRUE),
('D-04', 'Rutas del Día', 'Consulta al menos 1 ruta de autobús hoy.', 'ACCION', 'bus_consultar', 1, 20, 1, TRUE, TRUE),
('D-05', 'Ferry Hoy', 'Revisa las próximas salidas del ferry.', 'ACCION', 'ferry_ver_horarios', 1, 20, 1, TRUE, TRUE),
('D-06', 'Búsqueda Activa', 'Realiza 3 búsquedas en el mapa interactivo.', 'ACCION', 'lugar_buscar', 3, 25, 1, TRUE, TRUE),
('D-07', 'Categorías del Día', 'Filtra 3 veces por categorías en el mapa.', 'ACCION', 'mapa_filtro_categoria', 3, 25, 1, TRUE, TRUE),
('D-08', 'Check-in Diario', 'Haz 1 check-in presencial con GPS hoy.', 'VISITA', 'checkin', 1, 40, 1, TRUE, TRUE),
('D-09', 'Explorador Matutino', 'Revisa 3 lugares locales en detalle.', 'VISITA', 'lugar_ver_detalle', 3, 30, 1, TRUE, TRUE),
('D-10', 'Noticias Variadas', 'Filtra noticias por categoría 2 veces.', 'ACCION', 'noticias_filtro_categoria', 2, 25, 1, TRUE, TRUE),
('D-11', 'Mapa Activo', 'Recentra o ubica tu posición en el mapa 3 veces.', 'ACCION', 'mapa_recentrar', 3, 20, 1, TRUE, TRUE),
('D-12', 'Lector del Puerto', 'Busca 2 veces artículos en la sección de noticias.', 'ACCION', 'noticias_buscar', 2, 25, 1, TRUE, TRUE),
('D-13', 'Rutas Visuales', 'Abre el mapa interactivo de 2 rutas de bus.', 'ACCION', 'bus_ver_mapa', 2, 30, 1, TRUE, TRUE),
('D-14', 'Coleccionar Hoy', 'Agrega 3 lugares a favoritos hoy.', 'ACCION', 'favorito_agregar', 3, 30, 1, TRUE, TRUE),
('D-15', 'Visita Premium', 'Haz 2 check-ins en lugares distintos hoy.', 'VISITA', 'checkin', 2, 50, 1, TRUE, TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    instrucciones = EXCLUDED.instrucciones,
    tipo = EXCLUDED.tipo,
    evento = EXCLUDED.evento,
    meta = EXCLUDED.meta,
    xp = EXCLUDED.xp,
    nivel_requerido = EXCLUDED.nivel_requerido,
    es_diaria = EXCLUDED.es_diaria,
    activa = EXCLUDED.activa;
