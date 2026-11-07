import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Clock,
    Info, Compass, Ship, Ticket, Bookmark, BookmarkCheck,
    Bell, User, Map, ExternalLink
} from 'lucide-react';
import { axiosPrivate } from '../api/axios';
import '../styles/Transporte.css';
import Navbar from './Navbar';
import ReservationLink from './ReservationLink';
import TransportDayTabs from './TransportDayTabs';
import FerryRouteSelector from './FerryRouteSelector';
import FerryScheduleList from './FerryScheduleList';

// ═══════════════════════════════════════════════════════════
// URLS DE RESERVAS Y TARIFAS
// ═══════════════════════════════════════════════════════════
const URL_QUICKPAY_PAQUERA = 'https://www.quickpaycr.com/default.aspx';
const URL_QUICKPAY_PRECIOS = 'https://www.quickpaycr.com/precios.aspx';

function normalizarTexto(txt) {
    return (txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function esRutaPaqueraPuntarenas(origen, destino) {
    const o = normalizarTexto(origen);
    const d = normalizarTexto(destino);
    return (o.includes('paquera') && d.includes('puntarenas')) ||
           (o.includes('puntarenas') && d.includes('paquera'));
}

function resolverEnlaceReservaFerry(origen, destino, enlaceActual) {
    if (esRutaPaqueraPuntarenas(origen, destino)) {
        return URL_QUICKPAY_PAQUERA;
    }
    const o = normalizarTexto(origen);
    const d = normalizarTexto(destino);
    if (o.includes('naranjo') || d.includes('naranjo')) {
        return enlaceActual || 'https://www.coonatramar.com/';
    }
    return enlaceActual || '';
}

// Horarios de respaldo oficiales (evitan pantalla en blanco si el servidor de Render está dormido)
const FALLBACK_FERRY_HORARIOS = [
    { id: 'f-p-pq-1', origen: 'Puntarenas', destino: 'Paquera', horaSalida: '05:30:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Puntarenas' },
    { id: 'f-p-pq-2', origen: 'Puntarenas', destino: 'Paquera', horaSalida: '09:00:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Puntarenas' },
    { id: 'f-p-pq-3', origen: 'Puntarenas', destino: 'Paquera', horaSalida: '12:00:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Puntarenas' },
    { id: 'f-p-pq-4', origen: 'Puntarenas', destino: 'Paquera', horaSalida: '15:00:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Puntarenas' },
    { id: 'f-p-pq-5', origen: 'Puntarenas', destino: 'Paquera', horaSalida: '18:00:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Puntarenas' },
    { id: 'f-p-pq-6', origen: 'Puntarenas', destino: 'Paquera', horaSalida: '20:30:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Puntarenas', esNocturno: true },

    { id: 'f-pq-p-1', origen: 'Paquera', destino: 'Puntarenas', horaSalida: '05:30:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Paquera' },
    { id: 'f-pq-p-2', origen: 'Paquera', destino: 'Puntarenas', horaSalida: '09:00:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Paquera' },
    { id: 'f-pq-p-3', origen: 'Paquera', destino: 'Puntarenas', horaSalida: '12:00:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Paquera' },
    { id: 'f-pq-p-4', origen: 'Paquera', destino: 'Puntarenas', horaSalida: '15:00:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Paquera' },
    { id: 'f-pq-p-5', origen: 'Paquera', destino: 'Puntarenas', horaSalida: '18:00:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Paquera' },
    { id: 'f-pq-p-6', origen: 'Paquera', destino: 'Puntarenas', horaSalida: '20:30:00', embarcacionNombre: 'Naviera Tambor', embarcacionTipo: 'Ferry Convencional', enlaceReserva: URL_QUICKPAY_PAQUERA, terminalNombre: 'Terminal Paquera', esNocturno: true },

    { id: 'f-p-pn-1', origen: 'Puntarenas', destino: 'Playa Naranjo', horaSalida: '06:30:00', embarcacionNombre: 'Coonatramar', embarcacionTipo: 'Ferry', enlaceReserva: 'https://www.coonatramar.com/', terminalNombre: 'Terminal Coonatramar' },
    { id: 'f-p-pn-2', origen: 'Puntarenas', destino: 'Playa Naranjo', horaSalida: '10:00:00', embarcacionNombre: 'Coonatramar', embarcacionTipo: 'Ferry', enlaceReserva: 'https://www.coonatramar.com/', terminalNombre: 'Terminal Coonatramar' },
    { id: 'f-p-pn-3', origen: 'Puntarenas', destino: 'Playa Naranjo', horaSalida: '14:30:00', embarcacionNombre: 'Coonatramar', embarcacionTipo: 'Ferry', enlaceReserva: 'https://www.coonatramar.com/', terminalNombre: 'Terminal Coonatramar' },
    { id: 'f-p-pn-4', origen: 'Puntarenas', destino: 'Playa Naranjo', horaSalida: '19:30:00', embarcacionNombre: 'Coonatramar', embarcacionTipo: 'Ferry', enlaceReserva: 'https://www.coonatramar.com/', terminalNombre: 'Terminal Coonatramar', esNocturno: true },

    { id: 'f-pn-p-1', origen: 'Playa Naranjo', destino: 'Puntarenas', horaSalida: '08:00:00', embarcacionNombre: 'Coonatramar', embarcacionTipo: 'Ferry', enlaceReserva: 'https://www.coonatramar.com/', terminalNombre: 'Terminal Playa Naranjo' },
    { id: 'f-pn-p-2', origen: 'Playa Naranjo', destino: 'Puntarenas', horaSalida: '12:30:00', embarcacionNombre: 'Coonatramar', embarcacionTipo: 'Ferry', enlaceReserva: 'https://www.coonatramar.com/', terminalNombre: 'Terminal Playa Naranjo' },
    { id: 'f-pn-p-3', origen: 'Playa Naranjo', destino: 'Puntarenas', horaSalida: '17:00:00', embarcacionNombre: 'Coonatramar', embarcacionTipo: 'Ferry', enlaceReserva: 'https://www.coonatramar.com/', terminalNombre: 'Terminal Playa Naranjo' },
    { id: 'f-pn-p-4', origen: 'Playa Naranjo', destino: 'Puntarenas', horaSalida: '21:00:00', embarcacionNombre: 'Coonatramar', embarcacionTipo: 'Ferry', enlaceReserva: 'https://www.coonatramar.com/', terminalNombre: 'Terminal Playa Naranjo', esNocturno: true }
];

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
 */
function normalizarHorario(h) {
    const origen = h.origen || '';
    const destino = h.destino || '';
    const enlaceOriginal = h.enlaceReserva || h.enlace_reserva || '';

    return {
        id: h.id,
        horaSalida: h.horaSalida || h.hora_salida || '',
        origen,
        destino,
        embarcacionNombre: h.embarcacionNombre || h.embarcacion_nombre || '',
        embarcacionTipo: h.embarcacionTipo || h.embarcacion_tipo || '',
        enlaceReserva: resolverEnlaceReservaFerry(origen, destino, enlaceOriginal),
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
        <div className="transporte-grid">
            <div className="transporte-card big-card skeleton-card">
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
            <div className="transporte-card right-card skeleton-card">
                <div className="sk-line sk-label" />
                <div className="sk-line sk-title" />
                <div className="sk-line sk-sub" />
                <div className="sk-bar" />
                <div className="sk-line sk-btn" />
            </div>
            <div className="transporte-card bottom-left-card skeleton-card">
                <div className="sk-line sk-label" />
                <div className="sk-line sk-title" />
                <div className="sk-line sk-sub" />
            </div>
            <div className="transporte-card info-card skeleton-card" style={{ flexDirection: 'row', gap: '1rem' }}>
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
    const [reintento, setReintento] = useState(0);

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
        const controller = new AbortController();
        queueMicrotask(() => {
            setLoading(true);
            setError(null);
        });
        axiosPrivate.get('/ferry')
            .then(res => {
                if (controller.signal.aborted) return;
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
                if (controller.signal.aborted) return;
                console.warn('[PaginaFerry] Backend en reposo o no disponible. Cargando horarios oficiales de respaldo:', err);
                // Si el servidor falla o duerme, mostramos los horarios oficiales de respaldo
                const normalizados = FALLBACK_FERRY_HORARIOS.map(normalizarHorario);
                setHorarios(normalizados);

                const rutasDisponibles = [...new Set(
                    normalizados
                        .filter(h => h.origen && h.destino)
                        .map(h => `${h.origen} → ${h.destino}`)
                )];
                setActiveRoute(rutaActual =>
                    rutasDisponibles.includes(rutaActual) ? rutaActual : (rutasDisponibles[0] || '')
                );
                setError(null);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [reintento]);

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
        <div className="app-wrapper immersive-layout transporte-layout">
            <Navbar />

            <main className="transporte-main">
                {/* Botón volver eliminado */}

                {/* Hero Title */}
                <h1 className="transporte-hero-title">
                    Horarios de <span className="text-orange">Ferry</span>
                </h1>

                {/* Route Selector y Botón de Precios */}
                <div className="ferry-top-bar">
                    <FerryRouteSelector
                        activeRoute={activeRoute}
                        loading={loading}
                        onRouteChange={setActiveRoute}
                        onToggleSaved={toggleFerrySaved}
                        routes={routesFiltradas}
                        savedRoutes={ferrySaved}
                    />

                    <div className="ferry-actions-container">
                        <a
                            href={URL_QUICKPAY_PRECIOS}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ferry-precios-btn"
                            title="Consultar lista oficial de tarifas y precios de QuickPay"
                        >
                            <Ticket size={16} className="text-orange" />
                            <span>Ver Tarifas y Precios</span>
                            <ExternalLink size={13} style={{ opacity: 0.8 }} />
                        </a>
                    </div>
                </div>

                {/* ── Tabs HOY / MAÑANA — A-I3 ── */}
                {!loading && !error && (
                    <TransportDayTabs
                        className="transporte-dia-tabs"
                        day={tabDia}
                        onDayChange={setTabDia}
                    />
                )}

                {/* Section Header */}
                <div className="transporte-section-header">
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
                    <div className="transporte-error-state">
                        <Ship size={48} className="text-orange" style={{ opacity: 0.4 }} />
                        <p>{error}</p>
                        <button
                            className="transporte-btn-outline"
                            style={{ width: 'auto', marginTop: '1rem' }}
                            onClick={() => setReintento(r => r + 1)}
                        >
                            🔄 Reintentar
                        </button>
                    </div>
                )}

                {/* ── Grid principal — solo cuando hay datos ── */}
                {!loading && !error && (
                    <div className="transporte-grid">

                        {/* ── Big Card: SIGUIENTE SALIDA ── */}
                        <div className="transporte-card big-card">
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

                                    {/* Acciones directas para la siguiente salida */}
                                    <div className="big-card-actions">
                                        {siguiente.enlaceReserva && (
                                            <ReservationLink
                                                className="transporte-btn-outline transporte-reserve-link"
                                                href={siguiente.enlaceReserva}
                                                label={esRutaPaqueraPuntarenas(siguiente.origen, siguiente.destino) ? "Reservar en QuickPay" : "Reservar espacio"}
                                            />
                                        )}
                                        <a
                                            href={URL_QUICKPAY_PRECIOS}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="transporte-btn-outline transporte-prices-link"
                                        >
                                            <Ticket size={15} /> Ver Precios
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <div className="transporte-no-salidas">
                                    <p>No hay más salidas hoy para esta ruta.</p>
                                    {ultima && (
                                        <p className="transporte-ultima-hint">
                                            Última salida fue a las {formatHora(ultima.horaSalida)}
                                        </p>
                                    )}
                                </div>
                            )}

                            <Ship className="watermark-ship" size={200} />
                        </div>

                        {/* ── Right Card: 2ª SALIDA ── */}
                        {proxima2 && (
                            <div className="transporte-card right-card">
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
                                        className="transporte-btn-outline transporte-reserve-link"
                                        href={proxima2.enlaceReserva}
                                    />
                                ) : (
                                    <button className="transporte-btn-outline">Reservar Espacio</button>
                                )}
                            </div>
                        )}

                        {/* ── Bottom Left Card: ÚLTIMA / NOCTURNA ── */}
                        <div className="transporte-card bottom-left-card">
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
                        <div className="transporte-card info-card">
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
                <div className="transporte-saved-panel">
                    <h3 className="transporte-saved-title">⚓ Rutas Guardadas</h3>
                    {ferrySaved.length === 0 ? (
                        <div className="transporte-saved-empty">
                            <Ship size={40} style={{ opacity: 0.3 }} />
                            <p>Guardá rutas tocando el 🔖 en los chips de arriba.</p>
                        </div>
                    ) : (
                        <div className="transporte-saved-list">
                            {ferrySaved.map(r => {
                                const [orig, dest] = r.split(' → ');
                                const hsFiltrados = horarios
                                    .filter(h => h.origen === orig && h.destino === dest)
                                    .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida));
                                const proxima = hsFiltrados.find(h => minutosHasta(h.horaSalida) >= 0);
                                return (
                                    <div key={r} className="transporte-saved-item" onClick={() => { setActiveRoute(r); setActiveTab('SCHEDULES'); }}>
                                        <div className="transporte-saved-route">{r}</div>
                                        <div className="transporte-saved-next">
                                            {proxima
                                                ? <><span className="transporte-row-restante">{formatHora(proxima.horaSalida)}</span><span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '6px' }}>{formatearRestante(minutosHasta(proxima.horaSalida))}</span></>
                                                : <span style={{ color: '#555', fontSize: '0.85rem' }}>Sin salidas hoy</span>
                                            }
                                        </div>
                                        <button className="transporte-saved-remove" onClick={e => { e.stopPropagation(); toggleFerrySaved(r); }}>✕</button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Tab Bar — Mobile solo */}
            <nav className="transporte-bottom-nav">
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
