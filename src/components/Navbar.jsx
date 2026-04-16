import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../Resources/logoFinal.ico';

function Navbar({ onSearch, onToggleFilters, onOpenAbout }) {  // ← nueva prop

    const [menuAbierto, setMenuAbierto] = useState(false);
    const navigate = useNavigate();

    return (
        <header className="navbar-header">
            <div className="header-left">
                <img src={logoIcon} alt="Logo" className="logo-navbar" />
            </div>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="¿Qué buscás? ej. pizza, uñas, repuestos..."
                    className="search-input"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            <div className="header-right">
                <button className="filters-btn" onClick={onToggleFilters}>
                    ⚙️ Filtros
                </button>

                <div className="menu-container">
                    <button
                        className="three-dots-btn"
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        aria-label="Menú"
                    >
                        {menuAbierto ? '✕' : '☰'}
                    </button>

                    {menuAbierto && (
                        <div className="dropdown-menu">
                            <Link to="/perfil" className="dropdown-item" onClick={() => setMenuAbierto(false)}>
                                🧑‍✈️ Perfil
                            </Link>
                            <Link to="/buses" className="dropdown-item" onClick={() => setMenuAbierto(false)}>
                                🚌 Buses
                            </Link>
                            <Link to="/noticias" className="dropdown-item" onClick={() => setMenuAbierto(false)}>
                                📰 Noticias y Eventos
                            </Link>
                            <Link to="/ferry" className="dropdown-item" onClick={() => setMenuAbierto(false)}>
                                ⛵ Ferry
                            </Link>

                            {/* ✅ NUEVO: Acerca de - abre modal */}
                            <button
                                className="dropdown-item"
                                onClick={() => {
                                    setMenuAbierto(false);
                                    onOpenAbout();  // ← abre el modal en App.jsx
                                }}
                            >
                                📰 Acerca de
                            </button>

                            <div className="dropdown-divider"></div>

                            <button
                                className="dropdown-item dropdown-logout"
                                onClick={() => {
                                    setMenuAbierto(false);
                                    localStorage.removeItem('token');
                                    navigate('/login');
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