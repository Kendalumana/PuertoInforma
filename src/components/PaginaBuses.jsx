import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Buses.css';

const RUTAS = [
    {
        id: 1,
        numero: 'Ruta 150',
        destino: 'San José',
        origen: 'Puntarenas',
        empresa: 'Transportes Puntarenas',
        duracion: '2h 30m',
        frecuencia: 'Cada 30 min',
        proxima: '05:30',
        horarios: ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
        paradas: ['Terminal', 'Barranca', 'Esparta', 'Orotina', 'San José'],
        tipo: 'normal',
    },
    {
        id: 2,
        numero: 'Ruta 155',
        destino: 'San José',
        origen: 'Puntarenas',
        empresa: 'TUAN',
        duracion: '2h',
        frecuencia: 'Expreso',
        proxima: '07:00',
        horarios: ['07:00', '11:00', '15:00', '18:00'],
        paradas: ['Terminal', 'San José'],
        tipo: 'expreso',
    },
    {
        id: 3,
        numero: 'Ruta 160',
        destino: 'Liberia',
        origen: 'Puntarenas',
        empresa: 'Transportes Liberia',
        duracion: '3h',
        frecuencia: 'Cada hora',
        proxima: '06:00',
        horarios: ['06:00', '08:00', '10:00', '13:00', '16:00'],
        paradas: ['Terminal', 'Cañas', 'Liberia'],
        tipo: 'normal',
    },
    {
        id: 4,
        numero: 'Ruta 170',
        destino: 'Jacó',
        origen: 'Puntarenas',
        empresa: 'Transportes Jacó',
        duracion: '1h 30m',
        frecuencia: 'Cada 2h',
        proxima: '08:00',
        horarios: ['08:00', '10:00', '13:00', '16:00', '18:00'],
        paradas: ['Terminal', 'Jacó Centro'],
        tipo: 'normal',
    },
    {
        id: 5,
        numero: 'Ruta 180',
        destino: 'Nicoya',
        origen: 'Puntarenas',
        empresa: 'Empresa Alfaro',
        duracion: '2h 45m',
        frecuencia: 'Cada 3h',
        proxima: '06:30',
        horarios: ['06:30', '09:30', '12:30', '15:30'],
        paradas: ['Terminal', 'Ferry', 'Nicoya'],
        tipo: 'normal',
    },
];

const DESTINOS = ['Todas', ...new Set(RUTAS.map(r => r.destino))];

// -------------------------------------------------------
// Mini mapa SVG — dibuja la ruta con curvas y paradas
// -------------------------------------------------------
function MiniMapaSVG({ ruta }) {
    const paradas = ruta.paradas;
    const total   = paradas.length;

    // Distribución horizontal de los nodos
    const W = 320;
    const H = 80;
    const margen = 40;
    const paso   = (W - margen * 2) / (total - 1);

    // Posición X e Y de cada parada
    // Y alterna ligeramente para dar sensación de curva orgánica
    const puntos = paradas.map((_, i) => ({
        x: margen + i * paso,
        y: i % 2 === 0 ? H / 2 - 10 : H / 2 + 10,
    }));

    // Construye un path SVG con curvas suaves entre puntos
    const buildPath = () => {
        if (puntos.length < 2) return '';
        let d = `M ${puntos[0].x} ${puntos[0].y}`;
        for (let i = 1; i < puntos.length; i++) {
            const prev = puntos[i - 1];
            const curr = puntos[i];
            const cx   = (prev.x + curr.x) / 2;
            d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
        }
        return d;
    };

    return (
        <div className="minimapa-svg-wrapper">

            {/* Badge de la ruta arriba a la izquierda */}
            <div className="minimapa-badge-ruta">
                <span className={`buses-badge ${ruta.tipo}`}>{ruta.numero}</span>
                <span className="minimapa-titulo-ruta">
                    {ruta.origen} → {ruta.destino}
                </span>
            </div>

            {/* SVG del mapa */}
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="minimapa-svg"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Línea de fondo gris (sombra de ruta) */}
                <path
                    d={buildPath()}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="4"
                    strokeLinecap="round"
                />

                {/* Línea principal de la ruta — naranja */}
                <path
                    d={buildPath()}
                    fill="none"
                    stroke="#E8621A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="0"
                    opacity="0.85"
                />

                {/* Nodos de cada parada */}
                {puntos.map((p, i) => (
                    <g key={i}>
                        {/* Círculo exterior */}
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={i === 0 || i === total - 1 ? 7 : 5}
                            fill={i === 0 ? '#E8621A' : i === total - 1 ? '#aaaaaa' : '#2D2D2D'}
                            stroke={i === 0 ? '#E8621A' : '#ffffff'}
                            strokeWidth="1.5"
                        />
                        {/* Punto interior blanco */}
                        {(i === 0 || i === total - 1) && (
                            <circle cx={p.x} cy={p.y} r="3" fill="#fff" />
                        )}
                    </g>
                ))}

                {/* Etiquetas de las paradas */}
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

            {/* Info rápida debajo del mapa */}
            <div className="minimapa-info-rapida">
                <span>⏱ {ruta.duracion}</span>
                <span>🕐 {ruta.frecuencia}</span>
                <span>🚌 {ruta.empresa}</span>
            </div>
        </div>
    );
}

