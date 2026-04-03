import { useEffect, useState, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import './styles/Index.css';

// Datos
import { PLACES, CATEGORIES } from './data/places';

// Componentes
import Navbar      from './components/Navbar';
import FilterPanel from './components/FilterPanel';
import PlaceModal  from './components/PlaceModal';
import StarRating  from './components/StarRating';
import PaginaPerfil from './components/PaginaPerfil';

// Coordenadas del centro del mapa (Puntarenas)
const CENTER = { lat: 9.976, lng: -84.833 };

// Componente de la vista del Mapa y Lista
function MapaView() {
    // --- Estado global ---
    const [map,            setMap           ] = useState(null);
    const [markers,        setMarkers       ] = useState({});
    const [filteredPlaces, setFilteredPlaces] = useState(PLACES);
    const [selectedPlace,  setSelectedPlace ] = useState(null);
    const [showFilters,    setShowFilters   ] = useState(false);
    const [activeChip,     setActiveChip    ] = useState("");
    const [searchQuery,    setSearchQuery   ] = useState("");
    const [filterCat,      setFilterCat     ] = useState("");
    const [filterRating,   setFilterRating  ] = useState(0);
    const [activeTab,      setActiveTab     ] = useState("mapa");

    const mapRef       = useRef(null);
    const markersLayer = useRef(L.layerGroup());

    // -------------------------------------------------------
    // Inicialización del mapa
    // -------------------------------------------------------
    useEffect(() => {
        if (!mapRef.current) return;

        const instance = L.map(mapRef.current).setView([CENTER.lat, CENTER.lng], 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(instance);

        markersLayer.current.addTo(instance);
        setMap(instance);

        return () => instance.remove();
    }, []);

    // -------------------------------------------------------
    // Aplicar filtros
    // -------------------------------------------------------
    useEffect(() => {
        if (!map) return;
        applyFilters();
    }, [searchQuery, activeChip, filterCat, filterRating, map]);

    const applyFilters = () => {
        const list = PLACES.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesChip   = activeChip  ? p.category === activeChip : true;
            const matchesCat    = filterCat   ? p.category === filterCat  : true;
            const matchesRating = p.rating >= filterRating;
            return matchesSearch && matchesChip && matchesCat && matchesRating;
        });

        setFilteredPlaces(list);
        updateMarkers(list);
    };

    // -------------------------------------------------------
    // Marcadores del mapa
    // -------------------------------------------------------
    const updateMarkers = (list) => {
        markersLayer.current.clearLayers();

        const defaultIcon = new L.Icon({
            iconUrl:     markerIconPng,
            shadowUrl:   markerShadowPng,
            iconSize:    [25, 41],
            iconAnchor:  [12, 41],
            popupAnchor: [1, -34],
            shadowSize:  [41, 41]
        });

        const newMarkers = {};
        list.forEach(p => {
            const m = L.marker([p.lat, p.lng], { icon: defaultIcon })
                      .bindPopup(`<b>${p.name}</b>`);
            
            m.addTo(markersLayer.current);
            m.on('click', () => setSelectedPlace(p));
            newMarkers[p.id] = m;
        });

        setMarkers(newMarkers);
    };

    const handlePlaceClick = (p) => {
        if (map) {
            map.flyTo([p.lat, p.lng], 16);
            markers[p.id]?.openPopup();
        }
        setSelectedPlace(p);
        setActiveTab('mapa');
    };

    const handleClearFilters = () => {
        setFilterCat("");
        setFilterRating(0);
        setActiveChip("");
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
                filterRating={filterRating}
                onSetCat={setFilterCat}
                onSetRating={setFilterRating}
                onClear={handleClearFilters}
                onClose={() => setShowFilters(false)}
            />

            <div className="categories-container">
                {CATEGORIES.slice(0, 10).map(c => (
                    <div
                        key={c.id}
                        className={`category-chip ${activeChip === c.id ? 'active' : ''}`}
                        onClick={() => setActiveChip(activeChip === c.id ? "" : c.id)}
                    >
                        {c.name}
                    </div>
                ))}
            </div>

            <div className="mobile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'mapa' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mapa')}
                >
                    Mapa
                </button>
                <button
                    className={`tab-btn ${activeTab === 'lista' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lista')}
                >
                    Lista
                </button>
            </div>

            <main className="main-container">
                <div className={`map-container ${activeTab === 'lista' ? 'hidden-mobile' : ''}`}>
                    <div id="map" ref={mapRef}></div>
                    <button className="recenter-btn" onClick={() => map.setView([CENTER.lat, CENTER.lng], 14)}>
                        📍 Mi ubicación
                    </button>
                </div>

                <aside className={`results-container ${activeTab === 'mapa' ? 'hidden-mobile' : ''}`}>
                    <div className="results-header">
                        <h2 className="results-title">Comercios encontrados</h2>
                        <span className="results-count">{filteredPlaces.length}</span>
                    </div>

                    <div className="results-list">
                        {filteredPlaces.length > 0 ? (
                            filteredPlaces.map(p => (
                                <div key={p.id} className="place-card" onClick={() => handlePlaceClick(p)}>
                                    <img src={p.image} alt={p.name} className="place-img" />
                                    <div className="place-info">
                                        <h3 className="place-name">{p.name}</h3>
                                        <div className="place-meta">
                                            <StarRating rating={p.rating} />
                                            <span className="place-category">{p.category}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-results">No se encontraron lugares.</p>
                        )}
                    </div>
                </aside>
            </main>

            <PlaceModal
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
            />

            <section className="about-section">
                <h2 className="section-title">¿Sos dueño de un negocio?</h2>
                <p>Ayudanos a crecer la guía de Puntarenas. Sugerí tu comercio aquí mismo.</p>
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

// Página de Buses temporal
function PaginaBuses() {
    return (
        <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
            <h1>🚌 Página de Buses</h1>
            <p>Próximamente disponible para Puntarenas.</p>
        </div>
    );
}

// Componente Raíz con Rutas
function App() {
    return (
        <Routes>
            <Route path="/"       element={<MapaView />} />
            <Route path="/perfil" element={<PaginaPerfil />} />
            <Route path="/buses"  element={<PaginaBuses />} />
        </Routes>
    );
}

export default App;