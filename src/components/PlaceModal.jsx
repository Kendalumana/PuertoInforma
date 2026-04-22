import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Phone, MessageCircle, Map, Award, ArrowLeft, Heart, Clock, X } from 'lucide-react';

function PlaceModal({ place, onClose }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [fullscreenImg, setFullscreenImg] = useState(null);

    // ── Drag refs (refs para evitar closures viejos en touch handlers) ──
    const modalRef = useRef(null);
    const dragStartY = useRef(0);
    const currentOffset = useRef(0);
    const dragging = useRef(false);

    useEffect(() => {
        if (place) {
            const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
            setIsFavorite(favs.some(f => f.id === place.id));
            setFullscreenImg(null);
            currentOffset.current = 0;
            if (modalRef.current) {
                modalRef.current.style.transform = '';
                modalRef.current.style.transition = '';
            }
        }
    }, [place]);

    // ── Touch handlers: manipulación directa del DOM via refs ──
    // No usamos useCallback aquí porque estas funciones usan refs, no estado
    const handleTouchStart = (e) => {
        dragging.current = true;
        dragStartY.current = e.touches[0].clientY;
        if (modalRef.current) {
            modalRef.current.style.transition = 'none';
        }
    };

    const handleTouchMove = (e) => {
        if (!dragging.current) return;
        const diff = e.touches[0].clientY - dragStartY.current;
        if (diff > 0) {
            currentOffset.current = diff;
            if (modalRef.current) {
                modalRef.current.style.transform = `translateY(${diff}px)`;
            }
        }
    };

    const handleTouchEnd = () => {
        dragging.current = false;
        const offset = currentOffset.current;

        if (modalRef.current) {
            modalRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
        }

        if (offset > 120) {
            if (modalRef.current) {
                modalRef.current.style.transform = 'translateY(100vh)';
            }
            setTimeout(() => {
                onClose();
                currentOffset.current = 0;
                if (modalRef.current) {
                    modalRef.current.style.transform = '';
                    modalRef.current.style.transition = '';
                }
            }, 300);
        } else {
            currentOffset.current = 0;
            if (modalRef.current) {
                modalRef.current.style.transform = 'translateY(0)';
            }
        }
    };

    if (!place) return null;

    // ── Funciones con useCallback para evitar re-renders innecesarios ──
    const toggleFavorite = useCallback(() => {
        const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
        setIsFavorite(prev => {
            if (prev) {
                const newFavs = favs.filter(f => f.id !== place.id);
                localStorage.setItem('favoritos', JSON.stringify(newFavs));
                return false;
            } else {
                favs.push(place);
                localStorage.setItem('favoritos', JSON.stringify(favs));
                return true;
            }
        });
    }, [place]);

    const callPhone = useCallback((phone) => {
        window.open(`tel:${phone}`);
    }, []);

    const sendWhatsApp = useCallback((phone, name) => {
        const msg = encodeURIComponent(
            `Hola, vi a ${name} en Puerto Informa y me gustaría consultar sobre sus servicios.`
        );
        window.open(`https://wa.me/${phone.replace('+', '')}?text=${msg}`);
    }, []);

    const openInMaps = useCallback((lat, lng) => {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`);
    }, []);

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

            <div className="aesthetic-modal-overlay" onClick={onClose}>
                <div
                    ref={modalRef}
                    className="aesthetic-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── Zona arrastrable: handle + galería (touch-action: none en CSS) ── */}
                    <div
                        className="modal-draggable-zone"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Barra de arrastre visual */}
                        <div className="modal-drag-handle">
                            <div className="drag-bar"></div>
                        </div>

                        {/* Galería de fotos: 1 principal + 2 placeholders */}
                        <div className="aesthetic-modal-left">
                            <button className="aesthetic-back-btn" onClick={onClose} aria-label="Volver">
                                <ArrowLeft size={20} />
                            </button>
                            <div className="gallery-grid">
                                <div
                                    className="gallery-main"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (place.urlImagen) setFullscreenImg(place.urlImagen);
                                    }}
                                >
                                    {place.urlImagen ? (
                                        <img src={place.urlImagen} alt={place.nombre} draggable="false" />
                                    ) : (
                                        <div className="aesthetic-no-img">Sin imagen</div>
                                    )}
                                    {place.urlImagen && <span className="gallery-tap-hint">Tocar para ampliar</span>}
                                </div>
                                <div className="gallery-thumb placeholder">
                                    <span>📷</span>
                                </div>
                                <div className="gallery-thumb placeholder">
                                    <span>📷</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Información (esta parte tiene scroll libre) ── */}
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