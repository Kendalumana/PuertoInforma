import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './styles/Index.css';

// ── Carga inmediata: Login y Registro son las rutas de entrada ──
import Login from './components/Login';
import Registro from './components/Registro';
import AuthCallback from './components/AuthCallback';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// ── Carga diferida: rutas protegidas solo se descargan cuando el usuario las visita ──
// Esto reduce el bundle inicial de ~700kB a ~150kB
const MapaView       = lazy(() => import('./components/MapaView'));
const PaginaPerfil   = lazy(() => import('./components/PaginaPerfil'));
const PaginaBuses    = lazy(() => import('./components/PaginaBuses'));
const PaginaFerry    = lazy(() => import('./components/PaginaFerry'));
const PaginaNoticias = lazy(() => import('./components/PaginaNoticias'));

// ── Pantalla de carga mientras el chunk se descarga ──
function PantallaCarga() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at 50% 50%, #2A1A10 0%, #0D0D0D 80%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid rgba(232, 98, 26, 0.2)',
                borderTopColor: '#E8621A',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
                Cargando...
            </p>
        </div>
    );
}

function RutaProtegida({ children }) {
    const token = localStorage.getItem('token');
    const [isAllowed, setIsAllowed] = useState(null);

    useEffect(() => {
        queueMicrotask(() => {
            if (!token) {
                setIsAllowed(false);
                return;
            }

            try {
                const { exp } = jwtDecode(token);
                if (exp && exp * 1000 <= Date.now()) {
                    localStorage.removeItem('token');
                    setIsAllowed(false);
                    return;
                }

                setIsAllowed(true);
            } catch {
                localStorage.removeItem('token');
                setIsAllowed(false);
            }
        });
    }, [token]);

    if (isAllowed === null) return <PantallaCarga />;
    if (!isAllowed) return <Navigate to="/login" replace />;

    return children;
}

function App() {
    return (
        <Suspense fallback={<PantallaCarga />}>
            <Routes>
                {/* Rutas públicas — sin lazy, carga inmediata */}
                <Route path="/login"         element={<Login />} />
                <Route path="/registro"      element={<Registro />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/recuperar-clave" element={<ForgotPassword />} />
                <Route path="/restablecer-clave" element={<ResetPassword />} />

                {/* Rutas protegidas — lazy: se descargan al navegar por primera vez */}
                <Route path="/"         element={<RutaProtegida><MapaView /></RutaProtegida>} />
                <Route path="/perfil"   element={<RutaProtegida><PaginaPerfil /></RutaProtegida>} />
                <Route path="/buses"    element={<RutaProtegida><PaginaBuses /></RutaProtegida>} />
                <Route path="/ferry"    element={<RutaProtegida><PaginaFerry /></RutaProtegida>} />
                <Route path="/noticias" element={<RutaProtegida><PaginaNoticias /></RutaProtegida>} />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Suspense>
    );
}

export default App;
