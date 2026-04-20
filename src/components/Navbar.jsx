import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, MoreVertical } from 'lucide-react';

function Navbar({ onOpenAbout }) {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const navigate = useNavigate();

    return (
        <header className="navbar-header immersive-navbar">
            <div className="header-left">
                <h1 className="navbar-logo-text"><span className="logo-brand">Puerto</span> <span className="logo-sub">Informa</span></h1>
                
                <nav className="navbar-links">
                    <Link to="/noticias" className="nav-link">Noticias y Eventos</Link>
                    <Link to="/ferry" className="nav-link">Ferry</Link>
                    <Link to="/buses" className="nav-link">Buses</Link>
                    <Link to="/perfil" className="nav-link">Perfil</Link>
                    <button className="nav-link btn-logout-nav" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit'}}>Cerrar Sesión</button>
                </nav>
            </div>

            <div className="header-right">
                <div className="menu-container">
                    <button 
                        className="icon-btn profile-btn"
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        style={{ padding: '4px' }}
                    >
                        <MoreVertical size={24} color="#E8621A" />
                    </button>

                    {menuAbierto && (
                        <div className="dropdown-menu dropdown-menu-right">
                            <Link to="/perfil" className="dropdown-item" onClick={() => setMenuAbierto(false)}>🧑‍✈️ Perfil</Link>
                            <Link to="/buses" className="dropdown-item" onClick={() => setMenuAbierto(false)}>🚌 Buses</Link>
                            <Link to="/noticias" className="dropdown-item" onClick={() => setMenuAbierto(false)}>📰 Noticias y Eventos</Link>
                            <Link to="/ferry" className="dropdown-item" onClick={() => setMenuAbierto(false)}>⛵ Ferry</Link>
                            <button className="dropdown-item about-item" onClick={() => { setMenuAbierto(false); if(onOpenAbout) onOpenAbout(); }}>📰 Acerca de</button>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item dropdown-logout" onClick={() => { setMenuAbierto(false); localStorage.removeItem('token'); navigate('/login'); }}>🚪 Cerrar Sesión</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Navbar;