/**
 * haversine.js — Cálculo de distancia geográfica en metros
 */
function haversineMetros(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio medio de la Tierra en metros
    const rad = (deg) => (deg * Math.PI) / 180.0;
    
    const phi1 = rad(lat1);
    const phi2 = rad(lat2);
    const dphi = rad(lat2 - lat1);
    const dlambda = rad(lon2 - lon1);

    const a =
        Math.sin(dphi / 2.0) ** 2 +
        Math.cos(phi1) * Math.cos(phi2) * (Math.sin(dlambda / 2.0) ** 2);
    
    const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    return R * c;
}

module.exports = { haversineMetros };
