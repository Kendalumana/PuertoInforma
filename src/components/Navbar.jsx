import { useState } from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../Resources/logoFinal.ico';

function Navbar({ onSearch, onToggleFilters }) {

    // Controla si el menú hamburguesa está abierto o cerrado
    const [menuAbierto, setMenuAbierto] = useState(false);

    return (
        <header className="navbar-header">

            {/* ── Logo (izquierda) ── */}
            <div className="header-left">
                <img src={logoIcon} alt="Logo" className="logo-navbar" />
            </div>

            {/* ── Buscador (centro) — ocupa todo el espacio disponible ── */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="¿Qué buscás? ej. pizza, uñas, repuestos..."
                    className="search-input"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            {/* ── Sección derecha: Filtros + Hamburguesa ── */}
            <div className="header-right">

                {/* Botón filtros — llama al padre para mostrar/ocultar el panel */}
                <button className="filters-btn" onClick={onToggleFilters}>
                    ⚙️ Filtros
                </button>

                {/* Contenedor del menú hamburguesa
                    position: relative permite que el dropdown flote desde aquí */}
                <div className="menu-container">
                    <button
                        className="three-dots-btn"
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        aria-label="Menú"
                    >
                        {/* Cambia entre X y ☰ según el estado */}
                        {menuAbierto ? '✕' : '☰'}
                    </button>

                    {/* El dropdown solo existe en el DOM cuando menuAbierto es true */}
                    {menuAbierto && (
                        <div className="dropdown-menu">

                            {/* Cada Link cierra el menú al navegar */}
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

                            {/* Separador visual antes de Cerrar Sesión */}
                            <div className="dropdown-divider"></div>

                            {/* Usa button y no Link porque es una acción, no una navegación */}
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