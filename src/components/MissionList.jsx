import { useState, useMemo } from 'react';
import { Lock } from 'lucide-react';

const GRADIENTS = [
    'linear-gradient(45deg, #2D2D2D, #4a5568)',
    'linear-gradient(45deg, #2D2D2D, #2b6cb0)',
    'linear-gradient(45deg, #1A202C, #E8621A)',
    'linear-gradient(45deg, #2D2D2D, #805AD5)'
];

function MissionList({ misiones = [], perfilMisiones = [], tabActiva = 'todas', niveles = null }) {
    const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');

    // Normalizar lista de misiones (ya sea que vengan anidadas en `niveles` o en arreglo plano `misiones`)
    const listaCompleta = useMemo(() => {
        if (niveles && Array.isArray(niveles) && niveles.length > 0) {
            const aplanadas = [];
            niveles.forEach(g => {
                (g.misiones || []).forEach(m => {
                    aplanadas.push({
                        ...m,
                        nivelGrupo: g.nivel,
                        bloqueada: g.bloqueado || m.bloqueada
                    });
                });
            });
            return aplanadas;
        }

        // Formato legado o plano
        return misiones.map(m => {
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
    }, [misiones, perfilMisiones, niveles]);

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
                    {nivelesDisponibles.map(n => (
                        <button
                            key={n}
                            onClick={() => setNivelSeleccionado(n)}
                            className={`filter-btn ${nivelSeleccionado === n ? 'active' : ''}`}
                            style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
                        >
                            Nivel {n}
                        </button>
                    ))}
                </div>
            )}

            <div className="missions-grid">
                {misionesFiltradas.length === 0 && (
                    <p style={{ color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1', padding: '1.5rem 0' }}>
                        No hay misiones disponibles con los filtros actuales.
                    </p>
                )}

                {misionesFiltradas.map((mision, index) => {
                    const completada = Boolean(mision.completada);
                    const meta = mision.meta || 1;
                    const progreso = mision.progreso ?? 0;
                    const porcentaje = completada
                        ? 100
                        : Math.min(100, Math.round((progreso / meta) * 100));

                    const contador = completada ? `${meta}/${meta}` : `${progreso}/${meta}`;
                    const bloqueada = Boolean(mision.bloqueada);

                    return (
                        <div
                            key={mision.id || mision.codigo || index}
                            className={`mission-card ${bloqueada ? 'bloqueada' : ''}`}
                            style={bloqueada ? { opacity: 0.65 } : undefined}
                        >
                            <div className="mission-img" style={{ background: GRADIENTS[index % GRADIENTS.length] }}>
                                <div className="xp-pill">
                                    +{mision.xp || mision.xpRecompensa} XP
                                </div>
                                {bloqueada && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.4rem',
                                        color: '#FFD700',
                                        fontWeight: 700,
                                        fontSize: '0.85rem'
                                    }}>
                                        <Lock size={16} /> Requiere Nivel {mision.nivel_requerido || mision.nivelGrupo}
                                    </div>
                                )}
                            </div>
                            <div className="mission-content">
                                <div className="mission-header">
                                    <h3 className="mission-title">{mision.titulo}</h3>
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
                                        <div className="xp-relleno" style={{ width: `${porcentaje}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MissionList;
