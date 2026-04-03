import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import './styles/App.css';

import api from './api/axios';
import Navbar from './components/Navbar';
import FilterPanel from './components/FilterPanel';
import PlaceModal from './components/PlaceModal';
import StarRating from './components/StarRating';

const CENTER = { lat: 9.976, lng: -84.833 };

function App() {
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState({});
    const [allPlaces, setAllPlaces] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredPlaces, setFilteredPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [activeChip, setActiveChip] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCat, setFilterCat] = useState("");
    const [filterRating, setFilterRating] = useState(0);
    const [activeTab, setActiveTab] = useState("mapa");

    const mapRef = useRef(null);
    const markersLayer = useRef(L.layerGroup());

    // 1. Carga de datos y Mapa (Una sola vez)
    useEffect(() => {
        if (!mapRef.current) return;

        // Inicializar Mapa
        const instance = L.map(mapRef.current).setView([CENTER.lat, CENTER.lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(instance);
        markersLayer.current.addTo(instance);
        setMap(instance);

        const fetchInitialData = async () => {
            try {
                const [resLugares, resCats] = await Promise.all([
                    api.get('/lugar'),
                    api.get('/categoria')
                ]);

                const mappedPlaces = resLugares.data.map(p => ({
                    id: p.id,
                    name: p.nombre,
                    lat: p.latitud,
                    lng: p.longitud,
                    category: p.categoria.nombre,
                    puntos: p.puntosQueOtorga,
                    urlImagen: p.urlImagen,
                    rating: 5.0, // Temporal
                    openNow: true,
                    distance: "0.5",
                    tags: ["Puerto", "Turismo"]
                }));

                setAllPlaces(mappedPlaces);
                setFilteredPlaces(mappedPlaces);
                setCategories(resCats.data.map(c => c.nombre));
            } catch (err) {
                console.error("Error cargando datos:", err);
            }
        };

        fetchInitialData();
        return () => instance.remove();
    }, []);

    // 2. Lógica de Filtros
    useEffect(() => {
        const applyFilters = () => {
            const list = allPlaces.filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesChip = activeChip ? p.category === activeChip : true;
                const matchesCat = filterCat ? p.category === filterCat : true;
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

    return (
        <div className="app-wrapper">
            <Navbar onSearch={setSearchQuery} onToggleFilters={() => setShowFilters(!showFilters)} />
            
            <FilterPanel 
                visible={showFilters} 
                filterCat={filterCat} 
                onChangeCat={setFilterCat} 
                onClear={() => {setFilterCat(""); setFilterRating(0); setActiveChip("");}}
                onClose={() => setShowFilters(false)}
            />

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
                                <h3 className="result-name">{p.name}</h3>
                                <p className="result-category">{p.category}</p>
                                <StarRating rating={p.rating} />
                                <div className="puntos-badge">⭐ {p.puntos} pts</div>
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