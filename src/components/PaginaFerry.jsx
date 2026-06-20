import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Clock,
    Info, Compass, Ship, Ticket, Bookmark, BookmarkCheck,
    Bell, User, Map
} from 'lucide-react';
import { axiosPrivate } from '../api/axios';
import '../styles/Ferry.css';
import Navbar from './Navbar';
import ReservationLink from './ReservationLink';
import TransportDayTabs from './TransportDayTabs';
import FerryRouteSelector from './FerryRouteSelector';
import FerryScheduleList from './FerryScheduleList';

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

/**
 * Normaliza un objeto de horario de ferry.
 * El backend Spring Boot usa camelCase (horaSalida, embarcacionNombre, etc.)
 * Pero si por alguna razón llega en snake_case, también lo soportamos.
 */
function normalizarHorario(h) {
    return {
        id: h.id,
        horaSalida: h.horaSalida || h.hora_salida || '',
        origen: h.origen || '',
        destino: h.destino || '',
        embarcacionNombre: h.embarcacionNombre || h.embarcacion_nombre || '',
        embarcacionTipo: h.embarcacionTipo || h.embarcacion_tipo || '',
        enlaceReserva: h.enlaceReserva || h.enlace_reserva || '',
        esNocturno: h.esNocturno ?? h.es_nocturno ?? false,
        estado: h.estado || 'ACTIVO',
        terminalNombre: h.terminalNombre || h.terminal_nombre || '',
    };
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
    const [activeRoute, setActiveRoute] = useState('');
    const [tabDia, setTabDia] = useState('hoy');           // A-I3: 'hoy' | 'manana'
    const [busquedaFerry] = useState(''); // A-I1
    const [ferrySaved, setFerrySaved] = useState(() => {   // A-N2
        try { return JSON.parse(localStorage.getItem('ferryGuardados') || '[]'); }
        catch { return []; }
    });

    // Estado de datos
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Reloj vivo — recalcula "próxima salida" cada minuto
    const [, setAhora] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setAhora(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    // Persistir rutas guardadas — A-N2
    useEffect(() => {
        localStorage.setItem('ferryGuardados', JSON.stringify(ferrySaved));
    }, [ferrySaved]);

    const toggleFerrySaved = (route) =>
        setFerrySaved(prev =>
            prev.includes(route) ? prev.filter(r => r !== route) : [...prev, route]
        );

    // ── Fetch de horarios ──────────────────────────────────
    useEffect(() => {
        axiosPrivate.get('/ferry')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                const normalizados = data.map(normalizarHorario);
                setHorarios(normalizados);

                const rutasDisponibles = [...new Set(
                    normalizados
                        .filter(h => h.origen && h.destino)
                        .map(h => `${h.origen} → ${h.destino}`)
                )];
                setActiveRoute(rutaActual =>
                    rutasDisponibles.includes(rutaActual) ? rutaActual : (rutasDisponibles[0] || '')
                );
            })
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

    // Rutas filtradas por búsqueda — A-I1
    const routesFiltradas = useMemo(() => {
        if (!busquedaFerry.trim()) return routes;
        const q = busquedaFerry.toLowerCase();
        return routes.filter(r => r.toLowerCase().includes(q));
    }, [routes, busquedaFerry]);

    // ── Horarios filtrados por ruta activa ─────────────────
    const horariosFiltrados = useMemo(() => {
        if (!activeRoute) return [];
        const [origen, destino] = activeRoute.split(' → ');
        return horarios
            .filter(h => h.origen === origen && h.destino === destino)
            .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida));
    }, [horarios, activeRoute]);

    // ── Próximas salidas (futuras) — A-I3: en MAÑANA todas son "próximas"
    const proximasSalidas = useMemo(() => {
        if (tabDia === 'manana') return horariosFiltrados;
        return horariosFiltrados.filter(h => minutosHasta(h.horaSalida) >= 0);
    }, [horariosFiltrados, tabDia]);

    // Siguiente salida (big card)
    const siguiente = proximasSalidas[0] || null;
    const proxima2 = proximasSalidas[1] || null;
    const ultima = horariosFiltrados[horariosFiltrados.length - 1] || null;

    // Minutos restantes para la siguiente salida
    const minsRestantes = siguiente ? minutosHasta(siguiente.horaSalida) : null;
    const textoRestante = minsRestantes !== null ? formatearRestante(minsRestantes) : null;

    // ── Estado vivo de la big card ─────────────────────────
    const estadoBigCard = (() => {
        if (!siguiente) return { badge: 'SIN SALIDAS', badgeClass: 'badge-gray' };
        if (minsRestantes <= 10) return { badge: 'ABORDANDO', badgeClass: 'badge-orange' };
        return { badge: 'EN HORARIO', badgeClass: 'badge-green' };
    })();

    // ── Abordaje estimado ──────────────────────────────────
    const abordajeMin = siguiente ? Math.max(0, minsRestantes - 10) : null;

    return (
        <div className="app-wrapper immersive-layout ferry-layout">
            <Navbar />

            <main className="ferry-main">
                {/* Botón volver eliminado */}

                {/* Hero Title */}
                <h1 className="ferry-hero-title">
                    Horarios de <span className="text-orange">Ferry</span>
                </h1>

                <FerryRouteSelector
                    activeRoute={activeRoute}
                    loading={loading}
                    onRouteChange={setActiveRoute}
                    onToggleSaved={toggleFerrySaved}
                    routes={routesFiltradas}
                    savedRoutes={ferrySaved}
                />

                {/* ── Tabs HOY / MAÑANA — A-I3 ── */}
                {!loading && !error && (
                    <TransportDayTabs
                        className="ferry-dia-tabs"
                        day={tabDia}
                        onDayChange={setTabDia}
                    />
                )}

                {/* Section Header */}
                <div className="ferry-section-header">
                    <div>
                        <h2>{tabDia === 'manana' ? 'Salidas Mañana' : 'Próximas Salidas'}</h2>
                        <p>
                            {loading
                                ? 'Cargando horarios...'
                                : `${tabDia === 'manana' ? 'Mismo horario diario' : 'Tiempo real'} • ${activeRoute ? activeRoute.split(' → ')[0] : 'Puerto Puntarenas'}`
                            }
                        </p>
                    </div>
                    <div className="live-status">
                        <span className={tabDia === 'manana' ? '' : 'pulse-dot'}></span>
                        {tabDia === 'manana' ? '📅 MAÑANA' : '🟢 EN VIVO'}
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
                                    <div className="card-time">{formatHora(siguiente.horaSalida)}</div>
                                    <div className="card-subtitle">
                                        {siguiente.embarcacionNombre || 'Naviera Tambor'} •{' '}
                                        {siguiente.embarcacionTipo || 'Ferry Convencional'}
                                    </div>

                                    <div className="boarding-info">
                                        {textoRestante && (
                                            <div className="mins-box">
                                                <span className="mins-num">{minsRestantes}</span>
                                                <span className="mins-label">MINS</span>
                                            </div>
                                        )}
                                        <div className="boarding-text">
                                            <h4>{siguiente.terminalNombre || siguiente.origen + ' Terminal'}</h4>
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
                                            Última salida fue a las {formatHora(ultima.horaSalida)}
                                        </p>
                                    )}
                                </div>
                            )}

                            <Ship className="watermark-ship" size={200} />
                        </div>

                        {/* ── Right Card: 2ª SALIDA ── */}
                        {proxima2 && (
                            <div className="ferry-card right-card">
                                <div className="card-top flex-between">
                                    <Clock size={20} className="text-orange" />
                                    <span className="time-small">
                                        {formatHora(proxima2.horaSalida)}
                                    </span>
                                </div>

                                <h3 className="card-title mt-auto">{proxima2.embarcacionNombre || 'Naviera Tambor'}</h3>
                                <p className="card-subtitle mb-4">{proxima2.embarcacionTipo || 'Ferry Convencional'}</p>
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${Math.min(100, Math.max(5, 100 - (minutosHasta(proxima2.horaSalida) / 60) * 20))}%`,
                                            backgroundColor: '#E8621A'
                                        }}
                                    />
                                </div>
                                {proxima2.enlaceReserva ? (
                                    <ReservationLink
                                        className="ferry-btn-outline ferry-reserve-link"
                                        href={proxima2.enlaceReserva}
                                    />
                                ) : (
                                    <button className="ferry-btn-outline">Reservar Espacio</button>
                                )}
                            </div>
                        )}

                        {/* ── Bottom Left Card: ÚLTIMA / NOCTURNA ── */}
                        <div className="ferry-card bottom-left-card">
                            <div className="card-top flex-between">
                                <span className="time-small">
                                    {ultima ? formatHora(ultima.horaSalida) : '--:--'}
                                </span>
                                {ultima?.esNocturno
                                    ? <span className="badge-gray">NOCTURNO</span>
                                    : ultima
                                        ? <span className="badge-gray">ÚLTIMA</span>
                                        : null
                                }
                            </div>
                            <h3 className="card-title mt-auto">
                                {ultima?.embarcacionNombre || 'Naviera Tambor'}
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
                {!loading && !error && (
                    <FerryScheduleList
                        activeRoute={activeRoute}
                        formatHora={formatHora}
                        formatearRestante={formatearRestante}
                        horarios={horariosFiltrados}
                        minutosHasta={minutosHasta}
                        proximasSalidas={proximasSalidas}
                        tabDia={tabDia}
                    />
                )}

            </main>

            {/* ── Panel GUARDADOS — A-N2 ── */}
            {activeTab === 'SAVED' && (
                <div className="ferry-saved-panel">
                    <h3 className="ferry-saved-title">⚓ Rutas Guardadas</h3>
                    {ferrySaved.length === 0 ? (
                        <div className="ferry-saved-empty">
                            <Ship size={40} style={{ opacity: 0.3 }} />
                            <p>Guardá rutas tocando el 🔖 en los chips de arriba.</p>
                        </div>
                    ) : (
                        <div className="ferry-saved-list">
                            {ferrySaved.map(r => {
                                const [orig, dest] = r.split(' → ');
                                const hsFiltrados = horarios
                                    .filter(h => h.origen === orig && h.destino === dest)
                                    .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida));
                                const proxima = hsFiltrados.find(h => minutosHasta(h.horaSalida) >= 0);
                                return (
                                    <div key={r} className="ferry-saved-item" onClick={() => { setActiveRoute(r); setActiveTab('SCHEDULES'); }}>
                                        <div className="ferry-saved-route">{r}</div>
                                        <div className="ferry-saved-next">
                                            {proxima
                                                ? <><span className="ferry-row-restante">{formatHora(proxima.horaSalida)}</span><span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '6px' }}>{formatearRestante(minutosHasta(proxima.horaSalida))}</span></>
                                                : <span style={{ color: '#555', fontSize: '0.85rem' }}>Sin salidas hoy</span>
                                            }
                                        </div>
                                        <button className="ferry-saved-remove" onClick={e => { e.stopPropagation(); toggleFerrySaved(r); }}>✕</button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Tab Bar — Mobile solo */}
            <nav className="ferry-bottom-nav">
                <button
                    className={`nav-item ${activeTab === 'EXPLORE' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('EXPLORE'); navigate('/'); }}
                >
                    <Map size={24} />
                    <span>RUTAS</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'SCHEDULES' ? 'active' : ''}`}
                    onClick={() => setActiveTab('SCHEDULES')}
                >
                    <Ship size={24} />
                    <span>HORARIOS</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'SAVED' ? 'active' : ''}`}
                    onClick={() => setActiveTab('SAVED')}
                >
                    {ferrySaved.length > 0 ? <BookmarkCheck size={24} /> : <Bookmark size={24} />}
                    <span>FAVORITOS</span>
                </button>
            </nav>
        </div>
    );
}

export default PaginaFerry;
