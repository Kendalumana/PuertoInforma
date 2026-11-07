import { useState, useCallback } from 'react';
import { axiosPrivate } from '../api/axios';

/**
 * Tipos de error posibles:
 *  'SIN_GPS'        — El navegador no soporta geolocalización
 *  'GPS_DENEGADO'   — El usuario denegó el permiso
 *  'GPS_IMPRECISO'  — La precisión GPS es demasiado baja
 *  'FUERA_DE_RANGO' — El usuario está fuera del rango del lugar
 *  'YA_HECHO'       — Ya se realizó el check-in en este lugar hoy
 *  'ERROR_RED'      — Fallo de red o error inesperado del servidor
 */

const PRECISION_MINIMA_METROS = 50; // rechazar si accuracy > 50 m

function obtenerPosicion() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ tipo: 'SIN_GPS', mensaje: 'Tu navegador no soporta geolocalización.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => {
        if (err.code === 1) {
          reject({ tipo: 'GPS_DENEGADO', mensaje: 'Debes permitir el acceso al GPS para hacer check-in.' });
        } else {
          reject({ tipo: 'ERROR_RED', mensaje: 'No se pudo obtener tu posición GPS.' });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Hook para manejar el check-in en un lugar.
 *
 * Uso:
 *   const { cargando, error, resultado, hacerCheckin } = useCheckin();
 *   await hacerCheckin(lugarId);
 *
 * `resultado` contiene: { xp_ganado, misiones_completadas, subio_nivel, distancia_m }
 */
export function useCheckin() {
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null); // { tipo, mensaje }
  const [resultado, setResultado] = useState(null);

  const hacerCheckin = useCallback(async (lugarId) => {
    setCargando(true);
    setError(null);
    setResultado(null);

    let posicion;
    try {
      posicion = await obtenerPosicion();
    } catch (errGPS) {
      setError(errGPS);
      setCargando(false);
      return;
    }

    // Validar precisión mínima antes de enviar al servidor
    if (posicion.coords.accuracy > PRECISION_MINIMA_METROS) {
      setError({
        tipo: 'GPS_IMPRECISO',
        mensaje: `Tu señal GPS es imprecisa (±${Math.round(posicion.coords.accuracy)} m). Intenta en un lugar con mejor señal.`,
      });
      setCargando(false);
      return;
    }

    try {
      const { data } = await axiosPrivate.post(`/lugar/${lugarId}/checkin`, {
        latitud:  posicion.coords.latitude,
        longitud: posicion.coords.longitude,
        precision: posicion.coords.accuracy,
      });

      setResultado({
        xp_ganado:            data.xp_ganado            ?? 0,
        misiones_completadas: data.misiones_completadas ?? [],
        subio_nivel:          data.subio_nivel          ?? false,
        distancia_m:          data.distancia_m          ?? null,
        nivel_nuevo:          data.nivel_nuevo          ?? null,
      });
    } catch (errRed) {
      const status    = errRed?.response?.status;
      const serverTipo = errRed?.response?.data?.tipo;

      if (status === 409 || serverTipo === 'YA_HECHO') {
        setError({ tipo: 'YA_HECHO', mensaje: 'Ya hiciste check-in en este lugar hoy.' });
      } else if (status === 403 || serverTipo === 'FUERA_DE_RANGO') {
        const dist = errRed?.response?.data?.distancia_m;
        setError({
          tipo: 'FUERA_DE_RANGO',
          mensaje: dist
            ? `Estás a ${Math.round(dist)} m del lugar. Acércate más para hacer check-in.`
            : 'Estás fuera del rango permitido para este lugar.',
        });
      } else {
        setError({ tipo: 'ERROR_RED', mensaje: 'No se pudo conectar con el servidor. Intenta de nuevo.' });
      }
    } finally {
      setCargando(false);
    }
  }, []);

  return { cargando, error, resultado, hacerCheckin };
}
