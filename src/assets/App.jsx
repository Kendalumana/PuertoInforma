import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import '../styles/App.css';

// Recursos
import logoIcon from '../Resources/puerto_informa_pi.ico';
import imgMigdalia1 from '../Resources/migdalia1.png';
import imgMigdalia2 from '../Resources/migdalia2.png';
import imgMigdalia3 from '../Resources/migdalia3.png';

import imgMomyNails1 from '../Resources/momyNails1.png';
import imgMomyNails2 from '../Resources/momyNails2.png';
import imgMomyNails3 from '../Resources/momyNails3.png';

import imgFarmaValue from '../Resources/farmaValue.png';

import imgRocaDelMar1 from '../Resources/rocaDelMar1.png';
import imgRocaDelMar2 from '../Resources/rocaDelMar2.png';
import imgRocaDelMar3 from '../Resources/rocaDelMar3.png';

import imgIslitas1 from '../Resources/islitas1.png';
import imgIslitas2 from '../Resources/islitas2.png';
import imgIslitas3 from '../Resources/islitas3.png';

const centerCR = { lat: 9.976, lng: -84.833 };

/**
 * =========================================================================
 * GUÍA PARA AGREGAR NUEVOS COMERCIOS (PASO A PASO)
 * =========================================================================
 * Si quieres agregar un negocio, simplemente añade un objeto nuevo al array PLACES.
 * Asegúrate de seguir estas reglas para que todo funcione:
 * 1. id: Debe ser un número único (el siguiente en la lista).
 * 2. lat y lng: Búscalas en Google Maps (clic derecho en el punto -> copiar coordenadas).
 * 3. phone: Incluye el formato internacional (+506) para que el botón de llamada funcione.
 * 4. images: Agrega URLs reales de imágenes (pueden ser de Facebook o Google).
 * 5. acceptsSinpe: Un booleano (true/false) para mostrar la etiqueta de pago.
 * 6. tags: Palabras clave para llamar la atención del cliente.
 * =========================================================================
 */

