import { useEffect, useRef } from 'react';
import '../styles/ToastXP.css';

/**
 * ToastXP — Notificaciones flotantes de XP y misiones completadas.
 *
 * Props:
 *   notificaciones: Array<{
 *     id: string | number,
 *     xp: number,
 *     misiones_completadas: Array<{ titulo: string }>,
 *     subio_nivel: boolean,
 *     nivel_nuevo: number | null,
 *   }>
 *   onDismiss: (id) => void
 */
function ToastXP({ notificaciones = [], onDismiss }) {
  return (
    <div className="toast-container" role="region" aria-label="Notificaciones de XP" aria-live="polite">
      {notificaciones.map((notif) => (
        <ToastItem key={notif.id} notif={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ notif, onDismiss }) {
  const { id, xp, misiones_completadas = [], subio_nivel, nivel_nuevo } = notif;
  const timerRef   = useRef(null);
  const elementRef = useRef(null);

  // Auto-dismiss a los 4 segundos
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      dismissWithAnimation();
    }, 4000);

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function dismissWithAnimation() {
    const el = elementRef.current;
    if (!el) {
      onDismiss(id);
      return;
    }
    el.classList.add('saliendo');
    el.addEventListener('animationend', () => onDismiss(id), { once: true });
  }

  function handleDismiss() {
    clearTimeout(timerRef.current);
    dismissWithAnimation();
  }

  const esNivelUp = Boolean(subio_nivel && nivel_nuevo);

  return (
    <div
      ref={elementRef}
      className={`toast-xp${esNivelUp ? ' nivel-up' : ''}`}
      role="status"
    >
      {/* Barra de progreso de auto-dismiss */}
      <div className="toast-xp-progress" />

      {/* Fila principal: XP + botón cerrar */}
      <div className="toast-xp-main">
        <span className="toast-xp-amount">+{xp} XP ✨</span>
        <button
          className="toast-xp-dismiss"
          onClick={handleDismiss}
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>

      {/* Misiones completadas */}
      {misiones_completadas.length > 0 && (
        <div className="toast-xp-misiones">
          {misiones_completadas.map((m, i) => (
            <span key={i} className="toast-xp-mision-titulo">
              ✅ {m.titulo}
            </span>
          ))}
        </div>
      )}

      {/* Subida de nivel */}
      {esNivelUp && (
        <div className="toast-xp-nivel">
          🎉 ¡Subiste al Nivel {nivel_nuevo}!
        </div>
      )}
    </div>
  );
}

export default ToastXP;
