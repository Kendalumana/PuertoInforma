function PlaceModal({ place, onClose }) {
    if (!place) return null;

    const callPhone    = (phone) => window.open(`tel:${phone}`);
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
        <div
            className="modal-overlay"
            style={{ display: 'flex' }}
            onClick={onClose}
        >
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">{place.nombre}</h2>
                        <span className="modal-subtitle">{place.categoria?.nombre}</span>
                    </div>
                    <button className="close-modal" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="modal-images">
                        {place.urlImagen
                            ? <img
                                src={place.urlImagen}
                                className="modal-image"
                                alt={`Vista de ${place.nombre}`}
                                onError={(e) =>
                                    e.target.src = 'https://via.placeholder.com/300x200?text=Sin+imagen'
                                }
                              />
                            : <div className="no-image">Sin fotos disponibles</div>
                        }
                    </div>

                    <div className="modal-details">
                        {place.descripcion && (
                            <p>{place.descripcion}</p>
                        )}
                        {place.direccion && (
                            <p><strong>📍 Dirección:</strong> {place.direccion}</p>
                        )}
                        {place.telefono && (
                            <p><strong>📞 Teléfono:</strong> {place.telefono}</p>
                        )}
                        <p><strong>🏆 Puntos:</strong> {place.puntosQueOtorga} pts</p>
                    </div>

                    <div className="modal-actions">
                        {place.telefono && (
                            <>
                                <button
                                    className="action-btn phone-btn"
                                    onClick={() => callPhone(place.telefono)}
                                >
                                    📞 Llamar
                                </button>
                                <button
                                    className="action-btn whatsapp-btn"
                                    onClick={() => sendWhatsApp(place.telefono, place.nombre)}
                                >
                                    💬 WhatsApp
                                </button>
                            </>
                        )}
                        <button
                            className="action-btn maps-btn"
                            onClick={() => openInMaps(place.latitud, place.longitud)}
                        >
                            🗺️ Google Maps
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlaceModal;