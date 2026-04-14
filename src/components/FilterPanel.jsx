// ============================================================
// FilterPanel.jsx — Panel de filtros de búsqueda
// Se muestra/oculta con la clase CSS "visible".
// Las categorías vienen de la BD via props, no de places.js
// ============================================================

function FilterPanel({ visible, filterCat, categories = [], onSetCat, onClear, onClose }) {
    return (
        <div className={`filters-panel ${visible ? 'visible' : ''}`}>

            <div className="filters-title">Configurar Búsqueda</div>

            {/* Filtro por categoría — categorías reales de BD */}
            <div className="filters-row">
                <label>Categoría Específica</label>
                <select
                    value={filterCat}
                    onChange={(e) => onSetCat(e.target.value)}
                >
                    <option value="">Todas las categorías</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                </select>
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

        </div>
    );
}

export default FilterPanel;