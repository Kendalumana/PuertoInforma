import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../Resources/logoFinal.ico';

function Navbar({ onSearch, onToggleFilters, onOpenAbout, suggestions = [], onSuggestionClick }) {

    const [menuAbierto, setMenuAbierto] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);
    const navigate = useNavigate();

    // Manejar cambio en el input
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        onSearch(value);
        setShowSuggestions(value.trim().length > 0);
    };

    // Manejar clic en sugerencia
    const handleSuggestionClick = (suggestion) => {
        setInputValue(suggestion);
        onSearch(suggestion);
        setShowSuggestions(false);
        if (onSuggestionClick) onSuggestionClick(suggestion);
    };

    // Cerrar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="navbar-header">
            <div className="header-left">
                <img src={logoIcon} alt="Logo" className="logo-navbar" />
            </div>

            <div className="search-container" style={{ position: 'relative' }}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="¿Qué buscás? ej. pizza, uñas, repuestos..."
                    className="search-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => inputValue.trim() && setShowSuggestions(true)}
                />
                {/* Dropdown de sugerencias */}
                {showSuggestions && suggestions.length > 0 && (
                    <div ref={suggestionsRef} className="suggestions-dropdown">
                        {suggestions.map((s, idx) => (
                            <div
                                key={idx}
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(s)}
                            >
                                🔍 {s}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="header-right" style={{flexShrink: 0}}>
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

                            <button
                                className="dropdown-item about-item"
                                onClick={() => {
                                    setMenuAbierto(false);
                                    onOpenAbout();
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