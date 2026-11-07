import { useEffect, useRef } from 'react';

/* ─── Partícula de confeti (pura CSS) ────────────────────── */
const CONFETTI_COLORS = ['#E8621A', '#FF9B6A', '#FFD700', '#FFA500', '#fff'];
const CONFETTI_COUNT  = 40;

function ConfettiParticles() {
  return (
    <div aria-hidden="true" style={styles.confettiWrapper}>
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
        const color  = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const left   = `${Math.random() * 100}%`;
        const delay  = `${(Math.random() * 1.5).toFixed(2)}s`;
        const dur    = `${(1.5 + Math.random() * 1.5).toFixed(2)}s`;
        const size   = `${6 + Math.round(Math.random() * 6)}px`;
        const shape  = Math.random() > 0.5 ? '50%' : '2px';
        return (
          <span
            key={i}
            style={{
              ...styles.confettiPiece,
              left,
              width: size,
              height: size,
              background: color,
              borderRadius: shape,
              animationDelay: delay,
              animationDuration: dur,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * NivelModal — Modal de felicitaciones al subir de nivel.
 *
 * Props:
 *   nivel    {number}  — El nuevo nivel alcanzado
 *   xpTotal  {number}  — XP total acumulado
 *   onClose  {function} — Callback para cerrar
 */
function NivelModal({ nivel, xpTotal, onClose }) {
  const dialogRef = useRef(null);

  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    // Enfocar el modal para accesibilidad
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      style={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nivel-modal-title"
    >
      {/* Confeti */}
      <ConfettiParticles />

      {/* Caja del modal */}
      <div
        ref={dialogRef}
        style={styles.modal}
        tabIndex={-1}
        className="nivel-modal-box"
      >
        {/* Resplandor decorativo */}
        <div style={styles.glow} aria-hidden="true" />

        <div style={styles.emoji}>🎉</div>

        <h2 id="nivel-modal-title" style={styles.titulo}>
          ¡Nivel {nivel}!
        </h2>

        <p style={styles.subtitulo}>
          ¡Felicitaciones! Has alcanzado el nivel <strong style={{ color: '#E8621A' }}>{nivel}</strong>.
        </p>

        <div style={styles.xpBox}>
          <span style={styles.xpLabel}>XP Total acumulado</span>
          <span style={styles.xpValor}>{xpTotal?.toLocaleString()} XP</span>
        </div>

        <button
          style={styles.btnClose}
          onClick={onClose}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#cf5516'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#E8621A'; }}
        >
          ¡Genial!
        </button>
      </div>

      {/* Keyframes inyectados una sola vez */}
      <style>{KEYFRAMES}</style>
    </div>
  );
}

/* ─── Estilos en objeto (sin librería externa) ─────────────── */
const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '1rem',
  },
  confettiWrapper: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
    top: '-10px',
    animation: 'confettiFall linear infinite',
    opacity: 0.9,
  },
  modal: {
    position: 'relative',
    background: 'linear-gradient(135deg, #1A1A1A 0%, #2A1A10 100%)',
    border: '1px solid rgba(255, 215, 0, 0.4)',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    maxWidth: '380px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(255,215,0,0.15)',
    animation: 'modalPop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both',
    outline: 'none',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#fff',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '-60px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,215,0,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  emoji: {
    fontSize: '3.5rem',
    marginBottom: '0.5rem',
    animation: 'bounce 0.6s 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both',
    display: 'block',
  },
  titulo: {
    fontSize: '2.2rem',
    fontWeight: 900,
    margin: '0 0 0.5rem',
    background: 'linear-gradient(90deg, #FFD700, #FFA500)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitulo: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.7)',
    margin: '0 0 1.5rem',
    lineHeight: 1.5,
  },
  xpBox: {
    background: 'rgba(232, 98, 26, 0.12)',
    border: '1px solid rgba(232, 98, 26, 0.3)',
    borderRadius: '12px',
    padding: '0.9rem 1.2rem',
    marginBottom: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  xpLabel: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  xpValor: {
    fontSize: '1.6rem',
    fontWeight: 900,
    color: '#FF9B6A',
  },
  btnClose: {
    display: 'block',
    width: '100%',
    background: '#E8621A',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.9rem',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'background 0.2s',
    letterSpacing: '0.02em',
  },
};

const KEYFRAMES = `
  @keyframes confettiFall {
    0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    80%  { opacity: 0.8; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  @keyframes modalPop {
    from { opacity: 0; transform: scale(0.85) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes bounce {
    0%   { transform: scale(0); }
    60%  { transform: scale(1.25); }
    100% { transform: scale(1); }
  }
`;

export default NivelModal;
