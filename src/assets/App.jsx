import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
//Importamos el css
import '../styles/App.css';

// Importamos el logo 
import logoIcon from '../Resources/puerto_informa_pi.ico';

const centerCR = { lat: 9.976, lng: -84.833 };


//Importamos los lugares de el puertpo ID,Name,category,lat,lng,rating,distance,openNow,phone,address,hours,acceptsSinpe,tags,(imagen(opcional))
const PLACES = [
    { id:1, name:'Soda Migdalia', category:'Restaurantes', lat:9.97974972638573, lng:-84.81682490319031, rating:4.5, distance:0.35, openNow:true, phone:'+50626661234', address:'Av. Costanera, Puntarenas', hours:'Lun-Sab: 11:00-22:00, Dom: 12:00-20:00', acceptsSinpe:true, tags:['Económico','Abierto tarde','Acepta SINPE'], images:['https://via.placeholder.com/150','',''] },
    { id:2, name:'Nails by Maria', category:'Uñas', lat:9.9780, lng:-84.8355, rating:4.8, distance:0.15, openNow:true, phone:'+50688887777', address:'Calle Central, Puntarenas', hours:'Lun-Sab: 10:00-20:00', acceptsSinpe:true, tags:['Atención rápida','Reservas'] },
    { id:3, name:'Farmacia La Esperanza', category:'Farmacias', lat:9.9742, lng:-84.8300, rating:4.2, distance:0.50, openNow:true, phone:'+50622223333', address:'Costado Norte del Parque, Puntarenas', hours:'24 horas', acceptsSinpe:false, tags:['24/7','Parqueo'] },
    { id:4, name:'Hotel Roca Del Mar', category:'Alojamiento', lat:9.980341525303771, lng: -84.81310495794962, rating:4.3, distance:3.20, openNow:true, phone:'+50627771111', address:'Playa Puntarenas', hours:'Check-in 15:00', acceptsSinpe:true, tags:['Vista al mar'] },
    { id:5, name:'Islitas Drinks', category:'Bares', lat: 9.974751836362385, lng:-84.845633118635, rating:4.6, distance:0.55, openNow:true, phone:'+50629998877', address:'Calle 5, Puntarenas', hours:'Vie-Sáb: 17:00-02:00', acceptsSinpe:true, tags:['Cócteles','Música en vivo'] }
];

const CATEGORIES = ["Verduras", "Restaurantes", "Uñas", "Bares", "Cafés", "Farmacias", "Tecnología", "Gimnasios", "Ferreterías", "Bancos/ATM", "Copy/Librería", "Transporte", "Alojamiento", "Playas"];

