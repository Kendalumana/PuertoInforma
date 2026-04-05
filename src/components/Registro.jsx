// ============================================================
// Registro.jsx — PuertoInforma
// FLUJO: email + password + nombreUsuario + rol
//        → POST /usuario/registro
//        → guarda token → redirige a '/'
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import logoIcon from '../Resources/logoFinal.ico';
import '../styles/Login.css';

function Registro() {

    const [email,         setEmail        ] = useState('');
    const [password,      setPassword     ] = useState('');
    const [confirmar,     setConfirmar    ] = useState('');
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [rol,           setRol          ] = useState('TURISTA');
    const [error,         setError        ] = useState('');
    const [cargando,      setCargando     ] = useState(false);

    const navigate = useNavigate();

    const handleRegistro = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmar) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (nombreUsuario.trim().length < 3) {
            setError('El nombre de usuario debe tener al menos 3 caracteres.');
            return;
        }

        setCargando(true);

        try {
            const response = await axios.post('/usuario/registro', {
                email,
                password,
                nombreUsuario: nombreUsuario.trim(),
                rol
            });

            localStorage.setItem('token', response.data.token);
            navigate('/');

        } catch (err) {
            if (err.response?.status === 400) {
                setError(err.response.data || 'Datos inválidos. Revisá el formulario.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('No se pudo crear la cuenta. Intentá de nuevo.');
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                <div className="login-logo">
                    <img src={logoIcon} alt="Puerto Informa" className="login-logo-img" />
                </div>

                <h1 className="login-titulo">Crear cuenta</h1>
                <p className="login-subtitulo">Completá los datos para registrarte</p>

                <form className="login-form" onSubmit={handleRegistro}>

                    {/* Nombre de usuario */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="nombreUsuario">
                            Nombre de usuario
                        </label>
                        <input
                            id="nombreUsuario"
                            type="text"
                            className="login-input"
                            placeholder="ej: juan_puntarenas"
                            value={nombreUsuario}
                            onChange={(e) => setNombreUsuario(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>

                    {/* Email */}
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
                            required
                            autoComplete="email"
                        />
                    </div>

                    {/* Contraseña */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="login-input"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="confirmar">
                            Confirmá tu contraseña
                        </label>
                        <input
                            id="confirmar"
                            type="password"
                            className="login-input"
                            placeholder="Repetí la contraseña"
                            value={confirmar}
                            onChange={(e) => setConfirmar(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    {/* Rol */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="rol">
                            ¿Cómo vas a usar la app?
                        </label>
                        <select
                            id="rol"
                            className="login-input"
                            value={rol}
                            onChange={(e) => setRol(e.target.value)}
                            required
                        >
                            <option value="TURISTA">🧳 Turista — estoy de visita</option>
                            <option value="LOCAL">🏠 Local — soy de Puntarenas</option>
                        </select>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="login-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={cargando}
                    >
                        {cargando ? 'Creando cuenta...' : 'Registrarme'}
                    </button>

                </form>

                <p className="login-registro">
                    ¿Ya tenés cuenta?{' '}
                    <span className="login-link" onClick={() => navigate('/login')}>
                        Iniciá sesión
                    </span>
                </p>

            </div>
        </div>
    );
}

export default Registro;