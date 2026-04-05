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
        const procesarCallback = async () => {

            // 1. Supabase lee el hash de la URL y devuelve la sesión
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                // Si no hay sesión válida, mandamos al login
                navigate('/login');
                return;
            }

            // 2. Extraemos los datos del usuario de Google
            const { email, user_metadata } = session.user;
            const nombre = user_metadata?.full_name || email.split('@')[0];

            try {
                // 3. Le avisamos a tu backend Java que este usuario entró con Google
                //    El backend lo crea si no existe, o lo busca si ya existe
                const response = await axios.post('/usuario/login-google', {
                    email,
                    nombre,
                    googleId: session.user.id
                });

                // 4. Guardamos el token de TU backend (igual que el login normal)
                localStorage.setItem('token', response.data.token);

                // 5. Redirigimos al home
                navigate('/');

            } catch (err) {
                setMensaje('❌ Error al conectar con el servidor. Intentá de nuevo.');
            }
        };

        procesarCallback();
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