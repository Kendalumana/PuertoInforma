import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MoreVertical, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Navbar({ onOpenAbout }) {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const esMapa = location.pathname === '/';
    const estaAutenticado = Boolean(localStorage.getItem('token'));

    const handleLogout = async () => {
        try { await supabase.auth.signOut(); } catch { /* ignorar */ }
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <header className="navbar-header">
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
                    {estaAutenticado ? (
                        <>
                            <Link to="/perfil" className="nav-link">Perfil</Link>
                            <button
                                className="nav-link btn-logout-nav"
                                onClick={handleLogout}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                Cerrar Sesión
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="nav-link"
                            style={{
                                color: '#E8621A',
                                fontWeight: 700,
                                background: 'rgba(232, 98, 26, 0.12)',
                                padding: '0.4rem 0.9rem',
                                borderRadius: '20px',
                                border: '1px solid rgba(232, 98, 26, 0.4)'
                            }}
                        >
                            Iniciar Sesión
                        </Link>
                    )}
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
                            {estaAutenticado ? (
                                <Link to="/perfil" className="dropdown-item" role="menuitem" onClick={() => setMenuAbierto(false)}>🧑‍✈️ Perfil</Link>
                            ) : null}
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
                            {estaAutenticado ? (
                                <button
                                    className="dropdown-item dropdown-logout"
                                    role="menuitem"
                                    onClick={() => { setMenuAbierto(false); handleLogout(); }}
                                >
                                    🚪 Cerrar Sesión
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    className="dropdown-item"
                                    style={{ color: '#E8621A', fontWeight: 700 }}
                                    role="menuitem"
                                    onClick={() => setMenuAbierto(false)}
                                >
                                    🔑 Iniciar Sesión
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Navbar;
