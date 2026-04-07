import { useNavigate } from 'react-router-dom';
import '../styles/Ferry.css';

function PaginaFerry() {
    const navigate = useNavigate();

    return (
        <div className="ferry-page">

            {/* ── Header ── */}
            <header className="ferry-header">
                <button className="ferry-back-btn" onClick={() => navigate('/')}>
                    ⬅️
                </button>
                <h1 className="ferry-titulo">Ferry Puntarenas</h1>
                <span className="ferry-badge-pronto">Próximamente</span>
            </header>

            {/* ── Cuerpo placeholder ── */}
            <div className="ferry-body">

                <div className="ferry-placeholder-icono">⛴️</div>

                <div className="ferry-placeholder-texto">
                    <h3>Información del Ferry</h3>
                    <p>
                        Pronto podrás consultar horarios, tarifas y
                        disponibilidad del ferry de Puntarenas en tiempo real.
                    </p>
                </div>

                {/* Cards preview */}
                <div className="ferry-preview-cards">
                    <div className="ferry-preview-card">
                        <span className="ferry-preview-icono">🕐</span>
                        <span className="ferry-preview-titulo">Horarios</span>
                        <span className="ferry-preview-desc">
                            Salidas y llegadas del día
                        </span>
                    </div>
                    <div className="ferry-preview-card">
                        <span className="ferry-preview-icono">💰</span>
                        <span className="ferry-preview-titulo">Tarifas</span>
                        <span className="ferry-preview-desc">
                            Precios para personas y vehículos
                        </span>
                    </div>
                    <div className="ferry-preview-card">
                        <span className="ferry-preview-icono">📍</span>
                        <span className="ferry-preview-titulo">Rutas</span>
                        <span className="ferry-preview-desc">
                            Puntarenas ↔ Playa Naranjo ↔ Paquera
                        </span>
                    </div>
                    <div className="ferry-preview-card">
                        <span className="ferry-preview-icono">✅</span>
                        <span className="ferry-preview-titulo">Estado</span>
                        <span className="ferry-preview-desc">
                            Operativo, retrasado o cancelado
                        </span>
                    </div>
                </div>

            </div>

            {/* ── Aviso inferior ── */}
            <div className="ferry-footer-aviso">
                ⛵ Servicio operado por <span>CONATRAMAR y Ferry Peninsular</span>
            </div>

        </div>
    );
}

export default PaginaFerry;