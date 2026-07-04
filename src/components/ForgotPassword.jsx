import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import axios from '../api/axios';
import logoIcon from '../Resources/logoFinal.ico';
import '../styles/Login.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setCargando(true);

        try {
            await axios.post('/usuario/password/forgot', { email });
            setSuccess('Si el correo existe, te enviamos un enlace para restablecer tu contraseña.');
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('No se pudo enviar el correo. Intentá de nuevo más tarde.');
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

                <h1 className="login-titulo">Recuperar contraseña</h1>
                <p className="login-subtitulo">
                    Ingresá tu correo y te enviaremos un enlace seguro.
                </p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-campo">
                        <label className="login-label" htmlFor="email">
                            Correo electrónico
                        </label>
                        <div className="input-icon-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                id="email"
                                type="email"
                                className="login-input with-icon"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
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

                    <button type="submit" className="login-btn" disabled={cargando}>
                        {cargando ? 'Enviando...' : (
                            <>
                                Enviar enlace <Send size={18} className="login-btn-icon" />
                            </>
                        )}
                    </button>
                </form>

                <p className="login-registro">
                    <Link to="/login" className="login-link">
                        Volver al inicio de sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
