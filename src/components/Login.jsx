// ============================================================
// Login.jsx — Pantalla de inicio de sesión de PuertoInforma
// FLUJO: email + contraseña → POST /usuario/login → guarda token
//        en localStorage → redirige a '/'
// ============================================================

import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { enviarFormulario } from '../api/enviarFormulario';
import axios from '../api/axios';          // instancia base con baseURL
import { supabase } from '../lib/supabase'; // ← agregado para Google OAuth
import logoIcon from '../Resources/logoFinal.ico';
import '../styles/Login.css';
import { LogIn, Eye, EyeOff, Compass, UserCheck } from 'lucide-react';

function Login() {
    const [searchParams] = useSearchParams();
    const vieneDePerfil = searchParams.get('from') === 'perfil';

    // ── Estado del formulario ──────────────────────────────
    const [email, setEmail] = useState('');       // valor del campo email
    const [password, setPassword] = useState('');       // valor del campo contraseña
    const [error, setError] = useState('');       // mensaje de error visible
    const [cargando, setCargando] = useState(false);    // deshabilita el botón mientras espera
    const [showPassword, setShowPassword] = useState(false); // [MODIFICACIÓN] Estado para mostrar contraseña

    const [estadoConexion, setEstadoConexion] = useState('');
    const navigate = useNavigate(); // hook para redirigir después del login

    // ── Función principal al enviar el formulario ──────────
    const handleLogin = async (e) => {
        e.preventDefault();  // evita que la página se recargue al hacer submit
        setError('');        // limpia errores anteriores
        setCargando(true);   // desactiva el botón para evitar doble envío

        try {
            // POST al endpoint de login con email y contraseña
            const response = await enviarFormulario(axios, '/usuario/login', {
                email,
                password
            }, setEstadoConexion);

            // Sincronización robusta del token devuelto por el backend
            const data = response.data;
            const tokenRecibido = typeof data === 'string'
                ? data.trim()
                : (data?.token || data?.jwt || data?.accessToken || data?.access_token || data?.id_token);

            if (!tokenRecibido) {
                console.error('[Login] El backend respondió pero no envió un token:', data);
                setError('El servidor no retornó un token de sesión válido.');
                return;
            }

            // Desconectar cualquier sesión residual de Supabase para evitar conflictos de token
            try {
                await supabase.auth.signOut();
            } catch { /* ignorar */ }

            localStorage.setItem('token', tokenRecibido);
            localStorage.setItem('email', email);
            try {
                const payload = JSON.parse(atob(tokenRecibido.split('.')[1]));
                const numId = data?.id || data?.usuarioId || data?.userId || data?.usuario?.id || payload?.id || payload?.usuarioId || payload?.userId;
                if (numId) {
                    localStorage.setItem('usuarioId', String(numId));
                }
            } catch { /* ignorar */ }

            // Redirigimos al home o al perfil según corresponda
            navigate(vieneDePerfil ? '/perfil' : '/');

        } catch (err) {
            // Mostramos el mensaje del backend si existe, o un mensaje genérico
            if (err.esEsperaServidor) {
                setError(err.message);
            } else if (err.response?.status === 401) {
                setError('Correo o contraseña incorrectos.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('No se pudo conectar. Intentá de nuevo más tarde.');
            }
        } finally {
            setCargando(false); // reactiva el botón siempre, haya error o no
        }
    };

    // ── Login con Google ───────────────────────────────────
    const handleGoogle = async () => {
        setError('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) setError('No se pudo iniciar sesión con Google.');
    };

    return (
        // Contenedor que centra la tarjeta en la pantalla
        <div className="login-page">
            <div className="login-card">

                {/* Logo arriba de la tarjeta */}
                <div className="login-logo">
                    <img src={logoIcon} alt="Puerto Informa" className="login-logo-img" />
                </div>

                {/* Título y subtítulo */}
                <h1 className="login-titulo">Bienvenido</h1>
                <p className="login-subtitulo">
                    {vieneDePerfil
                        ? 'Iniciá sesión para acceder a tu perfil, nivel y misiones'
                        : 'Accedé a la guía definitiva de la ciudad'
                    }
                </p>

                {vieneDePerfil && (
                    <div className="login-info-banner" role="status">
                        <UserCheck size={18} color="#E8621A" />
                        <span>Para ver tu perfil y rango porteño debés iniciar sesión.</span>
                    </div>
                )}

                {/* Formulario — onSubmit llama a handleLogin */}
                <form className="login-form" onSubmit={handleLogin}>

                    {/* Campo email */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="email">
                            Correo electrónico
                        </label>
                        {/* [MODIFICACIÓN] Placeholder actualizado */}
                        <input
                            id="email"
                            type="email"
                            className="login-input"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required   // el navegador valida que no esté vacío
                            autoComplete="email"
                        />
                    </div>

                    {/* Campo contraseña */}
                    <div className="login-campo">
                        {/* [MODIFICACIÓN] Fila flex para etiqueta de contraseña y enlace de olvido */}
                        <div className="login-label-row">
                            <label className="login-label" htmlFor="password">
                                Contraseña
                            </label>
                            <Link to="/recuperar-clave" className="login-forgot-link">
                                ¿Olvidaste tu clave?
                            </Link>
                        </div>
                        {/* [MODIFICACIÓN] Wrapper para añadir el ícono del ojito */}
                        <div className="input-icon-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="login-input with-icon-right"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                aria-describedby={error ? 'login-error-msg' : undefined}
                            />
                            <button
                                type="button"
                                className="input-icon-right-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Mensaje de error — solo se muestra si hay un error */}
                    {cargando && <p className="login-espera" role="status" aria-live="polite">{estadoConexion}</p>}
                    {error && (
                        <div
                            id="login-error-msg"
                            className="login-error"
                            role="alert"
                            aria-live="assertive"
                        >
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Botón de submit — se desactiva mientras espera respuesta */}
                    <button
                        type="submit"
                        className="login-btn"
                        disabled={cargando}  // evita doble clic mientras carga
                    >
                        {/* [MODIFICACIÓN] Texto con ícono de flecha integrado */}
                        {cargando ? 'Ingresando...' : (
                            <>
                                Ingresar <LogIn size={18} className="login-btn-icon" />
                            </>
                        )}
                    </button>

                </form>

                {/* Separador visual entre los dos métodos de login */}
                <div className="login-separador">
                    <span>o</span>
                </div>

                {/* Botón Google OAuth */}
                <button className="login-btn-google" onClick={handleGoogle}>
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="login-google-icon"
                    />
                    Continuar con Google
                </button>

                {/* Botón Ingresar como Visitante */}
                <button
                    type="button"
                    className="login-btn-visitante"
                    onClick={() => navigate('/')}
                    title="Navegar por el mapa, buses, ferry y noticias sin iniciar sesión"
                >
                    <Compass size={18} />
                    Continuar como visitante
                </button>

                {/* Link para registro */}
                <p className="login-registro">
                    ¿No tenés cuenta?{' '}
                    <Link to="/registro" className="login-link">
                        Registrate
                    </Link>
                </p>

            </div>
        </div>
    );
}

export default Login;
