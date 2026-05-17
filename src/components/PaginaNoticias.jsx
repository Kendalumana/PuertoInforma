// ============================================================
// PaginaNoticias.jsx — PuertoInforma
// B-I4: UI completa lista para conectar al backend
// Por ahora carga noticias de ejemplo; cuando el backend
// tenga GET /noticia, solo hay que descomentar el fetch.
// ============================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Newspaper, CalendarDays,
    Megaphone, Waves, Ship, Star, ExternalLink, Clock
} from 'lucide-react';
import '../styles/Noticias.css';

// ── Datos de ejemplo (reemplazar con fetch cuando el backend tenga /noticia) ──
const NOTICIAS_EJEMPLO = [
    {
        id: 1,
        categoria: 'Eventos',
        titulo: 'Festival del Mar — Puntarenas 2025',
        descripcion: 'El tradicional festival del mar regresa este año con música en vivo, feria gastronómica y actividades para toda la familia en el malecón.',
        fecha: '2025-07-15',
        imagen: null,
        destacado: true,
        icono: '🎉',
        color: '#E8621A',
    },
    {
        id: 2,
        categoria: 'Noticias',
        titulo: 'Nueva ruta de buses hacia La Punta inaugurada',
        descripcion: 'TRACOPA inaugura una nueva ruta directa desde la Terminal Central hasta La Punta con 8 salidas diarias a partir del próximo lunes.',
        fecha: '2025-06-28',
        imagen: null,
        destacado: false,
        icono: '🚌',
        color: '#2196F3',
    },
    {
        id: 3,
        categoria: 'Ferry',
        titulo: 'Cambio de horarios del Ferry a Paquera',
        descripcion: 'A partir del 1 de julio, el ferry añade una salida nocturna a las 21:30 hrs. Se recomienda reservar espacio con anticipación para vehículos.',
        fecha: '2025-06-20',
        imagen: null,
        destacado: false,
        icono: '⛵',
        color: '#4CAF50',
    },
    {
        id: 4,
        categoria: 'Turismo',
        titulo: 'Temporada de avistamiento de delfines',
        descripcion: 'La temporada de avistamiento de delfines y ballenas jorobadas inicia en julio. Tours disponibles desde el muelle principal con guías certificados.',
        fecha: '2025-06-18',
        imagen: null,
        destacado: false,
        icono: '🐬',
        color: '#9C27B0',
    },
    {
        id: 5,
        categoria: 'Noticias',
        titulo: 'Mejoras al malecón de Puntarenas',
        descripcion: 'La municipalidad anuncia inversión de ₡800 millones para la renovación del malecón turístico, incluyendo nuevos parques y zonas de descanso.',
        fecha: '2025-06-10',
        imagen: null,
        destacado: false,
        icono: '🏗️',
        color: '#FF9800',
    },
    {
        id: 6,
        categoria: 'Eventos',
        titulo: 'Feria de Artesanos del Puerto — Junio',
        descripcion: 'Cada domingo de junio, artesanos locales exhiben sus obras en la plaza central. Entrada libre. Parking disponible en avenida primera.',
        fecha: '2025-06-07',
        imagen: null,
        destacado: false,
        icono: '🎨',
        color: '#E91E63',
    },
];

const CATEGORIAS = ['Todas', 'Eventos', 'Noticias', 'Ferry', 'Turismo'];

const CATEGORIA_ICONOS = {
    Eventos: <CalendarDays size={14} />,
    Noticias: <Megaphone size={14} />,
    Ferry: <Ship size={14} />,
    Turismo: <Waves size={14} />,
};

