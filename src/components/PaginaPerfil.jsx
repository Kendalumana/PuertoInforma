import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import axios, { axiosPrivate } from '../api/axios';
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

const RANGOS_FALLBACK = [
  {
    id: 1,
    nivel: 1,
    nombre: 'Recien Llegado (Cangrejo)',
    animal: 'Cangrejo',
    puntosRequeridos: 0,
    urlIcono: 'https://bikhrlcljursgwuqereh.supabase.co/storage/v1/object/public/rangos/cangrejo-removebg-preview.png',
    descripcion: 'Iniciando en las aguas del puerto como un ágil cangrejo.'
  },
  {
    id: 2,
    nivel: 2,
    nombre: 'Explorador (Lapa)',
    animal: 'Lapa',
    puntosRequeridos: 100,
    urlIcono: 'https://bikhrlcljursgwuqereh.supabase.co/storage/v1/object/public/rangos/lapa-removebg-preview.png',
    descripcion: 'Sobrevuelas el Paseo de los Turistas conociendo cada rincón.'
  },
  {
    id: 3,
    nivel: 3,
    nombre: 'Conocedor (Iguana)',
    animal: 'Iguana',
    puntosRequeridos: 250,
    urlIcono: 'https://bikhrlcljursgwuqereh.supabase.co/storage/v1/object/public/rangos/iguana-removebg-preview.png',
    descripcion: 'Explorador constante del Golfo de Nicoya y sus playas.'
  },
  {
    id: 4,
    nivel: 4,
    nombre: 'Guía Local (Zanate)',
    animal: 'Zanate',
    puntosRequeridos: 500,
    urlIcono: 'https://bikhrlcljursgwuqereh.supabase.co/storage/v1/object/public/rangos/zanate-removebg-preview.png',
    descripcion: 'Audaz, ágil y conocedor de cada secreto y ruta porteña.'
  },
  {
    id: 5,
    nivel: 5,
    nombre: 'Enbajador (Cocodrilo)',
    animal: 'Cocodrilo',
    puntosRequeridos: 1000,
    urlIcono: 'https://bikhrlcljursgwuqereh.supabase.co/storage/v1/object/public/rangos/cocodrilo-removebg-preview.png',
    descripcion: 'El coloso y protector absoluto del Estero y Puntarenas.'
  }
];

