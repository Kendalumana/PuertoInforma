import { useState, useMemo } from 'react';
import MisionModal from './MisionModal';

const GRADIENTS = [
    'linear-gradient(45deg, #2D2D2D, #4a5568)',
    'linear-gradient(45deg, #2D2D2D, #2b6cb0)',
    'linear-gradient(45deg, #1A202C, #E8621A)',
    'linear-gradient(45deg, #2D2D2D, #805AD5)'
];

const ANIMALES_POR_NIVEL = {
    1: { nombre: 'Cangrejo', icono: '🦀' },
    2: { nombre: 'Lapa', icono: '🦜' },
    3: { nombre: 'Iguana', icono: '🦎' },
    4: { nombre: 'Zanate', icono: '🦅' },
    5: { nombre: 'Cocodrilo', icono: '🐊' }
};

function MissionList({ misiones = [], perfilMisiones = [], tabActiva = 'todas', niveles = null, nivelActual = 1 }) {
    const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');
    const [misionParaModal, setMisionParaModal] = useState(null);

    // Normalizar lista de misiones — ESCONDER completamente las misiones bloqueadas por rango
    const listaCompleta = useMemo(() => {
        if (niveles && Array.isArray(niveles) && niveles.length > 0) {
            const disponibles = [];
            niveles.forEach(g => {
                // Si el nivel está bloqueado o supera el nivel actual del usuario, no se muestra
                if (g.bloqueado || (nivelActual && g.nivel > nivelActual)) return;
                (g.misiones || []).forEach(m => {
                    if (m.bloqueada) return;
                    disponibles.push({
                        ...m,
                        nivelGrupo: g.nivel,
                        bloqueada: false
                    });
                });
            });
            return disponibles;
        }

        // Formato legado o plano — filtrar cualquier misión bloqueada o de nivel superior
        return misiones
            .filter(m => {
                const req = m.nivel_requerido || m.nivelGrupo || 1;
                if (m.bloqueada) return false;
                if (nivelActual && req > nivelActual) return false;
                return true;
            })
            .map(m => {
                const perfilM = (perfilMisiones || []).find(item => item.mision?.id === m.id);
                const completada = m.completada ?? perfilM?.completada ?? false;
                const progreso = m.progreso ?? perfilM?.progreso ?? perfilM?.contadorVisitas ?? 0;
                const meta = m.meta ?? perfilM?.meta ?? 1;
                const xp = m.xp ?? m.xpRecompensa ?? 10;
                return {
                    ...m,
                    xp,
                    meta,
                    progreso,
                    completada,
                    instrucciones: m.instrucciones || m.descripcion || 'Completa esta misión para ganar recompensas.'
                };
            });
    }, [misiones, perfilMisiones, niveles, nivelActual]);

    // Filtrar por tab (todas / pendientes) y por nivel
    const misionesFiltradas = useMemo(() => {
        return listaCompleta.filter(m => {
            const matchPendiente = tabActiva === 'pendientes' ? !m.completada : true;
            const matchNivel = nivelSeleccionado === 'todos'
                ? true
                : (m.nivel_requerido || m.nivelGrupo) === Number(nivelSeleccionado);
            return matchPendiente && matchNivel;
        });
    }, [listaCompleta, tabActiva, nivelSeleccionado]);

    // Niveles disponibles para los chips de filtro
    const nivelesDisponibles = useMemo(() => {
        const setNiveles = new Set();
        listaCompleta.forEach(m => {
            const n = m.nivel_requerido || m.nivelGrupo;
            if (n) setNiveles.add(n);
        });
        return Array.from(setNiveles).sort((a, b) => a - b);
    }, [listaCompleta]);

    return (
        <div className="mission-list-wrapper">
            {/* Selector de Niveles (si hay más de 1 nivel) */}
            {nivelesDisponibles.length > 1 && (
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => setNivelSeleccionado('todos')}
                        className={`filter-btn ${nivelSeleccionado === 'todos' ? 'active' : ''}`}
                        style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
                    >
                        Todos los niveles
                    </button>
                    {nivelesDisponibles.map(n => {
                        const infoAnimal = ANIMALES_POR_NIVEL[n];
                        return (
                            <button
                                key={n}
                                onClick={() => setNivelSeleccionado(n)}
                                className={`filter-btn ${nivelSeleccionado === n ? 'active' : ''}`}
                                style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                                <span>{infoAnimal?.icono || '🏅'}</span>
                                <span>Nivel {n} ({infoAnimal?.nombre || `Rango ${n}`})</span>
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="missions-grid">
                {misionesFiltradas.map((mision, index) => {
                    const completada = Boolean(mision.completada);
                    const meta = mision.meta || 1;
                    const progreso = mision.progreso ?? 0;
                    const porcentaje = completada
                        ? 100
                        : Math.min(100, Math.round((progreso / meta) * 100));

                    const contador = completada ? `${meta}/${meta}` : `${progreso}/${meta}`;
                    const nivelReq = mision.nivel_requerido || mision.nivelGrupo || 1;
                    const infoAnimal = ANIMALES_POR_NIVEL[nivelReq];

                    // Detección de requerimientos especiales para badges visuales
                    const requiereFoto = Boolean(
                        mision.requiereFoto ||
                        mision.tipo === 'FOTO' ||
                        /foto|fotograf|selfie|captur/i.test(mision.titulo || '') ||
                        /foto|fotograf|selfie|captur/i.test(mision.instrucciones || mision.descripcion || '')
                    );

                    const requiereQR = Boolean(
                        mision.requiereQR ||
                        mision.tipo === 'QR' ||
                        /qr|código\s*qr|escan/i.test(mision.titulo || '') ||
                        /qr|código\s*qr|escan/i.test(mision.instrucciones || mision.descripcion || '')
                    );

                    const esCheckin = Boolean(
                        mision.tipo === 'VISITA' ||
                        /check-?in|gps/i.test(mision.titulo || '') ||
                        /check-?in|gps/i.test(mision.instrucciones || mision.descripcion || '')
                    );

                    return (
                        <div
                            key={mision.id || mision.codigo || index}
                            className="mission-card"
                            onClick={() => setMisionParaModal(mision)}
                            style={{
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.2s'
                            }}
                            title="Clic para inspeccionar o completar esta misión"
                        >
                            <div className="mission-img" style={{
                                background: GRADIENTS[index % GRADIENTS.length]
                            }}>
                                <div style={{ display: 'flex', gap: '0.4rem', position: 'absolute', top: '10px', right: '10px' }}>
                                    {requiereFoto && (
                                        <div className="xp-pill" style={{ background: 'rgba(76, 175, 80, 0.9)', color: '#fff', fontSize: '0.72rem' }}>
                                            📷 Foto
                                        </div>
                                    )}
                                    {requiereQR && (
                                        <div className="xp-pill" style={{ background: 'rgba(33, 150, 243, 0.9)', color: '#fff', fontSize: '0.72rem' }}>
                                            ⚡ QR
                                        </div>
                                    )}
                                    {esCheckin && (
                                        <div className="xp-pill" style={{ background: 'rgba(156, 39, 176, 0.9)', color: '#fff', fontSize: '0.72rem' }}>
                                            📍 GPS
                                        </div>
                                    )}
                                    <div className="xp-pill">
                                        +{mision.xp || mision.xpRecompensa} XP
                                    </div>
                                </div>
                            </div>
                            <div className="mission-content">
                                <div className="mission-header">
                                    <h3 className="mission-title">
                                        {mision.titulo}
                                    </h3>
                                    <span className={`status-badge ${completada ? 'completed' : ''}`}>
                                        {completada ? 'COMPLETADO' : 'PENDIENTE'}
                                    </span>
                                </div>
                                <p className="mission-desc">
                                    {mision.instrucciones || mision.descripcion || 'Completa esta misión para ganar recompensas.'}
                                </p>
                                <div className="mission-progress-container">
                                    <div className="mission-progress-header">
                                        <span>Progreso</span>
                                        <span>{contador}</span>
                                    </div>
                                    <div className="xp-barra">
                                        <div
                                            className="xp-relleno"
                                            style={{
                                                width: `${porcentaje}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Detalle de Misión (con Foto y QR) */}
            {misionParaModal && (
                <MisionModal
                    mision={misionParaModal}
                    onClose={() => setMisionParaModal(null)}
                />
            )}
        </div>
    );
}

export default MissionList;
