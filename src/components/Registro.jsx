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
// [MODIFICACIÓN] Importación de íconos para el formulario y decoración
import { User, Mail, Lock, Eye, EyeOff, BadgeCent, Sailboat } from 'lucide-react';

function Registro() {

    const [email,         setEmail        ] = useState('');
    const [password,      setPassword     ] = useState('');
    const [confirmar,     setConfirmar    ] = useState('');
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [rol,           setRol          ] = useState('TURISTA');
    const [error,         setError        ] = useState('');
    const [cargando,      setCargando     ] = useState(false);
    // [MODIFICACIÓN] Estados para mostrar contraseñas
    const [showPassword,  setShowPassword ] = useState(false);

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
        // [MODIFICACIÓN] Envoltura adicional para las dos columnas
        <div className="login-page">
            <div className="registro-layout">
                {/* Formulario (Columna Izquierda) */}
                <div className="login-card">

                    <div className="login-logo">
                        <img src={logoIcon} alt="Puerto Informa" className="login-logo-img" />
                    </div>

                    <h1 className="login-titulo">Crear cuenta</h1>
                    {/* [MODIFICACIÓN] Subtítulo actualizado */}
                    <p className="login-subtitulo">Unite a la comunidad digital del puerto</p>

                    <form className="login-form" onSubmit={handleRegistro}>

                    {/* Nombre de usuario */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="nombreUsuario">
                            Nombre de usuario
                        </label>
                        {/* [MODIFICACIÓN] Input con ícono integrado */}
                        <div className="input-icon-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                id="nombreUsuario"
                                type="text"
                                className="login-input with-icon"
                                placeholder="Tu apodo"
                                value={nombreUsuario}
                                onChange={(e) => setNombreUsuario(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="email">
                            Correo electrónico
                        </label>
                        {/* [MODIFICACIÓN] Input con ícono integrado */}
                        <div className="input-icon-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                id="email"
                                type="email"
                                className="login-input with-icon"
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Contraseña */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="password">
                            Contraseña
                        </label>
                        {/* [MODIFICACIÓN] Input con ícono y botón para ver contraseña */}
                        <div className="input-icon-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="login-input with-icon with-icon-right"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                            <button 
                                type="button" 
                                className="input-icon-right-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="confirmar">
                            Confirmá tu contraseña
                        </label>
                        <div className="input-icon-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                id="confirmar"
                                type="password"
                                className="login-input with-icon"
                                placeholder="••••••••"
                                value={confirmar}
                                onChange={(e) => setConfirmar(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    {/* Rol */}
                    <div className="login-campo">
                        <label className="login-label" htmlFor="rol">
                            ¿Cómo vas a usar la app?
                        </label>
                        <div className="input-icon-wrapper">
                            <BadgeCent size={18} className="input-icon" />
                            <select
                                id="rol"
                                className="login-input with-icon"
                                value={rol}
                                onChange={(e) => setRol(e.target.value)}
                                required
                            >
                                <option value="TURISTA">Turista</option>
                                <option value="LOCAL">Local</option>
                            </select>
                        </div>
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

                {/* Fin de login-card */}
                </div>

                {/* [MODIFICACIÓN] Tarjeta Decorativa (Columna Derecha) */}
                <div className="registro-side-card">
                    <div className="registro-side-content">
                        <Sailboat size={64} className="registro-side-icon" strokeWidth={1.5} color="#E8621A" />
                        <h2 className="registro-side-title">PUERTO</h2>
                        <p className="registro-side-subtitle">LIVE THE SCENE</p>
                    </div>
                </div>
            {/* Fin de registro-layout */}
            </div>
        </div>
    );
}

export default Registro;