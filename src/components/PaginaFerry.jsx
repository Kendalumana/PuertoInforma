import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Bell, User, Clock,
    Info, Compass, Ship, Ticket, Bookmark
} from 'lucide-react';
import '../styles/Ferry.css';

function PaginaFerry() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('SCHEDULES');
    const [activeRoute, setActiveRoute] = useState('Puntarenas - Paquera');

    const routes = [
        'Puntarenas - Paquera',
        'Puntarenas - Playa Naranjo',
        'Playa Naranjo - Puntarenas'
    ];

    return (
        <div className="ferry-layout">
            {/* Top Navbar */}
            <header className="ferry-topbar">
                <div className="ferry-logo" onClick={() => navigate('/')}>
                    <span className="logo-white">Puerto</span><span className="logo-orange">Informa</span>
                </div>
                <div className="ferry-topbar-right">
                    <div className="ferry-search-wrapper">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Search routes..." />
                    </div>
                    <button className="icon-btn"><Bell size={20} /></button>
                    <button className="icon-btn" onClick={() => navigate('/perfil')}><User size={20} /></button>
                </div>
            </header>

            <main className="ferry-main">
                {/* Hero Title */}
                <h1 className="ferry-hero-title">
                    Horarios de <span className="text-orange">Ferry</span>
                </h1>

                {/* Route Chips */}
                <div className="ferry-route-chips">
                    {routes.map(r => (
                        <button
                            key={r}
                            className={`ferry-chip ${activeRoute === r ? 'active' : ''}`}
                            onClick={() => setActiveRoute(r)}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                {/* Section Header */}
                <div className="ferry-section-header">
                    <div>
                        <h2>Próximas Salidas</h2>
                        <p>Actualizado en tiempo real • Puerto Puntarenas</p>
                    </div>
                    <div className="live-status">
                        <span className="pulse-dot"></span> LIVE STATUS
                    </div>
                </div>

                {/* Grid Content */}
                <div className="ferry-grid">
                    {/* Big Card */}
                    <div className="ferry-card big-card">
                        <div className="card-top">
                            <span className="siguiente-label">SIGUIENTE SALIDA</span>
                            <span className="badge-green">ON TIME</span>
                        </div>
                        <div className="card-time">14:30</div>
                        <div className="card-subtitle">Tambor II • Ferry Convencional</div>
                        
                        <div className="boarding-info">
                            <div className="mins-box">
                                <span className="mins-num">24</span>
                                <span className="mins-label">MINS</span>
                            </div>
                            <div className="boarding-text">
                                <h4>Puntarenas Terminal</h4>
                                <p>Abordaje inicia en 10 minutos</p>
                            </div>
                        </div>
                        <Ship className="watermark-ship" size={200} />
                    </div>

                    {/* Right Card */}
                    <div className="ferry-card right-card">
                        <div className="card-top flex-between">
                            <Clock size={20} className="text-orange" />
                            <span className="time-small">17:00 PM</span>
                        </div>
                        <h3 className="card-title mt-auto">San Lucas II</h3>
                        <p className="card-subtitle mb-4">Ferry de Carga & Pasajeros</p>
                        <div className="progress-bar-container">
                            <div className="progress-bar-fill"></div>
                        </div>
                        <button className="ferry-btn-outline">Reservar Espacio</button>
                    </div>

                    {/* Bottom Left Card */}
                    <div className="ferry-card bottom-left-card">
                        <div className="card-top flex-between">
                            <span className="time-small">20:30 PM</span>
                            <span className="badge-gray">NOCTURNO</span>
                        </div>
                        <h3 className="card-title mt-auto">Tambor III</h3>
                        <p className="card-subtitle">Última salida del día</p>
                        <Clock className="watermark-moon" size={150} />
                    </div>

                    {/* Info Card */}
                    <div className="ferry-card info-card">
                        <Info size={28} className="text-orange info-icon" />
                        <div>
                            <h4>Recomendación para Viajeros</h4>
                            <p>Se recomienda llegar al menos 45 minutos antes de la salida si viaja con vehículo. Los tiquetes digitales deben presentarse en el control de acceso.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Tab Bar */}
            <nav className="ferry-bottom-nav">
                <button className={`nav-item ${activeTab === 'EXPLORE' ? 'active' : ''}`} onClick={() => { setActiveTab('EXPLORE'); navigate('/'); }}>
                    <Compass size={24} />
                    <span>EXPLORE</span>
                </button>
                <button className={`nav-item ${activeTab === 'SCHEDULES' ? 'active' : ''}`} onClick={() => setActiveTab('SCHEDULES')}>
                    <Ship size={24} />
                    <span>SCHEDULES</span>
                </button>
                <button className={`nav-item ${activeTab === 'TICKETS' ? 'active' : ''}`} onClick={() => setActiveTab('TICKETS')}>
                    <Ticket size={24} />
                    <span>TICKETS</span>
                </button>
                <button className={`nav-item ${activeTab === 'SAVED' ? 'active' : ''}`} onClick={() => setActiveTab('SAVED')}>
                    <Bookmark size={24} />
                    <span>SAVED</span>
                </button>
            </nav>
        </div>
    );
}

export default PaginaFerry;