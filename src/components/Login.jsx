// ============================================================
// Login.jsx — Pantalla de inicio de sesión de PuertoInforma
// FLUJO: email + contraseña → POST /usuario/login → guarda token
//        en localStorage → redirige a '/'
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';          // instancia base con baseURL
import logoIcon from '../Resources/logoFinal.ico';
import '../styles/Login.css';

function Login() {

    // ── Estado del formulario ──────────────────────────────
    const [email, setEmail]       = useState('');       // valor del campo email
    const [password, setPassword] = useState('');       // valor del campo contraseña
    const [error, setError]       = useState('');       // mensaje de error visible
    const [cargando, setCargando] = useState(false);    // deshabilita el botón mientras espera

    const navigate = useNavigate(); // hook para redirigir después del login

    // ── Función principal al enviar el formulario ──────────
    const handleLogin = async (e) => {
        e.preventDefault();  // evita que la página se recargue al hacer submit
        setError('');        // limpia errores anteriores
        setCargando(true);   // desactiva el botón para evitar doble envío

        try {
            // POST al endpoint de login con email y contraseña
            const response = await axios.post('/usuario/login', {
                email,
                password
            });

            // Guardamos el token en localStorage para usarlo en requests futuros
            // axiosPrivate lo leerá desde aquí en cada request autenticado
            localStorage.setItem('token', response.data.token);

            // Redirigimos al home — el usuario ya está autenticado
            navigate('/');

        } catch (err) {
            // Mostramos el mensaje del backend si existe, o un mensaje genérico
            if (err.response?.status === 401) {
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
                <p className="login-subtitulo">Iniciá sesión para continuar</p>

                {/* Formulario — onSubmit llama a handleLogin */}
                <form className="login-form" onSubmit={handleLogin}>

                    {/* Campo email */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="email">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="login-input"
                            placeholder="tucorreo@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required   // el navegador valida que no esté vacío
                            autoComplete="email"
                        />
                    </div>

                    {/* Campo contraseña */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="login-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Mensaje de error — solo se muestra si hay un error */}
                    {error && (
                        <div className="login-error">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Botón de submit — se desactiva mientras espera respuesta */}
                    <button
                        type="submit"
                        className="login-btn"
                        disabled={cargando}  // evita doble clic mientras carga
                    >
                        {/* Cambia el texto según si está cargando o no */}
                        {cargando ? 'Ingresando...' : 'Ingresar'}
                    </button>

                </form>

                {/* Link para registro */}
                <p className="login-registro">
                    ¿No tenés cuenta?{' '}
                    <span className="login-link" onClick={() => navigate('/registro')}>
                        Registrate
                    </span>
                </p>

            </div>
        </div>
    );
}

export default Login;