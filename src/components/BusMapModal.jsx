import { useEffect, useRef, useState } from 'react';
import { X, Navigation, MapPin, AlertCircle, Loader } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths (Vite no los copia automáticamente)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icono personalizado naranja para origen/destino de la ruta del bus
function createBusIcon(color = '#E8621A', label = '') {
    return L.divIcon({
        className: '',
        html: `
            <div style="
                width:36px; height:36px;
                background:${color};
                border:3px solid white;
                border-radius:50% 50% 50% 4px;
                transform:rotate(-45deg);
                box-shadow:0 3px 12px rgba(0,0,0,0.5);
                display:flex; align-items:center; justify-content:center;
            ">
                <div style="transform:rotate(45deg); color:white; font-size:14px;">🚌</div>
            </div>
            ${label ? `<div style="
                position:absolute; top:40px; left:50%; transform:translateX(-50%);
                background:rgba(20,20,30,0.9); color:white; font-size:10px;
                padding:2px 6px; border-radius:4px; white-space:nowrap;
                font-family:sans-serif; font-weight:600; letter-spacing:0.3px;
            ">${label}</div>` : ''}
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40],
    });
}

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
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
}

// Llama a OSRM (gratuito, no necesita API key) para obtener la polilínea de la ruta
async function fetchRoute(from, to) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM no disponible');
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Sin ruta disponible');
    const route = data.routes[0];
    // GeoJSON coords son [lng, lat], Leaflet necesita [lat, lng]
    const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const distKm = (route.distance / 1000).toFixed(1);
    const durMin = Math.round(route.duration / 60);
    return { coords, distKm, durMin };
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
function BusMapModal({ ruta, onClose }) {
    const mapRef     = useRef(null);
    const mapInstRef = useRef(null);
    const [estado, setEstado] = useState('loading'); // 'loading' | 'ok' | 'noGeo' | 'noCoords' | 'error'
    const [info, setInfo]     = useState(null); // { distKm, durMin }

    const origenCoords  = ruta?.lugarOrigen?.latitud  ? { lat: ruta.lugarOrigen.latitud,  lng: ruta.lugarOrigen.longitud  } : null;
    const destinoCoords = ruta?.lugarDestino?.latitud ? { lat: ruta.lugarDestino.latitud, lng: ruta.lugarDestino.longitud } : null;

    useEffect(() => {
        if (!mapRef.current) return;
        // Evitar doble init
        if (mapInstRef.current) return;

        // Necesitamos al menos las coords de origen y destino de la ruta
        if (!origenCoords || !destinoCoords) {
            setEstado('noCoords');
            return;
        }

        // Crear el mapa centrado en el origen del bus
        const map = L.map(mapRef.current, {
            center: [origenCoords.lat, origenCoords.lng],
            zoom: 14,
            zoomControl: false,
        });
        mapInstRef.current = map;

        // Tile oscuro — igual al estilo visual del resto de la app
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CartoDB',
            maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Marcadores de origen y destino de la ruta
        const mOrigen  = L.marker([origenCoords.lat,  origenCoords.lng],  { icon: createBusIcon('#E8621A', ruta.lugarOrigen?.nombre  || 'Origen')  }).addTo(map);
        const mDestino = L.marker([destinoCoords.lat, destinoCoords.lng], { icon: createBusIcon('#22C55E', ruta.lugarDestino?.nombre || 'Destino') }).addTo(map);

        mOrigen.bindPopup(`<b>🚌 Origen</b><br/>${ruta.lugarOrigen?.nombre || ''}`);
        mDestino.bindPopup(`<b>📍 Destino</b><br/>${ruta.lugarDestino?.nombre || ''}`);

        // Intentar obtener ubicación del usuario y trazar ruta desde ahí
        const dibujarRuta = async (userPos) => {
            if (userPos) {
                L.marker([userPos.lat, userPos.lng], { icon: createUserIcon() })
                    .addTo(map)
                    .bindPopup('📍 Tu ubicación');
            }

            try {
                // Ruta: usuario → origen del bus → destino del bus
                const segmento1 = userPos
                    ? await fetchRoute(userPos, origenCoords)
                    : null;
                const segmento2 = await fetchRoute(origenCoords, destinoCoords);

                // Dibujar segmento usuario → parada (azul punteado)
                if (segmento1) {
                    L.polyline(segmento1.coords, {
                        color: '#4A90E2',
                        weight: 4,
                        opacity: 0.8,
                        dashArray: '8, 8',
                    }).addTo(map);
                }

                // Dibujar ruta del bus (naranja)
                L.polyline(segmento2.coords, {
                    color: '#E8621A',
                    weight: 5,
                    opacity: 0.95,
                    lineJoin: 'round',
                    lineCap: 'round',
                }).addTo(map);

                // Ajustar vista para mostrar todo
                const allCoords = [
                    ...(segmento1?.coords || []),
                    ...segmento2.coords,
                    ...(userPos ? [[userPos.lat, userPos.lng]] : []),
                ];
                const bounds = L.latLngBounds(allCoords);
                map.fitBounds(bounds, { padding: [50, 50] });

                setInfo({
                    distKm:  segmento2.distKm,
                    durMin:  segmento2.durMin,
                    userDist: segmento1 ? segmento1.distKm : null,
                    userDur:  segmento1 ? segmento1.durMin  : null,
                });
                setEstado('ok');
            } catch (err) {
                console.error('Error trazando ruta:', err);
                // Sin ruta OSRM — dibujamos línea recta como fallback
                const pts = userPos
                    ? [[userPos.lat, userPos.lng], [origenCoords.lat, origenCoords.lng], [destinoCoords.lat, destinoCoords.lng]]
                    : [[origenCoords.lat, origenCoords.lng], [destinoCoords.lat, destinoCoords.lng]];
                L.polyline(pts, { color: '#E8621A', weight: 4, dashArray: '6,6' }).addTo(map);
                map.fitBounds(L.latLngBounds(pts), { padding: [50, 50] });
                setEstado('ok');
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => dibujarRuta({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                ()    => dibujarRuta(null), // sin permiso → mostrar igual sin ubicación del user
                { timeout: 6000, maximumAge: 60000 }
            );
        } else {
            dibujarRuta(null);
        }

        return () => {
            map.remove();
            mapInstRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!ruta) return null;

    const origen  = ruta.lugarOrigen?.nombre  || 'Origen';
    const destino = ruta.lugarDestino?.nombre || 'Destino';

    return (
        <div className="busmap-overlay" onClick={onClose}>
            <div className="busmap-modal" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="busmap-header">
                    <div className="busmap-header-info">
                        <span className="busmap-route-label">
                            <span className="busmap-dot origin"></span>
                            {origen}
                        </span>
                        <span className="busmap-arrow">→</span>
                        <span className="busmap-route-label">
                            <span className="busmap-dot dest"></span>
                            {destino}
                        </span>
                    </div>
                    <button className="busmap-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* ── Mapa ── */}
                <div className="busmap-map-wrapper">
                    {estado === 'loading' && (
                        <div className="busmap-state">
                            <Loader size={32} className="busmap-spin" />
                            <p>Trazando ruta...</p>
                        </div>
                    )}
                    {estado === 'noCoords' && (
                        <div className="busmap-state error">
                            <AlertCircle size={32} />
                            <p>Esta ruta no tiene coordenadas disponibles.</p>
                        </div>
                    )}
                    <div
                        ref={mapRef}
                        style={{ width: '100%', height: '100%', opacity: estado === 'loading' ? 0 : 1, transition: 'opacity 0.4s' }}
                    />
                </div>

                {/* ── Info barra inferior ── */}
                {estado === 'ok' && (
                    <div className="busmap-footer">
                        <div className="busmap-legend">
                            <span className="busmap-legend-item">
                                <span className="busmap-legend-line orange"></span>
                                Ruta del bus
                            </span>
                            <span className="busmap-legend-item">
                                <span className="busmap-legend-line blue dashed"></span>
                                Tu camino
                            </span>
                        </div>
                        {info && (
                            <div className="busmap-stats">
                                {info.userDist && (
                                    <span className="busmap-stat blue">
                                        <Navigation size={13} />
                                        {info.userDur} min · {info.userDist} km hasta parada
                                    </span>
                                )}
                                <span className="busmap-stat orange">
                                    <MapPin size={13} />
                                    Ruta: {info.durMin} min · {info.distKm} km
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BusMapModal;
