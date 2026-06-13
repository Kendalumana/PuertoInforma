import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/Index.css';

import PaginaPerfil from './components/PaginaPerfil';
import Login from './components/Login';
import Registro from './components/Registro';
import PaginaBuses from './components/PaginaBuses';
import AuthCallback from './components/AuthCallback';
import PaginaNoticias from './components/PaginaNoticias';
import PaginaFerry from './components/PaginaFerry';
import MapaView from './components/MapaView';

function RutaProtegida({ children }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/noticias" element={<PaginaNoticias />} />
            <Route path="/ferry" element={<RutaProtegida><PaginaFerry /></RutaProtegida>} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<RutaProtegida><MapaView /></RutaProtegida>} />
            <Route path="/perfil" element={<RutaProtegida><PaginaPerfil /></RutaProtegida>} />
            <Route path="/buses" element={<RutaProtegida><PaginaBuses /></RutaProtegida>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;