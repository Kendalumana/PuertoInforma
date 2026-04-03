// ============================================================
// App.jsx — Componente raíz de PuertoInforma (CONECTADO AL BACKEND)
// ============================================================

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import './styles/App.css';

// --- NUEVO: Importamos el túnel de Axios ---
import api from './api/axios';

// Componentes
import Navbar      from './components/Navbar';
import FilterPanel from './components/FilterPanel';
import PlaceModal  from './components/PlaceModal';
import StarRating  from './components/StarRating';

const CENTER = { lat: 9.976, lng: -84.833 };

function App() {

    // --- Estado global ---
    const [map,            setMap           ] = useState(null);
    const [markers,        setMarkers       ] = useState({});
    const [allPlaces,      setAllPlaces     ] = useState([]); // 👈 Reemplaza al PLACES estático
    const [categories,     setCategories    ] = useState([]); // 👈 Reemplaza al CATEGORIES estático
    const [filteredPlaces, setFilteredPlaces] = useState([]);
    const [selectedPlace,  setSelectedPlace ] = useState(null);
    const [activeChip,     setActiveChip    ] = useState("");
    const [showFilters,    setShowFilters   ] = useState(false);
    const [searchQuery,    setSearchQuery   ] = useState("");
    const [filterCat,      setFilterCat     ] = useState("");
    const [filterRating,   setFilterRating  ] = useState(0);
    const [activeTab,      setActiveTab     ] = useState("mapa");

    const mapRef       = useRef(null);
    const markersLayer = useRef(L.layerGroup());

    // -------------------------------------------------------
    // 1. CARGA DE DATOS DESDE EL BACKEND (Render)
    // -------------------------------------------------------
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Traemos lugares y categorías en paralelo
                const [resLugares, resCats] = await Promise.all([
                    api.get('/lugar'),
                    api.get('/categoria')
                ]);

                // MAPEO: Convertimos los nombres de Java a los nombres que ya usa tu Front
                const mappedPlaces = resLugares.data.map(p => ({
                    id: p.id,
                    name: p.nombre,          // Java 'nombre' -> Front 'name'
                    lat: p.latitud,         // Java 'latitud' -> Front 'lat'
                    lng: p.longitud,        // Java 'longitud' -> Front 'lng'
                    category: p.categoria.nombre,
                    puntos: p.puntosQueOtorga,
                    urlImagen: p.urlImagen,
                    rating: 5.0,            // Hardcodeado por ahora si no hay en DB
                    openNow: true,          // Hardcodeado por ahora
                    distance: "0.5",        // Hardcodeado por ahora
                    tags: ["Puerto", "Turismo"]
                }));

                setAllPlaces(mappedPlaces);
                setFilteredPlaces(mappedPlaces); // Inicialmente mostramos todos
                setCategories(resCats.data.map(c => c.nombre));
                
            } catch (err) {
                console.error("Error cargando datos del Puerto:", err);
            }
        };

        fetchInitialData();
    }, []);

    // -------------------------------------------------------
    // 2. Inicialización del mapa
    // -------------------------------------------------------
    useEffect(() => {
        if (!mapRef.current) return;
        const instance = L.map(mapRef.current).setView([CENTER.lat, CENTER.lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(instance);
        markersLayer.current.addTo(instance);
        setMap(instance);
        return () => instance.remove();
    }, []);

    // -------------------------------------------------------
    // 3. Aplicar filtros (Ahora usa allPlaces en vez de PLACES)
    // -------------------------------------------------------
    useEffect(() => {
        if (!allPlaces.length) return;

        const applyFilters = () => {
            const list = allPlaces.filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesChip   = activeChip ? p.category === activeChip : true;
                const matchesCat    = filterCat ? p.category === filterCat : true;
                const matchesRating = p.rating >= filterRating;
                return matchesSearch && matchesChip && matchesCat && matchesRating;
            });

            setFilteredPlaces(list);
            if (map) updateMarkers(list);
        };

        applyFilters();
    }, [allPlaces, map, activeChip, filterCat, filterRating, searchQuery]);

    const updateMarkers = (list) => {
        markersLayer.current.clearLayers();
        const defaultIcon = new L.Icon({
            iconUrl: markerIconPng,
            shadowUrl: markerShadowPng,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        const newMarkers = {};
        list.forEach(p => {
            const m = L.marker([p.lat, p.lng], { icon: defaultIcon }).addTo(markersLayer.current);
            m.bindPopup(`<strong>${p.name}</strong><br>${p.category}`);
            m.on('click', () => setSelectedPlace(p));
            newMarkers[p.id] = m;
        });
        setMarkers(newMarkers);
    };

    const handlePlaceClick = (p) => {
        map.flyTo([p.lat, p.lng], 16);
        markers[p.id]?.openPopup();
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
            <Navbar onSearch={setSearchQuery} onToggleFilters={() => setShowFilters(!showFilters)} />
            
            <FilterPanel 
                visible={showFilters} 
                filterCat={filterCat} 
                onChangeCat={setFilterCat} 
                onClear={handleClearFilters}
                onClose={() => setShowFilters(false)}
            />

            {/* Chips dinámicos desde el Backend */}
            <div className="categories-container">
                {categories.map(c => (
                    <div 
                        key={c} 
                        className={`category-chip ${activeChip === c ? 'active' : ''}`}
                        onClick={() => setActiveChip(activeChip === c ? "" : c)}
                    >
                        {c}
                    </div>
                ))}
            </div>

            <div className="mobile-tabs">
                <button className={`tab-btn ${activeTab === 'mapa' ? 'active' : ''}`} onClick={() => setActiveTab('mapa')}>🗺️ Mapa</button>
                <button className={`tab-btn ${activeTab === 'lista' ? 'active' : ''}`} onClick={() => setActiveTab('lista')}>📋 Lista ({filteredPlaces.length})</button>
            </div>

            <main className="main-container">
                <div className={`map-container ${activeTab === 'lista' ? 'hidden-mobile' : ''}`}>
                    <div id="map" ref={mapRef}></div>
                    <button className="nearby-btn" onClick={() => map.setView([CENTER.lat, CENTER.lng], 14)}>📍 Centrar</button>
                </div>

                <aside className={`results-container ${activeTab === 'mapa' ? 'hidden-mobile' : ''}`}>
                    <div className="results-header">
                        <h2 className="results-title">Comercios en el Puerto</h2>
                        <span className="results-count">{filteredPlaces.length}</span>
                    </div>
                    <div className="results-list">
                        {filteredPlaces.map(p => (
                            <div key={p.id} className="result-card" onClick={() => handlePlaceClick(p)}>
                                <div className="result-header">
                                    <h3 className="result-name">{p.name}</h3>
                                    <span className="result-category">{p.category}</span>
                                </div>
                                <div className="result-info">
                                    <StarRating rating={p.rating} />
                                    <div className="puntos-badge">⭐ {p.puntos} pts</div>
                                </div>
                                <button className="get-directions">Ver detalles</button>
                            </div>
                        ))}
                    </div>
                </aside>
            </main>

            <PlaceModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
        </div>
    );
}

export default App;