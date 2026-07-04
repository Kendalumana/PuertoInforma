import ReservationLink from './ReservationLink';

function FerryScheduleList({ activeRoute, formatHora, formatearRestante, horarios, minutosHasta, proximasSalidas, tabDia }) {
    if (horarios.length === 0) return null;

    return (
        <div className="transporte-horarios-full">
            <h3 className="transporte-horarios-title">🚢 Todos los horarios — {activeRoute}</h3>
            <div className="transporte-horarios-list">
                {horarios.map((horario, index) => {
                    const minutos = minutosHasta(horario.horaSalida);
                    const pasado = tabDia === 'hoy' && minutos < 0;
                    const esProximo = !pasado && proximasSalidas[0] === horario;

                    return (
                        <div
                            key={horario.id || index}
                            className={`transporte-horario-row ${pasado ? 'pasado' : ''} ${esProximo ? 'proximo' : ''}`}
                        >
                            <div className="transporte-row-hora">{formatHora(horario.horaSalida)}</div>
                            <div className="transporte-row-info">
                                <span className="transporte-row-nombre">{horario.embarcacionNombre || 'Naviera Tambor'}</span>
                                {horario.esNocturno && <span className="badge-gray transporte-row-badge">Nocturno</span>}
                                {esProximo && <span className="badge-orange transporte-row-badge">Próximo</span>}
                            </div>
                            <div className="transporte-row-estado">
                                {pasado
                                    ? <span className="transporte-row-salido">Salió</span>
                                    : tabDia === 'manana'
                                        ? <span className="transporte-row-restante">Mañana</span>
                                        : <span className="transporte-row-restante">{formatearRestante(minutos)}</span>}
                            </div>
                            {!pasado && (
                                <ReservationLink className="transporte-row-link" href={horario.enlaceReserva} label="Reservar" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default FerryScheduleList;
