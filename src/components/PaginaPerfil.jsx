import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import '../styles/Perfil.css';

const AVATARES = [
  { id: 1, emoji: '🧑‍✈️', label: 'Capitán' },
  { id: 2, emoji: '🏄', label: 'Surfista' },
  { id: 3, emoji: '🎣', label: 'Pescador' },
  { id: 4, emoji: '🌴', label: 'Explorador' },
  { id: 5, emoji: '⚓', label: 'Marinero' },
  { id: 6, emoji: '🦀', label: 'Cangrejo' },
];

// XP necesaria para subir de nivel — se puede ajustar después
const XP_SIGUIENTE_NIVEL = 500;

function PaginaPerfil() {
  const navigate = useNavigate();

  // --- Avatar ---
  const [avatarTipo,         setAvatarTipo        ] = useState('prediseñado');
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(1);
  const [avatarImagen,       setAvatarImagen      ] = useState(null);
  const [mostrarSelector,    setMostrarSelector   ] = useState(false);
  const [tabActiva,          setTabActiva         ] = useState('misiones');

  // --- Datos de BD ---
  const [perfil,          setPerfil         ] = useState(null);
  const [misiones,        setMisiones       ] = useState([]);
  const [perfilMisiones,  setPerfilMisiones ] = useState([]);
  const [historial,       setHistorial      ] = useState([]);
  const [rangos,          setRangos         ] = useState([]);
  const [sitiosVisitados, setSitiosVisitados] = useState([]);
  const [cargando,        setCargando       ] = useState(true);
  const [error,           setError          ] = useState(null);

  // --- Session ---
  const [session, setSession] = useState(null);

  useEffect(() => {
    async function cargarTodo() {
      try {
        // 1. Obtener sesión de Supabase
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!s) { navigate('/login'); return; }
        setSession(s);
        const base = import.meta.env.VITE_API_URL ?? '';
        const headers = { Authorization: `Bearer ${s.access_token}` };

        // 2. Cargar perfil base
        const resPerfil = await fetch(`${base}/api/v1/perfil/usuario/${s.user.id}`, { headers });
        if (!resPerfil.ok) throw new Error('No se pudo cargar el perfil');
        const datosPerfil = await resPerfil.json();
        setPerfil(datosPerfil);

        const perfilId = datosPerfil.id;

        // 3. Cargar en paralelo — misiones, historial, sitios visitados, rangos
        const [
          resMisiones,
          resPerfilMisiones,
          resHistorial,
          resSitios,
          resRangos,
        ] = await Promise.all([
          fetch(`${base}/api/v1/mision`,                       { headers }),
          fetch(`${base}/api/v1/mision/perfil/${perfilId}`,    { headers }),
          fetch(`${base}/api/v1/mision/historial/${perfilId}`, { headers }),
          fetch(`${base}/api/v1/mision/visitados/${perfilId}`, { headers }),
          fetch(`${base}/api/v1/rango`,                        { headers }),
        ]);

        if (resMisiones.ok)       setMisiones(await resMisiones.json());
        if (resPerfilMisiones.ok) setPerfilMisiones(await resPerfilMisiones.json());
        if (resHistorial.ok)      setHistorial(await resHistorial.json());
        if (resSitios.ok)         setSitiosVisitados(await resSitios.json());
        if (resRangos.ok)         setRangos(await resRangos.json());

      } catch (err) {
        console.error(err);
        setError('No se pudo cargar el perfil. Intentá de nuevo.');
      } finally {
        setCargando(false);
      }
    }

    cargarTodo();
  }, [navigate]);

  // --- Helpers ---

  // Verifica si una misión está completada por este perfil
  const estaCompletada = (misionId) =>
    perfilMisiones.some(pm => pm.mision?.id === misionId && pm.completada);

  // Calcula el % de XP para la barra
  const calcularPorcentajeXP = () => {
    const xp = perfil?.experienciaXp ?? 0;
    return Math.min(Math.round((xp / XP_SIGUIENTE_NIVEL) * 100), 100);
  };

  // Marca el rango actual comparando XP
  const xpActual = perfil?.experienciaXp ?? 0;
  const rangoActual = [...rangos]
    .filter(r => xpActual >= r.puntosRequeridos)
    .sort((a, b) => b.puntosRequeridos - a.puntosRequeridos)[0];

  const handleSubirImagen = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setAvatarImagen(URL.createObjectURL(archivo));
    setAvatarTipo('subido');
    setMostrarSelector(false);
  };

  // Formatea fecha ISO a texto legible
  const formatearFecha = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('es-CR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // --- Estados de carga y error ---
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

        {/* ── BARRA LATERAL ── */}
        <aside className="profile-sidebar">
          <button className="btn-back" onClick={() => navigate('/')}>
            ⬅️ Volver al Inicio
          </button>

          {/* Avatar */}
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

          {/* Info básica — datos reales de BD */}
          <div className="profile-info-basica">
            <h2 className="profile-nombre">{perfil?.nombreUsuario ?? '—'}</h2>
            <span className="profile-rango">{rangoActual?.urlIcono && <img src={rangoActual.urlIcono} alt="icono" style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle', objectFit: 'contain' }} />} {rangoActual?.nombre ?? '—'}</span>
            <div className="profile-puntos-mini">
              <strong>{perfil?.puntosTotales ?? 0}</strong> puntos canjeables
            </div>
          </div>

          {/* Barra XP — usa experienciaXp real */}
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

          {/* Navegación de tabs */}
          <nav className="profile-nav-vertical">
            <button className={`nav-btn ${tabActiva === 'misiones'  ? 'activo' : ''}`} onClick={() => setTabActiva('misiones')}>
              🎯 Misiones
            </button>
            <button className={`nav-btn ${tabActiva === 'avance'    ? 'activo' : ''}`} onClick={() => setTabActiva('avance')}>
              📈 Mi Avance
            </button>
            <button className={`nav-btn ${tabActiva === 'rango'     ? 'activo' : ''}`} onClick={() => setTabActiva('rango')}>
              🏅 Rango
            </button>
            <button className={`nav-btn ${tabActiva === 'visitados' ? 'activo' : ''}`} onClick={() => setTabActiva('visitados')}>
              📍 Sitios Visitados
            </button>
          </nav>
        </aside>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main className="profile-main-content">

          {/* MISIONES — vienen de BD, estado real por perfil */}
          {tabActiva === 'misiones' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">🎯 Misiones Disponibles</h3>
              <p className="tab-desc">Completá estas tareas para ganar XP y puntos.</p>
              <div className="misiones-lista">
                {misiones.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>No hay misiones disponibles.</p>
                )}
                {misiones.map(mision => {
                  const completada = estaCompletada(mision.id);
                  return (
                    <div key={mision.id} className={`mision-card ${completada ? 'completada' : ''}`}>
                      <div className="mision-info">
                        <h4>{mision.titulo}</h4>
                        {mision.descripcion && (
                          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{mision.descripcion}</p>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span className="mision-xp">+{mision.xpRecompensa} XP</span>
                          <span className="mision-xp" style={{ background: '#E8621A' }}>
                            +{mision.puntosRecompensa} pts
                          </span>
                        </div>
                      </div>
                      <div className="mision-estado">
                        {completada ? '✅ Lista' : '⏳ Pendiente'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AVANCE — historial real de BD */}
          {tabActiva === 'avance' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">📈 Tu Historial</h3>
              <p className="tab-desc">Todo lo que has hecho recientemente en PuertoInforma.</p>
              <div className="avance-timeline">
                {historial.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>Aún no tenés actividad registrada.</p>
                )}
                {historial.map(item => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className="timeline-fecha">{formatearFecha(item.fecha)}</span>
                      <p className="timeline-accion">{item.descripcion}</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {item.xp   > 0 && <span className="timeline-xp">+{item.xp} XP</span>}
                        {item.puntos > 0 && <span className="timeline-xp" style={{ background: '#E8621A' }}>+{item.puntos} pts</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RANGO — rangos reales de BD */}
          {tabActiva === 'rango' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">🏅 Progreso de Rango</h3>
              <p className="tab-desc">Ganás XP para desbloquear nuevos títulos.</p>
              <div className="rangos-lista">
                {rangos
                  .sort((a, b) => a.puntosRequeridos - b.puntosRequeridos)
                  .map((rango, index) => {
                    const esActual   = rangoActual?.id === rango.id;
                    const desbloqueado = xpActual >= rango.puntosRequeridos;
                    return (
                      <div
                        key={rango.id}
                        className={`rango-card ${esActual ? 'rango-actual' : ''} ${desbloqueado ? 'desbloqueado' : 'bloqueado'}`}
                      >
                        <div className="rango-nivel">Nivel {index + 1}</div>
                        <div className="rango-nombre">{rango.urlIcono && <img src={rango.urlIcono} alt="icono" style={{ width: '80px', height: '80px', display: 'block', margin: '0 auto 0.5rem auto', objectFit: 'contain' }} />}{rango.nombre}</div>
                        <div className="rango-req">{rango.puntosRequeridos} XP requeridos</div>
                        {esActual && <div className="rango-badge">Tú estás aquí</div>}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* SITIOS VISITADOS — reales de BD */}
          {tabActiva === 'visitados' && (
            <div className="tab-section fade-in">
              <h3 className="tab-titulo">📍 Tus Sitios Explorados</h3>
              <p className="tab-desc">Lugares en los que has marcado asistencia.</p>
              <div className="sitios-grid">
                {sitiosVisitados.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>Aún no has visitado ningún lugar.</p>
                )}
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