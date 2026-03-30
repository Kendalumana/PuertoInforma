// ============================================================
// PlaceModal.jsx — Modal de detalle de cada comercio
// Se renderiza solo cuando selectedPlace tiene un valor.
// App.jsx le pasa el comercio seleccionado y la función para cerrarlo.
// ============================================================

function PlaceModal({ place, onClose }) {

    // Si no hay comercio seleccionado, no renderiza nada
    if (!place) return null;

    // --- Funciones de contacto ---

    // Abre la app de teléfono
    const callPhone = (phone) => window.open(`tel:${phone}`);

    // Abre WhatsApp con un mensaje pre-escrito
    const sendWhatsApp = (phone, name) => {
        const msg = encodeURIComponent(
            `Hola, vi a ${name} en Puerto Informa y me gustaría consultar sobre sus servicios.`
        );
        window.open(`https://wa.me/${phone.replace('+', '')}?text=${msg}`);
    };

    // Abre Google Maps en las coordenadas del comercio
    const openInMaps = (lat, lng) => {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`);
    };

    return (
        // Overlay oscuro — clic fuera del modal lo cierra
        <div
            className="modal-overlay"
            style={{ display: 'flex' }}
            onClick={onClose}
        >
            {/* Contenido del modal — stopPropagation evita que el clic
                interno cierre el modal por accidente */}
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Encabezado con nombre, categoría y botón de cerrar */}
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">{place.name}</h2>
                        <span className="modal-subtitle">{place.category}</span>
                    </div>
                    <button className="close-modal" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">

                    {/* Galería de imágenes */}
                    <div className="modal-images">
                        {place.images && place.images.length > 0
                            ? place.images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    className="modal-image"
                                    alt={`Vista de ${place.name}`}
                                    onError={(e) =>
                                        e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible'
                                    }
                                />
                            ))
                            : <div className="no-image">Sin fotos disponibles</div>
                        }
                    </div>

                    {/* Información del comercio */}
                    <div className="modal-details">
                        <p><strong>📍 Dirección:</strong> {place.address}</p>
                        <p><strong>⏰ Horario:</strong> {place.hours}</p>

                        {/* Badge de SINPE — solo aparece si acceptsSinpe es true */}
                        {place.acceptsSinpe && (
                            <p className="sinpe-badge">✅ Acepta SINPE Móvil</p>
                        )}

                        {/* Tags del comercio */}
                        <div className="modal-tags">
                            {place.tags?.map(t => (
                                <span key={t} className="tag-item">#{t}</span>
                            ))}
                        </div>
                    </div>

                    {/* Botones de contacto */}
                    <div className="modal-actions">
                        <button
                            className="action-btn phone-btn"
                            onClick={() => callPhone(place.phone)}
                        >
                            📞 Llamar
                        </button>
                        <button
                            className="action-btn whatsapp-btn"
                            onClick={() => sendWhatsApp(place.phone, place.name)}
                        >
                            💬 WhatsApp
                        </button>
                        <button
                            className="action-btn maps-btn"
                            onClick={() => openInMaps(place.lat, place.lng)}
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