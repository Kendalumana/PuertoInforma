import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Clock,
    Info, Compass, Bus, Ticket, Bookmark, BookmarkCheck, MapPin,
    Bell, User, Map, Navigation, Zap, GitBranch, ArrowRight, X
} from 'lucide-react';
import { axiosPrivate } from '../api/axios';
import '../styles/Transporte.css';
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
// MAPA DE PUNTITOS (TRACK DE PARADAS)
// ═══════════════════════════════════════════════════════════
function RouteStopsTrack({ paradas, paradaBuscada }) {
    if (!paradas || paradas.length < 2) return null;

    let parsed = [];
    if (typeof paradas === 'string') {
        try {
            parsed = JSON.parse(paradas);
        } catch {
            parsed = [paradas];
        }
    } else {
        parsed = paradas;
    }

    if (parsed.length <= 2) return null; // Solo mostramos track si hay paradas intermedias

    // Normaliza para comparar sin importar mayúsculas ni acentos
    const normalizar = (s) => s?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ?? '';
    const qBuscada = normalizar(paradaBuscada);

    return (
        <div style={{ padding: '0 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#E8621A', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <MapPin size={14} />
                <span>Ruta del Bus</span>
                {paradaBuscada && (
                    // Indicador visual de que se está mostrando la parada buscada
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: 600, color: '#aaa' }}>
                        — marcando <strong style={{ color: '#fff' }}>{paradaBuscada}</strong>
                    </span>
                )}
            </div>
            <div className="transporte-stops-track">
                {parsed.map((p, i) => {
                    const esMatch = qBuscada && normalizar(p).includes(qBuscada);
                    const clasesDot = [
                        'transporte-stop-dot',
                        i === 0 ? 'origin' : i === parsed.length - 1 ? 'dest' : '',
                        esMatch ? 'match' : '', // ← resaltado si coincide con la parada buscada
                    ].filter(Boolean).join(' ');
                    return (
                        <div key={i} className="transporte-stop-item">
                            <div className={clasesDot} />
                            {i < parsed.length - 1 && <div className="transporte-stop-connector active" />}
                            <span className={`transporte-stop-label${esMatch ? ' match' : ''}`}>{p}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// COMBOBOX DE PARADA INTERMEDIA — dropdown real con todas las paradas del JSON
// ═══════════════════════════════════════════════════════════
function StopCombobox({ paradasUnicas, paradaBuscada, onParadaChange }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef(null);
    const searchRef = useRef(null);

    // Cierra al hacer clic fuera
    useEffect(() => {
        const handleClick = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Al abrir, enfoca el buscador interno
    useEffect(() => {
        if (open && searchRef.current) searchRef.current.focus();
    }, [open]);

    // Paradas filtradas por lo que el usuario escribe DENTRO del dropdown
    const paradasFiltradas = useMemo(() => {
        if (!query.trim()) return paradasUnicas;
        const q = query.trim().toLowerCase();
        return paradasUnicas.filter(p => p.toLowerCase().includes(q));
    }, [query, paradasUnicas]);

    const seleccionar = (parada) => {
        onParadaChange(parada);
        setOpen(false);
        setQuery('');
    };

    const limpiar = (e) => {
        e.stopPropagation();
        onParadaChange('');
        setQuery('');
        setOpen(false);
    };

    const isActive = !!paradaBuscada;

    return (
        <div className={`stop-combobox-wrapper${isActive ? ' is-active' : ''}`} ref={wrapperRef}>
            {/* ── Botón principal del combobox ── */}
            <button
                id="stop-combobox-trigger"
                type="button"
                className="stop-combobox-trigger"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Seleccionar parada intermedia"
            >
                <Navigation size={16} className="stop-combobox-icon" />
                <span className={`stop-combobox-label${isActive ? ' selected' : ''}`}>
                    {paradaBuscada || '¿A dónde vas?'}
                </span>
                {isActive ? (
                    <button
                        className="stop-combobox-clear"
                        onClick={limpiar}
                        aria-label="Limpiar selección"
                        type="button"
                    >✕</button>
                ) : (
                    <span className={`stop-combobox-chevron${open ? ' open' : ''}`}>▾</span>
                )}
            </button>

            {/* ── Panel desplegable con TODAS las paradas del JSON ── */}
            {open && (
                <div className="stop-combobox-panel" role="listbox" aria-label="Paradas disponibles">
                    {/* Buscador interno para filtrar dentro del dropdown */}
                    <div className="stop-combobox-search-row">
                        <Search size={13} className="stop-panel-search-icon" />
                        <input
                            ref={searchRef}
                            type="text"
                            className="stop-panel-search-input"
                            placeholder="Filtrar paradas..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>

                    <ul className="stop-combobox-list">
                        {paradasFiltradas.length === 0 ? (
                            <li className="stop-combobox-empty">Sin resultados</li>
                        ) : (
                            paradasFiltradas.map(p => (
                                <li
                                    key={p}
                                    role="option"
                                    aria-selected={p === paradaBuscada}
                                    className={`stop-combobox-option${p === paradaBuscada ? ' selected' : ''}`}
                                    onMouseDown={() => seleccionar(p)}
                                >
                                    <MapPin size={12} className="stop-option-icon" />
                                    <span>{p}</span>
                                    {p === paradaBuscada && <span className="stop-option-check">✓</span>}
                                </li>
                            ))
                        )}
                    </ul>

                    <div className="stop-combobox-count">
                        {paradasFiltradas.length} parada{paradasFiltradas.length !== 1 ? 's' : ''} disponible{paradasFiltradas.length !== 1 ? 's' : ''}
                    </div>
                </div>
            )}

            {/* Badge "Filtrando por:" debajo del trigger */}
            {isActive && !open && (
                <div className="stop-combobox-badge-row">
                    <span className="stop-combobox-active-badge">
                        <MapPin size={11} /> Filtrando por: <strong>{paradaBuscada}</strong>
                    </span>
                </div>
            )}
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
    const [paradaBuscada, setParadaBuscada] = useState(''); // parada intermedia buscada
    const [filtroServicio, setFiltroServicio] = useState('TODOS'); // 'TODOS', 'DIRECTO', 'REGULAR'
    const [tabDia, setTabDia] = useState('hoy');
    const [autoFiltroMsg, setAutoFiltroMsg] = useState(null); // mensaje de auto-cambio de filtro
    const autoFiltroTimer = useRef(null);
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

    // ── Paradas únicas de TODAS las rutas (para el combobox) ──
    const paradasUnicas = useMemo(() => {
        const set = new Set();
        horarios.forEach(h => {
            let paradas = h.paradas;
            if (typeof paradas === 'string') {
                try { paradas = JSON.parse(paradas); } catch { paradas = [paradas]; }
            }
            if (Array.isArray(paradas)) {
                paradas.forEach(p => { if (p && typeof p === 'string') set.add(p.trim()); });
            }
        });
        return [...set].sort((a, b) => a.localeCompare(b, 'es'));
    }, [horarios]);

    // ── IDs de rutas que pasan por la parada buscada ──
    const rutasConParada = useMemo(() => {
        if (!paradaBuscada) return null; // null = sin filtro activo
        const q = paradaBuscada.trim().toLowerCase();
        const ids = new Set();
        horarios.forEach(h => {
            // EXCEPCIÓN SOLICITADA:
            // Si el usuario está buscando una parada intermedia específica (ej. Barranca),
            // excluimos los buses DIRECTOS del filtro.
            // ¿Por qué?: Porque los buses directos no recogen ni bajan pasajeros a medio camino,
            // por lo tanto, no sirve mostrarle un bus directo a alguien que espera en Barranca.
            if (h.tipo === 'DIRECTO') return;

            let paradas = h.paradas;
            if (typeof paradas === 'string') {
                try { paradas = JSON.parse(paradas); } catch { paradas = [paradas]; }
            }
            if (Array.isArray(paradas) && paradas.some(p => p?.toLowerCase().includes(q))) {
                ids.add(h.rutaId);
            }
        });
        return ids;
    }, [horarios, paradaBuscada]);

    // Cada opción conserva su ruta real: rutas directas e indirectas ya no se mezclan.
    const routes = useMemo(() => {
        const routeMap = new globalThis.Map();
        horarios.forEach(h => {
            if (h.origen && h.destino && !routeMap.has(h.rutaId)) {
                // Si hay filtro por parada, solo incluimos rutas que pasen por ella
                if (rutasConParada && !rutasConParada.has(h.rutaId)) return;
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
    }, [horarios, rutasConParada]);

    const activeRouteData = useMemo(
        () => routes.find(route => route.id === activeRoute) || null,
        [routes, activeRoute]
    );

    const handleDestinoChange = (destino) => {
        setDestinoSeleccionado(destino);
        const route = routes.find(item => item.destino === destino);
        if (route) setActiveRoute(route.id);
    };

    // Cuando se selecciona una parada, auto-seleccionamos la primera ruta que pase por ella
    const handleParadaChange = (parada) => {
        setParadaBuscada(parada);
        if (parada) {
            // Si busca una parada intermedia, el filtro "Directo" pierde sentido. Forzamos a "Con Paradas" (REGULAR)
            if (filtroServicio === 'DIRECTO') {
                setFiltroServicio('REGULAR');
                // Notificar al usuario del auto-cambio
                clearTimeout(autoFiltroTimer.current);
                setAutoFiltroMsg('Se cambió a "Con Paradas" porque los buses directos no tienen paradas intermedias.');
                autoFiltroTimer.current = setTimeout(() => setAutoFiltroMsg(null), 4500);
            }

            // Buscar la primera ruta que pase por esta parada
            const q = parada.trim().toLowerCase();
            const primerHorario = horarios.find(h => {
                if (h.tipo === 'DIRECTO') return false; // Los directos no cuentan para paradas intermedias
                let paradas = h.paradas;
                if (typeof paradas === 'string') {
                    try { paradas = JSON.parse(paradas); } catch { paradas = [paradas]; }
                }
                return Array.isArray(paradas) && paradas.some(p => p?.toLowerCase().includes(q));
            });
            if (primerHorario) {
                setDestinoSeleccionado(primerHorario.destino);
                setActiveRoute(primerHorario.rutaId);
            }
        }
    };

    const getNextDeparture = (destino) => {
        const diaNum = tabDia === 'hoy' ? ahora.getDay() : (ahora.getDay() + 1) % 7;
        return horarios
            .filter(horario => horario.destino === destino && correEnDia(horario, diaNum) && minutosHasta(horario.horaSalida) >= 0)
            .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida))[0];
    };

    // ── Conteo de horarios por tipo (para badges en los tabs) ──
    const conteoServicios = useMemo(() => {
        if (!activeRoute) return { TODOS: 0, DIRECTO: 0, REGULAR: 0 };
        const diaNum = tabDia === 'hoy' ? ahora.getDay() : (ahora.getDay() + 1) % 7;
        const deRuta = horarios.filter(h => h.rutaId === activeRoute && correEnDia(h, diaNum));
        return {
            TODOS: deRuta.length,
            DIRECTO: deRuta.filter(h => h.tipo === 'DIRECTO').length,
            REGULAR: deRuta.filter(h => h.tipo !== 'DIRECTO').length,
        };
    }, [horarios, activeRoute, tabDia, ahora]);

    // ── Horarios filtrados por ruta activa ─────────────────
    const horariosFiltradosRuta = useMemo(() => {
        if (!activeRoute) return [];
        return horarios
            .filter(h => h.rutaId === activeRoute)
            .filter(h => {
                // Filtro visual (Pestañota "Todos / Directo / Con Paradas")
                if (filtroServicio === 'DIRECTO' && h.tipo !== 'DIRECTO') return false;
                if (filtroServicio === 'REGULAR' && h.tipo === 'DIRECTO') return false;

                // Doble validación de la excepción solicitada:
                // Si hay un filtro de parada buscada, NUNCA mostrar buses directos,
                // ya que no pueden abordarse en esa parada intermedia.
                if (paradaBuscada && h.tipo === 'DIRECTO') return false;

                return true;
            })
            .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida));
    }, [horarios, activeRoute, filtroServicio, paradaBuscada]);

    // Paradas de la ruta activa para el mapa de puntitos
    const paradasRutaActiva = horariosFiltradosRuta.length > 0 ? horariosFiltradosRuta[0].paradas : [];

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
        <div className="app-wrapper immersive-layout transporte-layout">
            <Navbar />

            <main className="transporte-main">

                {/* Hero Title */}
                <h1 className="transporte-hero-title">
                    Horarios de <span className="text-orange">Buses</span>
                </h1>

                {/* ─── Combobox de parada intermedia ──────────────────── */}
                {!loading && paradasUnicas.length > 0 && (
                    <StopCombobox
                        paradasUnicas={paradasUnicas}
                        paradaBuscada={paradaBuscada}
                        onParadaChange={handleParadaChange}
                    />
                )}

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

                {/* ── Tabs HOY / MAÑANA y Filtros de Servicio ── */}
                {!loading && !error && (
                    <>
                    <div className="transporte-filtros-row">
                        <TransportDayTabs
                            className="transporte-dia-tabs"
                            day={tabDia}
                            onDayChange={setTabDia}
                            style={{ marginBottom: 0 }}
                        />

                        {/* ── Selector de tipo de servicio mejorado ── */}
                        <div className="servicio-filter-group" role="group" aria-label="Filtrar por tipo de servicio">
                            {/* Botón: Todos */}
                            <button
                                id="filtro-todos"
                                className={`servicio-filter-btn todos ${filtroServicio === 'TODOS' ? 'active' : ''}`}
                                onClick={() => setFiltroServicio('TODOS')}
                                title="Mostrar todos los horarios disponibles"
                                aria-pressed={filtroServicio === 'TODOS'}
                            >
                                <span className="sfb-icon">☰</span>
                                <span className="sfb-label">Todos</span>
                                {conteoServicios.TODOS > 0 && (
                                    <span className="sfb-badge">{conteoServicios.TODOS}</span>
                                )}
                            </button>

                            {/* Botón: Directo */}
                            <button
                                id="filtro-directo"
                                className={`servicio-filter-btn directo ${filtroServicio === 'DIRECTO' ? 'active' : ''} ${conteoServicios.DIRECTO === 0 ? 'empty' : ''}`}
                                onClick={() => {
                                    setFiltroServicio('DIRECTO');
                                    if (paradaBuscada) {
                                        setParadaBuscada('');
                                        clearTimeout(autoFiltroTimer.current);
                                        setAutoFiltroMsg('Se quitó la parada intermedia. Los buses directos no tienen paradas en ruta.');
                                        autoFiltroTimer.current = setTimeout(() => setAutoFiltroMsg(null), 4500);
                                    }
                                }}
                                title="Solo buses expresos: viajan de origen a destino sin paradas intermedias. Más rápidos."
                                aria-pressed={filtroServicio === 'DIRECTO'}
                                disabled={conteoServicios.DIRECTO === 0}
                            >
                                <Zap size={13} className="sfb-icon-svg" />
                                <span className="sfb-label">Directo</span>
                                {conteoServicios.DIRECTO > 0 && (
                                    <span className="sfb-badge directo">{conteoServicios.DIRECTO}</span>
                                )}
                            </button>

                            {/* Botón: Con Paradas */}
                            <button
                                id="filtro-con-paradas"
                                className={`servicio-filter-btn paradas ${filtroServicio === 'REGULAR' ? 'active' : ''} ${conteoServicios.REGULAR === 0 ? 'empty' : ''}`}
                                onClick={() => setFiltroServicio('REGULAR')}
                                title="Buses que recogen y dejan pasajeros en paradas intermedias a lo largo de la ruta."
                                aria-pressed={filtroServicio === 'REGULAR'}
                                disabled={conteoServicios.REGULAR === 0}
                            >
                                <GitBranch size={13} className="sfb-icon-svg" />
                                <span className="sfb-label">Con Paradas</span>
                                {conteoServicios.REGULAR > 0 && (
                                    <span className="sfb-badge paradas">{conteoServicios.REGULAR}</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ── Banner informativo de tipo activo ── */}
                    {filtroServicio !== 'TODOS' && (
                        <div className={`servicio-info-banner ${filtroServicio === 'DIRECTO' ? 'directo' : 'paradas'}`}>
                            {filtroServicio === 'DIRECTO' ? (
                                <>
                                    <Zap size={14} />
                                    <span><strong>Buses Directos:</strong> Sin paradas intermedias, llegan más rápido a destino.</span>
                                </>
                            ) : (
                                <>
                                    <GitBranch size={14} />
                                    <span><strong>Con Paradas:</strong> Paran en puntos intermedios. Ideales si subís en ruta.</span>
                                </>
                            )}
                            <button
                                className="servicio-info-banner-close"
                                onClick={() => setFiltroServicio('TODOS')}
                                aria-label="Limpiar filtro"
                            ><X size={12} /></button>
                        </div>
                    )}

                    {/* ── Toast de auto-cambio de filtro ── */}
                    {autoFiltroMsg && (
                        <div className="filtro-auto-toast" role="status" aria-live="polite">
                            <Info size={14} />
                            <span>{autoFiltroMsg}</span>
                            <button onClick={() => setAutoFiltroMsg(null)} aria-label="Cerrar"><X size={11} /></button>
                        </div>
                    )}
                    </>
                )}

                {/* ── Mapa de Puntitos de la ruta actual ── */}
                {!loading && !error && activeRouteData && (
                    <RouteStopsTrack
                        paradas={paradasRutaActiva}
                        paradaBuscada={paradaBuscada}
                    />
                )}

                {/* Section Header */}
                <div className="transporte-section-header">
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
                    <div className="transporte-error-state">
                        <Bus size={48} className="text-orange" style={{ opacity: 0.4 }} />
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
                                    {/* Badge de parada filtrada */}
                                    {paradaBuscada && (
                                        <div className="stop-filter-banner">
                                            <Navigation size={13} />
                                            Pasa por <strong>{paradaBuscada}</strong>
                                        </div>
                                    )}

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
                                    <ReservationLink
                                        className="transporte-btn-outline"
                                        href={siguiente.enlaceReserva}
                                        label="Comprar boleto"
                                    />
                                </>
                            ) : (
                                <div className="transporte-no-salidas">
                                    <p>No hay más salidas para esta ruta en este día.</p>
                                    {ultima && (
                                        <p className="transporte-ultima-hint">
                                            Última salida fue a las {formatHora(ultima.horaSalida)}
                                        </p>
                                    )}
                                </div>
                            )}

                            <Bus className="watermark-bus" size={200} />
                        </div>

                        {/* ── Right Card: 2ª SALIDA ── */}
                        {proxima2 && (
                            <div className="transporte-card right-card">
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

                                <h3 className="card-title mt-auto mb-4" style={{ fontSize: '1rem' }}>{proxima2.operadorNombre}</h3>
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
                                {ultima?.operadorNombre || 'Operador Desconocido'}
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
                                    Se recomienda llegar al menos 15 minutos antes de la salida. 
                                    Asegúrese de revisar la terminal correcta ya que puede variar.
                                </p>
                            </div>
                        </div>

                    </div>
                )}

                {/* ── Lista completa de horarios del día ── */}
                {!loading && !error && horariosDelDia.length > 0 && (
                    <div className="transporte-horarios-full">
                        <h3 className="transporte-horarios-title">
                            🚌 Todos los horarios — {activeRouteData ? `${activeRouteData.shortLabel} · ${activeRouteData.routeCode}` : 'Ruta'}
                        </h3>
                        <div className="transporte-horarios-list">
                            {horariosDelDia.map((h, idx) => {
                                const min = minutosHasta(h.horaSalida);
                                const pasado = tabDia === 'hoy' && min < 0;
                                const esProximo = !pasado && proximasSalidas[0] === h;
                                return (
                                    <div
                                        key={h.id || idx}
                                        className={`transporte-horario-row ${pasado ? 'pasado' : ''} ${esProximo ? 'proximo' : ''}`}
                                    >
                                        {/* Hora de salida */}
                                        <div className="transporte-row-hora">{formatHora(h.horaSalida)}</div>

                                        {/* Info principal: ruta + operador */}
                                        <div className="transporte-row-info">
                                            <span className="transporte-row-nombre">
                                                {h.rutaCorta}
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#666' }}>{h.operadorNombre}</span>
                                                <span className="badge-gray transporte-row-badge">{h.rutaCodigo}</span>
                                                <span className="badge-green transporte-row-badge">{h.servicioRuta}</span>
                                                {h.esNocturno && (
                                                    <span className="badge-gray transporte-row-badge">Nocturno</span>
                                                )}
                                                {esProximo && (
                                                    <span className="badge-orange transporte-row-badge">Próximo</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tiempo restante a la derecha */}
                                        <div className="transporte-row-estado">
                                            {pasado
                                                ? <span className="transporte-row-salido">Salió</span>
                                                : tabDia === 'manana'
                                                    ? <span className="transporte-row-restante">Mañana</span>
                                                    : <span className="transporte-row-restante">{formatearRestante(min)}</span>
                                            }
                                        </div>
                                        {!pasado && (
                                            <ReservationLink
                                                className="transporte-row-link"
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
                <div className="transporte-saved-panel">
                    <h3 className="transporte-saved-title">🔖 Rutas Guardadas</h3>
                    {busesSaved.length === 0 ? (
                        <div className="transporte-saved-empty">
                            <Bus size={40} style={{ opacity: 0.3 }} />
                            <p>Guardá rutas tocando el 🔖 en los chips de arriba.</p>
                        </div>
                    ) : (
                        <div className="transporte-saved-list">
                            {busesSaved.map(routeId => {
                                const route = routes.find(item => item.id === routeId);
                                if (!route) return null;
                                const hsFiltrados = horarios
                                    .filter(h => h.rutaId === route.id && correEnDia(h, diaNum))
                                    .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida));
                                const proxima = hsFiltrados.find(h => minutosHasta(h.horaSalida) >= 0);
                                return (
                                    <div key={route.id} className="transporte-saved-item" onClick={() => { setDestinoSeleccionado(route.destino); setActiveRoute(route.id); setActiveTab('SCHEDULES'); }}>
                                        <div className="transporte-saved-route">{route.shortLabel} · {route.routeCode} · {route.serviceLabel}</div>
                                        <div className="transporte-saved-next">
                                            {proxima
                                                ? <><span className="transporte-row-restante">{formatHora(proxima.horaSalida)}</span><span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '6px' }}>{formatearRestante(minutosHasta(proxima.horaSalida))}</span></>
                                                : <span style={{ color: '#555', fontSize: '0.85rem' }}>Sin salidas hoy</span>
                                            }
                                        </div>
                                        <button className="transporte-saved-remove" onClick={e => { e.stopPropagation(); toggleBusesSaved(route.id); }}>✕</button>
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
