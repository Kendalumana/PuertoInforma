import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Perfil.css';

const AVATARES = [
  { id: 1, emoji: '🧑‍✈️', label: 'Capitán' },
  { id: 2, emoji: '🏄', label: 'Surfista' },
  { id: 3, emoji: '🎣', label: 'Pescador' },
  { id: 4, emoji: '🌴', label: 'Explorador' },
  { id: 5, emoji: '⚓', label: 'Marinero' },
  { id: 6, emoji: '🦀', label: 'Cangrejo' },
];

function PaginaPerfil() {
  const navigate = useNavigate();

  const [avatarTipo, setAvatarTipo] = useState('prediseñado');
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(1);
  const [avatarImagen, setAvatarImagen] = useState(null);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [tabActiva, setTabActiva] = useState('misiones');

  const usuario = {
    nombre: 'Kendal Rodríguez',
    rango: 'Explorador Novato',
    puntos: 340,
    experiencia: 340,
    expSiguienteNivel: 500,
  };

  const calcularPorcentajeXP = () => {
    return Math.round((usuario.experiencia / usuario.expSiguienteNivel) * 100);
  };

  const handleSubirImagen = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const urlTemporal = URL.createObjectURL(archivo);
    setAvatarImagen(urlTemporal);
    setAvatarTipo('subido');
    setMostrarSelector(false);
  };

  const misiones = [
    { id: 1,  titulo: 'Visita tu primer puerto',                xp: 50,  completada: true },
    { id: 2,  titulo: 'Explora 3 sitios diferentes',            xp: 100, completada: false },
    { id: 3,  titulo: 'Visita un sitio fuera de tu provincia',  xp: 150, completada: false },
    { id: 4,  titulo: 'Marca asistencia en 5 lugares',          xp: 200, completada: false },
    { id: 5,  titulo: 'Deja tu primera reseña',                 xp: 75,  completada: false },
    { id: 6,  titulo: 'Deja 3 reseñas en sitios diferentes',   xp: 150, completada: false },
    { id: 7,  titulo: 'Recibe 10 "útil" en tus reseñas',       xp: 200, completada: false },
    { id: 8,  titulo: 'Comparte un sitio con un amigo',         xp: 80,  completada: false },
    { id: 9,  titulo: 'Completa tu información de perfil',      xp: 50,  completada: false },
    { id: 10, titulo: 'Sube una foto de perfil personalizada',  xp: 100, completada: avatarTipo === 'subido' },
    { id: 11, titulo: 'Agrega un sitio a favoritos',            xp: 30,  completada: false },
    { id: 12, titulo: 'Inicia sesión 5 días seguidos',          xp: 200, completada: false },
    { id: 13, titulo: 'Usa la app durante 1 mes',               xp: 300, completada: false },
    { id: 14, titulo: 'Completa 10 misiones en total',          xp: 500, completada: false },
  ];

  const historialAvance = [
    { id: 1, fecha: 'Hoy',  accion: 'Completaste la misión "Visita tu primer puerto"', xpObtenida: '+50 XP' },
    { id: 2, fecha: 'Ayer', accion: 'Te registraste en PuertoInforma',                 xpObtenida: '+100 XP' },
    { id: 3, fecha: 'Ayer', accion: 'Agregaste "Playa Hermosa" a favoritos',           xpObtenida: '+10 XP' },
  ];

  const rangosDisponibles = [
    { nivel: 1, nombre: 'Turista Curioso',      xpReq: 0,    actual: false },
    { nivel: 2, nombre: 'Explorador Novato',    xpReq: 200,  actual: true },
    { nivel: 3, nombre: 'Navegante Frecuente',  xpReq: 500,  actual: false },
    { nivel: 4, nombre: 'Capitán de la Costa',  xpReq: 1000, actual: false },
  ];

  const sitiosVisitados = [
    { id: 1, nombre: 'Puerto Viejo', fecha: '12 Oct 2023', icono: '🌴' },
    { id: 2, nombre: 'Puntarenas',   fecha: '05 Nov 2023', icono: '🛳️' },
    { id: 3, nombre: 'Limón Centro', fecha: '18 Dic 2023', icono: '🏙️' },
  ];

  return (
    <div className="profile-page">
      <div className="profile-layout">

        {/* BARRA LATERAL */}
        <aside className="profile-sidebar">
          <button className="btn-back" onClick={() => navigate('/')}>
            ⬅️ Volver al Inicio
          </button>

          <div className="avatar-wrapper">
            <div className="avatar-display" onClick={() => setMostrarSelector(!mostrarSelector)}>
              {avatarTipo === 'subido' && avatarImagen ? (
                <img src={avatarImagen} alt="Avatar" className="avatar-img" />
              ) : (
                <span className="avatar-emoji">
                  {AVATARES.find(a => a.id === avatarSeleccionado)?.emoji}
                </span>
              )}
              <div className="avatar-edit-badge">✏️</div>
            </div>

            {mostrarSelector && (
              <div className="avatar-selector">
                <p className="avatar-selector-titulo">Elegí tu avatar</p>
                <div className="avatares-grid">
                  {AVATARES.map(av => (
                    <div
                      key={av.id}
                      className={`avatar-opcion ${avatarSeleccionado === av.id && avatarTipo === 'prediseñado' ? 'activo' : ''}`}
                      onClick={() => {
                        setAvatarSeleccionado(av.id);
                        setAvatarTipo('prediseñado');
                        setMostrarSelector(false);
                      }}
                    >
                      {av.emoji}
                    </div>
                  ))}
                </div>
                <div className="avatar-divider">— o subí tu foto —</div>
                <label className="btn-subir-foto" htmlFor="input-foto">📷 Subir foto</label>
                <input id="input-foto" type="file" accept="image/*" onChange={handleSubirImagen} style={{ display: 'none' }} />
              </div>
            )}
          </div>

          <div className="profile-info-basica">
            <h2 className="profile-nombre">{usuario.nombre}</h2>
            <span className="profile-rango">{usuario.rango}</span>
            <div className="profile-puntos-mini">
              <strong>{usuario.puntos}</strong> puntos
            </div>
          </div>

          <div className="xp-container">
            <div className="xp-labels">
              <span>{usuario.experiencia} XP</span>
              <span>{usuario.expSiguienteNivel} XP</span>
            </div>
            <div className="xp-barra">
              <div className="xp-relleno" style={{ width: `${calcularPorcentajeXP()}%` }}></div>
            </div>
            <p className="xp-texto">Faltan {usuario.expSiguienteNivel - usuario.experiencia} XP para subir</p>
          </div>

          <nav className="profile-nav-vertical">
            <button className={`nav-btn ${tabActiva === 'misiones' ? 'activo' : ''}`} onClick={() => setTabActiva('misiones')}>
              🎯 Misiones
            </button>
            <button className={`nav-btn ${tabActiva === 'avance' ? 'activo' : ''}`} onClick={() => setTabActiva('avance')}>
              📈 Mi Avance
            </button>
            <button className={`nav-btn ${tabActiva === 'rango' ? 'activo' : ''}`} onClick={() => setTabActiva('rango')}>
              🏅 Rango
            </button>
            <button className={`nav-btn ${tabActiva === 'visitados' ? 'activo' : ''}`} onClick={() => setTabActiva('visitados')}>
              📍 Sitios Visitados
            </button>
          </nav>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="profile-main-content">

          {tabActiva === 'misiones' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">🎯 Misiones Disponibles</h3>
              <p className="tab-desc">Completa estas tareas para ganar experiencia y subir de rango.</p>
              <div className="misiones-lista">
                {misiones.map(mision => (
                  <div key={mision.id} className={`mision-card ${mision.completada ? 'completada' : ''}`}>
                    <div className="mision-info">
                      <h4>{mision.titulo}</h4>
                      <span className="mision-xp">+{mision.xp} XP</span>
                    </div>
                    <div className="mision-estado">
                      {mision.completada ? '✅ Lista' : '⏳ Pendiente'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabActiva === 'avance' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">📈 Tu Historial</h3>
              <p className="tab-desc">Todo lo que has hecho recientemente en PuertoInforma.</p>
              <div className="avance-timeline">
                {historialAvance.map(item => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className="timeline-fecha">{item.fecha}</span>
                      <p className="timeline-accion">{item.accion}</p>
                      <span className="timeline-xp">{item.xpObtenida}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabActiva === 'rango' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">🏅 Progreso de Rango</h3>
              <p className="tab-desc">Gana puntos para desbloquear nuevos títulos.</p>
              <div className="rangos-lista">
                {rangosDisponibles.map(rango => (
                  <div key={rango.nivel} className={`rango-card ${rango.actual ? 'rango-actual' : ''} ${usuario.experiencia >= rango.xpReq ? 'desbloqueado' : 'bloqueado'}`}>
                    <div className="rango-nivel">Nivel {rango.nivel}</div>
                    <div className="rango-nombre">{rango.nombre}</div>
                    <div className="rango-req">{rango.xpReq} XP requeridos</div>
                    {rango.actual && <div className="rango-badge">Tú estás aquí</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabActiva === 'visitados' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">📍 Tus Sitios Explorados</h3>
              <p className="tab-desc">Lugares en los que has marcado asistencia.</p>
              <div className="sitios-grid">
                {sitiosVisitados.map(sitio => (
                  <div key={sitio.id} className="sitio-card">
                    <div className="sitio-icono">{sitio.icono}</div>
                    <div className="sitio-info">
                      <h4>{sitio.nombre}</h4>
                      <span>Visitado el: {sitio.fecha}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default PaginaPerfil;