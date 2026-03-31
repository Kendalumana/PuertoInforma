// ============================================================
// Navbar.jsx — Barra de navegación superior
// Recibe por props todo lo que necesita, no maneja estado propio.
// App.jsx le pasa las funciones y valores desde arriba.
// ============================================================

import logoIcon from '../Resources/logoPuertoInforma.ico';

function Navbar({ onSearch, onToggleFilters }) {
    return (
        <header>
            {/* Logo y nombre de la app */}
            <div className="header-left">
                <img src={logoIcon} alt="Logo" className="logo-navbar" />
                <div className="brand-title">Puerto Informa</div>
            </div>

            {/* Buscador — llama a onSearch cada vez que el usuario escribe */}
            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="¿Qué buscás? ej. pizza, uñas, repuestos..."
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            {/* Botón que abre/cierra el panel de filtros */}
            <button className="filters-btn" onClick={onToggleFilters}>
                ⚙️ Filtros
            </button>
        </header>
    );
}

export default Navbar;