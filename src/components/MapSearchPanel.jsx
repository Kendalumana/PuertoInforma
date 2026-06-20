import LazyImage from './LazyImage';
import { SkeletonList } from './Skeleton';

function MapSearchPanel({
    activeChip,
    categories,
    categoryColors,
    error,
    favorites,
    filteredPlaces,
    loading,
    onCategoryToggle,
    onClearFilters,
    onFavoritesToggle,
    onLoadMore,
    onPlaceClick,
    onSearchChange,
    onSuggestionClick,
    onToggleFavorite,
    resultadosVisibles,
    searchQuery,
    selectedPlace,
    showFavorites,
    suggestions,
}) {
    return (
        <div className="immersive-left-panel">
            <div className="immersive-search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Busca destinos, cultura o experiencias..."
                    className="immersive-search-input"
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
                <button className="immersive-search-btn">Explorar</button>

                {searchQuery.trim().length > 0 && suggestions.length > 0 && (
                    <div className="immersive-suggestions">
                        {suggestions.map((suggestion, index) => (
                            <div key={index} className="suggestion-item" onClick={() => onSuggestionClick(suggestion)}>
                                🔍 {suggestion}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="immersive-categories">
                <button
                    className={`immersive-chip ${!activeChip ? 'active' : ''}`}
                    onClick={onClearFilters}
                >
                    Todos
                </button>
                {categories.map(category => (
                    <button
                        key={category.id}
                        className={`immersive-chip ${activeChip === category.id ? 'active' : ''}`}
                        onClick={() => onCategoryToggle(category.id)}
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                        <span
                            style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: categoryColors[category.id] || '#ccc',
                                marginRight: '6px',
                                boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                            }}
                        />
                        {category.nombre}
                    </button>
                ))}
                <button
                    className={`immersive-chip ${showFavorites ? 'active' : ''}`}
                    onClick={onFavoritesToggle}
                >
                    Favoritos
                </button>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(220, 38, 38, 0.2)',
                    border: '1px solid rgba(220, 38, 38, 0.5)',
                    backdropFilter: 'blur(12px)',
                    color: '#FFF',
                    padding: '1rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {(searchQuery || activeChip || showFavorites) && !selectedPlace && (
                <div className="immersive-results-panel">
                    <div className="results-header">
                        <h2 className="results-title">Comercios encontrados</h2>
                        <span className="results-count">{filteredPlaces.length}</span>
                    </div>
                    {loading && (
                        <div className="results-list" style={{ padding: '1rem' }}>
                            <SkeletonList count={5} />
                        </div>
                    )}
                    {!loading && !error && (
                        <div className="results-list">
                            {filteredPlaces.length > 0 ? (
                                <>
                                    {filteredPlaces.slice(0, resultadosVisibles).map(place => (
                                        <div key={place.id} className="result-card" onClick={() => onPlaceClick(place)}>
                                            <div
                                                className={`favorite-icon ${favorites.includes(place.id) ? 'active' : ''}`}
                                                onClick={(event) => onToggleFavorite(place.id, event)}
                                            >
                                                {favorites.includes(place.id) ? '❤️' : '🤍'}
                                            </div>
                                            {place.urlImagen ? (
                                                <LazyImage src={place.urlImagen} alt={place.nombre} className="result-card-img" />
                                            ) : (
                                                <div className="result-card-img-placeholder">🏖️</div>
                                            )}
                                            <div className="result-card-body">
                                                <div className="result-card-top">
                                                    <span className="result-name">{place.nombre}</span>
                                                    {place.categoria && <span className="result-category">{place.categoria.nombre}</span>}
                                                </div>
                                                {place.descripcion && <p className="result-description">{place.descripcion}</p>}
                                                <div className="result-footer">
                                                    <span className="result-points">🏆 {place.puntosQueOtorga} pts</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredPlaces.length > resultadosVisibles && (
                                        <button className="results-ver-mas" onClick={onLoadMore}>
                                            Ver más ({filteredPlaces.length - resultadosVisibles} restantes)
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p style={{ color: 'rgba(255,255,255,0.5)', padding: '1rem' }}>No se encontraron lugares.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default MapSearchPanel;
