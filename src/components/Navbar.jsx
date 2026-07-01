import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MoreVertical, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Navbar({ onOpenAbout }) {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const esMapa = location.pathname === '/';

    const handleLogout = async () => {
        try { await supabase.auth.signOut(); } catch { /* ignorar */ }
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <header className="navbar-header immersive-navbar">
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!esMapa && (
                    <button
                        className="nav-back-map-btn"
                        onClick={() => navigate('/')}
                        aria-label="Volver al Mapa"
                    >
                        <ArrowLeft size={20} />
                        <span className="hide-on-mobile">Mapa</span>
                    </button>
                )}
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <h1 className="navbar-logo-text"><span className="logo-brand">Puerto</span> <span className="logo-sub">Informa</span></h1>
                </Link>

                <nav className="navbar-links">
                    <Link to="/noticias" className="nav-link">Noticias y Eventos</Link>
                    <Link to="/ferry" className="nav-link">Ferry</Link>
                    <Link to="/buses" className="nav-link">Buses</Link>
                    <Link to="/perfil" className="nav-link">Perfil</Link>
                    <button
                        className="nav-link btn-logout-nav"
                        onClick={handleLogout}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        Cerrar Sesión
                    </button>
                </nav>
            </div>

            <div className="header-right">
                <div className="menu-container">
                    <button
                        className="icon-btn profile-btn"
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        style={{ padding: '4px' }}
                        aria-label={menuAbierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
                        aria-expanded={menuAbierto}
                        aria-haspopup="menu"
                    >
                        <MoreVertical size={24} color="#E8621A" />
                    </button>

                    {menuAbierto && (
                        <div className="dropdown-menu dropdown-menu-right" role="menu">
                            <Link to="/perfil" className="dropdown-item" role="menuitem" onClick={() => setMenuAbierto(false)}>🧑‍✈️ Perfil</Link>
                            <Link to="/buses" className="dropdown-item" role="menuitem" onClick={() => setMenuAbierto(false)}>🚌 Buses</Link>
                            <Link to="/noticias" className="dropdown-item" role="menuitem" onClick={() => setMenuAbierto(false)}>📰 Noticias y Eventos</Link>
                            <Link to="/ferry" className="dropdown-item" role="menuitem" onClick={() => setMenuAbierto(false)}>⛵ Ferry</Link>
                            <button
                                className="dropdown-item about-item"
                                role="menuitem"
                                onClick={() => { setMenuAbierto(false); if (onOpenAbout) onOpenAbout(); }}
                            >
                                📰 Acerca de
                            </button>
                            <div className="dropdown-divider"></div>
                            <button
                                className="dropdown-item dropdown-logout"
                                role="menuitem"
                                onClick={() => { setMenuAbierto(false); handleLogout(); }}
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
