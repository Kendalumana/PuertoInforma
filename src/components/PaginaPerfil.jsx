import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { axiosPrivate } from '../api/axios';
import Navbar from './Navbar';
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

// ✅ Sube imagen al bucket 'avatars' de Supabase y guarda la URL en el backend
async function subirAvatarImagen(file, usuarioId) {
  // 1. Subir al bucket 'avatars' (carpeta por usuario, reemplaza si ya existe)
  const ext = file.name.split('.').pop();
  const path = `${usuarioId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);

  // 2. Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  // 3. Guardar URL en el backend
  await guardarAvatar('imagen', publicUrl, usuarioId);
  return publicUrl;
}

// ✅ Función para guardar avatar (con usuarioId explícito, usando fetch)
async function guardarAvatar(tipo, valor, usuarioId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No hay token de autenticación');

    const url = 'https://puertoinforma-backend-production.up.railway.app/api/v1/perfil/avatar';
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

  const handleSubirImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño (máx 3MB)
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposPermitidos.includes(file.type)) {
      setAvatarError('Solo se permiten imágenes JPG, PNG, WEBP o GIF.');
      e.target.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setAvatarError('La imagen no puede superar 3MB.');
      e.target.value = '';
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      setAvatarError('No hay sesión activa. Iniciá sesión nuevamente.');
      return;
    }

    setGuardandoAvatar(true);
    setAvatarError(null);
    // Preview local inmediato mientras sube
    const previewUrl = URL.createObjectURL(file);
    setAvatarImagen(previewUrl);
    setAvatarTipo('subido');

    try {
      const publicUrl = await subirAvatarImagen(file, userId);
      setAvatarImagen(publicUrl); // reemplaza preview con URL real
    } catch (err) {
      setAvatarError(err.message || 'No se pudo subir la imagen.');
      // Revertir a emoji si falla
      setAvatarTipo('prediseñado');
      setAvatarImagen(null);
    } finally {
      setGuardandoAvatar(false);
      e.target.value = '';
    }
  };

  const formatearFecha = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('es-CR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  if (cargando) return (
    <div className="profile-page">
      <div className="profile-layout">
        {/* Skeleton sidebar */}
        <aside className="profile-sidebar">
          <div className="skeleton-card">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-line wide"></div>
            <div className="skeleton-line medium"></div>
            <div className="skeleton-stats">
              <div className="skeleton-stat-box"></div>
              <div className="skeleton-stat-box"></div>
            </div>
            <div className="skeleton-bar"></div>
          </div>
        </aside>
        {/* Skeleton misiones */}
        <main className="profile-main-content">
          <div className="skeleton-line wide" style={{ height: '2rem', marginBottom: '1.5rem', maxWidth: '250px' }}></div>
          <div className="missions-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-mission-card">
                <div className="skeleton-mission-img"></div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div className="skeleton-line wide"></div>
                  <div className="skeleton-line medium"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );

  if (error) return (
    <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh' }}>
      <div style={{ fontSize: '3rem' }}>⚠️</div>
      <p style={{ color: '#ef5350', fontWeight: 700, fontSize: '1rem', textAlign: 'center', maxWidth: '300px' }}>{error}</p>
      <button
        onClick={() => window.location.reload()}
        style={{ background: '#E8621A', color: '#fff', border: 'none', padding: '0.7rem 2rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
      >
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="profile-page">
      {/* NAVBAR SUPERIOR */}
      <Navbar />

      <div className="profile-layout">

        {/* SIDEBAR */}
        <aside className="profile-sidebar">
          {/* Botón volver */}
          <Link to="/" className="btn-back">← Volver al Mapa</Link>

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

                  {/* Subir foto propia */}
                  <div className="avatar-upload-section">
                    <label htmlFor="avatar-file-input" className="avatar-upload-btn">
                      {guardandoAvatar ? '⏳ Subiendo...' : '📷 Subir foto'}
                    </label>
                    <input
                      id="avatar-file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={handleSubirImagen}
                      disabled={guardandoAvatar}
                    />
                    <p className="avatar-upload-hint">JPG, PNG, WEBP · Máx 3MB</p>
                  </div>

                  {/* Error de avatar */}
                  {avatarError && (
                    <p className="avatar-error-msg">⚠️ {avatarError}</p>
                  )}
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
              <div className="stat-box rango-box">
                <span className="stat-label">RANGO</span>
                {rangoActual?.urlIcono ? (
                  <img src={rangoActual.urlIcono} alt={rangoActual.nombre} className="rango-stat-icon" />
                ) : (
                  <span className="stat-value light">🏅</span>
                )}
                <span className="rango-stat-name">{rangoActual?.nombre?.split('(')[0]?.trim() ?? 'Nivel 1'}</span>
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

          {/* ── Historial de Actividad — A-I2 ── */}
          {historial.length > 0 && (
            <div className="perfil-historial-card">
              <h3 className="badges-title">📍 Historial de Actividad</h3>
              <div className="perfil-historial-list">
                {historial.slice(0, 5).map((item, i) => (
                  <div key={i} className="perfil-historial-item">
                    <span className="perfil-historial-icon">✓</span>
                    <div className="perfil-historial-info">
                      <span className="perfil-historial-nombre">
                        {item.mision?.titulo || item.titulo || 'Actividad'}
                      </span>
                      <span className="perfil-historial-fecha">
                        {formatearFecha(item.fechaCompletado || item.fecha)}
                      </span>
                    </div>
                    {(item.xpGanado || item.mision?.xpRecompensa) && (
                      <span className="perfil-historial-xp">
                        +{item.xpGanado || item.mision?.xpRecompensa} XP
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sitios Visitados — A-I2 ── */}
          {sitiosVisitados.length > 0 && (
            <div className="perfil-historial-card">
              <h3 className="badges-title">🏖️ Sitios Visitados ({sitiosVisitados.length})</h3>
              <div className="perfil-sitios-grid">
                {sitiosVisitados.slice(0, 6).map((sitio, i) => (
                  <div key={i} className="perfil-sitio-chip">
                    <span className="perfil-sitio-icono">📍</span>
                    <span className="perfil-sitio-nombre">
                      {sitio.lugar?.nombre || sitio.nombre || 'Lugar'}
                    </span>
                  </div>
                ))}
              </div>
              {sitiosVisitados.length > 6 && (
                <p className="perfil-sitios-mas">+{sitiosVisitados.length - 6} más</p>
              )}
            </div>
          )}
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

              // Buscar el perfilMision correspondiente para leer el progreso real
              const pm = perfilMisiones.find(p => p.mision?.id === mision.id);
              const progresoReal = pm?.progreso ?? pm?.contadorVisitas ?? null;
              const metaReal     = pm?.meta ?? mision.meta ?? null;

              // Generar un gradiente o color estético basado en el index
              const gradients = [
                'linear-gradient(45deg, #2D2D2D, #4a5568)',
                'linear-gradient(45deg, #2D2D2D, #2b6cb0)',
                'linear-gradient(45deg, #1A202C, #E8621A)',
                'linear-gradient(45deg, #2D2D2D, #805AD5)'
              ];
              const bgGradient = gradients[i % gradients.length];

              // Porcentaje de la barra de progreso
              const pct = completada
                ? 100
                : (progresoReal !== null && metaReal)
                  ? Math.min(100, Math.round((progresoReal / metaReal) * 100))
                  : 0;

              // Texto del contador (ej: "3/5")
              const contadorTexto = completada
                ? (metaReal ? `${metaReal}/${metaReal}` : '1/1')
                : (progresoReal !== null && metaReal)
                  ? `${progresoReal}/${metaReal}`
                  : '0/1';

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
                        <span>{contadorTexto}</span>
                      </div>
                      <div className="xp-barra">
                        <div className="xp-relleno" style={{ width: `${pct}%` }}></div>
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