function App() {
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState({});
    const [filteredPlaces, setFilteredPlaces] = useState(PLACES);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [activeChip, setActiveChip] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Filtros
    const [filterCat, setFilterCat] = useState("");
    const [filterRating, setFilterRating] = useState(0);
    const [filterRadius, setFilterRadius] = useState(0);

    const mapRef = useRef(null);
    const markersLayer = useRef(L.layerGroup());

    useEffect(() => {
        if (!mapRef.current) return;
        
        const instance = L.map(mapRef.current).setView([centerCR.lat, centerCR.lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(instance);
        markersLayer.current.addTo(instance);
        setMap(instance);

        return () => instance.remove();
    }, []);

    useEffect(() => {
        if (!map) return;
        applyFilters();
    }, [map, activeChip, filterCat, filterRating, filterRadius, searchQuery]);

    const applyFilters = () => {
        let list = PLACES.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesChip = activeChip ? p.category === activeChip : true;
            const matchesCat = filterCat ? p.category === filterCat : true;
            const matchesRating = p.rating >= filterRating;
            return matchesSearch && matchesChip && matchesCat && matchesRating;
        });

        setFilteredPlaces(list);
        updateMarkers(list);
    };

    const updateMarkers = (list) => {
        markersLayer.current.clearLayers();
        const newMarkers = {};
        list.forEach(p => {
            const m = L.marker([p.lat, p.lng]).addTo(markersLayer.current);
            m.bindPopup(`<b>${p.name}</b>`);
            m.on('click', () => setSelectedPlace(p));
            newMarkers[p.id] = m;
        });
        setMarkers(newMarkers);
    };

    const handlePlaceClick = (p) => {
        map.flyTo([p.lat, p.lng], 16);
        markers[p.id]?.openPopup();
        setSelectedPlace(p);
    };

    return (
        <div className="app-wrapper">
            {/* Header */}
            <header>
                <div className="header-left">
                    <img src={logoIcon} alt="Logo" className="logo-navbar" />
                    <div className="brand-title">Puerto Informa</div>
                </div>
                <div className="search-container">
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="¿Qué buscás? ej. verduras, uñas, bar" 
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="filters-btn" onClick={() => setShowFilters(!showFilters)}>Filtros</button>
                <div className="notifications">🔔</div>
            </header>

            {/* Panel de Filtros */}
            <div className={`filters-panel ${showFilters ? 'visible' : ''}`}>
                <div className="filters-title">Filtrar lugares</div>
                <div className="filters-row">
                    <label>Categoría</label>
                    <select onChange={(e) => setFilterCat(e.target.value)}>
                        <option value="">Todas</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="filters-row">
                    <label>Rating mín: {filterRating}</label>
                    <input type="range" min="0" max="5" step="0.5" onChange={(e) => setFilterRating(e.target.value)} />
                </div>
                <div className="filters-actions">
                    <button className="btn btn-clear" onClick={() => {setFilterCat(""); setFilterRating(0);}}>Limpiar</button>
                    <button className="btn btn-apply" onClick={() => setShowFilters(false)}>Aplicar</button>
                </div>
            </div>

            {/* Chips */}
            <div className="categories-container">
                {CATEGORIES.slice(0, 8).map(c => (
                    <div 
                        key={c} 
                        className={`category-chip ${activeChip === c ? 'active' : ''}`}
                        onClick={() => setActiveChip(activeChip === c ? "" : c)}
                    >
                        {c}
                    </div>
                ))}
            </div>

            {/* Main Section */}
            <main className="main-container">
                <div className="map-container">
                    <div id="map" ref={mapRef}></div>
                    <button className="nearby-btn">📍 Cerca de mí</button>
                </div>

                <aside className="results-container">
                    <div className="results-header">
                        <h2 className="results-title">Resultados</h2>
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
                                    <div className="rating">⭐ {p.rating}</div>
                                    <div className="distance">{p.distance} km</div>
                                </div>
                                <button className="get-directions">Cómo llegar</button>
                            </div>
                        ))}
                    </div>
                </aside>
            </main>

            {/* Modal Detalle */}
            {selectedPlace && (
                <div className="modal-overlay" style={{display: 'flex'}}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">{selectedPlace.name}</h2>
                            <button className="close-modal" onClick={() => setSelectedPlace(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-images">
                                {selectedPlace.images?.map((img, i) => <img key={i} src={img} className="modal-image" alt="lugar" />)}
                            </div>
                            <p><strong>Dirección:</strong> {selectedPlace.address}</p>
                            <p><strong>Horario:</strong> {selectedPlace.hours}</p>
                            <div className="modal-actions">
                                <button className="action-btn phone-btn">📞 Llamar</button>
                                <button className="action-btn whatsapp-btn">💬 WhatsApp</button>
                                <button className="action-btn maps-btn">🗺️ Ver Mapa</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer / About */}
            <section className="about-section">
                <h2 className="section-title">Acerca de Puerto Informa</h2>
                <p>Tu guía local de confianza en Puntarenas.</p>
                <div className="contact-form">
                    <h3 className="section-title">Sugerir un lugar</h3>
                    <div className="form-group">
                        <input type="text" className="form-input" placeholder="Nombre del lugar" />
                    </div>
                    <button className="submit-btn">Enviar sugerencia</button>
                </div>
            </section>
        </div>
    );
}

export default App;