// ============================================================
// PaginaNoticias.jsx — PuertoInforma
// B-I4: UI completa lista para conectar al backend
// Por ahora carga noticias de ejemplo; cuando el backend
// tenga GET /noticia, solo hay que descomentar el fetch.
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import {
    ArrowLeft, Search, Newspaper, CalendarDays,
    Megaphone, Waves, Ship, Star, ExternalLink, Clock
} from 'lucide-react';
import '../styles/Noticias.css';
import Navbar from './Navbar';

// ── Fetch desde backend ──
import { axiosPrivate } from '../api/axios';

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
    const [categoriaActiva, setCategoriaActiva] = useState('Todas');
    const [busqueda, setBusqueda] = useState('');
    const [noticias, setNoticias] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosPrivate.get('/noticia')
            .then(res => {
                setNoticias(res.data);
            })
            .catch(err => {
                console.error("Error cargando noticias:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

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
        <div className="app-wrapper immersive-layout noticias-page">

            <Navbar />



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


            </div>
        </div>
    );
}

export default PaginaNoticias;
