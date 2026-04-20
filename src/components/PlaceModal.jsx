import { useState, useEffect } from 'react';
import { MapPin, Phone, MessageCircle, Map, Award, ArrowLeft, Heart, Clock } from 'lucide-react';

function PlaceModal({ place, onClose }) {
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (place) {
            const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
            setIsFavorite(favs.some(f => f.id === place.id));
        }
    }, [place]);

    if (!place) return null;

    const toggleFavorite = () => {
        const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
        if (isFavorite) {
            const newFavs = favs.filter(f => f.id !== place.id);
            localStorage.setItem('favoritos', JSON.stringify(newFavs));
            setIsFavorite(false);
        } else {
            favs.push(place);
            localStorage.setItem('favoritos', JSON.stringify(favs));
            setIsFavorite(true);
        }
    };

    const callPhone = (phone) => window.open(`tel:${phone}`);
    const sendWhatsApp = (phone, name) => {
        const msg = encodeURIComponent(
            `Hola, vi a ${name} en Puerto Informa y me gustaría consultar sobre sus servicios.`
        );
        window.open(`https://wa.me/${phone.replace('+', '')}?text=${msg}`);
    };
    const openInMaps = (lat, lng) => {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`);
    };

    return (
        <div className="aesthetic-modal-overlay" onClick={onClose}>
            <div className="aesthetic-modal" onClick={(e) => e.stopPropagation()}>
                {/* Lado Izquierdo: Imagen */}
                <div className="aesthetic-modal-left">
                    <button className="aesthetic-back-btn" onClick={onClose} aria-label="Volver">
                        <ArrowLeft size={20} />
                    </button>
                    {place.urlImagen ? (
                        <img src={place.urlImagen} alt={place.nombre} />
                    ) : (
                        <div className="aesthetic-no-img">Sin imagen</div>
                    )}
                </div>

                {/* Lado Derecho: Información */}
                <div className="aesthetic-modal-right">
                    <div className="aesthetic-modal-content">
                        <div className="aesthetic-top-row">
                            <div className="aesthetic-category-badge">
                                {place.categoria?.nombre?.toUpperCase() || 'PUNTO DE INTERÉS'}
                            </div>
                            <div className="aesthetic-xp-badge">
                                <Award size={16} color="#E8621A" />
                                <span>{place.puntosQueOtorga || 0} XP</span>
                            </div>
                        </div>
                        
                        <h2 className="aesthetic-title">{place.nombre}</h2>

                        <p className="aesthetic-description">
                            {place.descripcion || "Un espacio perfecto para pasear, disfrutar de la brisa marina y capturar los mejores atardeceres en el puerto."}
                        </p>

                        <div className="aesthetic-info-grid">
                            <div className="info-item">
                                <Clock size={16} color="#E8621A" />
                                <span>Abierto 24h</span>
                            </div>
                            {place.direccion ? (
                                <div className="info-item">
                                    <MapPin size={16} color="#E8621A" />
                                    <span>{place.direccion}</span>
                                </div>
                            ) : (
                                <div className="info-item">
                                    <MapPin size={16} color="#E8621A" />
                                    <span>Ubicación en el mapa</span>
                                </div>
                            )}
                            {place.telefono && (
                                <div className="info-item clickable" onClick={() => callPhone(place.telefono)}>
                                    <Phone size={16} color="#E8621A" />
                                    <span>{place.telefono}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="aesthetic-actions">
                        <button 
                            className="aesthetic-btn-primary"
                            onClick={() => openInMaps(place.latitud, place.longitud)}
                        >
                            CÓMO LLEGAR
                        </button>
                        {place.telefono ? (
                            <button className="aesthetic-btn-secondary" onClick={() => sendWhatsApp(place.telefono, place.nombre)} aria-label="WhatsApp">
                                <MessageCircle size={20} />
                            </button>
                        ) : (
                            <button 
                                className="aesthetic-btn-secondary" 
                                aria-label="Favorito"
                                onClick={toggleFavorite}
                            >
                                <Heart 
                                    size={20} 
                                    fill={isFavorite ? "#E8621A" : "transparent"} 
                                    color={isFavorite ? "#E8621A" : "rgba(255, 255, 255, 0.6)"} 
                                />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlaceModal;