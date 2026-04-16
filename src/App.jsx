import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles/Index.css';

// API
import api from './api/axios';

// Componentes
import MiniCard from './components/MiniCard';
import Navbar         from './components/Navbar';
import FilterPanel    from './components/FilterPanel';
import PlaceModal     from './components/PlaceModal';
import StarRating     from './components/StarRating';
import PaginaPerfil   from './components/PaginaPerfil';
import Login          from './components/Login';
import Registro       from './components/Registro';
import PaginaBuses    from './components/PaginaBuses';
import AuthCallback   from './components/AuthCallback';
import PaginaNoticias from './components/PaginaNoticias';
import PaginaFerry    from './components/PaginaFerry';

const CENTER = { lat: 9.976, lng: -84.833 };

function RutaProtegida({ children }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

function MapaView() {
    const [map,            setMap           ] = useState(null);
    const [markers,        setMarkers       ] = useState({});
    const [allPlaces,      setAllPlaces     ] = useState([]);
    const [categories,     setCategories    ] = useState([]);
    const [selectedPlace,  setSelectedPlace ] = useState(null);
    const [showFilters,    setShowFilters   ] = useState(false);
    const [activeChip,     setActiveChip    ] = useState("");
    const [searchQuery,    setSearchQuery   ] = useState("");
    const [filterCat,      setFilterCat     ] = useState("");
    const [loading,        setLoading       ] = useState(true);
    const [error,          setError         ] = useState(null);
    const [previewPlace,   setPreviewPlace  ] = useState(null);
    const [mapaVisible,    setMapaVisible   ] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);

    const mapRef       = useRef(null);
    const markersLayer = useRef(L.layerGroup());

    // ── 1. Fetch lugares ──────────────────────────────────────
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

    // ── 2. Inicializar mapa ──────────────────────────────────
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

    // ── 3. Sugerencias de búsqueda (autocompletado) ──
    const suggestions = useMemo(() => {
        if (!searchQuery.trim() || allPlaces.length === 0) return [];
        const queryLower = searchQuery.toLowerCase();
        // Filtrar lugares que contengan el texto, limitar a 5
        return allPlaces
            .filter(p => p.nombre.toLowerCase().includes(queryLower))
            .slice(0, 5)
            .map(p => p.nombre);
    }, [allPlaces, searchQuery]);

    // ── 4. Filtrar lugares con useMemo ──
    const filteredPlaces = useMemo(() => {
        if (allPlaces.length === 0) return [];
        return allPlaces.filter(p => {
            const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesChip   = activeChip ? p.categoria?.id === activeChip : true;
            const matchesCat    = filterCat  ? p.categoria?.id === Number(filterCat) : true;
            return matchesSearch && matchesChip && matchesCat;
        });
    }, [allPlaces, searchQuery, activeChip, filterCat]);

    // ── 5. Actualizar marcadores ──
    useEffect(() => {
        if (!map || filteredPlaces.length === 0) return;
        
        markersLayer.current.clearLayers();
        const defaultIcon = L.divIcon({
            className: '',
            html: `<div style="width:28px;height:28px;background:#E8621A;border:3px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(232,98,26,0.7);"></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -32]
        });

        const newMarkers = {};
        filteredPlaces.forEach(p => {
            const m = L.marker([p.latitud, p.longitud], { icon: defaultIcon })
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

    // ── 6. Manejadores ──
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

    return (
        <div className="app-wrapper">
            <Navbar
                onSearch={setSearchQuery}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onOpenAbout={() => setShowAboutModal(true)}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
            />

            <FilterPanel
                visible={showFilters}
                filterCat={filterCat}
                filterRating={0}
                onSetCat={setFilterCat}
                onSetRating={() => {}}
                onClear={handleClearFilters}
                onClose={() => setShowFilters(false)}
            />

            <div className="categories-container">
                {categories.map(c => (
                    <div
                        key={c.id}
                        className={`category-chip ${activeChip === c.id ? 'active' : ''}`}
                        onClick={() => setActiveChip(activeChip === c.id ? "" : c.id)}
                    >
                        {c.nombre}
                    </div>
                ))}
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
                    {error && <p style={{ color: '#ef5350', textAlign: 'center', marginTop: '2rem' }}>{error}</p>}

                    {!loading && !error && (
                        <div className="results-list">
                            {filteredPlaces.length > 0 ? (
                                filteredPlaces.map(p => (
                                    <div key={p.id} className="result-card" onClick={() => handlePlaceClick(p)}>
                                        {p.urlImagen ? (
                                            <img src={p.urlImagen} alt={p.nombre} className="result-card-img" />
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

            {/* MODAL ACERCA DE */}
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
            <Route path="/login"         element={<Login />} />
            <Route path="/registro"      element={<Registro />} />
            <Route path="/noticias"      element={<PaginaNoticias />} />
            <Route path="/ferry"         element={<PaginaFerry />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<RutaProtegida><MapaView /></RutaProtegida>} />
            <Route path="/perfil" element={<RutaProtegida><PaginaPerfil /></RutaProtegida>} />
            <Route path="/buses" element={<RutaProtegida><PaginaBuses /></RutaProtegida>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;