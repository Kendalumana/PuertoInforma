// ============================================================
// AuthCallback.jsx — Procesa el retorno de Google OAuth
// FLUJO: Supabase redirige aquí → obtenemos sesión → llamamos
//        al backend Java → guardamos token → redirigimos a '/'
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import axios from '../api/axios';

function AuthCallback() {
    const navigate = useNavigate();
    const [mensaje, setMensaje] = useState('Verificando sesión...');

    useEffect(() => {
        // Escuchamos cuando Supabase termina de procesar el hash de la URL
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {

                    // 1. Extraemos los datos del usuario de Google
                    const { email, user_metadata } = session.user;
                    const nombre = user_metadata?.full_name || email.split('@')[0];

                    try {
                        // 2. Le avisamos a tu backend Java
                        const response = await axios.post('/usuario/login-google', {
                            email,
                            nombre,
                            googleId: session.user.id
                        });

                        // 3. Guardamos el token de TU backend
                        localStorage.setItem('token', response.data.token);

                        // 4. Redirigimos al home
                        navigate('/');

                    } catch (err) {
                        setMensaje('❌ Error al conectar con el servidor. Intentá de nuevo.');
                    }

                } else if (event === 'SIGNED_OUT' || !session) {
                    navigate('/login');
                }
            }
        );

        // Limpiamos la suscripción cuando el componente se desmonta
        return () => subscription.unsubscribe();

    }, [navigate]);

    // Pantalla de espera mientras procesa
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            gap: '1rem'
        }}>
            <p style={{ fontSize: '1.1rem', color: '#555' }}>{mensaje}</p>
        </div>
    );
}

export default AuthCallback;