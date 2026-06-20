import ReservationLink from './ReservationLink';

function FerryScheduleList({ activeRoute, formatHora, formatearRestante, horarios, minutosHasta, proximasSalidas, tabDia }) {
    if (horarios.length === 0) return null;

    return (
        <div className="ferry-horarios-full">
            <h3 className="ferry-horarios-title">🚢 Todos los horarios — {activeRoute}</h3>
            <div className="ferry-horarios-list">
                {horarios.map((horario, index) => {
                    const minutos = minutosHasta(horario.horaSalida);
                    const pasado = tabDia === 'hoy' && minutos < 0;
                    const esProximo = !pasado && proximasSalidas[0] === horario;

                    return (
                        <div
                            key={horario.id || index}
                            className={`ferry-horario-row ${pasado ? 'pasado' : ''} ${esProximo ? 'proximo' : ''}`}
                        >
                            <div className="ferry-row-hora">{formatHora(horario.horaSalida)}</div>
                            <div className="ferry-row-info">
                                <span className="ferry-row-nombre">{horario.embarcacionNombre || 'Naviera Tambor'}</span>
                                {horario.esNocturno && <span className="badge-gray ferry-row-badge">Nocturno</span>}
                                {esProximo && <span className="badge-orange ferry-row-badge">Próximo</span>}
                            </div>
                            <div className="ferry-row-estado">
                                {pasado
                                    ? <span className="ferry-row-salido">Salió</span>
                                    : tabDia === 'manana'
                                        ? <span className="ferry-row-restante">Mañana</span>
                                        : <span className="ferry-row-restante">{formatearRestante(minutos)}</span>}
                            </div>
                            {!pasado && (
                                <ReservationLink className="ferry-row-link" href={horario.enlaceReserva} label="Reservar" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default FerryScheduleList;
