import { useState } from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../Resources/logoFinal.ico';

function Navbar({ onSearch, onToggleFilters }) {

    const [menuAbierto, setMenuAbierto] = useState(false);

    return (
        <header className="navbar-header">

            {/* ── Logo (izquierda) ── */}
            <div className="header-left">
                <img src={logoIcon} alt="Logo" className="logo-navbar" />
            </div>

            {/* ── Buscador (centro) ── */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Buscar..."
                    className="search-input" // 🔥 FIX
                    onChange={(e) => onSearch(e.target.value)}  
                />
            </div>

            {/* ── Sección derecha ── */}
            <div className="header-right">

                {/* Botón filtros */}
                <button className="filters-btn" onClick={onToggleFilters}>
                    ⚙️ Filtros
                </button>

                {/* Menú hamburguesa */}
                <div className="menu-container" style={{ position: "relative" }}>
                    <button
                        className="three-dots-btn"
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        aria-label="Menú"
                    >
                        {menuAbierto ? '✕' : '☰'}
                    </button>

                    {menuAbierto && (
                        <div className="dropdown-menu">

                            <Link
                                to="/perfil"
                                className="dropdown-item"
                                onClick={() => setMenuAbierto(false)}
                            >
                                🧑‍✈️ Perfil
                            </Link>

                            <Link
                                to="/buses"
                                className="dropdown-item"
                                onClick={() => setMenuAbierto(false)}
                            >
                                🚌 Buses
                            </Link>

                            <div className="dropdown-divider"></div>

                            <button
                                className="dropdown-item dropdown-logout"
                                onClick={() => {
                                    setMenuAbierto(false);
                                    console.log('Cerrando sesión...');
                                }}
                            >
                                🚪 Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Navbar;