const NIVELES_FALLBACK = [
  {
    nivel: 1,
    animal: 'Cangrejo',
    icono: '🦀',
    bloqueado: false,
    completadas: 0,
    total: 10,
    misiones: [
      { id: 1, codigo: 'N1-01', titulo: 'Primer Vistazo', instrucciones: 'Visita tu perfil por primera vez para conocer tus estadísticas.', meta: 1, xp: 30, nivel_requerido: 1, progreso: 0, completada: false },
      { id: 2, codigo: 'N1-02', titulo: 'Mi Cara', instrucciones: 'Elige y personaliza tu avatar en tu perfil.', meta: 1, xp: 40, nivel_requerido: 1, progreso: 0, completada: false },
      { id: 3, codigo: 'N1-03', titulo: 'Explorador Inicial', instrucciones: 'Abre y revisa el detalle de 3 lugares distintos en el mapa.', meta: 3, xp: 60, nivel_requerido: 1, progreso: 0, completada: false },
      { id: 4, codigo: 'N1-04', titulo: 'Corazón Local', instrucciones: 'Agrega tu primer comercio o sitio de interés a favoritos.', meta: 1, xp: 30, nivel_requerido: 1, progreso: 0, completada: false },
      { id: 5, codigo: 'N1-05', titulo: 'Busca y Encuentra', instrucciones: 'Realiza tu primera búsqueda en el panel del mapa interactivo.', meta: 1, xp: 20, nivel_requerido: 1, progreso: 0, completada: false },
      { id: 6, codigo: 'N1-06', titulo: 'Categorías', instrucciones: 'Filtra los lugares por cualquier categoría en el mapa.', meta: 1, xp: 20, nivel_requerido: 1, progreso: 0, completada: false },
      { id: 7, codigo: 'N1-07', titulo: 'Rumbo Fijo', instrucciones: 'Consulta las rutas y horarios de autobús del puerto.', meta: 1, xp: 40, nivel_requerido: 1, progreso: 0, completada: false },
      { id: 8, codigo: 'N1-08', titulo: 'Postal del Faro', instrucciones: 'Toma y adjunta una fotografía del Faro de Puntarenas o de la punta.', tipo: 'FOTO', requiereFoto: true, meta: 1, xp: 70, nivel_requerido: 1, progreso: 0, completada: false },
      { id: 9, codigo: 'N1-09', titulo: 'QR de la Capitanía', instrucciones: 'Escanea el código QR de información turística en la Antigua Capitanía / Muelle Grande.', tipo: 'QR', requiereQR: true, meta: 1, xp: 80, nivel_requerido: 1, progreso: 0, completada: false },
      { id: 10, codigo: 'N1-10', titulo: 'Selfie en las Letras', instrucciones: 'Captura una foto de recuerdo junto al rótulo icónico de PUNTARENAS en el Paseo.', tipo: 'FOTO', requiereFoto: true, meta: 1, xp: 60, nivel_requerido: 1, progreso: 0, completada: false }
    ]
  },
  {
    nivel: 2,
    animal: 'Lapa',
    icono: '🦜',
    bloqueado: true,
    completadas: 0,
    total: 7,
    misiones: [
      { id: 11, codigo: 'N2-01', titulo: 'Coleccionista', instrucciones: 'Explora y abre el detalle de 10 lugares distintos.', meta: 10, xp: 60, nivel_requerido: 2, progreso: 0, completada: false, bloqueada: true },
      { id: 12, codigo: 'N2-02', titulo: 'Lista de Favoritos', instrucciones: 'Guarda 5 comercios o puntos de interés en tus favoritos.', meta: 5, xp: 50, nivel_requerido: 2, progreso: 0, completada: false, bloqueada: true },
      { id: 13, codigo: 'N2-03', titulo: 'Rutas Maestro', instrucciones: 'Abre el mapa de recorrido de 3 rutas de autobuses.', meta: 3, xp: 60, nivel_requerido: 2, progreso: 0, completada: false, bloqueada: true },
      { id: 14, codigo: 'N2-04', titulo: 'Noticias del Puerto', instrucciones: 'Lee 5 artículos o comunicados en la sección de noticias.', meta: 5, xp: 50, nivel_requerido: 2, progreso: 0, completada: false, bloqueada: true },
      { id: 15, codigo: 'N2-05', titulo: 'Categorías Pro', instrucciones: 'Explora filtrando por 5 categorías diferentes en el mapa.', meta: 5, xp: 50, nivel_requerido: 2, progreso: 0, completada: false, bloqueada: true },
      { id: 16, codigo: 'N2-06', titulo: 'QR Boletería de Ferry', instrucciones: 'Escanea el código QR informativo en la terminal del ferry.', tipo: 'QR', requiereQR: true, meta: 1, xp: 80, nivel_requerido: 2, progreso: 0, completada: false, bloqueada: true },
      { id: 17, codigo: 'N2-07', titulo: 'Foto del Sunset Porteño', instrucciones: 'Captura una foto del atardecer sobre el Paseo de los Turistas.', tipo: 'FOTO', requiereFoto: true, meta: 1, xp: 90, nivel_requerido: 2, progreso: 0, completada: false, bloqueada: true }
    ]
  },
  {
    nivel: 3,
    animal: 'Iguana',
    icono: '🦎',
    bloqueado: true,
    completadas: 0,
    total: 5,
    misiones: [
      { id: 21, codigo: 'N3-01', titulo: 'Gran Explorador', instrucciones: 'Inspecciona a fondo abriendo 25 lugares distintos de Puntarenas.', meta: 25, xp: 100, nivel_requerido: 3, progreso: 0, completada: false, bloqueada: true },
      { id: 22, codigo: 'N3-02', titulo: 'Colección Completa', instrucciones: 'Arma tu guía definitiva guardando 15 favoritos.', meta: 15, xp: 80, nivel_requerido: 3, progreso: 0, completada: false, bloqueada: true },
      { id: 23, codigo: 'N3-03', titulo: 'Racha Semanal', instrucciones: 'Haz check-in o mantén actividad continua durante 7 días seguidos.', meta: 7, xp: 150, nivel_requerido: 3, progreso: 0, completada: false, bloqueada: true },
      { id: 24, codigo: 'N3-04', titulo: 'QR Estación de Buses', instrucciones: 'Escanea el código QR de horarios en la terminal de buses.', tipo: 'QR', requiereQR: true, meta: 1, xp: 100, nivel_requerido: 3, progreso: 0, completada: false, bloqueada: true },
      { id: 25, codigo: 'N3-05', titulo: 'Foto Churchill Tradicional', instrucciones: 'Captura y sube una foto de tu Churchill en los kioscos del puerto.', tipo: 'FOTO', requiereFoto: true, meta: 1, xp: 90, nivel_requerido: 3, progreso: 0, completada: false, bloqueada: true }
    ]
  },
  {
    nivel: 4,
    animal: 'Zanate',
    icono: '🦅',
    bloqueado: true,
    completadas: 0,
    total: 5,
    misiones: [
      { id: 31, codigo: 'N4-01', titulo: 'Vuelo de Zanate', instrucciones: 'Consulta rutas de autobús en 15 ocasiones.', meta: 15, xp: 90, nivel_requerido: 4, progreso: 0, completada: false, bloqueada: true },
      { id: 32, codigo: 'N4-02', titulo: 'Guardián del Faro', instrucciones: 'Realiza check-in presencial en 10 comercios o atractivos.', meta: 10, xp: 120, nivel_requerido: 4, progreso: 0, completada: false, bloqueada: true },
      { id: 33, codigo: 'N4-03', titulo: 'Travesía del Estero', instrucciones: 'Consulta los horarios y salidas de ferry 10 veces.', meta: 10, xp: 90, nivel_requerido: 4, progreso: 0, completada: false, bloqueada: true },
      { id: 34, codigo: 'N4-04', titulo: 'QR Kiosco de Turismo', instrucciones: 'Escanea el código QR del punto de información turística.', tipo: 'QR', requiereQR: true, meta: 1, xp: 110, nivel_requerido: 4, progreso: 0, completada: false, bloqueada: true },
      { id: 35, codigo: 'N4-05', titulo: 'Foto Mirador del Estero', instrucciones: 'Captura una fotografía de la vista panorámica del estero.', tipo: 'FOTO', requiereFoto: true, meta: 1, xp: 120, nivel_requerido: 4, progreso: 0, completada: false, bloqueada: true }
    ]
  },
  {
    nivel: 5,
    animal: 'Cocodrilo',
    icono: '🐊',
    bloqueado: true,
    completadas: 0,
    total: 5,
    misiones: [
      { id: 41, codigo: 'N5-01', titulo: 'Rey del Estero', instrucciones: 'Completa 20 check-ins presenciales en comercios de la ciudad.', meta: 20, xp: 200, nivel_requerido: 5, progreso: 0, completada: false, bloqueada: true },
      { id: 42, codigo: 'N5-02', titulo: 'Embajador Legendario', instrucciones: 'Acumula 20 sitios favoritos en tu colección personal.', meta: 20, xp: 150, nivel_requerido: 5, progreso: 0, completada: false, bloqueada: true },
      { id: 43, codigo: 'N5-03', titulo: 'Capitán del Golfo', instrucciones: 'Inspecciona en el mapa el trayecto de 15 rutas de bus.', meta: 15, xp: 120, nivel_requerido: 5, progreso: 0, completada: false, bloqueada: true },
      { id: 44, codigo: 'N5-04', titulo: 'QR Placa Histórica', instrucciones: 'Escanea el código QR de la placa conmemorativa del muelle.', tipo: 'QR', requiereQR: true, meta: 1, xp: 150, nivel_requerido: 5, progreso: 0, completada: false, bloqueada: true },
      { id: 45, codigo: 'N5-05', titulo: 'Foto Panorámica del Puerto', instrucciones: 'Toma una foto panorámica de toda la península porteña.', tipo: 'FOTO', requiereFoto: true, meta: 1, xp: 200, nivel_requerido: 5, progreso: 0, completada: false, bloqueada: true }
    ]
  }
];

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
  const [nivelesMisiones, setNivelesMisiones] = useState(null);
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
        if (localUserId) {
          resolvedUserId = !isNaN(Number(localUserId)) ? Number(localUserId) : localUserId;
        }

        // 2. Si no, extraemos el ID de los claims del token JWT del backend
        if (!resolvedUserId && localToken && localToken !== 'undefined' && localToken !== 'null') {
          try {
            const payload = JSON.parse(atob(localToken.split('.')[1]));
            const possibleId = payload.id ?? payload.usuarioId ?? payload.userId ?? payload.idUsuario;
            if (possibleId !== undefined && possibleId !== null) {
              resolvedUserId = !isNaN(Number(possibleId)) ? Number(possibleId) : possibleId;
            } else if (payload.sub) {
              resolvedUserId = !isNaN(Number(payload.sub)) ? Number(payload.sub) : payload.sub;
            }
          } catch (e) {
            console.error('Error decodificando token local', e);
          }
        }

        // 3. Fallback a Supabase si no hay token del backend
        if (!resolvedUserId && s?.user?.id) {
          resolvedUserId = s.user.id;
        }

        // Si NO hay token ni sesión de Supabase, solo en ese caso redirigir a login
        if (!localToken && !s) {
          navigate('/login');
          return;
        }

        // Si hay token pero resolvedUserId no vino explícito, usar identificador seguro
        if (!resolvedUserId) {
          resolvedUserId = 'demo-user-123';
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
          // Si no existe o estamos en modo pruebas sin backend, usamos el perfil local de Kendall CR
          setPerfil({
            id: 1,
            nombreUsuario: 'Kendall CR',
            nombre: 'Kendall CR',
            puntosTotales: 0,
            experienciaXp: 0,
            avatarTipo: 'emoji',
            avatarValor: '6'
          });
          setPerfilId(1);
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
      // Rangos y misiones globales cargan directo de la BD pública de Render
      const [resMisiones, resRangos, resPerfilMisiones, resHistorial, resVisitados] =
        await Promise.allSettled([
          axios.get('/mision'),
          axios.get('/rango'),
          axiosPrivate.get(`/mision/perfil/${pid}`),
          axiosPrivate.get(`/mision/historial/${pid}`),
          axiosPrivate.get(`/mision/visitados/${pid}`),
        ]);

      if (resMisiones.status === 'fulfilled') {
        const dataM = resMisiones.value.data;
        if (dataM?.niveles && dataM.niveles.length > 0) {
          setNivelesMisiones(dataM.niveles);
        } else if (Array.isArray(dataM) && dataM.length > 0) {
          setMisiones(dataM);
          setNivelesMisiones(null);
        } else {
          setNivelesMisiones(NIVELES_FALLBACK);
        }
      } else {
        setNivelesMisiones(NIVELES_FALLBACK);
      }

      if (resRangos.status === 'fulfilled' && (resRangos.value.data || []).length > 0) {
        setRangos(resRangos.value.data);
      } else {
        setRangos(RANGOS_FALLBACK);
      }

      if (resPerfilMisiones.status === 'fulfilled') setPerfilMisiones(resPerfilMisiones.value.data || []);
      if (resHistorial.status === 'fulfilled')      setHistorial(resHistorial.value.data || []);
      if (resVisitados.status === 'fulfilled')      setSitiosVisitados(resVisitados.value.data || []);

      // Si usamos fallback local de misiones, no mostrar banner de error alarmante
      setErrorMisiones(null);

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
              niveles={nivelesMisiones}
              nivelActual={rangoActual?.id || rangoActual?.nivel || (Math.floor(xpActual / XP_SIGUIENTE_NIVEL) + 1)}
            />
          )}
        </main>

      </div>
    </div>
  );
}

export default PaginaPerfil;
