import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../api/axios';
import {
    Search, Bus, Bookmark, BookmarkCheck,
    MapPin, ArrowLeft, Clock, Star,
    ChevronRight, CalendarDays, ListFilter, Navigation
} from 'lucide-react';
import '../styles/Buses.css';
import BusMapModal from './BusMapModal';
import Navbar from './Navbar';

// ═══════════════════════════════════════════════════════════
// HELPERS DE TIEMPO REAL
// ═══════════════════════════════════════════════════════════

// Días en el mismo formato que devuelve la DB (sin tildes)
const DIA_ORDEN = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const DIA_NUM   = Object.fromEntries(DIA_ORDEN.map((d, i) => [d, i]));

// Normaliza un nombre de día eliminando tildes/espacios (robusto para SABADO y SÁBADO)
function normalizarDia(dia) {
    if (!dia) return '';
    return dia.toUpperCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quita tildes
}

// Distancia entre dos coordenadas en km (Haversine)
function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Parsea paradas: la DB las guarda como string JSON "[\"A\",\"B\"]"
function parsearParadas(ruta) {
    if (!ruta) return ['Origen', 'Destino'];
    const raw = ruta.paradas;
    if (Array.isArray(raw) && raw.length >= 2) return raw;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
        } catch (_) { /* continúa al fallback */ }
    }
    return [ruta.lugarOrigen?.nombre || 'Origen', ruta.lugarDestino?.nombre || 'Destino'];
}

// ¿Corre esta ruta en el día numérico dado?
function correEnDia(horario, diaNum) {
    const inicio = DIA_NUM[normalizarDia(horario.diaInicio)] ?? 1;
    const fin    = DIA_NUM[normalizarDia(horario.diaFin)]    ?? 5;
    // Manejar rangos que cruzan el fin de semana (ej: V→L)
    if (inicio <= fin) return diaNum >= inicio && diaNum <= fin;
    return diaNum >= inicio || diaNum <= fin;
}

// Minutos transcurridos desde medianoche para "HH:MM:SS" o "HH:MM"
function horaEnMinutos(hora) {
    if (!hora) return -1;
    const partes = hora.split(':').map(Number);
    return partes[0] * 60 + (partes[1] || 0);
}

// Minutos que faltan hasta esa hora (negativo = ya pasó)
function minutosHasta(horaSalida) {
    const ahora = new Date();
    const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
    return horaEnMinutos(horaSalida) - ahoraMin;
}

