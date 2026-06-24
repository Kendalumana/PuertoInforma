import { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { axiosPrivate } from '../api/axios';

import MiniCard from './MiniCard';
import Navbar from './Navbar';
import PlaceModal from './PlaceModal';
import LocationPermissionModal from './LocationPermissionModal';
import MapSearchPanel from './MapSearchPanel';
import AboutModal from './AboutModal';

const CENTER = { lat: 9.976, lng: -84.833 };

// Avoid duplicate native permission prompts while React StrictMode remounts.
let locationPermissionRequested = false;

function createUserIcon() {
    return L.divIcon({
        className: '',
        html: `
            <div style="
                width:20px; height:20px;
                background:#4A90E2;
                border:3px solid white;
                border-radius:50%;
                box-shadow:0 0 0 4px rgba(74,144,226,0.3);
                animation: pulseUser 2s infinite;
            "></div>
            <style>
                @keyframes pulseUser {
                    0% { box-shadow: 0 0 0 0 rgba(74,144,226, 0.7); }
                    70% { box-shadow: 0 0 0 15px rgba(74,144,226, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(74,144,226, 0); }
                }
            </style>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
}

const categoryColors = {
    1: '#9C27B0', 2: '#4CAF50', 3: '#FFB300',
    4: '#795548', 5: '#FF5722', 6: '#2196F3',
    7: '#F44336', 8: '#b49e84',
};

function MapaView() {
    const location = useLocation();
    const [map, setMap] = useState(null);
    const [allPlaces, setAllPlaces] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [activeChip, setActiveChip] = useState(() => location.state?.flyTo ? 7 : "");
    const [searchQuery, setSearchQuery] = useState(() => location.state?.label || "");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewPlace, setPreviewPlace] = useState(null);
    const [showAboutModal, setShowAboutModal] = useState(false);
    // Kept false: the browser provides the only location-permission dialog.
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        try {
            const saved = localStorage.getItem('favoritos');
            return saved
                ? JSON.parse(saved).map(favorite => typeof favorite === 'object' ? favorite.id : favorite)
                : [];
        } catch (e) {
            console.error(e);
            return [];
        }
    });
    const [showFavorites, setShowFavorites] = useState(false);
    const [resultadosVisibles, setResultadosVisibles] = useState(20); // A-N1

    const mapRef = useRef(null);
    const markersLayer = useRef(L.layerGroup());
    const userMarkerLayer = useRef(L.layerGroup());
    // Capturamos el state UNA VEZ al montar para no usarlo como dependency
    const flyToStateRef = useRef(location.state);

    useEffect(() => {
        localStorage.setItem('favoritos', JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        axiosPrivate.get('/lugar')
            .then(res => {
                const lugares = res.data;
                setAllPlaces(lugares);
                const validIds = new Set(lugares.map(l => l.id));
                setFavorites(prev => prev.filter(id => validIds.has(id)));
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
        const mapElement = mapRef.current;
        if (!mapElement) return;

        // Limpiar instancia previa si existe (fix robusto para StrictMode)
        if (mapElement._leaflet_id) {
            try {
                const old = mapElement._leaflet;
                if (old && typeof old.remove === 'function') old.remove();
            } catch { /* La instancia anterior puede no existir. */ }
            mapElement._leaflet_id = null;
        }

        const instance = L.map(mapElement, { zoomControl: false }).setView([CENTER.lat, CENTER.lng], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(instance);
        markersLayer.current.addTo(instance);
        userMarkerLayer.current.addTo(instance);
        setMap(instance);

        // Forzar a Leaflet a recalcular el tamaño una vez que el DOM está listo
        setTimeout(() => {
            instance.invalidateSize();
        }, 100);

        return () => {
            instance.remove();
            setMap(null);
            mapElement._leaflet_id = null;
        };
    }, []);

    // Leer el state de "VER EN MAPA" — solo se ejecuta cuando el mapa está listo
    // Usamos ref en vez de location.state como dependency para evitar re-renders infinitos
    useEffect(() => {
        if (!map || !flyToStateRef.current?.flyTo) return;
        const { lat, lng } = flyToStateRef.current.flyTo;
        flyToStateRef.current = null; // consumimos el state una sola vez
        map.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
    }, [map]); // solo depende del mapa, no de location.state

    // Obtener y actualizar en tiempo real la ubicación del usuario
    useEffect(() => {
        if (!map) return;
        
        let watchId;
        let isWatching = false;

        const startWatching = (highAccuracy = true) => {
            if (isWatching) return;
            isWatching = true;
            watchId = navigator.geolocation.watchPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    
                    userMarkerLayer.current.clearLayers();
                    const userMarker = L.marker([lat, lng], { icon: createUserIcon() });
                    userMarker.bindPopup('<b>📍 Tu ubicación actual</b><br/>En tiempo real');
                    userMarkerLayer.current.addLayer(userMarker);

                    // Enviar ubicación al backend
                    try {
                        const localToken = localStorage.getItem('token');
                        if (localToken) {
                            const payload = JSON.parse(atob(localToken.split('.')[1]));
                            const userId = payload.id || payload.sub || payload.usuarioId || payload.userId;
                            if (userId) {
                                await axiosPrivate.put(`/usuario/${userId}/ubicacion`, { latitud: lat, longitud: lng });
                            }
                        }
                    } catch (e) {
                        console.warn("No se pudo actualizar la ubicación en el backend", e);
                    }
                },
                (err) => {
                    if (highAccuracy) {
                        // Alta precisión falló (timeout, network error) → reintentar con baja precisión
                        console.warn("Alta precisión falló, usando baja precisión:", err.message);
                        if (watchId) navigator.geolocation.clearWatch(watchId);
                        isWatching = false;
                        startWatching(false);
                    } else {
                        console.warn("No se pudo obtener la ubicación:", err);
                        setError("Permiso de ubicación denegado. No podrás ver tu posición en el mapa.");
                    }
                },
                highAccuracy
                    ? { enableHighAccuracy: true,  maximumAge: 10000, timeout: 8000 }
                    : { enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 }
            );
        };

        const requestLocationPermission = () => {
            if (locationPermissionRequested) return;
            locationPermissionRequested = true;
            navigator.geolocation.getCurrentPosition(
                () => startWatching(),
                () => setError("Permiso de ubicación denegado. Actívalo en tu navegador para ver tu posición.")
            );
        };

        if (navigator.geolocation && navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then(result => {
                if (result.state === 'granted') {
                    startWatching();
                } else if (result.state === 'prompt') {
                    requestLocationPermission();
                } else if (result.state === 'denied') {
                    setError("Permiso de ubicación denegado. Activalo en tu navegador para ver tu posición.");
                }
                
                result.onchange = () => {
                    if (result.state === 'granted') {
                        startWatching();
                        setError(null);
                    } else if (result.state === 'denied') {
                        setError("Permiso de ubicación denegado. Activalo en tu navegador para ver tu posición.");
                    }
                };
            });
        } else if (navigator.geolocation) {
            // Fallback sin permissions API
            requestLocationPermission();
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [map]);

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
            return matchesSearch && matchesChip;
        });
        if (showFavorites) {
            result = result.filter(p => favorites.includes(p.id));
        }
        return result;
    }, [allPlaces, searchQuery, activeChip, favorites, showFavorites]);

    useEffect(() => {
        if (!map || filteredPlaces.length === 0) return;
        markersLayer.current.clearLayers();
        filteredPlaces.forEach(p => {
            const color = categoryColors[p.categoria?.id] || '#E8621A';
            const icon = L.divIcon({
                className: '',
                html: `<div style="width:28px;height:28px;background:${color};border:3px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px ${color}99;"></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -32]
            });
            const m = L.marker([p.latitud, p.longitud], { icon });
            m.addTo(markersLayer.current);
            m.on('click', () => {
                map.flyTo([p.latitud, p.longitud], 16);
                setPreviewPlace(p);
                setSelectedPlace(null);
            });
        });
    }, [map, filteredPlaces]);

    const handlePlaceClick = (p) => {
        if (map) map.flyTo([p.latitud, p.longitud], 16);
        setPreviewPlace(null);
        setSelectedPlace(p);
    };

    const handleClearFilters = () => {
        setActiveChip("");
        setShowFavorites(false);
        setSearchQuery("");
        setResultadosVisibles(20);
    };

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        setResultadosVisibles(20);
    };

    const handleSuggestionClick = (suggestion) => handleSearchChange(suggestion);

    const handleCategoryToggle = (categoryId) => {
        setActiveChip(activeChip === categoryId ? "" : categoryId);
        setResultadosVisibles(20);
    };

    const handleFavoritesToggle = () => {
        setShowFavorites(!showFavorites);
        setResultadosVisibles(20);
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
        <div className="app-wrapper immersive-layout">
            {/* [MODIFICACIÓN] El mapa ocupa todo el fondo ahora */}
            <div className="immersive-map-bg">
                <div id="map" ref={mapRef}></div>
            </div>

            <Navbar onOpenAbout={() => setShowAboutModal(true)} />

            <MapSearchPanel
                activeChip={activeChip}
                categories={categories}
                categoryColors={categoryColors}
                error={error}
                favorites={favorites}
                filteredPlaces={filteredPlaces}
                loading={loading}
                onCategoryToggle={handleCategoryToggle}
                onClearFilters={handleClearFilters}
                onFavoritesToggle={handleFavoritesToggle}
                onLoadMore={() => setResultadosVisibles(visible => visible + 20)}
                onPlaceClick={handlePlaceClick}
                onSearchChange={handleSearchChange}
                onSuggestionClick={handleSuggestionClick}
                onToggleFavorite={toggleFavorite}
                resultadosVisibles={resultadosVisibles}
                searchQuery={searchQuery}
                selectedPlace={selectedPlace}
                showFavorites={showFavorites}
                suggestions={suggestions}
            />

            {/* [MODIFICACIÓN] Botón de centrar mapa (ahora flotante abajo a la derecha) */}
            <button className="immersive-recenter-btn" onClick={() => map?.setView([CENTER.lat, CENTER.lng], 14)}>
                📍
            </button>

            {/* MiniCard: preview flotante al tocar un pin */}
            <MiniCard
                place={previewPlace}
                onVerMas={() => {
                    setSelectedPlace(previewPlace);
                    setPreviewPlace(null);
                }}
                onClose={() => setPreviewPlace(null)}
            />

            {/* Panel lateral de detalles del lugar */}
            <PlaceModal
                key={selectedPlace?.id}
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
            />

            {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}

            {/* Modal de Permiso de Ubicación */}
            {showLocationModal && (
                <LocationPermissionModal
                    onAllow={() => {
                        setShowLocationModal(false);
                        // Al ocultar el modal, intentamos obtener la ubicación
                        // Lo que activará el prompt del navegador
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                () => {}, // el watchPosition del useEffect atrapará el cambio
                                () => setError("Permiso denegado por el navegador.")
                            );
                        }
                    }}
                    onDeny={() => {
                        setShowLocationModal(false);
                        setError("Has denegado el acceso a tu ubicación. Algunas funciones no estarán disponibles.");
                    }}
                />
            )}
        </div>
    );
}

export default MapaView;
