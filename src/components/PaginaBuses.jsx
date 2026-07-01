import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Clock,
    Info, Compass, Bus, Ticket, Bookmark, BookmarkCheck, MapPin,
    Bell, User, Map
} from 'lucide-react';
import { axiosPrivate } from '../api/axios';
import '../styles/Buses.css';
import Navbar from './Navbar';
import BusDestinationSelector from './BusDestinationSelector';
import ReservationLink from './ReservationLink';
import TransportDayTabs from './TransportDayTabs';

// ═══════════════════════════════════════════════════════════
// HELPERS DE TIEMPO REAL Y FECHAS
// ═══════════════════════════════════════════════════════════

const DIA_ORDEN = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const DIA_NUM   = Object.fromEntries(DIA_ORDEN.map((d, i) => [d, i]));
const MIBUS_RESERVATION_URL = import.meta.env.VITE_MIBUS_URL || 'https://mibus.cr/';
const EXTERNAL_RESERVATION_RULES = [
    {
        tipo: 'directo',
        paradas: ['puntarenas', 'san jose'],
        url: MIBUS_RESERVATION_URL,
    },
];

function normalizarRuta(nombre) {
    return (nombre || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function resumirRuta(nombre, tipoHorario) {
    const texto = (nombre || '').replace(/\s+/g, ' ').trim();
    const codigo = texto.match(/ruta\s*\d+/i)?.[0]
        .replace(/\s+/g, ' ')
        .replace(/^ruta/i, 'Ruta') || 'Ruta';
    const textoNormalizado = normalizarRuta(texto);

    let servicio = tipoHorario === 'DIRECTO' ? 'Directo' : 'Con paradas';
    if (textoNormalizado.includes('costa')) servicio = 'Por la costa';
    else if (textoNormalizado.includes('directo')) servicio = 'Directo';
    else if (textoNormalizado.includes('indirecto')) servicio = 'Con paradas';

    return { codigo, servicio };
}

function obtenerEnlaceReservaExterno({ origen, destino, tipo }) {
    const paradasRuta = [normalizarRuta(origen), normalizarRuta(destino)];
    const regla = EXTERNAL_RESERVATION_RULES.find(({ tipo: tipoRegla, paradas }) =>
        normalizarRuta(tipo) === tipoRegla
        && paradas.every(parada => paradasRuta.some(nombre => nombre.includes(parada)))
    );

    return regla?.url || '';
}

function normalizarDia(dia) {
    if (!dia) return '';
    return dia.toUpperCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function correEnDia(horario, diaNum) {
    const inicio = DIA_NUM[normalizarDia(horario.diaInicio)] ?? 1;
    const fin    = DIA_NUM[normalizarDia(horario.diaFin)]    ?? 5;
    if (inicio <= fin) return diaNum >= inicio && diaNum <= fin;
    return diaNum >= inicio || diaNum <= fin;
}

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
function BusesSkeletonGrid() {
    return (
        <div className="buses-grid">
            <div className="buses-card big-card skeleton-card">
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
            <div className="buses-card right-card skeleton-card">
                <div className="sk-line sk-label" />
                <div className="sk-line sk-title" />
                <div className="sk-line sk-sub" />
                <div className="sk-bar" />
                <div className="sk-line sk-btn" />
            </div>
            <div className="buses-card bottom-left-card skeleton-card">
                <div className="sk-line sk-label" />
                <div className="sk-line sk-title" />
                <div className="sk-line sk-sub" />
            </div>
            <div className="buses-card info-card skeleton-card" style={{ flexDirection: 'row', gap: '1rem' }}>
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
// MINI MAPA SVG
// ═══════════════════════════════════════════════════════════
function MiniMapaSVG({ ruta }) {
    let paradas = [];
    if (ruta.paradas) {
        try {
            paradas = typeof ruta.paradas === 'string' ? JSON.parse(ruta.paradas) : ruta.paradas;
        } catch {
            paradas = [ruta.origen || 'Origen', ruta.destino || 'Destino'];
        }
    } else {
        paradas = [ruta.origen || 'Origen', ruta.destino || 'Destino'];
    }

    const total = paradas.length;
    const W = 320;
    const H = 80;
    const margen = 40;
    const paso = (W - margen * 2) / (total > 1 ? total - 1 : 1);

    const puntos = paradas.map((_, i) => ({
        x: margen + i * paso,
        y: i % 2 === 0 ? H / 2 - 10 : H / 2 + 10,
    }));

    const buildPath = () => {
        if (puntos.length === 0) return '';
        let d = `M ${puntos[0].x} ${puntos[0].y} `;
        for (let i = 0; i < puntos.length - 1; i++) {
            const p1 = puntos[i];
            const p2 = puntos[i + 1];
            const cx = (p1.x + p2.x) / 2;
            d += `C ${cx} ${p1.y}, ${cx} ${p2.y}, ${p2.x} ${p2.y} `;
        }
        return d;
    };

    return (
        <div style={{ marginTop: '1rem', width: '100%', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem', color: '#E8621A', fontSize: '0.75rem', fontWeight: 700 }}>
                <MapPin size={12} />
                <span>Ruta del bus</span>
            </div>
            
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} preserveAspectRatio="xMidYMid meet">
                <path d={buildPath()} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" strokeLinecap="round" />
                <path d={buildPath()} fill="none" stroke="#E8621A" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />

                {puntos.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r={i === 0 || i === total - 1 ? "5" : "3.5"} fill="#1c1c1e" stroke={i === 0 ? '#E8621A' : '#ffffff'} strokeWidth="1.5" />
                        {(i === 0 || i === total - 1) && <circle cx={p.x} cy={p.y} r="3" fill="#fff" />}
                    </g>
                ))}

                {puntos.map((p, i) => (
                    <text
                        key={`label-${i}`}
                        x={p.x}
                        y={i % 2 === 0 ? p.y - 14 : p.y + 20}
                        textAnchor="middle"
                        fontSize="8"
                        fill={i === 0 ? '#E8621A' : 'rgba(255,255,255,0.7)'}
                        fontWeight={i === 0 || i === total - 1 ? '700' : '400'}
                    >
                        {paradas[i]}
                    </text>
                ))}
            </svg>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
function PaginaBuses() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('SCHEDULES');
    const [activeRoute, setActiveRoute] = useState('');
    const [destinoSeleccionado, setDestinoSeleccionado] = useState(''); // destino elegido por el usuario
    const [tabDia, setTabDia] = useState('hoy');
    const [busesSaved, setBusesSaved] = useState(() => {
        try { return JSON.parse(localStorage.getItem('busesGuardados') || '[]').map(String); }
        catch { return []; }
    });

    // Estado de datos
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reintento, setReintento] = useState(0);

    // Reloj vivo
    const [ahora, setAhora] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setAhora(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    // Persistir rutas guardadas
    useEffect(() => {
        localStorage.setItem('busesGuardados', JSON.stringify(busesSaved));
    }, [busesSaved]);

    const toggleBusesSaved = (routeId) =>
        setBusesSaved(prev =>
            prev.includes(String(routeId))
                ? prev.filter(id => id !== String(routeId))
                : [...prev, String(routeId)]
        );

    // ── Fetch de rutas ──────────────────────────────────
    useEffect(() => {
        setLoading(true);
        setError(null);
        axiosPrivate.get('/ruta-transporte')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                const flattenedHorarios = data.flatMap(ruta => {
                    const orig = ruta.lugarOrigen?.nombre || 'Origen Desconocido';
                    const dest = ruta.lugarDestino?.nombre || 'Destino Desconocido';
                    return (ruta.horarios || []).map(h => {
                        const resumen = resumirRuta(ruta.nombre, h.tipo);
                        return {
                        id: h.id,
                        rutaId: String(ruta.id),
                        rutaNombre: ruta.nombre || '',
                        rutaCodigo: resumen.codigo,
                        servicioRuta: resumen.servicio,
                        rutaCorta: `${orig} \u2192 ${dest}`,
                        horaSalida: h.horaSalida,
                        horaLlegada: h.horaLlegada,
                        origen: orig,
                        destino: dest,
                        diaInicio: h.diaInicio,
                        diaFin: h.diaFin,
                        operadorNombre: ruta.operador?.nombre || 'Operador Desconocido',
                        terminalNombre: orig,
                        tipo: h.tipo || 'REGULAR',
                        esNocturno: parseInt((h.horaSalida||'0').split(':')[0]) >= 18,
                        enlaceReserva: h.enlaceReserva
                            || h.enlace_reserva
                            || ruta.enlaceReserva
                            || ruta.enlace_reserva
                            || obtenerEnlaceReservaExterno({ origen: orig, destino: dest, tipo: h.tipo }),
                        paradas: ruta.paradas || [orig, dest]
                        };
                    });
                });
                setHorarios(flattenedHorarios);

                const destinosDisponibles = [...new Set(flattenedHorarios.map(h => h.destino).filter(Boolean))].sort();
                const primerDestino = destinosDisponibles[0] || '';
                const primeraRuta = flattenedHorarios.find(h => h.destino === primerDestino);

                setDestinoSeleccionado(primerDestino);
                setActiveRoute(primeraRuta?.rutaId || '');

                setBusesSaved(prev => [...new Set(prev
                    .map(saved => {
                        if (flattenedHorarios.some(h => h.rutaId === saved)) return saved;
                        return flattenedHorarios.find(h => `${h.origen} \u2192 ${h.destino}` === saved)?.rutaId;
                    })
                    .filter(Boolean))]);
            })
            .catch(err => {
                console.error('[PaginaBuses] Error cargando horarios:', err);
                const esTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
                setError(esTimeout
                    ? 'El servidor tard\u00f3 en responder. Puede estar iniciando, reintent\u00e1 en unos segundos.'
                    : 'No se pudieron cargar los horarios. Intenta de nuevo.'
                );
            })
            .finally(() => setLoading(false));
    }, [reintento]);

    // ── Destinos únicos disponibles ──
    const destinos = useMemo(() => {
        const set = new Set();
        horarios.forEach(h => { if (h.destino) set.add(h.destino); });
        return [...set].sort();
    }, [horarios]);

    // Cada opción conserva su ruta real: rutas directas e indirectas ya no se mezclan.
    const routes = useMemo(() => {
        const routeMap = new globalThis.Map();
        horarios.forEach(h => {
            if (h.origen && h.destino && !routeMap.has(h.rutaId)) {
                routeMap.set(h.rutaId, {
                    id: h.rutaId,
                    origen: h.origen,
                    destino: h.destino,
                    routeCode: h.rutaCodigo,
                    serviceLabel: h.servicioRuta,
                    shortLabel: `${h.origen} → ${h.destino}`,
                });
            }
        });
        return [...routeMap.values()];
    }, [horarios]);

    const activeRouteData = useMemo(
        () => routes.find(route => route.id === activeRoute) || null,
        [routes, activeRoute]
    );

    const handleDestinoChange = (destino) => {
        setDestinoSeleccionado(destino);
        const route = routes.find(item => item.destino === destino);
        if (route) setActiveRoute(route.id);
    };

    const getNextDeparture = (destino) => {
        const diaNum = tabDia === 'hoy' ? ahora.getDay() : (ahora.getDay() + 1) % 7;
        return horarios
            .filter(horario => horario.destino === destino && correEnDia(horario, diaNum) && minutosHasta(horario.horaSalida) >= 0)
            .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida))[0];
    };

    // ── Horarios filtrados por ruta activa ─────────────────
    const horariosFiltradosRuta = useMemo(() => {
        if (!activeRoute) return [];
        return horarios
            .filter(h => h.rutaId === activeRoute)
            .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida));
    }, [horarios, activeRoute]);

    // ── Próximas salidas (según día y hora) ────────────────
    const diaNum = tabDia === 'hoy' ? ahora.getDay() : (ahora.getDay() + 1) % 7;
    
    // Filtrar primero por el día
    const horariosDelDia = useMemo(() => {
        return horariosFiltradosRuta.filter(h => correEnDia(h, diaNum));
    }, [horariosFiltradosRuta, diaNum]);

    const proximasSalidas = useMemo(() => {
        if (tabDia === 'manana') return horariosDelDia;
        return horariosDelDia.filter(h => minutosHasta(h.horaSalida) >= 0);
    }, [horariosDelDia, tabDia]);

    // Siguiente salida (big card)
    const siguiente = proximasSalidas[0] || null;
    const proxima2 = proximasSalidas[1] || null;
    const ultima = horariosDelDia[horariosDelDia.length - 1] || null;

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
        <div className="app-wrapper immersive-layout buses-layout">
            <Navbar />

            <main className="buses-main">

                {/* Hero Title */}
                <h1 className="buses-hero-title">
                    Horarios de <span className="text-orange">Buses</span>
                </h1>

                {/* ─── ¿Para dónde vas? ─────────────────────────────── */}
                <BusDestinationSelector
                    activeRouteId={activeRoute}
                    destinoSeleccionado={destinoSeleccionado}
                    destinos={destinos}
                    formatHora={formatHora}
                    getNextDeparture={getNextDeparture}
                    loading={loading}
                    onDestinoChange={handleDestinoChange}
                    onRouteChange={setActiveRoute}
                    onToggleSaved={toggleBusesSaved}
                    routes={routes}
                    savedRoutes={busesSaved}
                />

                {/* ── Tabs HOY / MAÑANA ── */}
                {!loading && !error && (
                    <TransportDayTabs
                        className="buses-dia-tabs"
                        day={tabDia}
                        onDayChange={setTabDia}
                    />
                )}

                {/* Section Header */}
                <div className="buses-section-header">
                    <div>
                        <h2>{tabDia === 'manana' ? 'Salidas Mañana' : 'Próximas Salidas'}</h2>
                        <p>
                            {loading
                                ? 'Cargando horarios...'
                                : `${tabDia === 'manana' ? 'Horario de mañana' : 'Tiempo real'} • ${activeRouteData?.shortLabel || 'Origen'}`
                            }
                        </p>
                    </div>
                    <div className="live-status">
                        <span className={tabDia === 'manana' ? '' : 'pulse-dot'}></span>
                        {tabDia === 'manana' ? '📅 MAÑANA' : '🟢 EN VIVO'}
                    </div>
                </div>

                {/* ── Estado de carga / error ── */}
                {loading && <BusesSkeletonGrid />}

                {!loading && error && (
                    <div className="buses-error-state">
                        <Bus size={48} className="text-orange" style={{ opacity: 0.4 }} />
                        <p>{error}</p>
                        <button
                            className="buses-btn-outline"
                            style={{ width: 'auto', marginTop: '1rem' }}
                            onClick={() => setReintento(r => r + 1)}
                        >
                            🔄 Reintentar
                        </button>
                    </div>
                )}

                {/* ── Grid principal — solo cuando hay datos ── */}
                {!loading && !error && (
                    <div className="buses-grid">

                        {/* ── Big Card: SIGUIENTE SALIDA ── */}
                        <div className="buses-card big-card">
                            <div className="card-top">
                                <span className="siguiente-label">SIGUIENTE SALIDA</span>
                                <span className={estadoBigCard.badgeClass}>{estadoBigCard.badge}</span>
                            </div>

                            {siguiente ? (
                                <>
                                    {/* Ruta visible como subtítulo arriba */}
                                    <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 0.25rem', fontWeight: 600 }}>
                                        <MapPin size={13} style={{ marginRight: 4, color: '#E8621A' }} />
                                        {siguiente.rutaCorta}
                                        <span style={{ marginLeft: 8, color: '#E8621A' }}>{siguiente.rutaCodigo}</span>
                                    </p>

                                    <div className="card-time">{formatHora(siguiente.horaSalida)}</div>
                                    <div className="card-subtitle">
                                        {siguiente.operadorNombre}
                                        <span style={{ marginLeft: 8, fontSize: '0.7rem', background: 'rgba(46,204,113,0.15)', color: '#2ECC71', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{siguiente.servicioRuta}</span>
                                    </div>

                                    <div className="boarding-info">
                                        {textoRestante && (
                                            <div className="mins-box">
                                                <span className="mins-num">{minsRestantes}</span>
                                                <span className="mins-label">MINS</span>
                                            </div>
                                        )}
                                        <div className="boarding-text">
                                            <h4>Terminal: {siguiente.terminalNombre}</h4>
                                            <p>
                                                {abordajeMin !== null && abordajeMin > 0
                                                    ? `Abordaje inicia en ${abordajeMin} minutos`
                                                    : minsRestantes <= 10
                                                        ? '🚌 Abordaje en curso'
                                                        : textoRestante
                                                            ? `Sale ${textoRestante}`
                                                            : 'Sin información'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <MiniMapaSVG ruta={siguiente} />
                                    <ReservationLink
                                        className="buses-btn-outline"
                                        href={siguiente.enlaceReserva}
                                        label="Comprar boleto"
                                    />
                                </>
                            ) : (
                                <div className="buses-no-salidas">
                                    <p>No hay más salidas para esta ruta en este día.</p>
                                    {ultima && (
                                        <p className="buses-ultima-hint">
                                            Última salida fue a las {formatHora(ultima.horaSalida)}
                                        </p>
                                    )}
                                </div>
                            )}

                            <Bus className="watermark-bus" size={200} />
                        </div>

                        {/* ── Right Card: 2ª SALIDA ── */}
                        {proxima2 && (
                            <div className="buses-card right-card">
                                <div className="card-top flex-between">
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E8621A', letterSpacing: 1 }}>2° BUS</span>
                                    <span className="badge-gray">{proxima2.tipo}</span>
                                </div>

                                {/* Countdown grande como hero */}
                                <div style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, margin: '0.75rem 0 0.25rem', color: '#fff' }}>
                                    {formatearRestante(minutosHasta(proxima2.horaSalida)) || formatHora(proxima2.horaSalida)}
                                </div>
                                <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>
                                    Sale a las {formatHora(proxima2.horaSalida)}
                                </p>

                                <h3 className="card-title mt-auto" style={{ fontSize: '1rem' }}>{proxima2.operadorNombre}</h3>
                                <p className="card-subtitle mb-4" style={{ fontSize: '0.8rem' }}>
                                    <MapPin size={11} style={{ marginRight: 3 }} />
                                    {proxima2.rutaCorta} · {proxima2.rutaCodigo}
                                </p>
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${Math.min(100, Math.max(5, 100 - (minutosHasta(proxima2.horaSalida) / 60) * 20))}%`,
                                            backgroundColor: '#E8621A'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Bottom Left Card: ÚLTIMA / NOCTURNA ── */}
                        <div className="buses-card bottom-left-card">
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
                                {ultima?.operadorNombre || 'Operador Desconocido'}
                            </h3>
                            <p className="card-subtitle">
                                {ultima ? 'Última salida del día' : 'Sin datos disponibles'}
                            </p>
                            <Clock className="watermark-moon" size={150} />
                        </div>

                        {/* ── Info Card: Recomendación estática ── */}
                        <div className="buses-card info-card">
                            <Info size={28} className="text-orange info-icon" />
                            <div>
                                <h4>Recomendación para Viajeros</h4>
                                <p>
                                    Se recomienda llegar al menos 15 minutos antes de la salida. 
                                    Asegúrese de revisar la terminal correcta ya que puede variar.
                                </p>
                            </div>
                        </div>

                    </div>
                )}

                {/* ── Lista completa de horarios del día ── */}
                {!loading && !error && horariosDelDia.length > 0 && (
                    <div className="buses-horarios-full">
                        <h3 className="buses-horarios-title">
                            🚌 Todos los horarios — {activeRouteData ? `${activeRouteData.shortLabel} · ${activeRouteData.routeCode}` : 'Ruta'}
                        </h3>
                        <div className="buses-horarios-list">
                            {horariosDelDia.map((h, idx) => {
                                const min = minutosHasta(h.horaSalida);
                                const pasado = tabDia === 'hoy' && min < 0;
                                const esProximo = !pasado && proximasSalidas[0] === h;
                                return (
                                    <div
                                        key={h.id || idx}
                                        className={`buses-horario-row ${pasado ? 'pasado' : ''} ${esProximo ? 'proximo' : ''}`}
                                    >
                                        {/* Hora de salida */}
                                        <div className="buses-row-hora">{formatHora(h.horaSalida)}</div>

                                        {/* Info principal: ruta + operador */}
                                        <div className="buses-row-info">
                                            <span className="buses-row-nombre">
                                                {h.rutaCorta}
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#666' }}>{h.operadorNombre}</span>
                                                <span className="badge-gray buses-row-badge">{h.rutaCodigo}</span>
                                                <span className="badge-green buses-row-badge">{h.servicioRuta}</span>
                                                {h.esNocturno && (
                                                    <span className="badge-gray buses-row-badge">Nocturno</span>
                                                )}
                                                {esProximo && (
                                                    <span className="badge-orange buses-row-badge">Próximo</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tiempo restante a la derecha */}
                                        <div className="buses-row-estado">
                                            {pasado
                                                ? <span className="buses-row-salido">Salió</span>
                                                : tabDia === 'manana'
                                                    ? <span className="buses-row-restante">Mañana</span>
                                                    : <span className="buses-row-restante">{formatearRestante(min)}</span>
                                            }
                                        </div>
                                        {!pasado && (
                                            <ReservationLink
                                                className="buses-row-link"
                                                href={h.enlaceReserva}
                                                label="Comprar"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </main>

            {/* ── Panel GUARDADOS ── */}
            {activeTab === 'SAVED' && (
                <div className="buses-saved-panel">
                    <h3 className="buses-saved-title">🔖 Rutas Guardadas</h3>
                    {busesSaved.length === 0 ? (
                        <div className="buses-saved-empty">
                            <Bus size={40} style={{ opacity: 0.3 }} />
                            <p>Guardá rutas tocando el 🔖 en los chips de arriba.</p>
                        </div>
                    ) : (
                        <div className="buses-saved-list">
                            {busesSaved.map(routeId => {
                                const route = routes.find(item => item.id === routeId);
                                if (!route) return null;
                                const hsFiltrados = horarios
                                    .filter(h => h.rutaId === route.id && correEnDia(h, diaNum))
                                    .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida));
                                const proxima = hsFiltrados.find(h => minutosHasta(h.horaSalida) >= 0);
                                return (
                                    <div key={route.id} className="buses-saved-item" onClick={() => { setDestinoSeleccionado(route.destino); setActiveRoute(route.id); setActiveTab('SCHEDULES'); }}>
                                        <div className="buses-saved-route">{route.shortLabel} · {route.routeCode} · {route.serviceLabel}</div>
                                        <div className="buses-saved-next">
                                            {proxima
                                                ? <><span className="buses-row-restante">{formatHora(proxima.horaSalida)}</span><span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '6px' }}>{formatearRestante(minutosHasta(proxima.horaSalida))}</span></>
                                                : <span style={{ color: '#555', fontSize: '0.85rem' }}>Sin salidas hoy</span>
                                            }
                                        </div>
                                        <button className="buses-saved-remove" onClick={e => { e.stopPropagation(); toggleBusesSaved(route.id); }}>✕</button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Tab Bar — Mobile solo */}
            <nav className="buses-bottom-nav">
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
                    <Bus size={24} />
                    <span>HORARIOS</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'SAVED' ? 'active' : ''}`}
                    onClick={() => setActiveTab('SAVED')}
                >
                    {busesSaved.length > 0 ? <BookmarkCheck size={24} /> : <Bookmark size={24} />}
                    <span>FAVORITOS</span>
                </button>
            </nav>
        </div>
    );
}

export default PaginaBuses;
