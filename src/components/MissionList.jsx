const GRADIENTS = [
    'linear-gradient(45deg, #2D2D2D, #4a5568)',
    'linear-gradient(45deg, #2D2D2D, #2b6cb0)',
    'linear-gradient(45deg, #1A202C, #E8621A)',
    'linear-gradient(45deg, #2D2D2D, #805AD5)'
];

function MissionList({ misiones, perfilMisiones, tabActiva }) {
    const estaCompletada = (misionId) =>
        perfilMisiones.some(perfilMision => perfilMision.mision?.id === misionId && perfilMision.completada);

    const misionesVisibles = tabActiva === 'pendientes'
        ? misiones.filter(mision => !estaCompletada(mision.id))
        : misiones;

    return (
        <div className="missions-grid">
            {misiones.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1' }}>No hay misiones disponibles.</p>
            )}

            {misionesVisibles.map((mision, index) => {
                const completada = estaCompletada(mision.id);
                const perfilMision = perfilMisiones.find(item => item.mision?.id === mision.id);
                const progreso = perfilMision?.progreso ?? perfilMision?.contadorVisitas ?? null;
                const meta = perfilMision?.meta ?? mision.meta ?? null;
                const porcentaje = completada
                    ? 100
                    : (progreso !== null && meta)
                        ? Math.min(100, Math.round((progreso / meta) * 100))
                        : 0;
                const contador = completada
                    ? (meta ? `${meta}/${meta}` : '1/1')
                    : (progreso !== null && meta)
                        ? `${progreso}/${meta}`
                        : '0/1';

                return (
                    <div key={mision.id} className="mission-card">
                        <div className="mission-img" style={{ background: GRADIENTS[index % GRADIENTS.length] }}>
                            <div className="xp-pill">+{mision.xpRecompensa} XP</div>
                        </div>
                        <div className="mission-content">
                            <div className="mission-header">
                                <h3 className="mission-title">{mision.titulo}</h3>
                                <span className={`status-badge ${completada ? 'completed' : ''}`}>
                                    {completada ? 'COMPLETADO' : 'PENDIENTE'}
                                </span>
                            </div>
                            <p className="mission-desc">
                                {mision.descripcion || 'Completa esta misión para ganar recompensas.'}
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
    );
}

export default MissionList;
