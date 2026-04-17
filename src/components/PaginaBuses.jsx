import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../api/axios';
import '../styles/Buses.css';

// -------------------------------------------------------
// Mini mapa SVG — dibuja la ruta con curvas y paradas
// -------------------------------------------------------
function MiniMapaSVG({ ruta }) {
    let paradas = [];
    if (ruta.paradas) {
        try {
            paradas = typeof ruta.paradas === 'string' ? JSON.parse(ruta.paradas) : ruta.paradas;
        } catch(e) {
            paradas = [ruta.lugarOrigen?.nombre || 'Origen', ruta.lugarDestino?.nombre || 'Destino'];
        }
    } else {
        paradas = [ruta.lugarOrigen?.nombre || 'Origen', ruta.lugarDestino?.nombre || 'Destino'];
    }

    const total = paradas.length;
    const W = 320;
    const H = 80;
    const margen = 40;
    const paso = (W - margen * 2) / (total - 1);

    const puntos = paradas.map((_, i) => ({
        x: margen + i * paso,
        y: i % 2 === 0 ? H / 2 - 10 : H / 2 + 10,
    }));

    const buildPath = () => {
        if (puntos.length < 2) return '';
        let d = `M ${puntos[0].x} ${puntos[0].y}`;
        for (let i = 1; i < puntos.length; i++) {
            const prev = puntos[i - 1];
            const curr = puntos[i];
            const cx = (prev.x + curr.x) / 2;
            d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
        }
        return d;
    };

    return (
        <div className="minimapa-svg-wrapper">
            <div className="minimapa-badge-ruta">
                <span className={`buses-badge ${ruta.tipo?.toLowerCase() === 'expreso' ? 'expreso' : 'normal'}`}>
                    {ruta.nombre}
                </span>
                <span className="minimapa-titulo-ruta">
                    {ruta.lugarOrigen?.nombre || '?'} → {ruta.lugarDestino?.nombre || '?'}
                </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="minimapa-svg" preserveAspectRatio="xMidYMid meet">
                <path d={buildPath()} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" strokeLinecap="round" />
                <path d={buildPath()} fill="none" stroke="#E8621A" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                {puntos.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r={i === 0 || i === total - 1 ? 7 : 5}
                                fill={i === 0 ? '#E8621A' : i === total - 1 ? '#aaaaaa' : '#2D2D2D'}
                                stroke={i === 0 ? '#E8621A' : '#ffffff'} strokeWidth="1.5" />
                        {(i === 0 || i === total - 1) && <circle cx={p.x} cy={p.y} r="3" fill="#fff" />}
                    </g>
                ))}
                {puntos.map((p, i) => (
                    <text key={`label-${i}`} x={p.x} y={i % 2 === 0 ? p.y - 14 : p.y + 20}
                          textAnchor="middle" fontSize="8"
                          fill={i === 0 ? '#E8621A' : 'rgba(255,255,255,0.7)'}
                          fontWeight={i === 0 || i === total - 1 ? '700' : '400'}>
                        {paradas[i]}
                    </text>
                ))}
            </svg>
            <div className="minimapa-info-rapida">
                <span>⏱ {ruta.duracion || '—'}</span>
                <span>🕐 {ruta.frecuencia || '—'}</span>
                <span>🚌 {ruta.operador?.nombre || '—'}</span>
            </div>
        </div>
    );
}

