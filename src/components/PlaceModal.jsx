import { useState, useRef, useCallback } from 'react';
import { MapPin, Phone, MessageCircle, Map, Award, ArrowLeft, Heart, Clock, X } from 'lucide-react';

function PlaceModal({ place, onClose }) {
    const [isFavorite, setIsFavorite] = useState(() => {
        try {
            const favorites = JSON.parse(localStorage.getItem('favoritos') || '[]');
            return favorites.some(favorite => (typeof favorite === 'object' ? favorite.id : favorite) === place?.id);
        } catch {
            return false;
        }
    });
    const [fullscreenImg, setFullscreenImg] = useState(null);

    // ── Drag refs (refs para evitar closures viejos en touch handlers) ──
    const modalRef = useRef(null);
    const dragStartY = useRef(0);
    const currentOffset = useRef(0);
    const dragging = useRef(false);

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

    // ── Funciones con useCallback para evitar re-renders innecesarios ──
    const toggleFavorite = useCallback(() => {
        const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
        const favoriteIds = favs.map(favorite => typeof favorite === 'object' ? favorite.id : favorite);
        setIsFavorite(prev => {
            if (prev) {
                const newFavs = favoriteIds.filter(id => id !== place.id);
                localStorage.setItem('favoritos', JSON.stringify(newFavs));
                return false;
            } else {
                localStorage.setItem('favoritos', JSON.stringify([...favoriteIds, place.id]));
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

    if (!place) return null;

    return (
        <>
            {/* ── Visor de imagen a pantalla completa ── */}
            {fullscreenImg && (
                <div
                    className="fullscreen-img-overlay"
                    onClick={() => setFullscreenImg(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Imagen ampliada de ${place.nombre}`}
                >
                    <button
                        className="fullscreen-close-btn"
                        onClick={() => setFullscreenImg(null)}
                        aria-label="Cerrar imagen"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <img src={fullscreenImg} alt={`${place.nombre} — vista ampliada`} className="fullscreen-img" />
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
                            {(place.urlImagen || place.urlImagen2 || place.urlImagen3) && (
                                <div className="gallery-grid">
                                    {place.urlImagen && (
                                        <button
                                            className="gallery-main"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFullscreenImg(place.urlImagen);
                                            }}
                                            aria-label={`Ampliar foto principal de ${place.nombre}`}
                                        >
                                            <img src={place.urlImagen} alt={place.nombre} draggable="false" />
                                            <span className="gallery-tap-hint">Tocar para ampliar</span>
                                        </button>
                                    )}
                                    {place.urlImagen2 && (
                                        <button
                                            className="gallery-thumb"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFullscreenImg(place.urlImagen2);
                                            }}
                                            aria-label={`Ampliar segunda foto de ${place.nombre}`}
                                        >
                                            <img src={place.urlImagen2} alt={`${place.nombre} 2`} draggable="false" />
                                            <span className="gallery-tap-hint">Tocar para ampliar</span>
                                        </button>
                                    )}
                                    {place.urlImagen3 && (
                                        <button
                                            className="gallery-thumb"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFullscreenImg(place.urlImagen3);
                                            }}
                                            aria-label={`Ampliar tercera foto de ${place.nombre}`}
                                        >
                                            <img src={place.urlImagen3} alt={`${place.nombre} 3`} draggable="false" />
                                            <span className="gallery-tap-hint">Tocar para ampliar</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Información (esta parte tiene scroll libre) ── */}
                    <div className="aesthetic-modal-right">
                        <div className="aesthetic-modal-content">
                            <div className="aesthetic-top-row">
                                <div className="aesthetic-category-badge">
                                    {place.categoria?.nombre?.toUpperCase() || 'PUNTO DE INTERÉS'}
                                </div>
                                {place.puntosQueOtorga > 0 && (
                                    <div className="aesthetic-xp-badge">
                                        <Award size={16} color="#E8621A" />
                                        <span>{place.puntosQueOtorga} XP</span>
                                    </div>
                                )}
                            </div>
                            
                            <h2 className="aesthetic-title">{place.nombre}</h2>

                            {place.descripcion && (
                                <p className="aesthetic-description">
                                    {place.descripcion}
                                </p>
                            )}

                            <div className="aesthetic-info-grid">
                                {place.horario && (
                                    <div className="info-item">
                                        <Clock size={16} color="#E8621A" />
                                        <span>{place.horario}</span>
                                    </div>
                                )}
                                {place.direccion && (
                                    <div className="info-item">
                                        <MapPin size={16} color="#E8621A" />
                                        <span>{place.direccion}</span>
                                    </div>
                                )}
                                {place.telefono && (
                                    <button
                                        className="info-item clickable"
                                        onClick={() => callPhone(place.telefono)}
                                        aria-label={`Llamar al ${place.telefono}`}
                                    >
                                        <Phone size={16} color="#E8621A" />
                                        <span>{place.telefono}</span>
                                    </button>
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
