import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { axiosPrivate } from '../api/axios';
import '../styles/Perfil.css';

const AVATARES = [
  { id: 1, emoji: '🧑‍✈️', label: 'Capitán' },
  { id: 2, emoji: '🏄', label: 'Surfista' },
  { id: 3, emoji: '🎣', label: 'Pescador' },
  { id: 4, emoji: '🌴', label: 'Explorador' },
  { id: 5, emoji: '⚓', label: 'Marinero' },
  { id: 6, emoji: '🦀', label: 'Cangrejo' },
];

const XP_SIGUIENTE_NIVEL = 500;

// ✅ Función para guardar avatar (con usuarioId explícito, usando fetch)
async function guardarAvatar(tipo, valor, usuarioId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No hay token de autenticación');

    const url = 'https://puertoinforma-backend.onrender.com/api/v1/perfil/avatar';
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tipo, valor, usuarioId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    console.log('✅ Avatar guardado correctamente');
  } catch (error) {
    console.error('❌ Error al guardar avatar:', error);
    throw new Error('No se pudo guardar el avatar');
  }
}

function PaginaPerfil() {
  const navigate = useNavigate();

  const [avatarTipo,         setAvatarTipo        ] = useState('prediseñado');
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(1);
  const [avatarImagen,       setAvatarImagen      ] = useState(null);
  const [mostrarSelector,    setMostrarSelector   ] = useState(false);
  const [tabActiva,          setTabActiva         ] = useState('misiones');
  const [guardandoAvatar,    setGuardandoAvatar   ] = useState(false);
  const [avatarError,        setAvatarError       ] = useState(null);

  const [perfil,          setPerfil         ] = useState(null);
  const [misiones,        setMisiones       ] = useState([]);
  const [perfilMisiones,  setPerfilMisiones ] = useState([]);
  const [historial,       setHistorial      ] = useState([]);
  const [rangos,          setRangos         ] = useState([]);
  const [sitiosVisitados, setSitiosVisitados] = useState([]);
  const [cargando,        setCargando       ] = useState(true);
  const [error,           setError          ] = useState(null);

  const [session, setSession] = useState(null);

  useEffect(() => {
    async function cargarTodo() {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        const localToken = localStorage.getItem('token');
        
        let userId = null;

        if (s) {
            userId = s.user.id;
            setSession(s);
        } else if (localToken) {
            try {
                // Decodificar JWT para obtener el ID de usuario
                const payload = JSON.parse(atob(localToken.split('.')[1]));
                console.log("=== JWT PAYLOAD ===", payload); // Para depurar

                userId = payload.id || payload.sub || payload.usuarioId || payload.userId;
                console.log("=== USER ID EXTRACTED ===", userId);
            } catch (e) {
                console.error("Error decodificando token local", e);
            }
        }

        if (!userId) { 
            navigate('/login'); 
            return; 
        }

        const resPerfil = await axiosPrivate.get(`/perfil/usuario/${userId}`);
        const datosPerfil = resPerfil.data;
        setPerfil(datosPerfil);

        if (datosPerfil.avatarTipo && datosPerfil.avatarValor) {
          if (datosPerfil.avatarTipo === 'emoji') {
            const emojiId = parseInt(datosPerfil.avatarValor, 10);
            if (!isNaN(emojiId)) {
              setAvatarTipo('prediseñado');
              setAvatarSeleccionado(emojiId);
            }
          } else if (datosPerfil.avatarTipo === 'imagen') {
            setAvatarTipo('subido');
            setAvatarImagen(datosPerfil.avatarValor);
          }
        }

        const perfilId = datosPerfil.id;

        const [
          resMisiones,
          resPerfilMisiones,
          resHistorial,
          resSitios,
          resRangos,
        ] = await Promise.all([
          axiosPrivate.get('/mision'),
          axiosPrivate.get(`/mision/perfil/${perfilId}`),
          axiosPrivate.get(`/mision/historial/${perfilId}`),
          axiosPrivate.get(`/mision/visitados/${perfilId}`),
          axiosPrivate.get('/rango'),
        ]);

        setMisiones(resMisiones.data);
        setPerfilMisiones(resPerfilMisiones.data);
        setHistorial(resHistorial.data);
        setSitiosVisitados(resSitios.data);
        setRangos(resRangos.data);

      } catch (err) {
        console.error(err);
        setError('No se pudo cargar el perfil. Intentá de nuevo.');
      } finally {
        setCargando(false);
      }
    }

    cargarTodo();
  }, [navigate]);

  const estaCompletada = (misionId) =>
    perfilMisiones.some(pm => pm.mision?.id === misionId && pm.completada);

  const calcularPorcentajeXP = () => {
    const xp = perfil?.experienciaXp ?? 0;
    return Math.min(Math.round((xp / XP_SIGUIENTE_NIVEL) * 100), 100);
  };

  const xpActual = perfil?.experienciaXp ?? 0;
  const rangoActual = [...rangos]
    .filter(r => xpActual >= r.puntosRequeridos)
    .sort((a, b) => b.puntosRequeridos - a.puntosRequeridos)[0];

  const handleSeleccionarEmoji = async (id) => {
    setAvatarSeleccionado(id);
    setAvatarTipo('prediseñado');
    setMostrarSelector(false);
    setGuardandoAvatar(true);
    setAvatarError(null);
    try {
      await guardarAvatar('emoji', id.toString(), session.user.id);
    } catch (err) {
      setAvatarError('No se pudo guardar el avatar. Reintentá.');
    } finally {
      setGuardandoAvatar(false);
    }
  };

  const handleSubirImagen = (e) => {
    e.preventDefault();
    setAvatarError('🚧 Subida de imágenes: Próximamente disponible');
    e.target.value = '';
  };

  const formatearFecha = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('es-CR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  if (cargando) return (
    <div className="profile-page" style={{ color: 'white', textAlign: 'center', paddingTop: '4rem' }}>
      Cargando perfil...
    </div>
  );

  if (error) return (
    <div className="profile-page" style={{ color: '#ef5350', textAlign: 'center', paddingTop: '4rem' }}>
      {error}
    </div>
  );

  return (
    <div className="profile-page">
      <div className="profile-layout">

        <aside className="profile-sidebar">
          <button className="btn-back" onClick={() => navigate('/')}>
            ⬅️ Volver al Inicio
          </button>

          <div className="avatar-wrapper">
            <div className="avatar-display" onClick={() => setMostrarSelector(!mostrarSelector)}>
              {guardandoAvatar ? (
                <span className="avatar-emoji">⏳</span>
              ) : avatarTipo === 'subido' && avatarImagen ? (
                <img src={avatarImagen} alt="Avatar" className="avatar-img" />
              ) : (
                <span className="avatar-emoji">
                  {AVATARES.find(a => a.id === avatarSeleccionado)?.emoji}
                </span>
              )}
              <div className="avatar-edit-badge">✏️</div>
            </div>

            {avatarError && (
              <p style={{ color: '#ef5350', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
                {avatarError}
              </p>
            )}

            {mostrarSelector && (
              <div className="avatar-selector">
                <p className="avatar-selector-titulo">Elegí tu avatar</p>
                <div className="avatares-grid">
                  {AVATARES.map(av => (
                    <div
                      key={av.id}
                      className={`avatar-opcion ${avatarSeleccionado === av.id && avatarTipo === 'prediseñado' ? 'activo' : ''}`}
                      onClick={() => handleSeleccionarEmoji(av.id)}
                    >
                      {av.emoji}
                    </div>
                  ))}
                </div>
                <div className="avatar-divider">— o subí tu foto —</div>
                <label
                  className="btn-subir-foto"
                  htmlFor="input-foto"
                  title="Próximamente disponible"
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                >
                  📷 Subir foto (próximamente)
                </label>
                <input
                  id="input-foto"
                  type="file"
                  accept="image/*"
                  onChange={handleSubirImagen}
                  style={{ display: 'none' }}
                  disabled
                />
              </div>
            )}
          </div>

          <div className="profile-info-basica">
            <h2 className="profile-nombre">{perfil?.nombreUsuario ?? '—'}</h2>
            <span className="profile-rango">
              {rangoActual?.urlIcono && <img src={rangoActual.urlIcono} alt="icono" style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle', objectFit: 'contain' }} />}
              {rangoActual?.nombre ?? '—'}
            </span>
            <div className="profile-puntos-mini">
              <strong>{perfil?.puntosTotales ?? 0}</strong> puntos canjeables
            </div>
          </div>

          <div className="xp-container">
            <div className="xp-labels">
              <span>{xpActual} XP</span>
              <span>{XP_SIGUIENTE_NIVEL} XP</span>
            </div>
            <div className="xp-barra">
              <div className="xp-relleno" style={{ width: `${calcularPorcentajeXP()}%` }}></div>
            </div>
            <p className="xp-texto">
              Faltan {Math.max(XP_SIGUIENTE_NIVEL - xpActual, 0)} XP para subir
            </p>
          </div>

          <nav className="profile-nav-vertical">
            <button className={`nav-btn ${tabActiva === 'misiones'  ? 'activo' : ''}`} onClick={() => setTabActiva('misiones')}>🎯 Misiones</button>
            <button className={`nav-btn ${tabActiva === 'avance'    ? 'activo' : ''}`} onClick={() => setTabActiva('avance')}>📈 Mi Avance</button>
            <button className={`nav-btn ${tabActiva === 'rango'     ? 'activo' : ''}`} onClick={() => setTabActiva('rango')}>🏅 Rango</button>
            <button className={`nav-btn ${tabActiva === 'visitados' ? 'activo' : ''}`} onClick={() => setTabActiva('visitados')}>📍 Sitios Visitados</button>
          </nav>
        </aside>

        <main className="profile-main-content">

          {tabActiva === 'misiones' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">🎯 Misiones Disponibles</h3>
              <p className="tab-desc">Completá estas tareas para ganar XP y puntos.</p>
              <div className="misiones-lista">
                {misiones.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)' }}>No hay misiones disponibles.</p>}
                {misiones.map(mision => {
                  const completada = estaCompletada(mision.id);
                  return (
                    <div key={mision.id} className={`mision-card ${completada ? 'completada' : ''}`}>
                      <div className="mision-info">
                        <h4>{mision.titulo}</h4>
                        {mision.descripcion && <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{mision.descripcion}</p>}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span className="mision-xp">+{mision.xpRecompensa} XP</span>
                          <span className="mision-xp" style={{ background: '#E8621A' }}>+{mision.puntosRecompensa} pts</span>
                        </div>
                      </div>
                      <div className="mision-estado">{completada ? '✅ Lista' : '⏳ Pendiente'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tabActiva === 'avance' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">📈 Tu Historial</h3>
              <p className="tab-desc">Todo lo que has hecho recientemente en PuertoInforma.</p>
              <div className="avance-timeline">
                {historial.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)' }}>Aún no tenés actividad registrada.</p>}
                {historial.map(item => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className="timeline-fecha">{formatearFecha(item.fecha)}</span>
                      <p className="timeline-accion">{item.descripcion}</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {item.xp > 0 && <span className="timeline-xp">+{item.xp} XP</span>}
                        {item.puntos > 0 && <span className="timeline-xp" style={{ background: '#E8621A' }}>+{item.puntos} pts</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabActiva === 'rango' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">🏅 Progreso de Rango</h3>
              <p className="tab-desc">Ganás XP para desbloquear nuevos títulos.</p>
              <div className="rangos-lista">
                {rangos.sort((a, b) => a.puntosRequeridos - b.puntosRequeridos).map((rango, index) => {
                  const esActual = rangoActual?.id === rango.id;
                  const desbloqueado = xpActual >= rango.puntosRequeridos;
                  return (
                    <div key={rango.id} className={`rango-card ${esActual ? 'rango-actual' : ''} ${desbloqueado ? 'desbloqueado' : 'bloqueado'}`}>
                      <div className="rango-nivel">Nivel {index + 1}</div>
                      <div className="rango-nombre">
                        {rango.urlIcono && <img src={rango.urlIcono} alt="icono" style={{ width: '80px', height: '80px', display: 'block', margin: '0 auto 0.5rem auto', objectFit: 'contain' }} />}
                        {rango.nombre}
                      </div>
                      <div className="rango-req">{rango.puntosRequeridos} XP requeridos</div>
                      {esActual && <div className="rango-badge">Tú estás aquí</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tabActiva === 'visitados' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">📍 Tus Sitios Explorados</h3>
              <p className="tab-desc">Lugares en los que has marcado asistencia.</p>
              <div className="sitios-grid">
                {sitiosVisitados.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)' }}>Aún no has visitado ningún lugar.</p>}
                {sitiosVisitados.map(sitio => (
                  <div key={sitio.id} className="sitio-card">
                    <div className="sitio-icono">📍</div>
                    <div className="sitio-info">
                      <h4>{sitio.lugar?.nombre ?? '—'}</h4>
                      <span>Visitado el: {formatearFecha(sitio.fecha)}</span>
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