// -------------------------------------------------------
// Componente principal
// -------------------------------------------------------
function PaginaBuses() {
    const navigate = useNavigate();

    const [rutas, setRutas] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [destinoActivo, setDestinoActivo] = useState('Todas');
    const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar rutas desde el backend
    useEffect(() => {
        const cargarRutas = async () => {
            try {
                const response = await axiosPrivate.get('/ruta-transporte');
                setRutas(response.data);
            } catch (err) {
                console.error(err);
                setError('No se pudieron cargar las rutas. Intentá de nuevo.');
            } finally {
                setLoading(false);
            }
        };
        cargarRutas();
    }, []);

    // Destinos únicos (para los chips)
    const destinosUnicos = ['Todas', ...new Set(rutas.map(r => r.lugarDestino?.nombre).filter(Boolean))];

    // Filtrar rutas según búsqueda y destino
    const rutasFiltradas = rutas.filter(r => {
        const destinoNombre = r.lugarDestino?.nombre || '';
        const origenNombre = r.lugarOrigen?.nombre || '';
        const matchBusqueda = destinoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                              origenNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                              r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                              (r.operador?.nombre || '').toLowerCase().includes(busqueda.toLowerCase());
        const matchDestino = destinoActivo === 'Todas' || destinoNombre === destinoActivo;
        return matchBusqueda && matchDestino;
    });

    // Agrupar rutas por destino (para las tabs cuando no hay búsqueda)
    const rutasPorDestino = destinosUnicos.filter(d => d !== 'Todas').reduce((acc, dest) => {
        acc[dest] = rutas.filter(r => r.lugarDestino?.nombre === dest);
        return acc;
    }, {});

    // Formatear rango de días (ej: "LUNES" -> "LUN", "LUNES-VIERNES" -> "LUN-VIE")
    const formatearRangoDias = (inicio, fin) => {
        const abrev = (dia) => dia.substring(0, 3).toUpperCase();
        if (inicio === fin) return abrev(inicio);
        return `${abrev(inicio)}-${abrev(fin)}`;
    };

    // Estados de carga y error
    if (loading) {
        return (
            <div className="buses-page" style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Cargando rutas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="buses-page" style={{ textAlign: 'center', padding: '2rem', color: '#ef5350' }}>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#E8621A', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="buses-page">
            {/* ── Header ── */}
            <header className="buses-header">
                <button className="buses-back-btn" onClick={() => navigate('/')}>⬅️</button>
                <h1 className="buses-title">Rutas de Puntarenas</h1>
            </header>

            {/* ── Buscador ── */}
            <div className="buses-search-container">
                <span className="buses-search-icon">🔍</span>
                <input
                    type="text"
                    className="buses-search-input"
                    placeholder="¿A dónde vas?..."
                    value={busqueda}
                    onChange={(e) => {
                        setBusqueda(e.target.value);
                        setRutaSeleccionada(null);
                    }}
                />
            </div>

            {/* ── Chips de destino ── */}
            <div className="buses-chips-container">
                {destinosUnicos.map(dest => (
                    <button
                        key={dest}
                        className={`buses-chip ${destinoActivo === dest ? 'active' : ''}`}
                        onClick={() => {
                            setDestinoActivo(dest);
                            setRutaSeleccionada(null);
                        }}
                    >
                        {dest}
                    </button>
                ))}
            </div>

            {/* ── Mini mapa SVG — se muestra al seleccionar una ruta ── */}
            {rutaSeleccionada && (
                <div className="buses-mini-mapa-container">
                    <MiniMapaSVG ruta={rutaSeleccionada} />
                    <button
                        className="minimapa-cerrar-btn"
                        onClick={() => setRutaSeleccionada(null)}
                    >
                        ✕ Cerrar mapa
                    </button>
                </div>
            )}

            {/* ── Tabs por destino (solo cuando no hay búsqueda y el chip es "Todas") ── */}
            {destinoActivo === 'Todas' && !busqueda && (
                <div className="buses-tabs-destino">
                    {Object.keys(rutasPorDestino).map(dest => (
                        <button
                            key={dest}
                            className="buses-tab-destino"
                            onClick={() => {
                                setDestinoActivo(dest);
                                setRutaSeleccionada(null);
                            }}
                        >
                            {dest}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Lista de rutas ── */}
            <div className="buses-lista">
                {rutasFiltradas.length > 0 ? (
                    rutasFiltradas.map(ruta => (
                        <div
                            key={ruta.id}
                            className={`buses-card ${rutaSeleccionada?.id === ruta.id ? 'seleccionada' : ''}`}
                            onClick={() => setRutaSeleccionada(
                                rutaSeleccionada?.id === ruta.id ? null : ruta
                            )}
                        >
                            {/* Fila superior */}
                            <div className="buses-card-header">
                                <div className="buses-card-left">
                                    <span className={`buses-badge ${ruta.tipo?.toLowerCase() === 'expreso' ? 'expreso' : 'normal'}`}>
                                        {ruta.nombre}
                                    </span>
                                    <div className="buses-card-info">
                                        <span className="buses-card-ruta">
                                            {ruta.lugarOrigen?.nombre || '?'} → {ruta.lugarDestino?.nombre || '?'}
                                        </span>
                                        {ruta.tipo?.toLowerCase() === 'expreso' && (
                                            <span className="buses-expreso-tag">Expreso</span>
                                        )}
                                    </div>
                                </div>
                                <span className="buses-proxima">{ruta.proxima || '—'} ↗</span>
                            </div>

                            {/* ── SUB‑APARTADO DE HORARIOS (mejorado) ── */}
                            <div className="buses-horarios">
                                {ruta.horarios && ruta.horarios.length > 0 ? (
                                    ruta.horarios.slice(0, 6).map((h, i) => (
                                        <div key={i} className="buses-horario-item">
                                            <span className="buses-hora">
                                                {h.horaSalida?.substring(0, 5) || h.horaSalida || '--:--'}
                                            </span>
                                            <span className="buses-hora-rango">
                                                {formatearRangoDias(h.diaInicio, h.diaFin)}
                                            </span>
                                            <span className={`buses-tipo-servicio ${h.tipo?.toLowerCase() === 'directo' ? 'directo' : 'indirecto'}`}>
                                                {h.tipo === 'DIRECTO' ? '🚌 Directo' : '🔄 Indirecto'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <span className="buses-hora">Sin horarios registrados</span>
                                )}
                                {ruta.horarios?.length > 6 && (
                                    <span className="buses-hora-mas">
                                        +{ruta.horarios.length - 6} más
                                    </span>
                                )}
                            </div>

                            {/* Meta info */}
                            <div className="buses-card-meta">
                                <span className="buses-meta-item">🕐 {ruta.frecuencia || '—'}</span>
                                <span className="buses-meta-item">⏱ {ruta.duracion || '—'}</span>
                                <span className="buses-meta-item">🚌 {ruta.operador?.nombre || '—'}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="buses-sin-resultados">
                        No se encontraron rutas para "{busqueda || destinoActivo}".
                    </p>
                )}
            </div>
        </div>
    );
}

export default PaginaBuses;