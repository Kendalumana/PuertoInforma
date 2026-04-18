import { useEffect, useState, useRef, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles/Index.css';

// API
import api from './api/axios';

// Componentes (StarRating eliminado)
import MiniCard from './components/MiniCard';
import Navbar from './components/Navbar';
import PlaceModal from './components/PlaceModal';
import PaginaPerfil from './components/PaginaPerfil';
import Login from './components/Login';
import Registro from './components/Registro';
import PaginaBuses from './components/PaginaBuses';
import AuthCallback from './components/AuthCallback';
import PaginaNoticias from './components/PaginaNoticias';
import PaginaFerry from './components/PaginaFerry';

const CENTER = { lat: 9.976, lng: -84.833 };

const categoryColors = {
    1: '#9C27B0', 2: '#4CAF50', 3: '#FFB300',
    4: '#795548', 5: '#FF5722', 6: '#2196F3',
    7: '#F44336', 8: '#b49e84',
};

function RutaProtegida({ children }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

function MapaView() {
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState({});
    const [allPlaces, setAllPlaces] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [activeChip, setActiveChip] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCat, setFilterCat] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewPlace, setPreviewPlace] = useState(null);
    const [mapaVisible, setMapaVisible] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [showFavorites, setShowFavorites] = useState(false);

    const mapRef = useRef(null);
    const markersLayer = useRef(L.layerGroup());

    useEffect(() => {
        const saved = localStorage.getItem('favoritos');
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('favoritos', JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        api.get('/lugar')
            .then(res => {
                const lugares = res.data;
                setAllPlaces(lugares);
                const cats = [];
                const seen = new Set();
                lugares.forEach(l => {
                    if (l.categoria && !seen.has(l.categoria.id)) {
                        seen.add(l.categoria.id);
                        cats.push(l.categoria);
                    }
                });
                setCategories(cats);
            })
            .catch(() => setError('No se pudieron cargar los lugares. Intentá de nuevo.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;
        const instance = L.map(mapRef.current).setView([CENTER.lat, CENTER.lng], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(instance);
        markersLayer.current.addTo(instance);
        setMap(instance);
        return () => instance.remove();
    }, []);

    const suggestions = useMemo(() => {
        if (!searchQuery.trim() || allPlaces.length === 0) return [];
        const queryLower = searchQuery.toLowerCase();
        return allPlaces
            .filter(p => p.nombre.toLowerCase().includes(queryLower))
            .slice(0, 5)
            .map(p => p.nombre);
    }, [allPlaces, searchQuery]);

    const filteredPlaces = useMemo(() => {
        if (allPlaces.length === 0) return [];
        let result = allPlaces.filter(p => {
            const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesChip = activeChip ? p.categoria?.id === activeChip : true;
            const matchesCat = filterCat ? p.categoria?.id === Number(filterCat) : true;
            return matchesSearch && matchesChip && matchesCat;
        });
        if (showFavorites) {
            result = result.filter(p => favorites.includes(p.id));
        }
        return result;
    }, [allPlaces, searchQuery, activeChip, filterCat, favorites, showFavorites]);

    useEffect(() => {
        if (!map || filteredPlaces.length === 0) return;
        markersLayer.current.clearLayers();
        const newMarkers = {};
        filteredPlaces.forEach(p => {
            const color = categoryColors[p.categoria?.id] || '#E8621A';
            const icon = L.divIcon({
                className: '',
                html: `<div style="width:28px;height:28px;background:${color};border:3px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px ${color}99;"></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -32]
            });
            const m = L.marker([p.latitud, p.longitud], { icon })
                .bindPopup(`<b>${p.nombre}</b>`);
            m.addTo(markersLayer.current);
            m.on('click', () => {
                map.flyTo([p.latitud, p.longitud], 16);
                m.openPopup();
                setPreviewPlace(p);
                setSelectedPlace(null);
            });
            newMarkers[p.id] = m;
        });
        setMarkers(newMarkers);
    }, [map, filteredPlaces]);

    const handlePlaceClick = (p) => {
        if (map) {
            map.flyTo([p.latitud, p.longitud], 16);
            markers[p.id]?.openPopup();
        }
        setSelectedPlace(p);
    };

    const handleClearFilters = () => {
        setFilterCat("");
        setActiveChip("");
        setShowFavorites(false);
        setSearchQuery("");
    };

    const handleToggleMapa = () => {
        const nuevoEstado = !mapaVisible;
        setMapaVisible(nuevoEstado);
        if (nuevoEstado) {
            setTimeout(() => map?.invalidateSize(), 350);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion);
    };

    const toggleFavorite = (placeId, e) => {
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(placeId)
                ? prev.filter(id => id !== placeId)
                : [...prev, placeId]
        );
    };

    return (
        <div className="app-wrapper">
            <Navbar
                onSearch={setSearchQuery}
                onOpenAbout={() => setShowAboutModal(true)}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
            />

            <div className="categories-container">
                {categories.map(c => (
                    <div
                        key={c.id}
                        className={`category-chip ${activeChip === c.id ? 'active' : ''}`}
                        onClick={() => setActiveChip(activeChip === c.id ? "" : c.id)}
                    >
                        <span className="chip-dot" style={{ background: categoryColors[c.id] || '#E8621A' }}></span>
                        {c.nombre}
                    </div>
                ))}
                <div
                    className={`category-chip ${showFavorites ? 'active' : ''}`}
                    onClick={() => setShowFavorites(!showFavorites)}
                    style={{ background: showFavorites ? '#E8621A' : 'transparent' }}
                >
                    ❤️ Favoritos
                </div>

                {/* Botón Limpiar filtros */}
                {(activeChip || showFavorites || searchQuery) && (
                    <div className="category-chip chip-clear" onClick={handleClearFilters}>
                        ✕ Limpiar
                    </div>
                )}
            </div>

            <button
                className={`map-toggle-btn ${mapaVisible ? 'map-abierto' : ''}`}
                onClick={handleToggleMapa}
            >
                🗺️ {mapaVisible ? 'Ocultar mapa' : 'Ver mapa'}
                <span>▼</span>
            </button>

            <main className="main-container">
                <div className={`map-container ${mapaVisible ? 'map-visible' : ''}`}>
                    <div id="map" ref={mapRef}></div>
                    <button
                        className="recenter-btn"
                        onClick={() => map?.setView([CENTER.lat, CENTER.lng], 14)}
                    >
                        📍 Centrar
                    </button>
                </div>

                <aside className="results-container">
                    <div className="results-header">
                        <h2 className="results-title">Comercios encontrados</h2>
                        <span className="results-count">{filteredPlaces.length}</span>
                    </div>

                    {loading && <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: '2rem' }}>Cargando lugares...</p>}
                    
                    {/* ✅ Reintentar carga de lugares */}
                    {error && (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <p style={{ color: '#ef5350', marginBottom: '0.75rem' }}>{error}</p>
                            <button 
                                onClick={() => window.location.reload()}
                                style={{ background: '#ef5350', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                🔄 Reintentar
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="results-list">
                            {filteredPlaces.length > 0 ? (
                                filteredPlaces.map(p => (
                                    <div key={p.id} className="result-card" onClick={() => handlePlaceClick(p)}>
                                        <div
                                            className={`favorite-icon ${favorites.includes(p.id) ? 'active' : ''}`}
                                            onClick={(e) => toggleFavorite(p.id, e)}
                                        >
                                            {favorites.includes(p.id) ? '❤️' : '🤍'}
                                        </div>
                                        {p.urlImagen ? (
                                            <img
                                                src={p.urlImagen}
                                                alt={p.nombre}
                                                className="result-card-img"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="result-card-img-placeholder">🏖️</div>
                                        )}
                                        <div className="result-card-body">
                                            <div className="result-card-top">
                                                <span className="result-name">{p.nombre}</span>
                                                {p.categoria && <span className="result-category">{p.categoria.nombre}</span>}
                                            </div>
                                            {p.descripcion && <p className="result-description">{p.descripcion}</p>}
                                            <div className="result-footer">
                                                <span className="result-points">🏆 {p.puntosQueOtorga} pts</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '2rem' }}>No se encontraron lugares.</p>
                            )}
                        </div>
                    )}
                </aside>
            </main>

            <MiniCard
                place={previewPlace}
                onVerMas={() => { setSelectedPlace(previewPlace); setPreviewPlace(null); }}
                onClose={() => setPreviewPlace(null)}
            />

            <PlaceModal
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
            />

            {showAboutModal && (
                <div
                    className="modal-overlay about-overlay"
                    onClick={() => setShowAboutModal(false)}
                    style={{ display: 'flex' }}
                >
                    <div className="modal-content about-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">📰 Acerca de PuertoInforma</h2>
                            <button className="close-modal" onClick={() => setShowAboutModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '1rem' }}>
                                PuertoInforma es un directorio interactivo de comercios, lugares culturales y servicios de Puntarenas, Costa Rica.
                            </p>
                            <h3 style={{ color: 'var(--naranja)', marginBottom: '0.5rem' }}>¿Sos dueño de un negocio?</h3>
                            <p>Contactanos para aparecer en nuestra plataforma.</p>
                            <div className="contact-form">
                                <div className="form-group">
                                    <input type="text" className="form-input" placeholder="Nombre del negocio / Servicio" />
                                    <input type="text" className="form-input" placeholder="Tu número de contacto" />
                                </div>
                                <button className="submit-btn">Enviar Información</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/noticias" element={<PaginaNoticias />} />
            <Route path="/ferry" element={<PaginaFerry />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<RutaProtegida><MapaView /></RutaProtegida>} />
            <Route path="/perfil" element={<RutaProtegida><PaginaPerfil /></RutaProtegida>} />
            <Route path="/buses" element={<RutaProtegida><PaginaBuses /></RutaProtegida>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;