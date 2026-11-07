import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, RotateCw, CheckCircle2 } from 'lucide-react';
import { axiosPrivate } from '../api/axios';
import '../styles/MisionDiarias.css';

const TIPO_ICONOS = {
    VISITA: '📍',
    ACCION: '⚡',
    RACHA: '🔥',
    ACUMULATIVA: '🎯',
    TEMATICA: '🌟'
};

function formatearSegundos(segundosRestantes) {
    if (segundosRestantes <= 0) return '00:00:00';
    const hrs = Math.floor(segundosRestantes / 3600);
    const mins = Math.floor((segundosRestantes % 3600) / 60);
    const segs = segundosRestantes % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(segs)}`;
}

function MisionDiarias({ onXpActualizado }) {
    const [diarias, setDiarias] = useState([]);
    const [renuevaEn, setRenuevaEn] = useState(null);
    const [tiempoRestante, setTiempoRestante] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [reintento, setReintento] = useState(0);

    const timerRef = useRef(null);

    const cargarDiarias = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const res = await axiosPrivate.get('/mision/diarias');
            const data = res.data;
            setDiarias(data.misiones || []);
            setRenuevaEn(data.renueva_en || null);

            if (data.renueva_en) {
                const diffMs = new Date(data.renueva_en).getTime() - Date.now();
                setTiempoRestante(Math.max(0, Math.floor(diffMs / 1000)));
            }
        } catch (err) {
            console.warn('Error cargando misiones diarias:', err?.message);
            setError('No se pudieron sincronizar las misiones de hoy.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarDiarias();
    }, [cargarDiarias, reintento]);

    // Reloj regresivo
    useEffect(() => {
        if (!renuevaEn) return;

        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            const diffMs = new Date(renuevaEn).getTime() - Date.now();
            const segundos = Math.max(0, Math.floor(diffMs / 1000));
            setTiempoRestante(segundos);

            // Al llegar a cero recarga las misiones automáticamente
            if (segundos <= 0) {
                clearInterval(timerRef.current);
                cargarDiarias();
            }
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [renuevaEn, cargarDiarias]);

    return (
        <section className="misiones-diarias-section" aria-labelledby="diarias-title">
            <div className="md-header">
                <div className="md-title-wrapper">
                    <span className="md-fire-icon" role="img" aria-label="Fuego">🔥</span>
                    <div>
                        <h3 id="diarias-title" className="md-title">Misiones del Día</h3>
                        <p className="md-subtitle">Se renuevan cada medianoche en Costa Rica (UTC-6)</p>
                    </div>
                </div>

                <div className="md-countdown-pill" title="Tiempo restante para nuevas misiones">
                    <Clock size={15} />
                    <span>Renuevan en: {formatearSegundos(tiempoRestante)}</span>
                </div>
            </div>

            {/* Estado de Error */}
            {error && !cargando && (
                <div style={{
                    padding: '1.25rem',
                    background: 'rgba(239, 83, 80, 0.1)',
                    border: '1px solid rgba(239, 83, 80, 0.25)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                }}>
                    <span style={{ color: '#ef9090', fontSize: '0.9rem' }}>⚠️ {error}</span>
                    <button
                        onClick={() => setReintento(r => r + 1)}
                        style={{
                            background: '#E8621A',
                            color: '#fff',
                            border: 'none',
                            padding: '0.45rem 1rem',
                            borderRadius: '8px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                        }}
                    >
                        <RotateCw size={14} /> Reintentar
                    </button>
                </div>
            )}

            {/* Skeletons de carga */}
            {cargando && (
                <div className="md-grid">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="md-skeleton-card">
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div className="md-skeleton-line" style={{ width: 36, height: 36, borderRadius: 10 }} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div className="md-skeleton-line" style={{ width: '70%', height: 16 }} />
                                    <div className="md-skeleton-line" style={{ width: '90%', height: 12 }} />
                                </div>
                            </div>
                            <div className="md-skeleton-line" style={{ width: '100%', height: 8 }} />
                        </div>
                    ))}
                </div>
            )}

            {/* Cuadrícula de 5 misiones diarias */}
            {!cargando && !error && (
                <div className="md-grid">
                    {diarias.map((m) => {
                        const progreso = m.progreso ?? 0;
                        const meta = m.meta ?? 1;
                        const completada = Boolean(m.completada);
                        const porcentaje = completada ? 100 : Math.min(100, Math.round((progreso / meta) * 100));

                        return (
                            <article
                                key={m.id}
                                className={`md-card ${completada ? 'completada' : ''}`}
                            >
                                <div className="md-card-top">
                                    <div className="md-card-info">
                                        <span className="md-card-icon">
                                            {TIPO_ICONOS[m.tipo] || '⚡'}
                                        </span>
                                        <div>
                                            <h4 className="md-card-titulo">{m.titulo}</h4>
                                            <p className="md-card-instrucciones">{m.instrucciones}</p>
                                        </div>
                                    </div>
                                    <span className="md-xp-badge">+{m.xp} XP</span>
                                </div>

                                <div className="md-progress-section">
                                    <div className="md-progress-meta">
                                        <span className="md-progress-status">
                                            {completada ? '✅ Completada' : 'En progreso'}
                                        </span>
                                        <span className="md-progress-nums">
                                            {progreso} / {meta}
                                        </span>
                                    </div>
                                    <div className="md-progress-track">
                                        <div
                                            className={`md-progress-fill ${completada ? 'completada' : ''}`}
                                            style={{ width: `${porcentaje}%` }}
                                        />
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default MisionDiarias;