const PLACES = [
    { 
        id: 1, 
        name: 'Soda Migdalia', 
        category: 'Restaurantes', 
        lat: 9.97974972638573, 
        lng: -84.81682490319031, 
        rating: 4.5, 
        distance: 0.35, 
        openNow: true, 
        phone: '+50670051878', 
        address: 'Av. 17, Diagonal  al Parque El Cocal , Puntarenas', 
        hours: 'Lun-Sab: 5:00 PM - 10:00 PM', 
        acceptsSinpe: true, 
        tags: ['Económico', 'Cantones', 'Acepta SINPE'], 
        images: [
            imgMigdalia1,
            imgMigdalia2,
            imgMigdalia3
        ] 
    },
    { 
        id: 2, 
        name: 'Momy Nails', 
        category: 'Uñas', 
        lat:  9.976670216899546,
        lng:  -84.84008648287417, 
        rating: 4.8, 
        distance: 0.15, 
        openNow: true, 
        phone: '+50670263379', 
        address: '75 metros oeste del estadio lito perez sobre calle principal, Provincia de Puntarenas, Puntarenas, 60101', 
        hours: 'Lun-Sab: 10:00 AM - 06:00 PM && Dom: 10:00-5:00 PM', 
        acceptsSinpe: true, 
        tags: ['Acrílicas', 'Pedicura', 'Atención personalizada'],
        images: [imgMomyNails1,imgMomyNails2,imgMomyNails3]
    },
    { 
        id: 3, 
        name: 'Farmacia Value Puntarenas', 
        category: 'Farmacias', 
        lat: 9.978854322103588,  
        lng: -84.82983162838762, 
        rating: 2.8, 
        distance: 0.50, 
        openNow: true, 
        phone: '+50640367171', 
        address: '600 metros norte de la gasolinera Delta, Provincia de Puntarenas, Centro', 
        hours: 'Lun-Vier : 7:00 AM-9:00 PM && Sab-Dom : 8:00 AM - 8:00 PM', 
        acceptsSinpe: false, 
        tags: ['Urgencias', 'Servicio a domicilio'],
        images: [imgFarmaValue]
    },
    { 
        id: 4, 
        name: 'Hotel Roca Del Mar', 
        category: 'Alojamiento', 
        lat: 9.980372190217345, 
        lng: -84.81293944232912,  
        rating: 4.3, 
        distance: 3.20, 
        openNow: true, 
        phone: '+50688962637', 
        address: 'Playa Puntarenas, frente al Mar', 
        hours: 'Recepción 24/7', 
        acceptsSinpe: true, 
        tags: ['Piscina', 'Vista al mar', 'WiFi gratis'],
        images: [imgRocaDelMar1,imgRocaDelMar2,imgRocaDelMar3]
    },
    { 
        id: 5, 
        name: 'Islitas Drinks', 
        category: 'Bares', 
        lat: 9.974751836362385, 
        lng: -84.845633118635, 
        rating: 4.6, 
        distance: 0.55, 
        openNow: true, 
        phone: '+50672960626', 
        address: 'Calle 5, Paseo de los Turistas, Puntarenas', 
        hours: 'Jue-Dom: 05:00 PM - 02:30 AM', 
        acceptsSinpe: true, 
        tags: ['Cócteles', 'Buen ambiente', 'Seguridad'],
        images: [imgIslitas1,imgIslitas2,imgIslitas3]
    }
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
    
    // Filtros de estado
    const [filterCat, setFilterCat] = useState("");
    const [filterRating, setFilterRating] = useState(0);

    const mapRef = useRef(null);
    const markersLayer = useRef(L.layerGroup());

    // Inicialización del Mapa
    useEffect(() => {
        if (!mapRef.current) return;
        
        const instance = L.map(mapRef.current).setView([centerCR.lat, centerCR.lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(instance);
        
        markersLayer.current.addTo(instance);
        setMap(instance);

        return () => instance.remove();
    }, []);

    // Escuchador de filtros
    useEffect(() => {
        if (!map) return;
        applyFilters();
    }, [map, activeChip, filterCat, filterRating, searchQuery]);

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
        
        // Creamos el icono de Leaflet manualmente
        const defaultIcon = new L.Icon({
            iconUrl: markerIconPng,
            shadowUrl: markerShadowPng,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        list.forEach(p => {
            // Le pasamos el icono personalizado al marcador
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
    };

    // Funciones de utilidad para el contacto
    const callPhone = (phone) => window.open(`tel:${phone}`);
    const sendWhatsApp = (phone, name) => {
        const msg = encodeURIComponent(`Hola, vi a ${name} en Puerto Informa y me gustaría consultar sobre sus servicios.`);
        window.open(`https://wa.me/${phone.replace('+', '')}?text=${msg}`);
    };
    const openInMaps = (lat, lng) => {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`);
    };

    return (
        <div className="app-wrapper">
            {/* Header / Navbar */}
            <header>
                <div className="header-left">
                    <img src={logoIcon} alt="Logo" className="logo-navbar" />
                    <div className="brand-title">Puerto Informa</div>
                </div>
                <div className="search-container">
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="¿Qué buscás? ej. pizza, uñas, repuestos..." 
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="filters-btn" onClick={() => setShowFilters(!showFilters)}>
                    ⚙️ Filtros
                </button>
            </header>

            {/* Panel de Filtros Lateral */}
            <div className={`filters-panel ${showFilters ? 'visible' : ''}`}>
                <div className="filters-title">Configurar Búsqueda</div>
                <div className="filters-row">
                    <label>Categoría Específica</label>
                    <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                        <option value="">Todas las categorías</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="filters-row">
                    <label>Calificación mínima: {filterRating} ⭐</label>
                    <input type="range" min="0" max="5" step="0.5" value={filterRating} onChange={(e) => setFilterRating(parseFloat(e.target.value))} />
                </div>
                <div className="filters-actions">
                    <button className="btn btn-clear" onClick={() => {setFilterCat(""); setFilterRating(0); setActiveChip("");}}>Limpiar</button>
                    <button className="btn btn-apply" onClick={() => setShowFilters(false)}>Listo</button>
                </div>
            </div>

            {/* Chips de Categorías Rápidas */}
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

            {/* Sección Principal: Mapa y Resultados */}
            <main className="main-container">
                <div className="map-container">
                    <div id="map" ref={mapRef}></div>
                    <button className="nearby-btn" onClick={() => map.setView([centerCR.lat, centerCR.lng], 14)}>
                        📍 Centrar Mapa
                    </button>
                </div>

                <aside className="results-container">
                    <div className="results-header">
                        <h2 className="results-title">Comercios encontrados</h2>
                        <span className="results-count">{filteredPlaces.length}</span>
                    </div>
                    <div className="results-list">
                        {filteredPlaces.length > 0 ? filteredPlaces.map(p => (
                            <div key={p.id} className="result-card" onClick={() => handlePlaceClick(p)}>
                                <div className="result-header">
                                    <h3 className="result-name">{p.name}</h3>
                                    <span className="result-category">{p.category}</span>
                                </div>
                                <div className="result-info">
                                    <div className="rating">⭐ {p.rating}</div>
                                    <div className="distance">📍 {p.distance} km</div>
                                </div>
                                <div className="card-tags">
                                    {p.tags?.slice(0,2).map(t => <span key={t} className="mini-tag">{t}</span>)}
                                </div>
                                <button className="get-directions">Ver detalles</button>
                            </div>
                        )) : <p style={{padding: '20px'}}>No se encontraron resultados.</p>}
                    </div>
                </aside>
            </main>

            {/* Modal de Detalle (Se abre al tocar un comercio) */}
            {selectedPlace && (
                <div className="modal-overlay" style={{display: 'flex'}} onClick={() => setSelectedPlace(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{selectedPlace.name}</h2>
                                <span className="modal-subtitle">{selectedPlace.category}</span>
                            </div>
                            <button className="close-modal" onClick={() => setSelectedPlace(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Galería de Imágenes */}
                            <div className="modal-images">
                                {selectedPlace.images && selectedPlace.images.length > 0 ? 
                                    selectedPlace.images.map((img, i) => (
                                        <img key={i} src={img} className="modal-image" alt={`Vista de ${selectedPlace.name}`} 
                                             onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible'}/>
                                    )) : <div className="no-image">Sin fotos disponibles</div>
                                }
                            </div>
                            
                            <div className="modal-details">
                                <p><strong>📍 Dirección:</strong> {selectedPlace.address}</p>
                                <p><strong>⏰ Horario:</strong> {selectedPlace.hours}</p>
                                {selectedPlace.acceptsSinpe && <p className="sinpe-badge">✅ Acepta SINPE Móvil</p>}
                                
                                <div className="modal-tags">
                                    {selectedPlace.tags?.map(t => <span key={t} className="tag-item">#{t}</span>)}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button className="action-btn phone-btn" onClick={() => callPhone(selectedPlace.phone)}>
                                    📞 Llamar
                                </button>
                                <button className="action-btn whatsapp-btn" onClick={() => sendWhatsApp(selectedPlace.phone, selectedPlace.name)}>
                                    💬 WhatsApp
                                </button>
                                <button className="action-btn maps-btn" onClick={() => openInMaps(selectedPlace.lat, selectedPlace.lng)}>
                                    🗺️ Google Maps
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Formulario de Sugerencias */}
            <section className="about-section">
                <h2 className="section-title">¿Sos dueño de un negocio?</h2>
                <p>Ayudanos a crecer la guía de Puntarenas. Sugerí tu comercio aquí mismo.</p>
                <div className="contact-form">
                    <div className="form-group">
                        <input type="text" className="form-input" placeholder="Nombre del negocio / Servicio" />
                        <input type="text" className="form-input" placeholder="Tu número de contacto" />
                    </div>
                    <button className="submit-btn">Enviar Información</button>
                    {/*Parte en proceso...*/}
                </div>
            </section>
        </div>
    );
}

export default App;