import { Bus, MapPin } from 'lucide-react';

function BusDestinationSelector({
    activeRoute,
    destinoSeleccionado,
    destinos,
    formatHora,
    getNextDeparture,
    loading,
    onDestinoChange,
    onRouteChange,
    origenesPosibles,
    routes,
}) {
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                ¿PARA DÓNDE VAS?
            </p>

            {loading ? (
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                    {[1, 2, 3].map(index => <div key={index} className="buses-chip-skeleton" style={{ width: 140, height: 56, borderRadius: 14 }} />)}
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                    {destinos.map(destino => {
                        const activo = destinoSeleccionado === destino;
                        const numeroRutas = routes.filter(route => route.endsWith(`→ ${destino}`)).length;
                        const proximaSalida = getNextDeparture(destino);

                        return (
                            <button
                                key={destino}
                                onClick={() => onDestinoChange(destino)}
                                style={{
                                    flexShrink: 0,
                                    background: activo ? 'linear-gradient(135deg, #E8621A, #FF9B6A)' : 'rgba(255,255,255,0.05)',
                                    border: activo ? 'none' : '1.5px solid rgba(255,255,255,0.08)',
                                    borderRadius: 14,
                                    padding: '0.75rem 1.1rem',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    minWidth: 140,
                                    transition: 'all 0.2s',
                                    boxShadow: activo ? '0 4px 18px rgba(232,98,26,0.4)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                                    <MapPin size={13} color={activo ? '#fff' : '#E8621A'} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                                        {destino}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: activo ? 'rgba(255,255,255,0.75)' : '#666' }}>
                                    {proximaSalida ? `Próximo: ${formatHora(proximaSalida.horaSalida)}` : 'Sin salidas hoy'}
                                    {numeroRutas > 1 && (
                                        <span style={{ marginLeft: 6, background: activo ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>
                                            {numeroRutas} rutas
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {!loading && origenesPosibles.length > 1 && (
                <div style={{ marginTop: '0.85rem' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                        DESDE DÓNDE SALÍS:
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {origenesPosibles.map(origen => {
                            const ruta = `${origen} → ${destinoSeleccionado}`;
                            const activo = activeRoute === ruta;
                            return (
                                <button
                                    key={origen}
                                    onClick={() => onRouteChange(ruta)}
                                    style={{
                                        background: activo ? 'rgba(232,98,26,0.2)' : 'rgba(255,255,255,0.04)',
                                        border: activo ? '1.5px solid #E8621A' : '1.5px solid rgba(255,255,255,0.07)',
                                        borderRadius: 20,
                                        padding: '0.4rem 1rem',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        color: activo ? '#E8621A' : 'rgba(255,255,255,0.55)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                    }}
                                >
                                    <Bus size={11} />
                                    {origen}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default BusDestinationSelector;