// -------------------------------------------------------
// Componente principal
// -------------------------------------------------------
function PaginaBuses() {
    const navigate = useNavigate();

    const [busqueda,         setBusqueda        ] = useState('');
    const [destinoActivo,    setDestinoActivo   ] = useState('Todas');
    const [rutaSeleccionada, setRutaSeleccionada] = useState(null);

    const rutasFiltradas = RUTAS.filter(r => {
        const matchBusqueda = r.destino.toLowerCase().includes(busqueda.toLowerCase()) ||
                              r.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
                              r.empresa.toLowerCase().includes(busqueda.toLowerCase());
        const matchDestino  = destinoActivo === 'Todas' || r.destino === destinoActivo;
        return matchBusqueda && matchDestino;
    });

    const rutasPorDestino = DESTINOS.filter(d => d !== 'Todas').reduce((acc, dest) => {
        acc[dest] = RUTAS.filter(r => r.destino === dest);
        return acc;
    }, {});

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
                        setRutaSeleccionada(null); // FIX: limpia el mapa al buscar
                    }}
                />
            </div>

            {/* ── Chips de destino ── */}
            <div className="buses-chips-container">
                {DESTINOS.map(dest => (
                    <button
                        key={dest}
                        className={`buses-chip ${destinoActivo === dest ? 'active' : ''}`}
                        onClick={() => {
                            setDestinoActivo(dest);
                            setRutaSeleccionada(null); // FIX: limpia el mapa al cambiar chip
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

            {/* ── Tabs por destino ── */}
            {destinoActivo === 'Todas' && !busqueda && (
                <div className="buses-tabs-destino">
                    {Object.keys(rutasPorDestino).map(dest => (
                        <button
                            key={dest}
                            className="buses-tab-destino"
                            onClick={() => {
                                setDestinoActivo(dest);
                                setRutaSeleccionada(null); // FIX: limpia el mapa al cambiar tab
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
                                    <span className={`buses-badge ${ruta.tipo}`}>
                                        {ruta.numero}
                                    </span>
                                    <div className="buses-card-info">
                                        <span className="buses-card-ruta">
                                            {ruta.origen} → {ruta.destino}
                                        </span>
                                        {ruta.tipo === 'expreso' && (
                                            <span className="buses-expreso-tag">Expreso</span>
                                        )}
                                    </div>
                                </div>
                                <span className="buses-proxima">{ruta.proxima} ↗</span>
                            </div>

                            {/* Horarios */}
                            <div className="buses-horarios">
                                {ruta.horarios.slice(0, 5).map((h, i) => (
                                    <span
                                        key={i}
                                        className={`buses-hora ${i === 0 ? 'proxima-hora' : ''}`}
                                    >
                                        {h}
                                    </span>
                                ))}
                                {ruta.horarios.length > 5 && (
                                    <span className="buses-hora-mas">
                                        +{ruta.horarios.length - 5} más
                                    </span>
                                )}
                            </div>

                            {/* Meta info */}
                            <div className="buses-card-meta">
                                <span className="buses-meta-item">🕐 {ruta.frecuencia}</span>
                                <span className="buses-meta-item">⏱ {ruta.duracion}</span>
                                <span className="buses-meta-item">🚌 {ruta.empresa}</span>
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