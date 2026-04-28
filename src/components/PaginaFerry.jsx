import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Bell, User, Clock,
    Info, Compass, Ship, Ticket, Bookmark, ExternalLink
} from 'lucide-react';
import axiosPublic from '../api/axios';
import '../styles/Ferry.css';

// ═══════════════════════════════════════════════════════════
// HELPERS DE TIEMPO REAL
// ═══════════════════════════════════════════════════════════

/** "HH:MM:SS" o "HH:MM" → minutos desde medianoche */
function horaEnMinutos(hora) {
    if (!hora) return -1;
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m || 0);
}

/** Minutos que faltan hasta esa hora (negativo = ya pasó) */
function minutosHasta(horaSalida) {
    const ahora = new Date();
    const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
    return horaEnMinutos(horaSalida) - ahoraMin;
}

/** "HH:MM:SS" → "HH:MM" */
function formatHora(hora) {
    if (!hora) return '--:--';
    return hora.substring(0, 5);
}

/** Minutos → texto legible */
function formatearRestante(min) {
    if (min < 0) return null;
    if (min === 0) return 'Ahora';
    if (min < 60) return `En ${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `En ${h}h ${m}m` : `En ${h}h`;
}

// ═══════════════════════════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════════════════════════
function FerrySkeletonGrid() {
    return (
        <div className="ferry-grid">
            <div className="ferry-card big-card skeleton-card">
                <div className="sk-line sk-label" />
                <div className="sk-time" />
                <div className="sk-line sk-sub" />
                <div className="sk-boarding">
                    <div className="sk-box" />
                    <div className="sk-texts">
                        <div className="sk-line sk-t1" />
                        <div className="sk-line sk-t2" />
                    </div>
                </div>
            </div>
            <div className="ferry-card right-card skeleton-card">
                <div className="sk-line sk-label" />
                <div className="sk-line sk-title" />
                <div className="sk-line sk-sub" />
                <div className="sk-bar" />
                <div className="sk-line sk-btn" />
            </div>
            <div className="ferry-card bottom-left-card skeleton-card">
                <div className="sk-line sk-label" />
                <div className="sk-line sk-title" />
                <div className="sk-line sk-sub" />
            </div>
            <div className="ferry-card info-card skeleton-card" style={{ flexDirection: 'row', gap: '1rem' }}>
                <div className="sk-box" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <div className="sk-line sk-t1" />
                    <div className="sk-line sk-t2" />
                    <div className="sk-line sk-t2" style={{ width: '60%' }} />
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
function PaginaFerry() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('SCHEDULES');
    const [activeRoute, setActiveRoute] = useState('Puntarenas → Paquera');

    // Estado de datos
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Reloj vivo — recalcula "próxima salida" cada minuto
    const [ahora, setAhora] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setAhora(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    // ── Fetch de horarios ──────────────────────────────────
    useEffect(() => {
        setLoading(true);
        setError(null);
        axiosPublic.get('/horarios-ferry')
            .then(res => setHorarios(res.data))
            .catch(err => {
                console.error('[PaginaFerry] Error cargando horarios:', err);
                setError('No se pudieron cargar los horarios. Intenta de nuevo.');
            })
            .finally(() => setLoading(false));
    }, []);

    // ── Rutas únicas disponibles (dinámicas desde la BD) ──
    const routes = useMemo(() => {
        const set = new Set();
        horarios.forEach(h => {
            if (h.origen && h.destino) set.add(`${h.origen} → ${h.destino}`);
        });
        return [...set];
    }, [horarios]);

    // Si la ruta activa ya no existe en la BD, seleccionar la primera
    useEffect(() => {
        if (routes.length > 0 && !routes.includes(activeRoute)) {
            setActiveRoute(routes[0]);
        }
    }, [routes]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Horarios filtrados por ruta activa ─────────────────
    const horariosFiltrados = useMemo(() => {
        const [origen, destino] = activeRoute.split(' → ');
        return horarios
            .filter(h => h.origen === origen && h.destino === destino)
            .sort((a, b) => horaEnMinutos(a.hora_salida) - horaEnMinutos(b.hora_salida));
    }, [horarios, activeRoute, ahora]); // ahora en deps para recalcular cada minuto

    // ── Próximas salidas (futuras) ─────────────────────────
    const proximasSalidas = useMemo(() => {
        return horariosFiltrados.filter(h => minutosHasta(h.hora_salida) >= 0);
    }, [horariosFiltrados]);

    // Siguiente salida (big card)
    const siguiente = proximasSalidas[0] || null;
    const proxima2 = proximasSalidas[1] || null;
    const ultima = horariosFiltrados[horariosFiltrados.length - 1] || null;

    // Minutos restantes para la siguiente salida
    const minsRestantes = siguiente ? minutosHasta(siguiente.hora_salida) : null;
    const textoRestante = minsRestantes !== null ? formatearRestante(minsRestantes) : null;

    // ── Estado vivo de la big card ─────────────────────────
    const estadoBigCard = (() => {
        if (!siguiente) return { badge: 'SIN SALIDAS', badgeClass: 'badge-gray' };
        if (minsRestantes <= 10) return { badge: 'ABORDANDO', badgeClass: 'badge-orange' };
        return { badge: 'ON TIME', badgeClass: 'badge-green' };
    })();

    // ── Abordaje estimado ──────────────────────────────────
    const abordajeMin = siguiente ? Math.max(0, minsRestantes - 10) : null;

    return (
        <div className="ferry-layout">
            {/* Top Navbar */}
            <header className="ferry-topbar">
                <div className="ferry-logo" onClick={() => navigate('/')}>
                    <span className="logo-white">Puerto</span><span className="logo-orange">Informa</span>
                </div>
                <div className="ferry-topbar-right">
                    <div className="ferry-search-wrapper">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Search routes..." readOnly />
                    </div>
                    <button className="icon-btn"><Bell size={20} /></button>
                    <button className="icon-btn" onClick={() => navigate('/perfil')}><User size={20} /></button>
                </div>
            </header>

            <main className="ferry-main">
                {/* Hero Title */}
                <h1 className="ferry-hero-title">
                    Horarios de <span className="text-orange">Ferry</span>
                </h1>

                {/* Route Chips — dinámicos desde la BD */}
                <div className="ferry-route-chips">
                    {loading
                        ? ['Cargando...'].map(r => (
                            <button key={r} className="ferry-chip active">{r}</button>
                        ))
                        : routes.map(r => (
                            <button
                                key={r}
                                className={`ferry-chip ${activeRoute === r ? 'active' : ''}`}
                                onClick={() => setActiveRoute(r)}
                            >
                                {r}
                            </button>
                        ))
                    }
                </div>

                {/* Section Header */}
                <div className="ferry-section-header">
                    <div>
                        <h2>Próximas Salidas</h2>
                        <p>
                            {loading
                                ? 'Cargando horarios...'
                                : `Actualizado en tiempo real • ${activeRoute.split(' → ')[0]}`
                            }
                        </p>
                    </div>
                    <div className="live-status">
                        <span className="pulse-dot"></span> LIVE STATUS
                    </div>
                </div>

                {/* ── Estado de carga / error ── */}
                {loading && <FerrySkeletonGrid />}

                {!loading && error && (
                    <div className="ferry-error-state">
                        <Ship size={48} className="text-orange" style={{ opacity: 0.4 }} />
                        <p>{error}</p>
                        <button
                            className="ferry-btn-outline"
                            style={{ width: 'auto', marginTop: '1rem' }}
                            onClick={() => window.location.reload()}
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* ── Grid principal — solo cuando hay datos ── */}
                {!loading && !error && (
                    <div className="ferry-grid">

                        {/* ── Big Card: SIGUIENTE SALIDA ── */}
                        <div className="ferry-card big-card">
                            <div className="card-top">
                                <span className="siguiente-label">SIGUIENTE SALIDA</span>
                                <span className={estadoBigCard.badgeClass}>{estadoBigCard.badge}</span>
                            </div>

                            {siguiente ? (
                                <>
                                    <div className="card-time">{formatHora(siguiente.hora_salida)}</div>
                                    <div className="card-subtitle">
                                        {siguiente.embarcacion_nombre || 'Naviera Tambor'} •{' '}
                                        {siguiente.embarcacion_tipo || 'Ferry Convencional'}
                                    </div>

                                    <div className="boarding-info">
                                        {textoRestante && (
                                            <div className="mins-box">
                                                <span className="mins-num">{minsRestantes}</span>
                                                <span className="mins-label">MINS</span>
                                            </div>
                                        )}
                                        <div className="boarding-text">
                                            <h4>{siguiente.terminal_nombre || siguiente.origen + ' Terminal'}</h4>
                                            <p>
                                                {abordajeMin !== null && abordajeMin > 0
                                                    ? `Abordaje inicia en ${abordajeMin} minutos`
                                                    : minsRestantes <= 10
                                                        ? '⚓ Abordaje en curso'
                                                        : textoRestante
                                                            ? `Sale ${textoRestante}`
                                                            : 'Sin información'}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="ferry-no-salidas">
                                    <p>No hay más salidas hoy para esta ruta.</p>
                                    {ultima && (
                                        <p className="ferry-ultima-hint">
                                            Última salida fue a las {formatHora(ultima.hora_salida)}
                                        </p>
                                    )}
                                </div>
                            )}

                            <Ship className="watermark-ship" size={200} />
                        </div>

                        {/* ── Right Card: 2ª SALIDA ── */}
                        <div className="ferry-card right-card">
                            <div className="card-top flex-between">
                                <Clock size={20} className="text-orange" />
                                <span className="time-small">
                                    {proxima2 ? `${formatHora(proxima2.hora_salida)}` : '—'}
                                </span>
                            </div>

                            {proxima2 ? (
                                <>
                                    <h3 className="card-title mt-auto">{proxima2.embarcacion_nombre || 'Naviera Tambor'}</h3>
                                    <p className="card-subtitle mb-4">{proxima2.embarcacion_tipo || 'Ferry Convencional'}</p>
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${Math.min(100, Math.max(5, 100 - (minutosHasta(proxima2.hora_salida) / 60) * 20))}%`,
                                                backgroundColor: '#E8621A'
                                            }}
                                        />
                                    </div>
                                    {proxima2.enlace_reserva ? (
                                        <a
                                            href={proxima2.enlace_reserva}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ferry-btn-outline ferry-reserve-link"
                                        >
                                            <ExternalLink size={14} /> Reservar Espacio
                                        </a>
                                    ) : (
                                        <button className="ferry-btn-outline">Reservar Espacio</button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h3 className="card-title mt-auto" style={{ color: '#555' }}>Sin salida</h3>
                                    <p className="card-subtitle mb-4">No hay 2ª salida disponible</p>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-fill" style={{ width: '0%' }} />
                                    </div>
                                    <button className="ferry-btn-outline" disabled style={{ opacity: 0.4 }}>
                                        Reservar Espacio
                                    </button>
                                </>
                            )}
                        </div>

                        {/* ── Bottom Left Card: ÚLTIMA / NOCTURNA ── */}
                        <div className="ferry-card bottom-left-card">
                            <div className="card-top flex-between">
                                <span className="time-small">
                                    {ultima ? formatHora(ultima.hora_salida) : '--:--'}
                                </span>
                                {ultima?.es_nocturno
                                    ? <span className="badge-gray">NOCTURNO</span>
                                    : ultima
                                        ? <span className="badge-gray">ÚLTIMA</span>
                                        : null
                                }
                            </div>
                            <h3 className="card-title mt-auto">
                                {ultima?.embarcacion_nombre || 'Naviera Tambor'}
                            </h3>
                            <p className="card-subtitle">
                                {ultima ? 'Última salida del día' : 'Sin datos disponibles'}
                            </p>
                            <Clock className="watermark-moon" size={150} />
                        </div>

                        {/* ── Info Card: Recomendación estática ── */}
                        <div className="ferry-card info-card">
                            <Info size={28} className="text-orange info-icon" />
                            <div>
                                <h4>Recomendación para Viajeros</h4>
                                <p>
                                    Se recomienda llegar al menos 45 minutos antes de la salida si viaja con vehículo.
                                    Los tiquetes digitales deben presentarse en el control de acceso.
                                </p>
                            </div>
                        </div>

                    </div>
                )}

                {/* ── Lista completa de horarios del día ── */}
                {!loading && !error && horariosFiltrados.length > 0 && (
                    <div className="ferry-horarios-full">
                        <h3 className="ferry-horarios-title">Todos los horarios del día</h3>
                        <div className="ferry-horarios-list">
                            {horariosFiltrados.map((h, idx) => {
                                const min = minutosHasta(h.hora_salida);
                                const pasado = min < 0;
                                const esProximo = !pasado && proximasSalidas[0] === h;
                                return (
                                    <div
                                        key={idx}
                                        className={`ferry-horario-row ${pasado ? 'pasado' : ''} ${esProximo ? 'proximo' : ''}`}
                                    >
                                        <div className="ferry-row-hora">{formatHora(h.hora_salida)}</div>
                                        <div className="ferry-row-info">
                                            <span className="ferry-row-nombre">
                                                {h.embarcacion_nombre || 'Naviera Tambor'}
                                            </span>
                                            {h.es_nocturno && (
                                                <span className="badge-gray ferry-row-badge">Nocturno</span>
                                            )}
                                            {esProximo && (
                                                <span className="badge-orange ferry-row-badge">Próximo</span>
                                            )}
                                        </div>
                                        <div className="ferry-row-estado">
                                            {pasado
                                                ? <span className="ferry-row-salido">Salió</span>
                                                : <span className="ferry-row-restante">{formatearRestante(min)}</span>
                                            }
                                        </div>
                                        {h.enlace_reserva && !pasado && (
                                            <a
                                                href={h.enlace_reserva}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ferry-row-link"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </main>

            {/* Bottom Tab Bar */}
            <nav className="ferry-bottom-nav">
                <button
                    className={`nav-item ${activeTab === 'EXPLORE' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('EXPLORE'); navigate('/'); }}
                >
                    <Compass size={24} />
                    <span>EXPLORE</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'SCHEDULES' ? 'active' : ''}`}
                    onClick={() => setActiveTab('SCHEDULES')}
                >
                    <Ship size={24} />
                    <span>SCHEDULES</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'TICKETS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('TICKETS')}
                >
                    <Ticket size={24} />
                    <span>TICKETS</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'SAVED' ? 'active' : ''}`}
                    onClick={() => setActiveTab('SAVED')}
                >
                    <Bookmark size={24} />
                    <span>SAVED</span>
                </button>
            </nav>
        </div>
    );
}

export default PaginaFerry;