import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import axios from '../api/axios';
import logoIcon from '../Resources/logoFinal.ico';
import '../styles/Login.css';

function getTokenStatus(token) {
    if (!token) return { valid: false, message: 'El enlace no incluye un token de recuperación.' };

    try {
        const { exp } = jwtDecode(token);
        if (exp && exp * 1000 <= Date.now()) {
            return { valid: false, message: 'El enlace de recuperación ya venció. Solicitá uno nuevo.' };
        }
        return { valid: true, message: '' };
    } catch {
        return { valid: false, message: 'El token de recuperación no es válido.' };
    }
}

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';
    const tokenStatus = useMemo(() => getTokenStatus(token), [token]);

    const [password, setPassword] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [cargando, setCargando] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!tokenStatus.valid) {
            setError(tokenStatus.message);
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmar) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setCargando(true);
        try {
            await axios.post('/usuario/password/reset', { token, password });
            setSuccess('Contraseña actualizada. Ya podés iniciar sesión.');
            setTimeout(() => navigate('/login'), 1600);
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('No se pudo actualizar la contraseña. Solicitá un enlace nuevo.');
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

                <h1 className="login-titulo">Nueva contraseña</h1>
                <p className="login-subtitulo">
                    Creá una contraseña segura para volver a entrar.
                </p>

                {!tokenStatus.valid && (
                    <div className="login-error" role="alert">
                        ⚠️ {tokenStatus.message}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-campo">
                        <label className="login-label" htmlFor="password">
                            Nueva contraseña
                        </label>
                        <div className="input-icon-wrapper">
                            <KeyRound size={18} className="input-icon" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="login-input with-icon with-icon-right"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                disabled={!tokenStatus.valid}
                            />
                            <button
                                type="button"
                                className="input-icon-right-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                disabled={!tokenStatus.valid}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="login-campo">
                        <label className="login-label" htmlFor="confirmar">
                            Confirmar contraseña
                        </label>
                        <div className="input-icon-wrapper">
                            <KeyRound size={18} className="input-icon" />
                            <input
                                id="confirmar"
                                type="password"
                                className="login-input with-icon"
                                placeholder="••••••••"
                                value={confirmar}
                                onChange={(e) => setConfirmar(e.target.value)}
                                required
                                autoComplete="new-password"
                                disabled={!tokenStatus.valid}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="login-error" role="alert" aria-live="assertive">
                            ⚠️ {error}
                        </div>
                    )}

                    {success && (
                        <div className="login-success" role="status" aria-live="polite">
                            {success}
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={cargando || !tokenStatus.valid}>
                        {cargando ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                </form>

                <p className="login-registro">
                    <Link to="/recuperar-clave" className="login-link">
                        Solicitar otro enlace
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPassword;
