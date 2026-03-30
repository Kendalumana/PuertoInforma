// ============================================================
// StarRating.jsx — Muestra estrellas visuales según el rating
// Recibe un número (ej: 4.5) y pinta ★ llenas, ½ y vacías
// ============================================================

function StarRating({ rating, max = 5 }) {
    const stars = [];

    for (let i = 1; i <= max; i++) {
        if (rating >= i) {
            // Estrella llena
            stars.push(
                <span key={i} className="star star-full">★</span>
            );
        } else if (rating >= i - 0.5) {
            // Media estrella
            stars.push(
                <span key={i} className="star star-half">★</span>
            );
        } else {
            // Estrella vacía
            stars.push(
                <span key={i} className="star star-empty">★</span>
            );
        }
    }

    return (
        <div className="star-rating">
            {stars}
            {/* Muestra el número al lado para más claridad */}
            <span className="star-number">{rating}</span>
        </div>
    );
}

export default StarRating;