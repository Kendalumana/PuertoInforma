import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { axiosPrivate } from '../api/axios';
import Navbar from './Navbar';
import MissionList from './MissionList';
import ProfileSidebar from './ProfileSidebar';
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

async function guardarAvatar(tipo, valor, usuarioId) {
  try {
    const response = await axiosPrivate.put('/perfil/avatar', { tipo, valor, usuarioId });
    return response.data;
  } catch (error) {
    console.error('❌ Error al guardar avatar:', error);
    throw new Error('No se pudo guardar el avatar');
  }
}

// Distingue timeout de otros errores
function mensajeError(err) {
  const esTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
  const es500 = err?.response?.status >= 500;
  if (esTimeout) return 'El servidor tardó en responder. Reintentá en unos segundos.';
  if (es500) return 'Error en el servidor (500). Reintentá en un momento.';
  return 'No se pudo cargar. Reintentá.';
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

  // Estados separados para carga/error del perfil completo vs. solo misiones
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);           // error total (sesión/perfil)
  const [errorMisiones, setErrorMisiones] = useState(null); // error parcial: solo misiones
  const [cargandoMisiones, setCargandoMisiones] = useState(false);

  const [reintento, setReintento] = useState(0);

  const [session, setSession] = useState(null);
  const [userId, setUserId] = useState(null);
  const [perfilId, setPerfilId] = useState(null);

  // ── Carga del perfil y sesión ──────────────────────────────
  useEffect(() => {
    async function cargarPerfil() {
      setCargando(true);
      setError(null);
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s) {
          setSession(s);
        }

        const localToken = localStorage.getItem('token');
        const localUserId = localStorage.getItem('usuarioId');

        let resolvedUserId = null;

        // 1. Priorizamos el ID numérico del backend guardado en localStorage
        if (localUserId && !isNaN(Number(localUserId))) {
          resolvedUserId = Number(localUserId);
        }

        // 2. Si no, extraemos el ID numérico de los claims del token JWT del backend
        if (!resolvedUserId && localToken && localToken !== 'undefined' && localToken !== 'null') {
          try {
            const payload = JSON.parse(atob(localToken.split('.')[1]));
            const possibleId = payload.id ?? payload.usuarioId ?? payload.userId ?? payload.idUsuario;
            if (possibleId !== undefined && possibleId !== null && !isNaN(Number(possibleId))) {
              resolvedUserId = Number(possibleId);
            } else if (payload.sub && !isNaN(Number(payload.sub))) {
              resolvedUserId = Number(payload.sub);
            } else if (possibleId) {
              resolvedUserId = possibleId;
            }
          } catch (e) {
            console.error('Error decodificando token local', e);
          }
        }

        // 3. Solo si no hay token ni ID del backend, usar el de Supabase como fallback
        if (!resolvedUserId && s?.user?.id) {
          resolvedUserId = s.user.id;
        }

        if (!resolvedUserId) {
          navigate('/login');
          return;
        }

        setUserId(resolvedUserId);

        // Cargar datos del perfil
        try {
          const resPerfil = await axiosPrivate.get(`/perfil/usuario/${resolvedUserId}`);
          const datosPerfil = resPerfil.data;
          setPerfil(datosPerfil);
          setPerfilId(datosPerfil.id);

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
          // 404 = usuario sin perfil aún, es normal
          if (!perfilErr.response || perfilErr.response.status !== 404) {
            console.warn('⚠️ No se pudo cargar perfil:', perfilErr.message);
          }
        }

      } catch (err) {
        console.error(err);
        setError(mensajeError(err));
      } finally {
        setCargando(false);
      }
    }

    cargarPerfil();
  }, [navigate]);

  // ── Carga de misiones — separada del perfil para poder reintentar ──
  const cargarMisiones = useCallback(async (pid) => {
    if (!pid) return;
    setCargandoMisiones(true);
    setErrorMisiones(null);
    try {
      // Rangos y misiones globales — si falla uno, el otro puede seguir
      const [resMisiones, resRangos, resPerfilMisiones, resHistorial, resVisitados] =
        await Promise.allSettled([
          axiosPrivate.get('/mision'),
          axiosPrivate.get('/rango'),
          axiosPrivate.get(`/mision/perfil/${pid}`),
          axiosPrivate.get(`/mision/historial/${pid}`),
          axiosPrivate.get(`/mision/visitados/${pid}`),
        ]);

      // Tomamos lo que funcionó, mostramos error si alguno falló
      const alguno500 = [resMisiones, resRangos, resPerfilMisiones, resHistorial, resVisitados]
        .some(r => r.status === 'rejected');

      if (resMisiones.status === 'fulfilled') setMisiones(resMisiones.value.data || []);
      if (resRangos.status === 'fulfilled')   setRangos(resRangos.value.data || []);
      if (resPerfilMisiones.status === 'fulfilled') setPerfilMisiones(resPerfilMisiones.value.data || []);
      if (resHistorial.status === 'fulfilled')      setHistorial(resHistorial.value.data || []);
      if (resVisitados.status === 'fulfilled')      setSitiosVisitados(resVisitados.value.data || []);

      if (alguno500) {
        // Algunos datos sí cargaron, mostramos lo que tenemos pero avisamos
        const primerError = [resMisiones, resRangos, resPerfilMisiones, resHistorial, resVisitados]
          .find(r => r.status === 'rejected')?.reason;
        setErrorMisiones(mensajeError(primerError));
      }
    } catch (err) {
      setErrorMisiones(mensajeError(err));
    } finally {
      setCargandoMisiones(false);
    }
  }, []);

  // Disparar carga de misiones cuando tengamos el perfilId (o al reintentar)
  useEffect(() => {
    if (perfilId) {
      cargarMisiones(perfilId);
    }
  }, [perfilId, reintento, cargarMisiones]);

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
    const resolvedId = userId || session?.user?.id;
    if (!resolvedId) {
      setAvatarError('No hay sesión activa. Iniciá sesión nuevamente.');
      setGuardandoAvatar(false);
      return;
    }
    try {
      await guardarAvatar('emoji', id.toString(), resolvedId);
    } catch {
      setAvatarError('No se pudo guardar el avatar. Reintentá.');
    } finally {
      setGuardandoAvatar(false);
    }
  };

  const formatearFecha = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('es-CR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // ── Skeleton de carga inicial ──
  if (cargando) return (
    <div className="profile-page">
      <div className="profile-layout">
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

  // ── Error crítico (sesión / red) ──
  if (error) return (
    <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh' }}>
      <div style={{ fontSize: '3rem' }}>⚠️</div>
      <p style={{ color: '#ef5350', fontWeight: 700, fontSize: '1rem', textAlign: 'center', maxWidth: '300px' }}>
        {error}
      </p>
      <button
        onClick={() => setReintento(r => r + 1)}
        style={{ background: 'linear-gradient(to right,#FF9B6A,#E85D04)', color: '#fff', border: 'none', padding: '0.7rem 2rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
      >
        🔄 Reintentar
      </button>
    </div>
  );

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-layout">

        <ProfileSidebar
          avatarError={avatarError}
          avatarImage={avatarImagen}
          avatarSelected={avatarSeleccionado}
          avatarType={avatarTipo}
          avatares={AVATARES}
          experiencia={xpActual}
          formatDate={formatearFecha}
          historial={historial}
          isAvatarSaving={guardandoAvatar}
          onSelectAvatar={handleSeleccionarEmoji}
          onToggleAvatarSelector={() => setMostrarSelector(valor => !valor)}
          perfil={perfil}
          rangoActual={rangoActual}
          rangos={rangos}
          session={session}
          showAvatarSelector={mostrarSelector}
          sitiosVisitados={sitiosVisitados}
          xpMaximo={XP_SIGUIENTE_NIVEL}
          xpPorcentaje={calcularPorcentajeXP()}
        />

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

          {/* ── Banner de error de misiones (sin bloquear el resto del perfil) ── */}
          {errorMisiones && !cargandoMisiones && (
            <div className="misiones-error-banner" role="alert">
              <span className="misiones-error-icon">📡</span>
              <div className="misiones-error-texto">
                <strong>No se pudieron cargar las misiones</strong>
                <p>{errorMisiones}</p>
              </div>
              <button
                className="misiones-retry-btn"
                onClick={() => setReintento(r => r + 1)}
              >
                🔄 Reintentar
              </button>
            </div>
          )}

          {/* ── Skeleton de misiones cargando ── */}
          {cargandoMisiones && (
            <div className="missions-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-mission-card">
                  <div className="skeleton-mission-img"></div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div className="skeleton-line wide"></div>
                    <div className="skeleton-line medium"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Lista de misiones ── */}
          {!cargandoMisiones && (
            <MissionList
              misiones={misiones}
              perfilMisiones={perfilMisiones}
              tabActiva={tabActiva}
            />
          )}
        </main>

      </div>
    </div>
  );
}

export default PaginaPerfil;
