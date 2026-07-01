import { useState, useEffect } from 'react';
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

// Función para guardar avatar (console.log de producción eliminado)
async function guardarAvatar(tipo, valor, usuarioId) {
  try {
    const response = await axiosPrivate.put('/perfil/avatar', { tipo, valor, usuarioId });
    return response.data;
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
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function cargarTodo() {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        const localToken = localStorage.getItem('token');

        let resolvedUserId = null;

        if (s) {
          resolvedUserId = s.user.id;
          setSession(s);
        } else if (localToken) {
          try {
            const payload = JSON.parse(atob(localToken.split('.')[1]));
            resolvedUserId = payload.id || payload.sub || payload.usuarioId || payload.userId;
          } catch (e) {
            console.error("Error decodificando token local", e);
          }
        }

        if (!resolvedUserId) {
          navigate('/login');
          return;
        }

        setUserId(resolvedUserId);
        const uid = resolvedUserId;

        // ── Cargar perfil ──
        let perfilId = null;
        try {
          const resPerfil = await axiosPrivate.get(`/perfil/usuario/${uid}`);
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
          if (perfilErr.response && perfilErr.response.status === 404) {
            // Normal: usuario sin perfil creado aún
          } else {
            console.warn('⚠️ No se pudo cargar perfil:', perfilErr.message);
          }
        }

        // ── Cargar rangos y misiones ──
        const promesas = [
          axiosPrivate.get('/mision').catch(() => ({ data: [] })),
          axiosPrivate.get('/rango').catch(() => ({ data: [] })),
        ];

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

          <MissionList
            misiones={misiones}
            perfilMisiones={perfilMisiones}
            tabActiva={tabActiva}
          />
        </main>

      </div>
    </div>
  );
}

export default PaginaPerfil;
