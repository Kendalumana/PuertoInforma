-- ============================================================
-- 001_sistema_misiones.sql — PuertoInforma
-- Sistema de Misiones de Nivel y Diarias, Progreso, Eventos y Check-in
-- ============================================================

-- 1. Tabla de Catálogo de Misiones
CREATE TABLE IF NOT EXISTS mision (
    id              BIGSERIAL PRIMARY KEY,
    codigo          TEXT UNIQUE NOT NULL, -- ej. 'N1-01', 'D-01'
    titulo          TEXT NOT NULL,
    instrucciones   TEXT NOT NULL,
    tipo            TEXT NOT NULL CHECK (tipo IN ('ACCION', 'VISITA', 'ACUMULATIVA', 'RACHA', 'TEMATICA')),
    evento          TEXT NOT NULL,        -- Tipo de evento que activa o suma a la misión
    meta            INT  NOT NULL DEFAULT 1,
    xp              INT  NOT NULL DEFAULT 10,
    nivel_requerido INT  NOT NULL DEFAULT 1,
    es_diaria       BOOL NOT NULL DEFAULT FALSE,
    activa          BOOL NOT NULL DEFAULT TRUE,
    criterio        JSONB,                -- Filtros o metadatos adicionales opcionales
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mision_es_diaria ON mision(es_diaria) WHERE activa = TRUE;
CREATE INDEX IF NOT EXISTS idx_mision_nivel_req ON mision(nivel_requerido) WHERE activa = TRUE;
CREATE INDEX IF NOT EXISTS idx_mision_evento ON mision(evento) WHERE activa = TRUE;

-- 2. Progreso de Misiones por Usuario
-- Para misiones de nivel: fecha_ref es NULL
-- Para misiones diarias: fecha_ref almacena la fecha correspondiente (YYYY-MM-DD)
CREATE TABLE IF NOT EXISTS progreso_mision (
    id               BIGSERIAL PRIMARY KEY,
    usuario_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mision_id        BIGINT NOT NULL REFERENCES mision(id) ON DELETE CASCADE,
    fecha_ref        DATE, 
    progreso         INT  NOT NULL DEFAULT 0,
    completada       BOOL NOT NULL DEFAULT FALSE,
    completada_en    TIMESTAMPTZ,
    disponible_desde TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_progreso_usuario_mision_fecha UNIQUE (usuario_id, mision_id, fecha_ref)
);

CREATE INDEX IF NOT EXISTS idx_progreso_usuario ON progreso_mision(usuario_id, fecha_ref);
CREATE INDEX IF NOT EXISTS idx_progreso_completada ON progreso_mision(usuario_id, completada);

-- 3. Misiones Diarias Asignadas por Fecha (Estables para todos los usuarios)
CREATE TABLE IF NOT EXISTS mision_diaria_dia (
    id        BIGSERIAL PRIMARY KEY,
    fecha     DATE   NOT NULL,
    mision_id BIGINT NOT NULL REFERENCES mision(id) ON DELETE CASCADE,
    orden     INT    NOT NULL CHECK (orden BETWEEN 1 AND 5),
    CONSTRAINT uq_diaria_fecha_mision UNIQUE (fecha, mision_id),
    CONSTRAINT uq_diaria_fecha_orden UNIQUE (fecha, orden)
);

CREATE INDEX IF NOT EXISTS idx_diaria_dia_fecha ON mision_diaria_dia(fecha);

-- 4. Registro de Auditoría de Eventos Reportados
CREATE TABLE IF NOT EXISTS evento_usuario (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    evento      TEXT NOT NULL,
    referencia  TEXT,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice optimizado para Rate Limiting (60 eventos/minuto por usuario)
CREATE INDEX IF NOT EXISTS idx_evento_usuario_rate_limit ON evento_usuario(usuario_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_evento_usuario_dedup ON evento_usuario(usuario_id, evento, referencia, creado_en DESC);

-- 5. Registro de Check-ins en Lugares con Validación GPS
CREATE TABLE IF NOT EXISTS checkin_lugar (
    id           BIGSERIAL PRIMARY KEY,
    usuario_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lugar_id     BIGINT NOT NULL,
    fecha        DATE NOT NULL DEFAULT CURRENT_DATE,
    latitud      DOUBLE PRECISION NOT NULL,
    longitud     DOUBLE PRECISION NOT NULL,
    precision_m  INT,
    distancia_m  DOUBLE PRECISION,
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_checkin_usuario_lugar_dia UNIQUE (usuario_id, lugar_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_checkin_usuario ON checkin_lugar(usuario_id, fecha);

-- 6. Racha de Días Consecutivos por Usuario
CREATE TABLE IF NOT EXISTS racha_usuario (
    usuario_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    dias_actuales INT  NOT NULL DEFAULT 0,
    ultimo_dia    DATE,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Función Haversine para cálculo de distancia en metros en PostgreSQL
CREATE OR REPLACE FUNCTION haversine_meters(
    lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    R CONSTANT DOUBLE PRECISION := 6371000; -- Radio medio de la Tierra en metros
    phi1 DOUBLE PRECISION := radians(lat1);
    phi2 DOUBLE PRECISION := radians(lat2);
    dphi DOUBLE PRECISION := radians(lat2 - lat1);
    dlambda DOUBLE PRECISION := radians(lon2 - lon1);
    a DOUBLE PRECISION;
BEGIN
    a := sin(dphi / 2.0)^2 + cos(phi1) * cos(phi2) * sin(dlambda / 2.0)^2;
    RETURN R * 2.0 * asin(sqrt(a));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
