import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles/Index.css';

// API
import api from './api/axios';

// Componentes
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
    const [filteredPlaces, setFilteredPlaces] = useState([]);
    const [selectedPlace,  setSelectedPlace ] = useState(null);
    const [showFilters,    setShowFilters   ] = useState(false);
    const [activeChip,     setActiveChip    ] = useState("");
    const [searchQuery,    setSearchQuery   ] = useState("");
    const [filterCat,      setFilterCat     ] = useState("");
    const [loading,        setLoading       ] = useState(true);
    const [error,          setError         ] = useState(null);
    const [mapaVisible,    setMapaVisible   ] = useState(false); // oculto por defecto en móvil

    const mapRef       = useRef(null);
    const markersLayer = useRef(L.layerGroup());

    // ── 1. Fetch lugares ──────────────────────────────────────
    useEffect(() => {
        api.get('/lugar')
            .then(res => {
                const lugares = res.data;
                setAllPlaces(lugares);
                setFilteredPlaces(lugares);

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

    // ── 2. Inicializar mapa — fondo oscuro CartoDB ────────────
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

    // ── 3. Aplicar filtros ────────────────────────────────────
    useEffect(() => {
        if (!map || allPlaces.length === 0) return;
        applyFilters();
    }, [searchQuery, activeChip, filterCat, map, allPlaces]);

    const applyFilters = () => {
        const list = allPlaces.filter(p => {
            const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesChip   = activeChip ? p.categoria?.id === activeChip : true;
            const matchesCat    = filterCat  ? p.categoria?.id === Number(filterCat) : true;
            return matchesSearch && matchesChip && matchesCat;
        });
        setFilteredPlaces(list);
        updateMarkers(list);
    };

    // ── 4. Marcadores — pines naranjas custom ─────────────────
    const updateMarkers = (list) => {
        markersLayer.current.clearLayers();

        const defaultIcon = L.divIcon({
            className: '',
            html: `
                <div style="
                    width: 28px;
                    height: 28px;
                    background: #E8621A;
                    border: 3px solid #ffffff;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    box-shadow: 0 2px 8px rgba(232,98,26,0.7);
                "></div>
            `,
            iconSize:    [28, 28],
            iconAnchor:  [14, 28],
            popupAnchor: [0, -32]
        });

        const newMarkers = {};
        list.forEach(p => {
            const m = L.marker([p.latitud, p.longitud], { icon: defaultIcon })
                       .bindPopup(`<b>${p.nombre}</b>`);
            m.addTo(markersLayer.current);
            m.on('click', () => setSelectedPlace(p));
            newMarkers[p.id] = m;
        });
        setMarkers(newMarkers);
    };

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

    // ── Toggle mapa móvil — invalida tamaño para que Leaflet re-renderice ──
    const handleToggleMapa = () => {
        const nuevoEstado = !mapaVisible;
        setMapaVisible(nuevoEstado);
        if (nuevoEstado) {
            setTimeout(() => map?.invalidateSize(), 350);
        }
    };

    return (
        <div className="app-wrapper">
            <Navbar
                onSearch={setSearchQuery}
                onToggleFilters={() => setShowFilters(!showFilters)}
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

            {/* Chips de categorías */}
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

            {/* Botón toggle mapa — solo visible en móvil, oculto en desktop */}
            <button
                className={`map-toggle-btn ${mapaVisible ? 'map-abierto' : ''}`}
                onClick={handleToggleMapa}
            >
                🗺️ {mapaVisible ? 'Ocultar mapa' : 'Ver mapa'}
                <span>▼</span>
            </button>

            <main className="main-container">

                {/* Mapa oscuro — colapsable en móvil, siempre visible en desktop */}
                <div className={`map-container ${mapaVisible ? 'map-visible' : ''}`}>
                    <div id="map" ref={mapRef}></div>
                    <button
                        className="recenter-btn"
                        onClick={() => map?.setView([CENTER.lat, CENTER.lng], 14)}
                    >
                        📍 Centrar
                    </button>
                </div>

                {/* Lista de lugares — siempre visible */}
                <aside className="results-container">
                    <div className="results-header">
                        <h2 className="results-title">Comercios encontrados</h2>
                        <span className="results-count">{filteredPlaces.length}</span>
                    </div>

                    {loading && (
                        <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: '2rem' }}>
                            Cargando lugares...
                        </p>
                    )}

                    {error && (
                        <p style={{ color: '#ef5350', textAlign: 'center', marginTop: '2rem' }}>
                            {error}
                        </p>
                    )}

                    {!loading && !error && (
                        <div className="results-list">
                            {filteredPlaces.length > 0 ? (
                                filteredPlaces.map(p => (
                                    <div
                                        key={p.id}
                                        className="result-card"
                                        onClick={() => handlePlaceClick(p)}
                                    >
                                        {p.urlImagen ? (
                                            <img
                                                src={p.urlImagen}
                                                alt={p.nombre}
                                                className="result-card-img"
                                            />
                                        ) : (
                                            <div className="result-card-img-placeholder">🏖️</div>
                                        )}

                                        <div className="result-card-body">
                                            <div className="result-card-top">
                                                <span className="result-name">{p.nombre}</span>
                                                {p.categoria && (
                                                    <span className="result-category">
                                                        {p.categoria.nombre}
                                                    </span>
                                                )}
                                            </div>

                                            {p.descripcion && (
                                                <p className="result-description">
                                                    {p.descripcion}
                                                </p>
                                            )}

                                            <div className="result-footer">
                                                <span className="result-points">
                                                    🏆 {p.puntosQueOtorga} pts
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '2rem' }}>
                                    No se encontraron lugares.
                                </p>
                            )}
                        </div>
                    )}
                </aside>
            </main>

            <PlaceModal
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
            />

            <section className="about-section">
                <h2 className="section-title">¿Sos dueño de un negocio?</h2>
                <p>No queremos ayuda de pobres, si tenes platica escribenos.</p>
                <div className="contact-form">
                    <div className="form-group">
                        <input type="text" className="form-input" placeholder="Nombre del negocio / Servicio" />
                        <input type="text" className="form-input" placeholder="Tu número de contacto" />
                    </div>
                    <button className="submit-btn">Enviar Información</button>
                </div>
            </section>
        </div>
    );
}

// ============================================================
// App — Rutas de la aplicación
// ============================================================
function App() {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path="/login"         element={<Login />} />
            <Route path="/registro"      element={<Registro />} />
            <Route path="/noticias"      element={<PaginaNoticias />} />
            <Route path="/ferry"         element={<PaginaFerry />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Rutas protegidas */}
            <Route path="/" element={
                <RutaProtegida><MapaView /></RutaProtegida>
            } />
            <Route path="/perfil" element={
                <RutaProtegida><PaginaPerfil /></RutaProtegida>
            } />
            <Route path="/buses" element={
                <RutaProtegida><PaginaBuses /></RutaProtegida>
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;