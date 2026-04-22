import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Phone, MessageCircle, Map, Award, ArrowLeft, Heart, Clock, X } from 'lucide-react';

function PlaceModal({ place, onClose }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [fullscreenImg, setFullscreenImg] = useState(null);
    const dragStartY = useRef(0);
    const modalRef = useRef(null);

    useEffect(() => {
        if (place) {
            const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
            setIsFavorite(favs.some(f => f.id === place.id));
            setDragOffset(0);
            setFullscreenImg(null);
        }
    }, [place]);

    // ── Touch handlers para arrastrar el bottom-sheet ──
    const handleTouchStart = useCallback((e) => {
        dragStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - dragStartY.current;
        if (diff > 0) {
            setDragOffset(diff);
        }
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
        if (dragOffset > 120) {
            setDragOffset(window.innerHeight);
            setTimeout(() => {
                onClose();
                setDragOffset(0);
            }, 250);
        } else {
            setDragOffset(0);
        }
    }, [dragOffset, onClose]);

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

    // Estilo dinámico para el arrastre
    const modalDragStyle = dragOffset > 0 ? {
        transform: `translateY(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
    } : {};

    // Opacidad del overlay según arrastre
    const overlayStyle = dragOffset > 0 ? {
        backgroundColor: `rgba(0, 0, 0, ${Math.max(0.1, 0.7 - (dragOffset / 500))})`,
    } : {};

    return (
        <>
            {/* ── Visor de imagen a pantalla completa ── */}
            {fullscreenImg && (
                <div className="fullscreen-img-overlay" onClick={() => setFullscreenImg(null)}>
                    <button className="fullscreen-close-btn" onClick={() => setFullscreenImg(null)}>
                        <X size={24} />
                    </button>
                    <img src={fullscreenImg} alt={place.nombre} className="fullscreen-img" />
                </div>
            )}

            <div className="aesthetic-modal-overlay" onClick={onClose} style={overlayStyle}>
                <div
                    ref={modalRef}
                    className="aesthetic-modal"
                    onClick={(e) => e.stopPropagation()}
                    style={modalDragStyle}
                >
                    {/* Barra de arrastre (drag handle) — Solo funcional en móvil */}
                    <div
                        className="modal-drag-handle"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="drag-bar"></div>
                    </div>

                    {/* Galería de fotos: 1 principal + 2 placeholders */}
                    <div className="aesthetic-modal-left">
                        <button className="aesthetic-back-btn" onClick={onClose} aria-label="Volver">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="gallery-grid">
                            {/* Foto principal */}
                            <div
                                className="gallery-main"
                                onClick={() => place.urlImagen && setFullscreenImg(place.urlImagen)}
                            >
                                {place.urlImagen ? (
                                    <img src={place.urlImagen} alt={place.nombre} />
                                ) : (
                                    <div className="aesthetic-no-img">Sin imagen</div>
                                )}
                                {place.urlImagen && <span className="gallery-tap-hint">Tocar para ampliar</span>}
                            </div>
                            {/* Placeholders para fotos futuras */}
                            <div className="gallery-thumb placeholder">
                                <span>📷</span>
                            </div>
                            <div className="gallery-thumb placeholder">
                                <span>📷</span>
                            </div>
                        </div>
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
        </>
    );
}

export default PlaceModal;