import { useNavigate } from 'react-router-dom';
import '../styles/Noticias.css';

function PaginaNoticias() {
    const navigate = useNavigate();

    return (
        <div className="noticias-page">

            {/* ── Header ── */}
            <header className="noticias-header-page">
                <button className="noticias-back-btn" onClick={() => navigate('/')}>
                    ⬅️
                </button>
                <h1 className="noticias-page-titulo">Noticias y Eventos</h1>
                <span className="noticias-badge-pronto">Próximamente</span>
            </header>

            {/* ── Cuerpo placeholder ── */}
            <div className="noticias-body">

                <div className="noticias-placeholder-icono">🏖️</div>

                <div className="noticias-placeholder-texto">
                    <h3>Estamos trabajando en esto</h3>
                    <p>
                        Pronto podrás ver noticias locales, eventos del puerto
                        y actividades turísticas de Puntarenas en tiempo real.
                    </p>
                </div>

                {/* Cards preview de lo que vendrá */}
                <div className="noticias-preview-cards">
                    <div className="noticias-preview-card">
                        <span className="noticias-preview-card-icono">🎉</span>
                        <span className="noticias-preview-card-titulo">Eventos</span>
                        <span className="noticias-preview-card-desc">
                            Festivales, ferias y actividades locales
                        </span>
                    </div>
                    <div className="noticias-preview-card">
                        <span className="noticias-preview-card-icono">📢</span>
                        <span className="noticias-preview-card-titulo">Noticias</span>
                        <span className="noticias-preview-card-desc">
                            Información importante del puerto y la ciudad
                        </span>
                    </div>
                    <div className="noticias-preview-card">
                        <span className="noticias-preview-card-icono">⛵</span>
                        <span className="noticias-preview-card-titulo">Ferry</span>
                        <span className="noticias-preview-card-desc">
                            Horarios y estado del servicio de ferry
                        </span>
                    </div>
                    <div className="noticias-preview-card">
                        <span className="noticias-preview-card-icono">🌊</span>
                        <span className="noticias-preview-card-titulo">Turismo</span>
                        <span className="noticias-preview-card-desc">
                            Actividades y tours disponibles
                        </span>
                    </div>
                </div>

            </div>

            {/* ── Aviso inferior ── */}
            <div className="noticias-footer-aviso">
                🔔 Activá las notificaciones para ser el primero en enterarte —
                <span>PuertoInforma</span>
            </div>

        </div>
    );
}

export default PaginaNoticias;