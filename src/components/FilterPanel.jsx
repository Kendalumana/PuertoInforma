// ============================================================
// FilterPanel.jsx — Panel de filtros de búsqueda
// Se muestra/oculta con la clase CSS "visible".
// App.jsx le pasa el estado actual y las funciones para cambiarlo.
// ============================================================

import { CATEGORIES } from '../data/places';

function FilterPanel({ visible, filterCat, filterRating, onChangeCat, onChangeRating, onClear, onClose }) {
    return (
        <div className={`filters-panel ${visible ? 'visible' : ''}`}>

            <div className="filters-title">Configurar Búsqueda</div>

            {/* Filtro por categoría */}
            <div className="filters-row">
                <label>Categoría Específica</label>
                <select
                    value={filterCat}
                    onChange={(e) => onChangeCat(e.target.value)}
                >
                    <option value="">Todas las categorías</option>
                    {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* Filtro por calificación mínima */}
            <div className="filters-row">
                <label>Calificación mínima: {filterRating} ⭐</label>
                <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={filterRating}
                    onChange={(e) => onChangeRating(parseFloat(e.target.value))}
                />
            </div>

            {/* Botones de acción */}
            <div className="filters-actions">
                <button className="btn btn-clear" onClick={onClear}>
                    Limpiar
                </button>
                <button className="btn btn-apply" onClick={onClose}>
                    Listo
                </button>
            </div>
            <p>
                Kendall no se baña y se siente sucio, así que no se baña. Es un poco raro, pero es su decisión.
            </p>

        </div>
    );
}

export default FilterPanel;