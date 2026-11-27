import { useCallback, useRef } from 'react';
import { axiosPrivate } from '../api/axios';

/**
 * Hook que reporta eventos de misión silenciosamente al backend.
 * - Llama a POST /mision/evento con el token del usuario.
 * - Si falla: solo console.warn, NUNCA lanza error al usuario ni bloquea la UI.
 * - Debounce de 300ms por combinación evento+referencia igual.
 * - Fire-and-forget: no hay await en el caller.
 *
 * Uso:
 *   const { reportarEvento } = useEventoMision();
 *   reportarEvento('lugar_ver_detalle', String(lugar.id));
 *   reportarEvento('favorito_agregar');
 */
export function useEventoMision() {
  // key: "evento:referencia", value: timestamp de último disparo
  const ultimosEventos = useRef(new Map());

  const reportarEvento = useCallback((evento, referencia = null) => {
    if (!evento) return;

    // Debounce: ignorar si el mismo evento+referencia se disparó hace menos de 300ms
    const key = `${evento}:${referencia ?? ''}`;
    const ahora = Date.now();
    if ((ultimosEventos.current.get(key) ?? 0) > ahora - 300) return;
    ultimosEventos.current.set(key, ahora);

    // Fire-and-forget: nunca await desde el caller
    axiosPrivate
      .post('/mision/evento', {
        evento,
        ...(referencia !== null && { referencia: String(referencia) }),
      })
      .catch((err) => {
        // Rate limit (429) es esperado; otros errores: log silencioso
        if (err?.response?.status !== 429) {
          console.warn(`[Misiones] Evento "${evento}" no reportado (${err?.response?.status ?? 'red'})`);
        }
      });
  }, []);

  return { reportarEvento };
}
