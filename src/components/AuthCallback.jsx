import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import axios from '../api/axios';

function AuthCallback() {
    const navigate = useNavigate();
    const [mensaje, setMensaje] = useState('Verificando sesión...');
    const [error, setError] = useState(false);

    useEffect(() => {
        // Timeout: si en 5 segundos no hay sesión, redirige a login
        const timeoutId = setTimeout(() => {
            navigate('/login');
        }, 5000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    clearTimeout(timeoutId);
                    const { email, user_metadata } = session.user;
                    const nombre = user_metadata?.full_name || email.split('@')[0];
                    try {
                        const response = await axios.post('/usuario/login-google', {
                            email,
                            nombre,
                            googleId: session.user.id,
                            supabaseToken: session.access_token
                        });
                        localStorage.setItem('token', response.data.token);
                        navigate('/');
                    } catch (err) {
                        clearTimeout(timeoutId);
                        setError(true);
                        setMensaje('❌ Error al conectar con el servidor.');
                    }
                } else if (event === 'SIGNED_OUT' || !session) {
                    clearTimeout(timeoutId);
                    navigate('/login');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [navigate]);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            height: '100vh', gap: '1rem'
        }}>
            <p style={{ fontSize: '1.1rem', color: '#555' }}>{mensaje}</p>
            {error && (
                <button
                    onClick={() => navigate('/login')}
                    style={{ background: '#E8621A', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
                >
                    Volver al login
                </button>
            )}
        </div>
    );
}

export default AuthCallback;