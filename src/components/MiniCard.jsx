import '../styles/MiniCard.css';

function MiniCard({ place, onVerMas, onClose }) {
    if (!place) return null;

    return (
        <div className="minicard-wrapper">
            <button className="minicard-close" onClick={onClose}>✕</button>

            {place.urlImagen
                ? <img src={place.urlImagen} alt={place.nombre} className="minicard-img" />
                : <div className="minicard-img-placeholder">🏖️</div>
            }

            <div className="minicard-info">
                <span className="minicard-nombre">{place.nombre}</span>
                {place.categoria && (
                    <span className="minicard-categoria">{place.categoria.nombre}</span>
                )}
                <span className="minicard-pts">🏆 {place.puntosQueOtorga} pts</span>
            </div>

            <button className="minicard-btn" onClick={onVerMas}>
                Ver más →
            </button>
        </div>
    );
}

export default MiniCard;