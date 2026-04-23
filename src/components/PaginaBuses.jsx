import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../api/axios';
import {
    Search, Bus, Bookmark, BookmarkCheck,
    Share2, MapPin, ArrowLeft, Clock, Star,
    ChevronRight, CalendarDays, ListFilter
} from 'lucide-react';
import '../styles/Buses.css';

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
            siguiente: null,
            estado: 'manana',
            hayHoy: false
        };
    }
    return { label: 'Sin salidas próximas', hora: '--:--', siguiente: null, estado: 'sinSalidas', hayHoy: false };
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
function RutaCard({ ruta, onSelect, esFavorito, onToggleFavorito }) {
    const paradas = useMemo(() => parsearParadas(ruta), [ruta]);
    const resumen = useMemo(() => resumenProximaSalida(Array.isArray(ruta.horarios) ? ruta.horarios : []), [ruta.horarios]);
    const origen  = paradas[0];
    const destino = paradas[paradas.length - 1];

    return (
        <div className={`mv-route-card ${resumen.estado}`} onClick={() => onSelect(ruta)}>
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
            <p className="mv-operator">{ruta.operador?.nombre || '—'}</p>

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
                    </>
                ) : (
                    <div className="mv-no-buses">
                        <span>{resumen.label}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Nombres cortos de días para la UI (orden JS: 0=Dom)
const DIA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Formatea el rango de días de un horario de manera legible
function formatearRangoDia(h) {
    const ini = normalizarDia(h.diaInicio);
    const fin = normalizarDia(h.diaFin);
    const idxIni = DIA_NUM[ini] ?? -1;
    const idxFin = DIA_NUM[fin] ?? -1;
    if (idxIni === -1) return '';
    if (ini === fin) return `Solo ${DIA_CORTO[idxIni]}`;
    if ((ini === 'LUNES' && fin === 'DOMINGO') || (ini === 'DOMINGO' && fin === 'SABADO'))
        return 'Todos los días';
    return `${DIA_CORTO[idxIni]} – ${DIA_CORTO[idxFin]}`;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE: Vista de detalle — estilo Move It
// ═══════════════════════════════════════════════════════════
function RutaDetalle({ ruta, esFavorito, onToggleFavorito, onCompartir, onVolver }) {
    const [tabHorario,  setTabHorario]  = useState('hoy');   // 'hoy' | 'manana' | 'semana'
    const [tipoFiltro,  setTipoFiltro]  = useState('TODOS'); // 'TODOS' | 'DIRECTO' | 'INDIRECTO'
    const [diaSemana,   setDiaSemana]   = useState(null);    // 0-6 | null = todos
    const hoy    = new Date().getDay();
    const manana = (hoy + 1) % 7;

    // Reset diaSemana al cambiar de tab
    const cambiarTab = (tab) => {
        setTabHorario(tab);
        if (tab !== 'semana') setDiaSemana(null);
    };

    // Paradas parseadas correctamente (string JSON → array)
    const paradas = useMemo(() => parsearParadas(ruta), [ruta]);

    // Tipos disponibles en esta ruta
    const tiposDisponibles = useMemo(() => {
        if (!ruta.horarios?.length) return [];
        return [...new Set(ruta.horarios.map(h => (h.tipo || 'REGULAR').toUpperCase()))];
    }, [ruta.horarios]);

    // Horarios según tab + filtros
    const horariosTab = useMemo(() => {
        if (!ruta.horarios?.length) return [];
        let base = ruta.horarios;

        // Filtro por día de la semana
        if (tabHorario === 'hoy') {
            base = base.filter(h => correEnDia(h, hoy));
        } else if (tabHorario === 'manana') {
            base = base.filter(h => correEnDia(h, manana));
        } else if (tabHorario === 'semana' && diaSemana !== null) {
            base = base.filter(h => correEnDia(h, diaSemana));
        }

        // Filtro por tipo (DIRECTO / INDIRECTO)
        if (tipoFiltro !== 'TODOS') {
            base = base.filter(h => (h.tipo || '').toUpperCase() === tipoFiltro);
        }

        return [...base].sort((a, b) => horaEnMinutos(a.horaSalida) - horaEnMinutos(b.horaSalida));
    }, [ruta.horarios, tabHorario, hoy, manana, diaSemana, tipoFiltro]);

    // Índice del próximo bus (solo en tab HOY)
    const idxProximo = tabHorario === 'hoy'
        ? horariosTab.findIndex(h => minutosHasta(h.horaSalida) >= 0)
        : -1;

    return (
        <div className="mv-detail-page">
            {/* ── Navbar compacto ── */}
            <header className="mv-detail-nav">
                <button className="mv-back-btn" onClick={onVolver}>
                    <ArrowLeft size={20} />
                    <span>Rutas</span>
                </button>
                <button className="mv-fav-btn" onClick={e => onToggleFavorito(ruta.id, e)}>
                    {esFavorito ? <BookmarkCheck size={20} color="#E8621A" /> : <Bookmark size={20} />}
                </button>
            </header>

            {/* ── Info principal ── */}
            <div className="mv-detail-hero">
                <h2 className="mv-detail-title">
                    {paradas[0]} <span className="mv-arrow-big">→</span> {paradas[paradas.length - 1]}
                </h2>
                <p className="mv-detail-operator">{ruta.operador?.nombre}</p>
                <div className="mv-detail-pills">
                    <span className="mv-pill">{ruta.nombre}</span>
                    {ruta.frecuencia && <span className="mv-pill">{ruta.frecuencia}</span>}
                    {ruta.duracion && <span className="mv-pill">⏱ {ruta.duracion}</span>}
                </div>
            </div>

            {/* ── Recorrido visual ── */}
            <div className="mv-recorrido">
                <p className="mv-section-label">📍 RECORRIDO</p>
                <div className="mv-stops-track">
                    {paradas.map((p, i) => (
                        <div key={i} className="mv-stop-item">
                            <div className={`mv-stop-dot ${i === 0 ? 'origin' : i === paradas.length - 1 ? 'destination' : ''}`}></div>
                            {i < paradas.length - 1 && <div className="mv-stop-line"></div>}
                            <span className="mv-stop-name">{p}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tabs de horario ── */}
            <div className="mv-horario-section">
                <div className="mv-tabs">
                    <button className={`mv-tab ${tabHorario === 'hoy' ? 'active' : ''}`} onClick={() => cambiarTab('hoy')}>
                        <Clock size={14} /> HOY
                    </button>
                    <button className={`mv-tab ${tabHorario === 'manana' ? 'active' : ''}`} onClick={() => cambiarTab('manana')}>
                        <CalendarDays size={14} /> MAÑANA
                    </button>
                    <button className={`mv-tab ${tabHorario === 'semana' ? 'active' : ''}`} onClick={() => cambiarTab('semana')}>
                        <ListFilter size={14} /> SEMANA
                    </button>
                </div>

                {/* Filtros de tipo (si hay más de uno disponible) */}
                {tiposDisponibles.length > 1 && (
                    <div className="mv-tipo-chips">
                        {['TODOS', ...tiposDisponibles].map(t => (
                            <button
                                key={t}
                                className={`mv-tipo-chip ${tipoFiltro === t ? 'active' : ''}`}
                                onClick={() => setTipoFiltro(t)}
                            >
                                {t === 'TODOS' ? 'Todos' : t.charAt(0) + t.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                )}

                {/* Selector de día (solo en tab SEMANA) */}
                {tabHorario === 'semana' && (
                    <div className="mv-dia-selector">
                        <button
                            className={`mv-dia-chip ${diaSemana === null ? 'active' : ''}`}
                            onClick={() => setDiaSemana(null)}
                        >Todos</button>
                        {DIA_CORTO.map((d, i) => (
                            <button
                                key={i}
                                className={`mv-dia-chip ${diaSemana === i ? 'active' : ''}`}
                                onClick={() => setDiaSemana(diaSemana === i ? null : i)}
                            >{d}</button>
                        ))}
                    </div>
                )}

                {/* Lista de horarios */}
                <div className="mv-horarios-list">
                    {horariosTab.length === 0 ? (
                        <div className="mv-no-horarios">
                            <Bus size={32} />
                            <p>{tabHorario === 'hoy' ? 'No hay más salidas hoy' : 'No opera este día'}</p>
                        </div>
                    ) : (
                        horariosTab.map((h, idx) => {
                            const yaPartio = tabHorario === 'hoy' && minutosHasta(h.horaSalida) < 0;
                            const esProximo = idx === idxProximo;
                            const minRestantes = tabHorario === 'hoy' ? minutosHasta(h.horaSalida) : null;
                            const esDirecto = (h.tipo || '').toUpperCase() === 'DIRECTO';

                            return (
                                <div key={idx} className={`mv-horario-row ${yaPartio ? 'pasado' : ''} ${esProximo ? 'proximo' : ''}`}>
                                    {/* Indicador lateral */}
                                    <div className="mv-horario-indicator">
                                        {esProximo && <div className="mv-proximo-dot"></div>}
                                        {yaPartio && <div className="mv-pasado-dot"></div>}
                                        {!esProximo && !yaPartio && <div className="mv-normal-dot"></div>}
                                    </div>

                                    {/* Hora */}
                                    <div className="mv-horario-hora">
                                        <span className="mv-hora-big">{formatHora(h.horaSalida)}</span>
                                        {esProximo && minRestantes >= 0 && (
                                            <span className="mv-proximo-badge">
                                                {formatearTiempoRestante(minRestantes)}
                                            </span>
                                        )}
                                        {yaPartio && <span className="mv-pasado-label">Salió</span>}
                                    </div>

                                    {/* Info adicional */}
                                    <div className="mv-horario-info">
                                        <span className={`mv-tipo-badge ${esDirecto ? 'directo' : 'regular'}`}>
                                            {h.tipo || 'REGULAR'}
                                        </span>
                                        {tabHorario === 'semana' && (
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
                <button className="mv-btn-primary" onClick={() => { /* navigate to map */ }}>
                    <MapPin size={18} /> VER EN MAPA
                </button>
                <button className="mv-btn-secondary" onClick={() => onCompartir(ruta)}>
                    <Share2 size={18} /> COMPARTIR
                </button>
            </div>
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

    // Cargar rutas
    useEffect(() => {
        axiosPrivate.get('/ruta-transporte')
            .then(res => setRutas(res.data))
            .catch(err => { console.error(err); setError('No se pudieron cargar las rutas.'); })
            .finally(() => setLoading(false));
    }, []);

    // Compartir ruta
    const handleCompartir = useCallback((ruta) => {
        const p = parsearParadas(ruta);
        const origen  = p[0];
        const destino = p[p.length - 1];
        const txt = `🚌 ${origen} → ${destino}\n${ruta.operador?.nombre || ''}\n⏱ ${ruta.duracion || '—'} | ${ruta.frecuencia || '—'}\nPuertoInforma`;
        if (navigator.share) navigator.share({ title: ruta.nombre, text: txt }).catch(() => {});
        else navigator.clipboard?.writeText(txt);
    }, []);

    // Terminales únicas para chips
    const terminales = useMemo(() =>
        ['Todas', ...new Set(rutas.map(r => r.lugarOrigen?.nombre).filter(Boolean))],
        [rutas]
    );

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
        <div className="buses-page">
            <BusesNavbar onBack={() => navigate('/')} />
            <div className="buses-loading"><div className="buses-spinner"></div><p>Cargando rutas...</p></div>
        </div>
    );

    if (error) return (
        <div className="buses-page">
            <BusesNavbar onBack={() => navigate('/')} />
            <div className="buses-error"><p>{error}</p><button className="buses-retry" onClick={() => window.location.reload()}>Reintentar</button></div>
        </div>
    );

    // ── Vista detalle ──
    if (rutaSeleccionada) return (
        <div className="buses-page">
            <RutaDetalle
                ruta={rutaSeleccionada}
                esFavorito={favoritos.includes(rutaSeleccionada.id)}
                onToggleFavorito={toggleFavorito}
                onCompartir={handleCompartir}
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
        <div className="buses-page">
            <BusesNavbar onBack={() => navigate('/')} />

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
                                : 'Salidas en tiempo real desde tu posición'}
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
                        {terminales.map(t => (
                            <button
                                key={t}
                                className={`mv-chip ${terminalActiva === t ? 'active' : ''}`}
                                onClick={() => setTerminalActiva(t)}
                            >
                                {t === 'Todas' ? 'Todas' : t}
                            </button>
                        ))}
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
                                esFavorito={favoritos.includes(ruta.id)}
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
// Navbar de la sección buses
// ═══════════════════════════════════════════════════════════
function BusesNavbar({ onBack }) {
    return (
        <header className="buses-navbar">
            <button className="buses-nav-back" onClick={onBack}>
                <ArrowLeft size={20} />
            </button>
            <span className="buses-nav-logo">
                <span className="logo-orange">Puerto</span> Informa
            </span>
        </header>
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
                    // Si hay ruta seleccionada, muestra su detalle; si no, no hace nada
                    if (!rutaSeleccionada) return;
                }}
                style={{ opacity: rutaSeleccionada ? 1 : 0.35 }}
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