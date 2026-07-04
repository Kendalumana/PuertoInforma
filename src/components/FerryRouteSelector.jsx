import { Anchor, Bookmark, BookmarkCheck } from 'lucide-react';

function FerryRouteSelector({ activeRoute, loading, onRouteChange, onToggleSaved, routes, savedRoutes }) {
    return (
        <div className="transporte-route-chips">
            {loading
                ? [1, 2].map(index => <div key={index} className="transporte-chip-skeleton" />)
                : routes.length === 0
                    ? <button className="transporte-chip active">Sin resultados</button>
                    : routes.map(route => (
                        <button
                            key={route}
                            className={`transporte-chip ${activeRoute === route ? 'active' : ''}`}
                            onClick={() => onRouteChange(route)}
                        >
                            <Anchor size={14} className="transporte-chip-icon" />
                            {route}
                            <span
                                onClick={event => { event.stopPropagation(); onToggleSaved(route); }}
                                style={{ marginLeft: '6px', display: 'flex', alignItems: 'center' }}
                            >
                                {savedRoutes.includes(route)
                                    ? <BookmarkCheck size={13} color="#fff" />
                                    : <Bookmark size={13} style={{ opacity: 0.5 }} />}
                            </span>
                        </button>
                    ))
            }
        </div>
    );
}

export default FerryRouteSelector;
