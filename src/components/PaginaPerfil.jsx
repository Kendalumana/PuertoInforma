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

  const [avatarTipo, setAvatarTipo] = useState('prediseñado');
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(1);
  const [avatarImagen, setAvatarImagen] = useState(null);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [tabActiva, setTabActiva] = useState('todas');
  const [guardandoAvatar, setGuardandoAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(null);

  const [perfil, setPerfil] = useState(null);
  const [misiones, setMisiones] = useState([]);
  const [perfilMisiones, setPerfilMisiones] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [rangos, setRangos] = useState([]);
  const [sitiosVisitados, setSitiosVisitados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

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
            const payload = JSON.parse(atob(localToken.split('.')[1]));
            userId = payload.id || payload.sub || payload.usuarioId || payload.userId;
          } catch (e) {
            console.error("Error decodificando token local", e);
          }
        }

        if (!userId) {
          navigate('/login');
          return;
        }

        // ── Cargar perfil (puede fallar si el usuario aún no tiene perfil) ──
        let perfilId = null;
        try {
          const resPerfil = await axiosPrivate.get(`/perfil/usuario/${userId}`);
          const datosPerfil = resPerfil.data;
          setPerfil(datosPerfil);
          perfilId = datosPerfil.id;

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
        } catch (perfilErr) {
          console.warn('⚠️ No se pudo cargar perfil (puede no existir aún):', perfilErr.message);
          // Crear un perfil temporal para que la UI no se rompa
          setPerfil({ nombreUsuario: 'Explorador', puntosTotales: 0, experienciaXp: 0 });
        }

        // ── Cargar rangos y misiones (independientes del perfil) ──
        const promesas = [
          axiosPrivate.get('/mision').catch(() => ({ data: [] })),
          axiosPrivate.get('/rango').catch(() => ({ data: [] })),
        ];

        // Si tenemos perfilId, cargar datos asociados al perfil
        if (perfilId) {
          promesas.push(
            axiosPrivate.get(`/mision/perfil/${perfilId}`).catch(() => ({ data: [] })),
            axiosPrivate.get(`/mision/historial/${perfilId}`).catch(() => ({ data: [] })),
            axiosPrivate.get(`/mision/visitados/${perfilId}`).catch(() => ({ data: [] })),
          );
        }

        const resultados = await Promise.all(promesas);

        setMisiones(resultados[0].data);
        setRangos(resultados[1].data);

        if (perfilId) {
          setPerfilMisiones(resultados[2].data);
          setHistorial(resultados[3].data);
          setSitiosVisitados(resultados[4].data);
        }

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

        {/* SIDEBAR */}
        <aside className="profile-sidebar">
          {/* Tarjeta Principal de Usuario */}
          <div className="profile-card">
            <div className="avatar-wrapper">
              <div className="avatar-display" onClick={() => setMostrarSelector(!mostrarSelector)}>
                {guardandoAvatar ? (
                  <span className="avatar-emoji">⏳</span>
                ) : avatarTipo === 'subido' && avatarImagen ? (
                  <img src={avatarImagen} alt="Avatar" className="avatar-img" />
                ) : (
                  <span className="avatar-emoji">
                    {AVATARES.find(a => a.id === avatarSeleccionado)?.emoji || '🧑‍✈️'}
                  </span>
                )}
              </div>

              {mostrarSelector && (
                <div className="avatar-selector" style={{ top: '130px' }}>
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
                </div>
              )}
            </div>

            <h2 className="profile-name">{perfil?.nombreUsuario ?? 'Usuario'}</h2>
            <div className="profile-rank-badge">
              {rangoActual?.nombre?.toUpperCase() ?? 'RECIEN LLEGADO'}
            </div>

            <div className="profile-stats-grid">
              <div className="stat-box">
                <span className="stat-label">PUNTOS</span>
                <span className="stat-value">{perfil?.puntosTotales ?? 0}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">RANGO</span>
                <span className="stat-value light">#{rangoActual?.id ?? 1}</span>
              </div>
            </div>

            <div className="xp-container">
              <div className="xp-header">
                <span className="xp-title">Progreso de Nivel</span>
                <span className="xp-numbers">{xpActual} / {XP_SIGUIENTE_NIVEL} XP</span>
              </div>
              <div className="xp-barra">
                <div className="xp-relleno" style={{ width: `${calcularPorcentajeXP()}%` }}></div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Pines / Rangos */}
          <div className="badges-card">
            <h3 className="badges-title">🏆 Tu Progreso de Rango</h3>
            <div className="badges-grid">
              {rangos.sort((a, b) => a.puntosRequeridos - b.puntosRequeridos).map((r) => {
                const isUnlocked = xpActual >= r.puntosRequeridos;
                return (
                  <div
                    key={r.id}
                    className={`badge-icon ${isUnlocked ? 'unlocked' : 'locked'}`}
                    title={`${r.nombre} (${r.puntosRequeridos} XP)`}
                  >
                    {r.urlIcono ? (
                      <img src={r.urlIcono} alt={r.nombre} />
                    ) : (
                      '🏅'
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="profile-main-content">
          <div className="main-header">
            <div className="main-title">
              <h2>Misiones Disponibles</h2>
              <p>Explora la ciudad, completa desafíos y sube de nivel.</p>
            </div>
            <div className="main-filters">
              <button
                className={`filter-btn ${tabActiva === 'todas' ? 'active' : ''}`}
                onClick={() => setTabActiva('todas')}
              >
                Todas
              </button>
              <button
                className={`filter-btn ${tabActiva === 'pendientes' ? 'active' : ''}`}
                onClick={() => setTabActiva('pendientes')}
              >
                Pendientes
              </button>
            </div>
          </div>

          <div className="missions-grid">
            {misiones.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1' }}>No hay misiones disponibles.</p>
            )}

            {misiones.map((mision, i) => {
              const completada = estaCompletada(mision.id);
              if (tabActiva === 'pendientes' && completada) return null;

              // Generar un gradiente o color estético basado en el index
              const gradients = [
                'linear-gradient(45deg, #2D2D2D, #4a5568)',
                'linear-gradient(45deg, #2D2D2D, #2b6cb0)',
                'linear-gradient(45deg, #1A202C, #E8621A)',
                'linear-gradient(45deg, #2D2D2D, #805AD5)'
              ];
              const bgGradient = gradients[i % gradients.length];

              return (
                <div key={mision.id} className="mission-card">
                  <div className="mission-img" style={{ background: bgGradient }}>
                    <div className="xp-pill">+{mision.xpRecompensa} XP</div>
                  </div>
                  <div className="mission-content">
                    <div className="mission-header">
                      <h3 className="mission-title">{mision.titulo}</h3>
                      <span className={`status-badge ${completada ? 'completed' : ''}`}>
                        {completada ? 'COMPLETADO' : 'PENDIENTE'}
                      </span>
                    </div>
                    <p className="mission-desc">
                      {mision.descripcion || 'Completa esta misión para ganar recompensas.'}
                    </p>
                    <div className="mission-progress-container">
                      <div className="mission-progress-header">
                        <span>Progreso</span>
                        <span>{completada ? '1/1' : '0/1'}</span>
                      </div>
                      <div className="xp-barra">
                        <div className="xp-relleno" style={{ width: completada ? '100%' : '0%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

      </div>
    </div>
  );
}

export default PaginaPerfil;