function formatearFecha(isoStr) {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString('es-CR', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

// ── Card grande (destacada) ──────────────────────────────
function NoticiasHeroCard({ noticia }) {
    return (
        <div className="noticias-hero-card" style={{ '--card-color': noticia.color }}>
            <div className="nhc-emoji">{noticia.icono}</div>
            <div className="nhc-body">
                <span className="nhc-categoria">{noticia.categoria}</span>
                <h2 className="nhc-titulo">{noticia.titulo}</h2>
                <p className="nhc-desc">{noticia.descripcion}</p>
                <div className="nhc-footer">
                    <span className="nhc-fecha">
                        <Clock size={12} /> {formatearFecha(noticia.fecha)}
                    </span>
                    <span className="nhc-badge">
                        <Star size={12} /> Destacado
                    </span>
                </div>
            </div>
        </div>
    );
}

// ── Card normal ──────────────────────────────────────────
function NoticiaCard({ noticia }) {
    return (
        <div className="noticia-card" style={{ '--card-color': noticia.color }}>
            <div className="nc-icono">{noticia.icono}</div>
            <div className="nc-body">
                <div className="nc-header">
                    <span className="nc-cat">{noticia.categoria}</span>
                    <span className="nc-fecha">
                        <Clock size={11} /> {formatearFecha(noticia.fecha)}
                    </span>
                </div>
                <h3 className="nc-titulo">{noticia.titulo}</h3>
                <p className="nc-desc">{noticia.descripcion}</p>
            </div>
        </div>
    );
}

// ── Skeleton ─────────────────────────────────────────────
function NoticiaSkeleton() {
    return (
        <div className="noticia-card skeleton-noticia">
            <div className="nc-sk-icono" />
            <div className="nc-body" style={{ gap: '0.5rem' }}>
                <div className="nc-sk-line short" />
                <div className="nc-sk-line wide" />
                <div className="nc-sk-line medium" />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
function PaginaNoticias() {
    const navigate = useNavigate();
    const [categoriaActiva, setCategoriaActiva] = useState('Todas');
    const [busqueda, setBusqueda] = useState('');
    // Cuando el backend tenga /noticia, cambiar a useState([]) + useEffect fetch
    const [noticias] = useState(NOTICIAS_EJEMPLO);
    const [loading] = useState(false);

    const destacada = noticias.find(n => n.destacado);

    const noticiasFiltradas = useMemo(() => {
        return noticias.filter(n => {
            if (n.destacado) return false; // la destacada va aparte
            const matchCat = categoriaActiva === 'Todas' || n.categoria === categoriaActiva;
            const matchQ   = !busqueda.trim() ||
                n.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                n.descripcion.toLowerCase().includes(busqueda.toLowerCase());
            return matchCat && matchQ;
        });
    }, [noticias, categoriaActiva, busqueda]);

    return (
        <div className="noticias-page">

            {/* Header */}
            <header className="noticias-header-page">
                <button className="noticias-back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="noticias-header-titles">
                    <h1 className="noticias-page-titulo">Noticias y Eventos</h1>
                    <p className="noticias-header-sub">Puntarenas al día</p>
                </div>
                <Newspaper size={22} className="noticias-header-icon" />
            </header>

            {/* Buscador */}
            <div className="noticias-search-wrapper">
                <Search size={16} className="noticias-search-icon" />
                <input
                    type="text"
                    className="noticias-search-input"
                    placeholder="Buscar noticias o eventos..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
                {busqueda && (
                    <button
                        className="noticias-search-clear"
                        onClick={() => setBusqueda('')}
                    >✕</button>
                )}
            </div>

            {/* Tabs de categoría */}
            <div className="noticias-cats">
                {CATEGORIAS.map(cat => (
                    <button
                        key={cat}
                        className={`noticias-cat-btn ${categoriaActiva === cat ? 'active' : ''}`}
                        onClick={() => setCategoriaActiva(cat)}
                    >
                        {cat !== 'Todas' && CATEGORIA_ICONOS[cat]}
                        {cat}
                    </button>
                ))}
            </div>

            <div className="noticias-body">

                {/* Noticia destacada */}
                {loading ? (
                    <div className="noticia-card skeleton-noticia hero-skeleton">
                        <div className="nc-sk-icono large" />
                        <div className="nc-body" style={{ gap: '0.7rem' }}>
                            <div className="nc-sk-line short" />
                            <div className="nc-sk-line wide" />
                            <div className="nc-sk-line medium" />
                            <div className="nc-sk-line short" />
                        </div>
                    </div>
                ) : destacada && (categoriaActiva === 'Todas' || categoriaActiva === destacada.categoria) && !busqueda ? (
                    <NoticiasHeroCard noticia={destacada} />
                ) : null}

                {/* Lista de noticias */}
                <div className="noticias-lista">
                    {loading ? (
                        [1, 2, 3, 4].map(i => <NoticiaSkeleton key={i} />)
                    ) : noticiasFiltradas.length === 0 ? (
                        <div className="noticias-empty">
                            <span style={{ fontSize: '2.5rem' }}>🔍</span>
                            <p>No se encontraron noticias{categoriaActiva !== 'Todas' ? ` en "${categoriaActiva}"` : ''}.</p>
                        </div>
                    ) : (
                        noticiasFiltradas.map(n => (
                            <NoticiaCard key={n.id} noticia={n} />
                        ))
                    )}
                </div>

                {/* Aviso backend */}
                <div className="noticias-backend-hint">
                    <ExternalLink size={13} />
                    Contenido de ejemplo — se conectará al backend cuando el endpoint esté disponible.
                </div>

            </div>
        </div>
    );
}

export default PaginaNoticias;