// Formato legible del tiempo restante
function formatearTiempoRestante(minutos) {
    if (minutos < 0) return null; // ya pasó
    if (minutos === 0) return 'Ahora';
    if (minutos < 60) return `En ${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `En ${h}h ${m}m` : `En ${h}h`;
}

// Formato "HH:MM" desde "HH:MM:SS"
function formatHora(hora) {
    if (!hora) return '--:--';
    return hora.substring(0, 5);
}

// Calcular los próximos buses de una ruta para el día indicado
function proximosBuses(horarios, diaNum, limit = 3) {
    if (!horarios?.length) return [];
    return horarios
        .filter(h => correEnDia(h, diaNum))
        .filter(h => minutosHasta(h.horaSalida) >= 0)
        .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida))
        .slice(0, limit);
}

// Obtener el resumen de próxima salida para una card
function resumenProximaSalida(horarios) {
    const hoy = new Date().getDay();
    const proximosHoy = proximosBuses(horarios, hoy, 2);
    if (proximosHoy.length > 0) {
        const primero = proximosHoy[0];
        const min = minutosHasta(primero.horaSalida);
        return {
            label: formatearTiempoRestante(min),
            hora: formatHora(primero.horaSalida),
            // horaLlegada solo existe en INDIRECTO — se muestra en la card como referencia
            horaLlegada: primero.horaLlegada ? formatHora(primero.horaLlegada) : null,
            siguiente: proximosHoy[1] ? formatHora(proximosHoy[1].horaSalida) : null,
            estado: min < 15 ? 'urgente' : min < 60 ? 'pronto' : 'normal',
            hayHoy: true
        };
    }
    // No hay más hoy → buscar mañana
    const manana = (hoy + 1) % 7;
    const mananaHorarios = (horarios || [])
        .filter(h => correEnDia(h, manana))
        .sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida));
    if (mananaHorarios.length > 0) {
        return {
            label: `Mañana ${formatHora(mananaHorarios[0].horaSalida)}`,
            hora: formatHora(mananaHorarios[0].horaSalida),
            horaLlegada: mananaHorarios[0].horaLlegada ? formatHora(mananaHorarios[0].horaLlegada) : null,
            siguiente: null,
            estado: 'manana',
            hayHoy: false
        };
    }
    return { label: 'Sin salidas próximas', hora: '--:--', horaLlegada: null, siguiente: null, estado: 'sinSalidas', hayHoy: false };
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE: Reloj en vivo
// ═══════════════════════════════════════════════════════════
function RelojVivo() {
    const [ahora, setAhora] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setAhora(new Date()), 30000);
        return () => clearInterval(t);
    }, []);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const h = ahora.getHours().toString().padStart(2, '0');
    const m = ahora.getMinutes().toString().padStart(2, '0');
    return (
        <div className="buses-reloj">
            <Clock size={14} />
            <span>{dias[ahora.getDay()]} · {h}:{m}</span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE: Card de ruta en la lista
// ═══════════════════════════════════════════════════════════

// Acorta nombres largos de terminales para que quepan en la card
function acortarTerminal(nombre) {
    if (!nombre) return '?';
    const n = nombre.trim();
    if (n.length <= 22) return n;
    // Quita prefijos verbosos comunes
    return n.replace(/Terminal (de buses de|Buses)/i, 'Term.').trim().substring(0, 24);
}

// Tipo dominante de una ruta según sus horarios
function tipoRuta(ruta) {
    if (!ruta.horarios?.length) return null;
    const counts = {};
    ruta.horarios.forEach(h => {
        const t = (h.tipo || 'REGULAR').toUpperCase();
        counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function RutaCard({ ruta, onSelect, esFavorito, onToggleFavorito }) {
    const resumen = useMemo(() => resumenProximaSalida(Array.isArray(ruta.horarios) ? ruta.horarios : []), [ruta.horarios]);
    const origen  = acortarTerminal(ruta.lugarOrigen?.nombre);
    const destino = acortarTerminal(ruta.lugarDestino?.nombre);
    const tipo    = tipoRuta(ruta); // 'DIRECTO' | 'INDIRECTO' | null

    return (
        <div className={`mv-route-card ${resumen.estado}`} onClick={() => onSelect(ruta)}>
            {/* Franja de tipo (arriba de la card) */}
            {tipo && (
                <div className={`mv-card-tipo-strip ${tipo === 'DIRECTO' ? 'directo' : 'indirecto'}`}>
                    {tipo === 'DIRECTO' ? '⚡ DIRECTO' : '🔄 INDIRECTO'}
                </div>
            )}

            {/* Cabecera: origen → destino */}
            <div className="mv-card-header">
                <div className="mv-route-direction">
                    <span className="mv-origin">{origen}</span>
                    <ChevronRight size={14} className="mv-arrow" />
                    <span className="mv-dest">{destino}</span>
                </div>
                <button
                    className="mv-bookmark"
                    onClick={e => { e.stopPropagation(); onToggleFavorito(ruta.id, e); }}
                >
                    {esFavorito ? <BookmarkCheck size={18} color="#E8621A" /> : <Bookmark size={18} />}
                </button>
            </div>

            {/* Operador */}
            <div className="mv-operator-row">
                <span className="mv-operator">{ruta.operador?.nombre || '—'}</span>
            </div>

            {/* Próximas salidas */}
            <div className="mv-departures">
                {resumen.hayHoy ? (
                    <>
                        <div className={`mv-next-bus ${resumen.estado}`}>
                            <span className="mv-next-label">PRÓXIMO</span>
                            <span className="mv-next-time">{resumen.hora}</span>
                            <span className="mv-countdown">{resumen.label}</span>
                        </div>
                        {resumen.siguiente && (
                            <div className="mv-next-bus normal secondary">
                                <span className="mv-next-label">SIGUIENTE</span>
                                <span className="mv-next-time">{resumen.siguiente}</span>
                            </div>
                        )}
                        {/* Tiempo de viaje para INDIRECTO */}
                        {tipo === 'INDIRECTO' && resumen.horaLlegada && (
                            <div className="mv-card-llegada">
                                <span className="mv-next-label">LLEGA</span>
                                <span className="mv-llegada-time">{resumen.horaLlegada}</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mv-no-buses">
                        <span>{resumen.label}</span>
  // ═══════════════════════════════════════════════════════════
// COMPONENTE: Vista de detalle — Matriz de Horarios
// ═══════════════════════════════════════════════════════════
function RutaDetalle({ ruta, esFavorito, onToggleFavorito, onVolver }) {
    const [mapaAbierto, setMapaAbierto] = useState(false);
    const [tabHorario,  setTabHorario]  = useState('hoy');
    const [tipoFiltro,  setTipoFiltro]  = useState('TODOS');
    const [diaSemana,   setDiaSemana]   = useState(null);
    const hoy    = new Date().getDay();
    const manana = (hoy + 1) % 7;

    const cambiarTab = (tab) => {
        setTabHorario(tab);
        if (tab !== 'semana') setDiaSemana(null);
    };

    const paradas = useMemo(() => parsearParadas(ruta), [ruta]);

    const tiposDisponibles = useMemo(() => {
        if (!ruta.horarios?.length) return [];
        return [...new Set(ruta.horarios.map(h => (h.tipo || 'REGULAR').toUpperCase()))];
    }, [ruta.horarios]);

    const horariosTab = useMemo(() => {
        if (!ruta.horarios?.length) return [];
        let base = ruta.horarios;
        if (tabHorario === 'hoy')         base = base.filter(h => correEnDia(h, hoy));
        else if (tabHorario === 'manana') base = base.filter(h => correEnDia(h, manana));
        else if (tabHorario === 'semana' && diaSemana !== null) base = base.filter(h => correEnDia(h, diaSemana));
        if (tipoFiltro !== 'TODOS') base = base.filter(h => (h.tipo || '').toUpperCase() === tipoFiltro);
        return [...base].sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida));
    }, [ruta.horarios, tabHorario, hoy, manana, diaSemana, tipoFiltro]);

    const idxProximo = tabHorario === 'hoy'
        ? horariosTab.findIndex(h => minutosHasta(h.horaSalida) >= 0)
        : -1;

    const horariosAgrupados = useMemo(() => {
        const grupos = [
            { label: '🌅 Madrugada', key: 'madrugada', desde: 0,  hasta: 5,  items: [] },
            { label: '🌄 Mañana',    key: 'manana',    desde: 5,  hasta: 12, items: [] },
            { label: '☀️ Tarde',     key: 'tarde',     desde: 12, hasta: 18, items: [] },
            { label: '🌙 Noche',     key: 'noche',     desde: 18, hasta: 24, items: [] },
        ];
        horariosTab.forEach(h => {
            const hora = parseInt(h.horaSalida?.split(':')[0] || '0', 10);
            const g = grupos.find(gr => hora >= gr.desde && hora < gr.hasta);
            if (g) g.items.push(h);
        });
        return grupos.filter(g => g.items.length > 0);
    }, [horariosTab]);

    const origen  = paradas[0];
    const destino = paradas[paradas.length - 1];

    return (
        <div className="mv-detail-page">
            {/* ══ HEADER ══ */}
            <div className="mvd-header">
                <div className="mvd-header-top">
                    <button className="mv-back-btn" onClick={onVolver}>
                        <ArrowLeft size={20} /><span>Rutas</span>
                    </button>
                    <div className="mvd-header-actions">
                        <button className="mv-fav-btn" onClick={e => onToggleFavorito(ruta.id, e)}>
                            {esFavorito ? <BookmarkCheck size={20} color="#E8621A" /> : <Bookmark size={20} />}
                        </button>
                        <button className="mvd-map-btn" onClick={() => setMapaAbierto(true)}>
                            <MapPin size={16} /><span>Mapa</span>
                        </button>
                    </div>
                </div>

                {/* Origen → Destino */}
                <div className="mvd-route-display">
                    <div className="mvd-terminal">
                        <span className="mvd-terminal-label">SALIDA</span>
                        <span className="mvd-terminal-name">{origen}</span>
                    </div>
                    <div className="mvd-route-arrow-wrap">
                        <div className="mvd-arrow-line" />
                        <Bus size={18} className="mvd-arrow-bus" />
                    </div>
                    <div className="mvd-terminal mvd-terminal-dest">
                        <span className="mvd-terminal-label">DESTINO</span>
                        <span className="mvd-terminal-name">{destino}</span>
                    </div>
                </div>

                {/* Meta info */}
                <div className="mvd-meta-row">
                    <span className="mvd-meta-item">
                        <Bus size={13} />{ruta.operador?.nombre || 'Operador desconocido'}
                    </span>
                    {ruta.nombre && <span className="mvd-meta-item mvd-meta-ruta">{ruta.nombre}</span>}
                    {ruta.duracion && <span className="mvd-meta-item"><Clock size={13} />{ruta.duracion}</span>}
                    {ruta.frecuencia && <span className="mvd-meta-item"><Clock size={13} />{ruta.frecuencia}</span>}
                </div>

                {/* Paradas intermedias */}
                {paradas.length > 2 && (
                    <div className="mvd-stops-track">
                        {paradas.map((p, i) => (
                            <div key={i} className="mvd-stop-item">
                                <div className={`mvd-stop-dot ${i === 0 ? 'origin' : i === paradas.length - 1 ? 'dest' : ''}`} />
                                {i < paradas.length - 1 && <div className="mvd-stop-connector" />}
                                <span className="mvd-stop-label">{p}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ══ TABS HOY / MAÑANA / SEMANA ══ */}
            <div className="mvd-tabs-bar">
                {[
                    { key: 'hoy',    icon: <Clock size={14} />,       label: 'HOY' },
                    { key: 'manana', icon: <CalendarDays size={14} />, label: 'MAÑANA' },
                    { key: 'semana', icon: <ListFilter size={14} />,   label: 'SEMANA' },
                ].map(t => (
                    <button key={t.key} className={`mvd-tab ${tabHorario === t.key ? 'active' : ''}`} onClick={() => cambiarTab(t.key)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Sub-filtros */}
            {(tiposDisponibles.length > 1 || tabHorario === 'semana') && (
                <div className="mvd-filters-row">
                    {tiposDisponibles.length > 1 && (
                        <div className="mvd-filter-group">
                            {['TODOS', ...tiposDisponibles].map(t => (
                                <button key={t} className={`mvd-filter-chip ${tipoFiltro === t ? 'active' : ''}`} onClick={() => setTipoFiltro(t)}>
                                    {t === 'TODOS' ? 'Todos' : t === 'DIRECTO' ? '⚡ Directo' : '🔄 Indirecto'}
                                </button>
                            ))}
                        </div>
                    )}
                    {tabHorario === 'semana' && (
                        <div className="mvd-filter-group">
                            <button className={`mvd-filter-chip ${diaSemana === null ? 'active' : ''}`} onClick={() => setDiaSemana(null)}>Todos</button>
                            {DIA_CORTO.map((d, i) => (
                                <button key={i} className={`mvd-filter-chip ${diaSemana === i ? 'active' : ''}`} onClick={() => setDiaSemana(diaSemana === i ? null : i)}>{d}</button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══ MATRIZ DE HORARIOS ══ */}
            <div className="mvd-schedule-container">
                {horariosTab.length === 0 ? (
                    <div className="mv-no-horarios">
                        <Bus size={32} />
                        <p>{tabHorario === 'hoy' ? 'No hay más salidas hoy' : 'No opera este día'}</p>
                    </div>
                ) : (
                    horariosAgrupados.map(grupo => (
                        <div key={grupo.key} className="mvd-period-group">
                            <div className="mvd-period-header">
                                <span className="mvd-period-label">{grupo.label}</span>
                                <span className="mvd-period-count">{grupo.items.length} salida{grupo.items.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="mvd-schedule-grid">
                                {grupo.items.map((h, idx) => {
                                    const globalIdx = horariosTab.indexOf(h);
                                    const yaPartio  = tabHorario === 'hoy' && minutosHasta(h.horaSalida) < 0;
                                    const esProximo = globalIdx === idxProximo;
                                    const minRest   = tabHorario === 'hoy' ? minutosHasta(h.horaSalida) : null;
                                    const esDirecto = (h.tipo || '').toUpperCase() === 'DIRECTO';
                                    const esInd     = (h.tipo || '').toUpperCase() === 'INDIRECTO';

                                    return (
                                        <div key={idx} className={`mvd-schedule-cell ${yaPartio ? 'pasado' : ''} ${esProximo ? 'proximo' : ''}`}>
                                            {esProximo && <div className="mvd-cell-badge-next">PRÓXIMO</div>}
                                            <div className="mvd-cell-departure">
                                                <span className="mvd-cell-time">{formatHora(h.horaSalida)}</span>
                                                {esInd && h.horaLlegada && (
                                                    <div className="mvd-cell-arrival">
                                                        <span className="mvd-cell-arrow-small">→</span>
                                                        <span className="mvd-cell-time-arr">{formatHora(h.horaLlegada)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mvd-cell-meta">
                                                <span className={`mvd-cell-tipo ${esDirecto ? 'directo' : esInd ? 'indirecto' : 'regular'}`}>
                                                    {esDirecto ? '⚡' : esInd ? '🔄' : '🚌'} {h.tipo || 'REGULAR'}
                                                </span>
                                                {tabHorario === 'semana' && (
                                                    <span className="mvd-cell-dias">{formatearRangoDia(h)}</span>
                                                )}
                                                {esProximo && minRest >= 0 && (
                                                    <span className="mvd-cell-countdown">{formatearTiempoRestante(minRest)}</span>
                                                )}
                                                {yaPartio && <span className="mvd-cell-salio">Salió</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {mapaAbierto && <BusMapModal ruta={ruta} onClose={() => setMapaAbierto(false)} />}
        </div>
    );
}
                   <span className="mv-dias-badge">
                                                {formatearRangoDia(h)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Botones de acción ── */}
            <div className="mv-detail-actions">
                <button
                    className="mv-btn-primary"
                    onClick={() => setMapaAbierto(true)}
                >
                    <MapPin size={18} /> VER EN MAPA
                </button>
            </div>

            {/* ── Modal de mapa con ruta ── */}
            {mapaAbierto && (
                <BusMapModal
                    ruta={ruta}
                    onClose={() => setMapaAbierto(false)}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
function PaginaBuses() {
    const navigate = useNavigate();

    const [rutas, setRutas]                     = useState([]);
    const [busqueda, setBusqueda]               = useState('');
    const [terminalActiva, setTerminalActiva]   = useState('Todas');
    const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
    const [tabPrincipal, setTabPrincipal]       = useState('buses'); // 'buses' | 'favoritos'
    const [loading, setLoading]                 = useState(true);
    const [error, setError]                     = useState(null);

    // Geolocalización
    const [ubicacion, setUbicacion]   = useState(null);       // { lat, lng }
    const [geoEstado, setGeoEstado]   = useState('idle');      // 'idle' | 'loading' | 'ok' | 'error'

    // Favoritos — almacenamiento LOCAL (no se envía al backend)
    const [favoritos, setFavoritos] = useState(() => {
        try { return JSON.parse(localStorage.getItem('favoritosRutas') || '[]'); }
        catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('favoritosRutas', JSON.stringify(favoritos));
    }, [favoritos]);

    const toggleFavorito = useCallback((rutaId, e) => {
        e?.stopPropagation();
        // Normalizar a string para evitar discrepancias number vs string
        const id = String(rutaId);
        setFavoritos(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    // Geolocalización: pedir permiso al montar
    useEffect(() => {
        if (!navigator.geolocation) { setGeoEstado('error'); return; }
        setGeoEstado('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoEstado('ok');
            },
            () => setGeoEstado('error'),
            { timeout: 8000, maximumAge: 60000 }
        );
    }, []);

    // Auto-seleccionar la terminal más cercana cuando llega el GPS (solo si está en 'Todas')
    useEffect(() => {
        if (!ubicacion || rutas.length === 0 || terminalActiva !== 'Todas') return;
        let nearest = null;
        let minDist = Infinity;
        rutas.forEach(r => {
            if (r.lugarOrigen?.latitud && r.lugarOrigen?.nombre) {
                const d = haversineKm(ubicacion.lat, ubicacion.lng,
                    r.lugarOrigen.latitud, r.lugarOrigen.longitud);
                if (d < minDist) { minDist = d; nearest = r.lugarOrigen.nombre; }
            }
        });
        if (nearest) setTerminalActiva(nearest);
    }, [ubicacion, rutas]); // eslint-disable-line react-hooks/exhaustive-deps

    // Cargar rutas
    useEffect(() => {
        axiosPrivate.get('/ruta-transporte')
            .then(res => setRutas(res.data))
            .catch(err => { console.error(err); setError('No se pudieron cargar las rutas.'); })
            .finally(() => setLoading(false));
    }, []);



    // Mapa de coordenadas por nombre de terminal
    const terminalCoordsMap = useMemo(() => {
        const m = {};
        rutas.forEach(r => {
            if (r.lugarOrigen?.nombre && r.lugarOrigen.latitud) {
                m[r.lugarOrigen.nombre] = {
                    lat: r.lugarOrigen.latitud,
                    lng: r.lugarOrigen.longitud
                };
            }
        });
        return m;
    }, [rutas]);

    // Terminales únicas — ordenadas por cercanía si GPS disponible
    const terminales = useMemo(() => {
        const nombres = [...new Set(rutas.map(r => r.lugarOrigen?.nombre).filter(Boolean))];
        if (!ubicacion) return ['Todas', ...nombres];
        const sorted = nombres.sort((a, b) => {
            const ca = terminalCoordsMap[a], cb = terminalCoordsMap[b];
            if (!ca) return 1; if (!cb) return -1;
            return haversineKm(ubicacion.lat, ubicacion.lng, ca.lat, ca.lng)
                 - haversineKm(ubicacion.lat, ubicacion.lng, cb.lat, cb.lng);
        });
        return ['Todas', ...sorted];
    }, [rutas, ubicacion, terminalCoordsMap]);

    // Rutas filtradas
    const rutasFiltradas = useMemo(() => {
        const q = busqueda.toLowerCase();
        const base = tabPrincipal === 'favoritos'
            ? rutas.filter(r => favoritos.includes(String(r.id)))
            : rutas;
        return base.filter(r => {
            const p      = parsearParadas(r);
            const origen = p[0];
            const dest   = p[p.length - 1];
            const matchQ = !q ||
                (r.nombre || '').toLowerCase().includes(q) ||
                origen.toLowerCase().includes(q) ||
                dest.toLowerCase().includes(q) ||
                (r.operador?.nombre || '').toLowerCase().includes(q) ||
                p.some(stop => stop.toLowerCase().includes(q));
            const matchT = terminalActiva === 'Todas' || r.lugarOrigen?.nombre === terminalActiva;
            return matchQ && matchT;
        });
    }, [rutas, busqueda, terminalActiva, tabPrincipal, favoritos]);

    // ── Pantalla de carga ──
    if (loading) return (
        <div className="app-wrapper immersive-layout buses-page">
            <Navbar />
            <div className="buses-loading"><div className="buses-spinner"></div><p>Cargando rutas...</p></div>
        </div>
    );

    if (error) return (
        <div className="app-wrapper immersive-layout buses-page">
            <Navbar />
            <div className="buses-error"><p>{error}</p><button className="buses-retry" onClick={() => window.location.reload()}>Reintentar</button></div>
        </div>
    );

    // ── Vista detalle ──
    if (rutaSeleccionada) return (
        <div className="app-wrapper immersive-layout buses-page">
            <RutaDetalle
                ruta={rutaSeleccionada}
                esFavorito={favoritos.includes(String(rutaSeleccionada.id))}
                onToggleFavorito={toggleFavorito}
                onVolver={() => setRutaSeleccionada(null)}
            />
            <BusesBottomBar
                tab={tabPrincipal}
                setTab={setTabPrincipal}
                rutaSeleccionada={rutaSeleccionada}
                setRutaSeleccionada={setRutaSeleccionada}
            />
        </div>
    );

    // ── Vista lista ──
    return (
        <div className="app-wrapper immersive-layout buses-page">
            <Navbar />

            <div className="mv-main-content">
                {/* Hero + reloj */}
                <div className="mv-hero">
                    <div>
                        <h1 className="mv-hero-title">
                            {tabPrincipal === 'favoritos' ? 'Mis Rutas' : 'Próximos Buses'}
                        </h1>
                        <p className="mv-hero-sub">
                            {tabPrincipal === 'favoritos'
                                ? 'Tus rutas guardadas'
                                : geoEstado === 'ok'
                                    ? '📍 Ubicación activa · Terminales ordenadas por cercanía'
                                    : geoEstado === 'loading'
                                        ? '⏳ Obteniendo tu ubicación...'
                                        : 'Salidas en tiempo real · Filtrá por terminal'}
                        </p>
                    </div>
                    <RelojVivo />
                </div>

                {/* Buscador */}
                <div className="mv-search-box">
                    <Search size={17} className="mv-search-icon" />
                    <input
                        type="text"
                        className="mv-search-input"
                        placeholder="¿A dónde vas?"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <button className="mv-clear-btn" onClick={() => setBusqueda('')}>✕</button>
                    )}
                </div>

                {/* Chips de terminal */}
                {tabPrincipal !== 'favoritos' && (
                    <div className="mv-chips">
                        {terminales.map(t => {
                            const coords = t !== 'Todas' ? terminalCoordsMap[t] : null;
                            const dist = coords && ubicacion
                                ? haversineKm(ubicacion.lat, ubicacion.lng, coords.lat, coords.lng)
                                : null;
                            return (
                                <button
                                    key={t}
                                    className={`mv-chip ${terminalActiva === t ? 'active' : ''}`}
                                    onClick={() => setTerminalActiva(t)}
                                >
                                    {t === 'Todas' ? (
                                        <>{geoEstado === 'error'
                                            ? <Navigation size={12} style={{ opacity: 0.4 }} />
                                            : null} Todas</>
                                    ) : t}
                                    {dist !== null && (
                                        <span className="mv-chip-dist">
                                            {dist < 1
                                                ? `${Math.round(dist * 1000)}m`
                                                : `${dist.toFixed(1)}km`}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Lista de rutas */}
                <div className="mv-routes-list">
                    {rutasFiltradas.length === 0 ? (
                        <div className="mv-empty">
                            <Bus size={40} />
                            <p>{tabPrincipal === 'favoritos' ? 'No tenés rutas guardadas aún.' : 'No se encontraron rutas.'}</p>
                        </div>
                    ) : (
                        rutasFiltradas.map(ruta => (
                            <RutaCard
                                key={ruta.id}
                                ruta={ruta}
                                onSelect={setRutaSeleccionada}
                                esFavorito={favoritos.includes(String(ruta.id))}
                                onToggleFavorito={toggleFavorito}
                            />
                        ))
                    )}
                </div>
            </div>

            <BusesBottomBar
                tab={tabPrincipal}
                setTab={setTabPrincipal}
                rutaSeleccionada={rutaSeleccionada}
                setRutaSeleccionada={setRutaSeleccionada}
            />
        </div>
    );
}



// ═══════════════════════════════════════════════════════════
// Bottom Tab Bar
// ═══════════════════════════════════════════════════════════
function BusesBottomBar({ tab, setTab, rutaSeleccionada, setRutaSeleccionada }) {
    return (
        <nav className="buses-bottom-bar">
            <button
                className={`bbar-tab ${tab === 'buses' && !rutaSeleccionada ? 'active' : ''}`}
                onClick={() => { setRutaSeleccionada(null); setTab('buses'); }}
            >
                <Bus size={22} />
                <span>Rutas</span>
            </button>
            <button
                className={`bbar-tab ${!!rutaSeleccionada ? 'active' : ''}`}
                onClick={() => {
                    // Si hay ruta seleccionada, permanece en el detalle (ya está activo)
                    // Si no hay ruta, no hace nada visualmente: mostrar tip
                    if (!rutaSeleccionada) return;
                }}
                style={{ opacity: rutaSeleccionada ? 1 : 0.35, cursor: rutaSeleccionada ? 'pointer' : 'not-allowed' }}
            >
                <Clock size={22} />
                <span>Horarios</span>
            </button>
            <button
                className={`bbar-tab ${tab === 'favoritos' ? 'active' : ''}`}
                onClick={() => { setRutaSeleccionada(null); setTab('favoritos'); }}
            >
                <Star size={22} />
                <span>Favoritos</span>
            </button>
        </nav>
    );
}

export default PaginaBuses;