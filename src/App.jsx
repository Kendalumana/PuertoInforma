// ============================================================
// App.jsx — Componente raíz de PuertoInforma
// Su único trabajo es: manejar el estado global y conectar
// todos los componentes entre sí.
// Pasó de ~200 líneas a ~120 líneas legibles.
// ============================================================

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import './styles/App.css';

// Datos
import { PLACES, CATEGORIES } from './data/places';

// Componentes
import Navbar      from './components/Navbar';
import FilterPanel from './components/FilterPanel';
import PlaceModal  from './components/PlaceModal';

// Coordenadas del centro del mapa (Puntarenas)
const CENTER = { lat: 9.976, lng: -84.833 };

function App() {

    // --- Estado global ---
    const [map,            setMap           ] = useState(null);
    const [markers,        setMarkers       ] = useState({});
    const [filteredPlaces, setFilteredPlaces] = useState(PLACES);
    const [selectedPlace,  setSelectedPlace ] = useState(null);
    const [activeChip,     setActiveChip    ] = useState("");
    const [showFilters,    setShowFilters   ] = useState(false);
    const [searchQuery,    setSearchQuery   ] = useState("");
    const [filterCat,      setFilterCat     ] = useState("");
    const [filterRating,   setFilterRating  ] = useState(0);

    const mapRef       = useRef(null);
    const markersLayer = useRef(L.layerGroup());

    // -------------------------------------------------------
    // Inicialización del mapa — corre solo una vez al montar
    // -------------------------------------------------------
    useEffect(() => {
        if (!mapRef.current) return;

        const instance = L.map(mapRef.current).setView(
            [CENTER.lat, CENTER.lng], 14
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(instance);

        markersLayer.current.addTo(instance);
        setMap(instance);

        // Limpia el mapa cuando el componente se desmonta
        return () => instance.remove();
    }, []);

    // -------------------------------------------------------
    // Aplicar filtros — corre cada vez que cambia cualquier
    // criterio de búsqueda o cuando el mapa está listo
    // -------------------------------------------------------
    useEffect(() => {
        if (!map) return;
        applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, activeChip, filterCat, filterRating, searchQuery]);

    const applyFilters = () => {
        const list = PLACES.filter(p => {
            const matchesSearch  = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesChip    = activeChip   ? p.category === activeChip  : true;
            const matchesCat     = filterCat    ? p.category === filterCat   : true;
            const matchesRating  = p.rating >= filterRating;
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
            iconUrl:    markerIconPng,
            shadowUrl:  markerShadowPng,
            iconSize:   [25, 41],
            iconAnchor: [12, 41],
            popupAnchor:[1, -34],
            shadowSize: [41, 41]
        });

        const newMarkers = {};
        list.forEach(p => {
            const m = L.marker([p.lat, p.lng], { icon: defaultIcon })
                .addTo(markersLayer.current);
            m.bindPopup(`<strong>${p.name}</strong><br>${p.category}`);
            m.on('click', () => setSelectedPlace(p));
            newMarkers[p.id] = m;
        });

        setMarkers(newMarkers);
    };

    // Al hacer clic en una tarjeta: vuela al marcador y abre el modal
    const handlePlaceClick = (p) => {
        map.flyTo([p.lat, p.lng], 16);
        markers[p.id]?.openPopup();
        setSelectedPlace(p);
    };

    // Limpia todos los filtros de una vez
    const handleClearFilters = () => {
        setFilterCat("");
        setFilterRating(0);
        setActiveChip("");
    };

    // -------------------------------------------------------
    // Render
    // -------------------------------------------------------
    return (
        <div className="app-wrapper">

            {/* Barra de navegación */}
            <Navbar
                onSearch={setSearchQuery}
                onToggleFilters={() => setShowFilters(!showFilters)}
            />

            {/* Panel de filtros */}
            <FilterPanel
                visible={showFilters}
                filterCat={filterCat}
                filterRating={filterRating}
                onChangeCat={setFilterCat}
                onChangeRating={setFilterRating}
                onClear={handleClearFilters}
                onClose={() => setShowFilters(false)}
            />

            {/* Chips de categorías rápidas */}
            <div className="categories-container">
                {CATEGORIES.slice(0, 10).map(c => (
                    <div
                        key={c}
                        className={`category-chip ${activeChip === c ? 'active' : ''}`}
                        onClick={() => setActiveChip(activeChip === c ? "" : c)}
                    >
                        {c}
                    </div>
                ))}
            </div>

            {/* Layout principal: mapa + lista */}
            <main className="main-container">

                {/* Mapa */}
                <div className="map-container">
                    <div id="map" ref={mapRef}></div>
                    <button
                        className="nearby-btn"
                        onClick={() => map.setView([CENTER.lat, CENTER.lng], 14)}
                    >
                        📍 Centrar Mapa
                    </button>
                </div>

                {/* Lista de resultados */}
                <aside className="results-container">
                    <div className="results-header">
                        <h2 className="results-title">Comercios encontrados</h2>
                        <span className="results-count">{filteredPlaces.length}</span>
                    </div>

                    <div className="results-list">
                        {filteredPlaces.length > 0
                            ? filteredPlaces.map(p => (
                                <div
                                    key={p.id}
                                    className="result-card"
                                    onClick={() => handlePlaceClick(p)}
                                >
                                    <div className="result-header">
                                        <h3 className="result-name">{p.name}</h3>
                                        <span className="result-category">{p.category}</span>
                                    </div>
                                    <div className="result-info">
                                        <div className="rating">⭐ {p.rating}</div>
                                        <div className="distance">📍 {p.distance} km</div>
                                    </div>
                                    <div className="card-tags">
                                        {p.tags?.slice(0, 2).map(t => (
                                            <span key={t} className="mini-tag">{t}</span>
                                        ))}
                                    </div>
                                    <button className="get-directions">Ver detalles</button>
                                </div>
                            ))
                            : <p style={{ padding: '20px' }}>No se encontraron resultados.</p>
                        }
                    </div>
                </aside>

            </main>

            {/* Modal de detalle */}
            <PlaceModal
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
            />

            {/* Footer / Formulario de sugerencias */}
            <section className="about-section">
                <h2 className="section-title">¿Sos dueño de un negocio?</h2>
                <p>Ayudanos a crecer la guía de Puntarenas. Sugerí tu comercio aquí mismo.</p>
                <div className="contact-form">
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Nombre del negocio / Servicio"
                        />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Tu número de contacto"
                        />
                    </div>
                    <button className="submit-btn">Enviar Información</button>
                </div>
            </section>

        </div>
    );
}

export default App;
