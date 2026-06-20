function ProfileSidebar({
    avatarError,
    avatarImage,
    avatarSelected,
    avatarType,
    avatares,
    experiencia,
    formatDate,
    historial,
    isAvatarSaving,
    onSelectAvatar,
    onToggleAvatarSelector,
    perfil,
    rangoActual,
    rangos,
    session,
    showAvatarSelector,
    sitiosVisitados,
    xpMaximo,
    xpPorcentaje,
}) {
    const nombreUsuario = perfil?.nombreUsuario
        ?? session?.user?.user_metadata?.full_name
        ?? session?.user?.user_metadata?.name
        ?? session?.user?.email?.split('@')[0]
        ?? 'Usuario';

    return (
        <aside className="profile-sidebar">
            <div className="profile-card profile-card--highlight">
                <div className="avatar-wrapper">
                    <button className="avatar-display" onClick={onToggleAvatarSelector} aria-label="Cambiar avatar">
                        {isAvatarSaving ? (
                            <span className="avatar-emoji">⏳</span>
                        ) : avatarType === 'subido' && avatarImage ? (
                            <img src={avatarImage} alt="Avatar" className="avatar-img" />
                        ) : (
                            <span className="avatar-emoji">
                                {avatares.find(avatar => avatar.id === avatarSelected)?.emoji || '🧭'}
                            </span>
                        )}
                    </button>

                    {showAvatarSelector && (
                        <div className="avatar-selector" style={{ top: '130px' }}>
                            <p className="avatar-selector-titulo">Elegí tu avatar</p>
                            <div className="avatares-grid">
                                {avatares.map(avatar => (
                                    <button
                                        key={avatar.id}
                                        className={`avatar-opcion ${avatarSelected === avatar.id && avatarType === 'prediseñado' ? 'activo' : ''}`}
                                        onClick={() => onSelectAvatar(avatar.id)}
                                        aria-label={`Elegir avatar ${avatar.label}`}
                                    >
                                        {avatar.emoji}
                                    </button>
                                ))}
                            </div>
                            <div className="avatar-upload-section">
                                <span className="avatar-upload-btn" style={{ cursor: 'not-allowed', opacity: 0.6 }}>
                                    📷 Subir foto (Próximamente)
                                </span>
                                <p className="avatar-upload-hint">Pronto podrás subir tu propia foto.</p>
                            </div>
                            {avatarError && <p className="avatar-error-msg">⚠️ {avatarError}</p>}
                        </div>
                    )}
                </div>

                <h2 className="profile-name">{nombreUsuario}</h2>
                <div className="profile-rank-badge">{rangoActual?.nombre?.toUpperCase() ?? 'RECIÉN LLEGADO'}</div>

                <div className="profile-stats-grid">
                    <div className="stat-box">
                        <span className="stat-label">PUNTOS</span>
                        <span className="stat-value">{perfil?.puntosTotales ?? 0}</span>
                    </div>
                    <div className="stat-box rango-box">
                        <span className="stat-label">RANGO</span>
                        {rangoActual?.urlIcono
                            ? <img src={rangoActual.urlIcono} alt={rangoActual.nombre} className="rango-stat-icon" />
                            : <span className="stat-value light">🏅</span>}
                        <span className="rango-stat-name">{rangoActual?.nombre?.split('(')[0]?.trim() ?? 'Nivel 1'}</span>
                    </div>
                </div>

                <div className="xp-container">
                    <div className="xp-header">
                        <span className="xp-title">Progreso de Nivel</span>
                        <span className="xp-numbers">{experiencia} / {xpMaximo} XP</span>
                    </div>
                    <div className="xp-barra">
                        <div className="xp-relleno" style={{ width: `${xpPorcentaje}%` }} />
                    </div>
                </div>
            </div>

            <div className="badges-card">
                <h3 className="badges-title">🏆 Tu Progreso de Rango</h3>
                <div className="badges-grid">
                    {[...rangos].sort((a, b) => a.puntosRequeridos - b.puntosRequeridos).map(rango => {
                        const desbloqueado = experiencia >= rango.puntosRequeridos;
                        return (
                            <div
                                key={rango.id}
                                className={`badge-icon ${desbloqueado ? 'unlocked' : 'locked'}`}
                                title={`${rango.nombre} (${rango.puntosRequeridos} XP)`}
                            >
                                {rango.urlIcono ? <img src={rango.urlIcono} alt={rango.nombre} /> : '🏅'}
                            </div>
                        );
                    })}
                </div>
            </div>

            {historial.length > 0 && (
                <div className="perfil-historial-card">
                    <h3 className="badges-title">📍 Historial de Actividad</h3>
                    <div className="perfil-historial-list">
                        {historial.slice(0, 5).map((item, index) => (
                            <div key={index} className="perfil-historial-item">
                                <span className="perfil-historial-icon">✓</span>
                                <div className="perfil-historial-info">
                                    <span className="perfil-historial-nombre">{item.mision?.titulo || item.titulo || 'Actividad'}</span>
                                    <span className="perfil-historial-fecha">{formatDate(item.fechaCompletado || item.fecha)}</span>
                                </div>
                                {(item.xpGanado || item.mision?.xpRecompensa) && (
                                    <span className="perfil-historial-xp">+{item.xpGanado || item.mision?.xpRecompensa} XP</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {sitiosVisitados.length > 0 && (
                <div className="perfil-historial-card">
                    <h3 className="badges-title">🏖️ Sitios Visitados ({sitiosVisitados.length})</h3>
                    <div className="perfil-sitios-grid">
                        {sitiosVisitados.slice(0, 6).map((sitio, index) => (
                            <div key={index} className="perfil-sitio-chip">
                                <span className="perfil-sitio-icono">📍</span>
                                <span className="perfil-sitio-nombre">{sitio.lugar?.nombre || sitio.nombre || 'Lugar'}</span>
                            </div>
                        ))}
                    </div>
                    {sitiosVisitados.length > 6 && <p className="perfil-sitios-mas">+{sitiosVisitados.length - 6} más</p>}
                </div>
            )}
        </aside>
    );
}

export default ProfileSidebar;
