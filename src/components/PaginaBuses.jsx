import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../api/axios';
import {
    Search, Bus, ChevronRight, Bookmark, BookmarkCheck,
    Share2, MapPin, ArrowLeft, Clock, Repeat, Route, Star
} from 'lucide-react';
import '../styles/Buses.css';

// ─────────────────────────────────────────────
// Timeline vertical de paradas
// ─────────────────────────────────────────────
function ParadasTimeline({ ruta }) {
    let paradas = [];
    if (ruta.paradas) {
        try {
            paradas = typeof ruta.paradas === 'string'
                ? JSON.parse(ruta.paradas)
                : ruta.paradas;
        } catch {
            paradas = [ruta.lugarOrigen?.nombre || 'Origen', ruta.lugarDestino?.nombre || 'Destino'];
        }
    } else {
        paradas = [ruta.lugarOrigen?.nombre || 'Origen', ruta.lugarDestino?.nombre || 'Destino'];
    }

    return (
        <div className="paradas-section">
            <div className="buses-section-title">
                <Route size={18} color="#E8621A" />
                <h3>Paradas Principales</h3>
            </div>
            <div className="paradas-card">
                <div className="paradas-timeline">
                    {paradas.map((parada, i) => (
                        <div key={i} className="parada-item">
                            <div className="parada-indicator">
                                <div className={`parada-dot ${i === 0 ? 'origin' : i === paradas.length - 1 ? 'destination' : 'stop'}`}></div>
                                {i < paradas.length - 1 && <div className="parada-line"></div>}
                            </div>
                            <div className="parada-info">
                                <span className="parada-name">{parada}</span>
                                <span className="parada-sub">
                                    {i === 0 ? 'Salida / Terminal' : i === paradas.length - 1 ? 'Destino Final' : 'Parada de Tránsito'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Tabla de horarios
// ─────────────────────────────────────────────
function HorariosTable({ ruta, formatearRangoDias }) {
    return (
        <div className="horarios-section">
            <div className="horarios-header-row">
                <div className="buses-section-title">
                    <Clock size={18} color="#E8621A" />
                    <h3>Horario Semanal Completo</h3>
                </div>
                {ruta.frecuencia && (
                    <span className="frecuencia-badge">Frecuencia: {ruta.frecuencia}</span>
                )}
            </div>
            {ruta.horarios && ruta.horarios.length > 0 ? (
                <div className="horarios-table-card">
                    <div className="horarios-head">
                        <span>HORA SALIDA</span>
                        <span>DÍAS APLICABLES</span>
                        <span>TIPO SERVICIO</span>
                    </div>
                    {ruta.horarios.map((h, idx) => {
                        const esProximo = idx === 0; // primera fila como destacada
                        const esDirecto = h.tipo === 'DIRECTO';
                        return (
                            <div key={idx} className={`horarios-row ${esProximo ? 'proximo' : ''}`}>
                                <span className="hrow-time">
                                    {h.horaSalida?.substring(0, 5) || '--:--'}
                                    {esProximo && <span className="proximo-label">PRÓXIMO BUS</span>}
                                </span>
                                <span className="hrow-days">
                                    {formatearRangoDias(h.diaInicio, h.diaFin)}
                                </span>
                                <span className={`hrow-type ${esDirecto ? 'directo' : 'regular'}`}>
                                    {esDirecto ? 'DIRECTO' : 'REGULAR'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="no-horarios">No hay horarios registrados para esta ruta.</p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
function PaginaBuses() {
    const navigate = useNavigate();

    const [rutas, setRutas] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [terminalActiva, setTerminalActiva] = useState('Todas');
    const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
    const [tabActiva, setTabActiva] = useState('buses'); // 'buses' | 'horarios' | 'rutas' | 'favoritos'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Favoritos de rutas — almacenamiento LOCAL (no se envía al backend)
    const [favoritosRutas, setFavoritosRutas] = useState(() => {
        try { return JSON.parse(localStorage.getItem('favoritosRutas') || '[]'); }
        catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('favoritosRutas', JSON.stringify(favoritosRutas));
    }, [favoritosRutas]);

    const toggleFavorito = useCallback((rutaId, e) => {
        e?.stopPropagation();
        setFavoritosRutas(prev =>
            prev.includes(rutaId) ? prev.filter(id => id !== rutaId) : [...prev, rutaId]
        );
    }, []);

    // Cargar rutas desde el backend
    useEffect(() => {
        axiosPrivate.get('/ruta-transporte')
            .then(res => setRutas(res.data))
            .catch(err => { console.error(err); setError('No se pudieron cargar las rutas.'); })
            .finally(() => setLoading(false));
    }, []);

    // Terminales únicas (lugarOrigen = terminal de salida)
    const terminales = ['Todas', ...new Set(rutas.map(r => r.lugarOrigen?.nombre).filter(Boolean))];

    // Rutas filtradas
    const rutasFiltradas = rutas.filter(r => {
        const q = busqueda.toLowerCase();
        const matchQ = !q ||
            (r.nombre || '').toLowerCase().includes(q) ||
            (r.lugarOrigen?.nombre || '').toLowerCase().includes(q) ||
            (r.lugarDestino?.nombre || '').toLowerCase().includes(q) ||
            (r.operador?.nombre || '').toLowerCase().includes(q);
        const matchT = terminalActiva === 'Todas' || r.lugarOrigen?.nombre === terminalActiva;
        return matchQ && matchT;
    });

    // Favoritos filtrados para su tab
    const rutasFavoritas = rutas.filter(r => favoritosRutas.includes(r.id));

    const formatearRangoDias = (inicio, fin) => {
        if (!inicio) return '—';
        const abrev = d => d.substring(0, 1).toUpperCase() + '-' + d.substring(1, 2).toUpperCase();
        const MAP = { LUNES: 'L', MARTES: 'M', MIÉRCOLES: 'X', JUEVES: 'J', VIERNES: 'V', SÁBADO: 'S', DOMINGO: 'D' };
        const a = MAP[inicio?.toUpperCase()] || inicio?.substring(0, 1);
        const b = MAP[fin?.toUpperCase()] || fin?.substring(0, 1);
        return inicio === fin ? a : `${a}-${b}`;
    };

    const abrirDetalle = (ruta) => {
        setRutaSeleccionada(ruta);
        setTabActiva('horarios');
    };

    const handleCompartir = useCallback((ruta) => {
        const txt = `🚌 ${ruta.nombre}: ${ruta.lugarOrigen?.nombre} → ${ruta.lugarDestino?.nombre}\n⏱ ${ruta.duracion || '—'} | 🕐 ${ruta.frecuencia || '—'}\nPuertoInforma`;
        if (navigator.share) navigator.share({ title: ruta.nombre, text: txt }).catch(() => {});
        else navigator.clipboard?.writeText(txt);
    }, []);

    // ── Loading / Error ──
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

    const featuredRuta = tabActiva !== 'favoritos'
        ? (rutasFiltradas[0] || null)
        : (rutasFavoritas[0] || null);
    const restRutas = tabActiva !== 'favoritos'
        ? rutasFiltradas.slice(1)
        : rutasFavoritas.slice(1);

    return (
        <div className="buses-page">
            <BusesNavbar onBack={() => { if (rutaSeleccionada) { setRutaSeleccionada(null); setTabActiva('buses'); } else navigate('/'); }} />

            {/* ══════════════════════════════════════
                VISTA DETALLE (cuando hay ruta seleccionada)
            ══════════════════════════════════════ */}
            {rutaSeleccionada ? (
                <div className="buses-detail-page">
                    {/* Hero */}
                    <div className="detail-hero">
                        <div className="detail-hero-bg"></div>
                        <div className="detail-hero-overlay"></div>
                        <div className="detail-hero-content">
                            <div className="detail-hero-top">
                                <span className="detail-route-badge">{rutaSeleccionada.nombre}</span>
                                <div className="detail-hero-pills-top">
                                    {rutaSeleccionada.duracion && (
                                        <div className="hero-pill">
                                            <span className="hero-pill-label">DURACIÓN</span>
                                            <span className="hero-pill-val">{rutaSeleccionada.duracion}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <h2 className="detail-hero-title">
                                {rutaSeleccionada.lugarOrigen?.nombre} – {rutaSeleccionada.lugarDestino?.nombre}
                            </h2>
                            <p className="detail-hero-operator">{rutaSeleccionada.operador?.nombre}</p>
                        </div>
                    </div>

                    {/* Contenido principal 2 columnas en desktop */}
                    <div className="detail-body-layout">
                        {/* Izquierda: horarios */}
                        <div className="detail-col-main">
                            <HorariosTable ruta={rutaSeleccionada} formatearRangoDias={formatearRangoDias} />
                        </div>

                        {/* Derecha: paradas + info */}
                        <div className="detail-col-side">
                            <ParadasTimeline ruta={rutaSeleccionada} />

                            <div className="info-a-bordo">
                                <div className="buses-section-title">
                                    <span>ℹ️</span>
                                    <h3>Información de Abordo</h3>
                                </div>
                                <div className="info-bordo-card">
                                    <div className="info-bordo-item">
                                        <Repeat size={16} color="#E8621A" />
                                        <span>Frecuencia: {rutaSeleccionada.frecuencia || '—'}</span>
                                    </div>
                                    <div className="info-bordo-item">
                                        <MapPin size={16} color="#E8621A" />
                                        <span>Terminal: {rutaSeleccionada.lugarOrigen?.nombre || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="detail-actions-bar">
                        <button className="detail-btn-primary" onClick={() => navigate('/')}>
                            <MapPin size={18} /> VER EN MAPA
                        </button>
                        <button className="detail-btn-secondary" onClick={() => handleCompartir(rutaSeleccionada)}>
                            <Share2 size={18} /> COMPARTIR
                        </button>
                    </div>
                </div>
            ) : (
                /* ══════════════════════════════════════
                   VISTA LISTA
                ══════════════════════════════════════ */
                <div className="buses-content">
                    {/* Hero */}
                    <section className="buses-hero">
                        <h1 className="buses-hero-title">Explora <span className="accent-italic">Tus Rutas</span></h1>
                        <p className="buses-hero-sub">Encuentra horarios, terminales y operadores para tu próximo viaje.</p>
                    </section>

                    {/* Búsqueda */}
                    <div className="buses-search-wrapper">
                        <Search size={17} className="buses-search-icon-svg" />
                        <input
                            type="text"
                            className="buses-search-input"
                            placeholder="Busca tu ruta..."
                            value={busqueda}
                            onChange={e => { setBusqueda(e.target.value); }}
                        />
                    </div>

                    {/* Chips terminales */}
                    {tabActiva !== 'favoritos' && (
                        <div className="buses-chips-scroll">
                            {terminales.map(t => (
                                <button key={t}
                                    className={`buses-chip ${terminalActiva === t ? 'active' : ''}`}
                                    onClick={() => setTerminalActiva(t)}
                                >
                                    {t === 'Todas' ? 'Todas las Terminales' : `Terminal ${t}`}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Featured card */}
                    {featuredRuta && (
                        <div className="buses-featured-card" onClick={() => abrirDetalle(featuredRuta)}>
                            <div className="featured-bg-gradient"></div>
                            <div className="featured-content">
                                <div className="featured-top-badges">
                                    <span className="badge-live">EN TIEMPO REAL</span>
                                    <span className="badge-terminal">Terminal {featuredRuta.lugarOrigen?.nombre || '—'}</span>
                                </div>
                                <h2 className="featured-title">{featuredRuta.nombre}</h2>
                                <div className="featured-meta-row">
                                    <span>🚌 {featuredRuta.operador?.nombre || '—'}</span>
                                    <span>🕐 {featuredRuta.frecuencia || '—'}</span>
                                </div>
                                <div className="featured-bottom-row">
                                    <div className="featured-next">
                                        <span className="fnext-label">PRÓXIMA SALIDA</span>
                                        <span className="fnext-time">{featuredRuta.proxima || '00:00'}</span>
                                    </div>
                                    <button className="featured-btn" onClick={e => { e.stopPropagation(); abrirDetalle(featuredRuta); }}>
                                        Ver Detalles <ChevronRight size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grid de rutas */}
                    <div className="buses-grid">
                        {restRutas.map(ruta => (
                            <div key={ruta.id} className="buses-route-card" onClick={() => abrirDetalle(ruta)}>
                                <div className="rcard-header">
                                    <div className="rcard-icon"><Bus size={18} /></div>
                                    {favoritosRutas.includes(ruta.id) && <span className="rcard-fav-tag">FAVORITO</span>}
                                </div>
                                <h3 className="rcard-name">
                                    {ruta.lugarOrigen?.nombre || '?'} – {ruta.lugarDestino?.nombre || '?'}
                                </h3>
                                <p className="rcard-operator">{ruta.operador?.nombre || '—'}</p>
                                <div className="rcard-info">
                                    <div className="rcard-row">
                                        <span className="rcard-label">Frecuencia</span>
                                        <span className="rcard-val">{ruta.frecuencia || '—'}</span>
                                    </div>
                                    <div className="rcard-row">
                                        <span className="rcard-label">Terminal</span>
                                        <span className="rcard-val">{ruta.lugarOrigen?.nombre || '—'}</span>
                                    </div>
                                </div>
                                <div className="rcard-footer">
                                    <div className="rcard-next">
                                        <span className="rcard-next-label">PRÓXIMA SALIDA</span>
                                        <span className="rcard-next-time">{ruta.proxima || '00:00'}</span>
                                    </div>
                                    <button className="rcard-bookmark" onClick={e => toggleFavorito(ruta.id, e)}>
                                        {favoritosRutas.includes(ruta.id)
                                            ? <BookmarkCheck size={18} color="#E8621A" />
                                            : <Bookmark size={18} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {!featuredRuta && restRutas.length === 0 && (
                            <p className="buses-no-results">
                                {tabActiva === 'favoritos'
                                    ? 'No tenés rutas favoritas aún.'
                                    : `No se encontraron rutas para "${busqueda || terminalActiva}".`
                                }
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                BOTTOM TAB BAR — Solo en esta sección
            ══════════════════════════════════════ */}
            <nav className="buses-bottom-bar">
                <button
                    className={`bbar-tab ${!rutaSeleccionada && tabActiva === 'buses' ? 'active' : ''}`}
                    onClick={() => { setRutaSeleccionada(null); setTabActiva('buses'); }}
                >
                    <Bus size={20} />
                    <span>BUSES</span>
                </button>
                <button
                    className={`bbar-tab ${rutaSeleccionada && tabActiva === 'horarios' ? 'active' : ''}`}
                    onClick={() => {
                        if (rutaSeleccionada) {
                            setTabActiva('horarios');
                        } else {
                            // Seleccionar primera ruta disponible si no hay ninguna
                            if (rutasFiltradas.length > 0) abrirDetalle(rutasFiltradas[0]);
                        }
                    }}
                >
                    <Clock size={20} />
                    <span>HORARIOS</span>
                </button>
                <button
                    className={`bbar-tab ${rutaSeleccionada && tabActiva === 'rutas' ? 'active' : ''}`}
                    onClick={() => {
                        if (rutaSeleccionada) {
                            setTabActiva('rutas');
                        } else {
                            if (rutasFiltradas.length > 0) abrirDetalle(rutasFiltradas[0]);
                        }
                    }}
                >
                    <Route size={20} />
                    <span>RUTAS</span>
                </button>
                <button
                    className={`bbar-tab ${tabActiva === 'favoritos' ? 'active' : ''}`}
                    onClick={() => { setRutaSeleccionada(null); setTabActiva('favoritos'); }}
                >
                    <Star size={20} />
                    <span>FAVORITOS</span>
                </button>
            </nav>
        </div>
    );
}

// ─────────────────────────────────────────────
// Navbar compacto para buses (sin iconos de usuario en mobile)
// ─────────────────────────────────────────────
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

export default PaginaBuses;