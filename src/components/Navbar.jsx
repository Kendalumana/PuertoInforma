import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../Resources/logoFinal.ico';

function Navbar({ onSearch, onToggleFilters }) {

    // Controla si el menú hamburguesa está abierto o cerrado
    const [menuAbierto, setMenuAbierto] = useState(false);

    // Para redirigir al cerrar sesión
    const navigate = useNavigate();

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
                    placeholder="¿Qué buscás? ej. pizza, uñas, repuestos..."
                    className="search-input"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            {/* ── Sección derecha: Filtros + Hamburguesa ── */}
            <div className="header-right">

                {/* Botón filtros */}
                <button className="filters-btn" onClick={onToggleFilters}>
                    ⚙️ Filtros
                </button>

                {/* Menú hamburguesa */}
                <div className="menu-container">
                    <button
                        className="three-dots-btn"
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        aria-label="Menú"
                    >
                        {/* Alterna entre X y ☰ según el estado */}
                        {menuAbierto ? '✕' : '☰'}
                    </button>

                    {/* Dropdown — solo existe en el DOM cuando está abierto */}
                    {menuAbierto && (
                        <div className="dropdown-menu">

                            {/* ── Perfil ── */}
                            <Link
                                to="/perfil"
                                className="dropdown-item"
                                onClick={() => setMenuAbierto(false)}
                            >
                                🧑‍✈️ Perfil
                            </Link>

                            {/* ── Buses ── */}
                            <Link
                                to="/buses"
                                className="dropdown-item"
                                onClick={() => setMenuAbierto(false)}
                            >
                                🚌 Buses
                            </Link>

                            {/* ── Noticias y Eventos ── */}
                            <Link
                                to="/noticias"
                                className="dropdown-item"
                                onClick={() => setMenuAbierto(false)}
                            >
                                📰 Noticias y Eventos
                            </Link>

                            {/* ── Ferry ── */}
                            <Link
                                to="/ferry"
                                className="dropdown-item"
                                onClick={() => setMenuAbierto(false)}
                            >
                                ⛵ Ferry
                            </Link>

                            {/* Separador antes de Cerrar Sesión */}
                            <div className="dropdown-divider"></div>

                            {/* ── Cerrar Sesión — borra token y redirige al login ── */}
                            <button
                                className="dropdown-item dropdown-logout"
                                onClick={() => {
                                    setMenuAbierto(false);
                                    localStorage.removeItem('token'); // borra el JWT
                                    navigate('/login');               // manda al login
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