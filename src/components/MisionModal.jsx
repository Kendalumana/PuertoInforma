import { useState, useRef } from 'react';
import { X, Camera, QrCode, CheckCircle2, Award, Image as ImageIcon, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import { useEventoMision } from '../hooks/useEventoMision';

function MisionModal({ mision, onClose, onMisionCompletada }) {
    const { reportarEvento } = useEventoMision();
    const [fotoTomada, setFotoTomada] = useState(null);
    const [qrEscaneado, setQrEscaneado] = useState(null);
    const [modoEscanerQR, setModoEscanerQR] = useState(false);
    const [completando, setCompletando] = useState(false);
    const [mensajeExito, setMensajeExito] = useState(null);

    const fileInputRef = useRef(null);

    if (!mision) return null;

    const progreso = mision.progreso ?? 0;
    const meta = mision.meta ?? 1;
    const completada = Boolean(mision.completada);
    const porcentaje = completada ? 100 : Math.min(100, Math.round((progreso / meta) * 100));

    // Determinar si la misión requiere tomar foto o escanear código QR
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

    const requiereEvidencia = requiereFoto || requiereQR;
    const faltaEvidenciaFoto = requiereFoto && !fotoTomada;
    const faltaEvidenciaQR = requiereQR && !qrEscaneado;
    const botonBloqueado = completando || completada || (!completada && (faltaEvidenciaFoto || faltaEvidenciaQR));

    // Manejar toma de fotografía
    const handleTomarFoto = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFotoTomada(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Simular o procesar escaneo de código QR
    const handleSimularEscaneoQR = () => {
        setModoEscanerQR(true);
        setTimeout(() => {
            const codigoDetectado = `PI-QR-${Math.floor(1000 + Math.random() * 9000)}`;
            setQrEscaneado(codigoDetectado);
            setModoEscanerQR(false);
        }, 1500);
    };

    // Enviar evidencia o completar
    const handleCompletar = async () => {
        setCompletando(true);
        try {
            // Reportar evento al motor de misiones
            if (mision.evento) {
                reportarEvento(mision.evento, qrEscaneado || mision.codigo);
            }

            setMensajeExito(`¡Genial! Has completado "${mision.titulo}" (+${mision.xp} XP)`);

            if (onMisionCompletada) {
                onMisionCompletada({
                    ...mision,
                    completada: true,
                    progreso: meta
                });
            }

            setTimeout(() => {
                onClose();
            }, 1800);
        } finally {
            setCompletando(false);
        }
    };

    return (
        <>
            <style>{`
                .mision-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 1rem;
                    animation: fadeIn 0.25s ease;
                }
                .mision-modal-box {
                    background: linear-gradient(180deg, #1C1C1C 0%, #121212 100%);
                    border: 1px solid rgba(232, 98, 26, 0.35);
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(232, 98, 26, 0.15);
                    border-radius: 24px;
                    max-width: 480px;
                    width: 100%;
                    padding: 3rem 1.75rem 1.75rem;
                    position: relative;
                    color: #fff;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .mision-close-btn {
                    top: 0.9rem !important;
                    right: 0.9rem !important;
                }
                @media (max-width: 640px) {
                    .mision-modal-overlay {
                        align-items: flex-end;
                        padding: 0;
                    }
                    .mision-modal-box {
                        border-radius: 24px 24px 0 0;
                        max-width: 100%;
                        max-height: 92vh;
                        padding: 3rem 1.25rem 2rem;
                        border-top: 3px solid rgba(232, 98, 26, 0.5);
                    }
                    .mision-close-btn {
                        width: 32px !important;
                        height: 32px !important;
                    }
                    /* Modal header: stack icon+title above XP badge */
                    .mision-modal-header {
                        flex-wrap: wrap;
                        gap: 0.5rem !important;
                    }
                    .mision-modal-title-block {
                        flex: 1;
                        min-width: 0;
                    }
                    .mision-modal-title-block h3 {
                        font-size: 1.05rem !important;
                        word-break: break-word;
                    }
                    .mision-xp-badge {
                        flex-shrink: 0;
                        font-size: 0.78rem !important;
                        padding: 0.25rem 0.55rem !important;
                    }
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
            <div
                className="mision-modal-overlay"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
            >
            <div
                className="mision-modal-box"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botón cerrar */}
                <button
                    className="mision-close-btn"
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.25rem',
                        right: '1.25rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.6)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                    }}
                    aria-label="Cerrar modal"
                >
                    <X size={18} />
                </button>

                {/* Cabecera de la misión */}
                <div className="mision-modal-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(232, 98, 26, 0.25) 0%, rgba(255, 155, 106, 0.15) 100%)',
                        border: '1px solid rgba(232, 98, 26, 0.5)',
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        flexShrink: 0
                    }}>
                        🎯
                    </div>
                    <div className="mision-modal-title-block" style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.75rem', color: '#FF9B6A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {mision.codigo || 'MISIÓN'}
                        </span>
                        <h3 style={{ margin: '0.1rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#fff', wordBreak: 'break-word' }}>
                            {mision.titulo}
                        </h3>
                    </div>
                    <div className="mision-xp-badge" style={{
                        marginLeft: 'auto',
                        background: 'rgba(232, 98, 26, 0.15)',
                        border: '1px solid #E8621A',
                        borderRadius: '10px',
                        padding: '0.35rem 0.75rem',
                        color: '#FF9B6A',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                    }}>
                        <Award size={14} /> +{mision.xp} XP
                    </div>
                </div>

                {/* Instrucciones */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    lineHeight: 1.5,
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.85)'
                }}>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.3rem' }}>Instrucciones del Desafío:</strong>
                    {mision.instrucciones || mision.descripcion || 'Completa los requerimientos para ganar tu recompensa en XP.'}
                </div>

                {/* Barra de Progreso */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                        <span style={{ color: completada ? '#81c784' : 'rgba(255,255,255,0.6)' }}>
                            {completada ? '✅ Misión Cumplida' : 'Progreso Actual'}
                        </span>
                        <span style={{ color: '#fff' }}>{progreso} / {meta}</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${porcentaje}%`,
                            background: completada ? 'linear-gradient(90deg, #4CAF50, #81c784)' : 'linear-gradient(90deg, #E8621A, #FF9B6A)',
                            borderRadius: '999px',
                            transition: 'width 0.4s ease'
                        }} />
                    </div>
                </div>

                {/* Sección interactiva: solo aparece si la misión amerita Foto o Código QR */}
                {requiereEvidencia && (
                    <div style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '1.25rem',
                        marginBottom: '1.25rem'
                    }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {requiereFoto && !requiereQR && <span>📷 Evidencia Fotográfica Requerida:</span>}
                            {requiereQR && !requiereFoto && <span>⚡ Escaneo de Código QR Requerido:</span>}
                            {requiereFoto && requiereQR && <span>📸 Evidencias de Misión (Foto y QR):</span>}
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: (requiereFoto && requiereQR) ? '1fr 1fr' : '1fr',
                            gap: '0.75rem',
                            marginBottom: '1rem'
                        }}>
                            {/* Botón Tomar Foto (solo si amerita foto) */}
                            {requiereFoto && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            background: fotoTomada ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                            border: `1px solid ${fotoTomada ? '#4CAF50' : 'rgba(255, 255, 255, 0.15)'}`,
                                            color: fotoTomada ? '#81c784' : '#fff',
                                            borderRadius: '12px',
                                            padding: '0.85rem',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: (requiereFoto && requiereQR) ? 'column' : 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Camera size={20} color={fotoTomada ? '#81c784' : '#FF9B6A'} />
                                        <span>{fotoTomada ? 'Foto Adjuntada ✓' : 'Tomar / Subir Fotografía'}</span>
                                    </button>

                                    {/* Input invisible para abrir cámara en celular o galería */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        style={{ display: 'none' }}
                                        onChange={handleTomarFoto}
                                    />
                                </>
                            )}

                            {/* Botón Escanear QR (solo si amerita QR) */}
                            {requiereQR && (
                                <button
                                    type="button"
                                    onClick={handleSimularEscaneoQR}
                                    disabled={modoEscanerQR}
                                    style={{
                                        background: qrEscaneado ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                        border: `1px solid ${qrEscaneado ? '#4CAF50' : 'rgba(255, 255, 255, 0.15)'}`,
                                        color: qrEscaneado ? '#81c784' : '#fff',
                                        borderRadius: '12px',
                                        padding: '0.85rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: (requiereFoto && requiereQR) ? 'column' : 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <QrCode size={20} color={qrEscaneado ? '#81c784' : '#FF9B6A'} />
                                    <span>{qrEscaneado ? 'Código QR Leído ✓' : modoEscanerQR ? 'Escaneando...' : 'Escanear Código QR'}</span>
                                </button>
                            )}
                        </div>

                        {/* Visor de Escaneo QR activo */}
                        {modoEscanerQR && (
                            <div style={{
                                background: '#0a0a0a',
                                border: '1px dashed #E8621A',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                textAlign: 'center',
                                marginBottom: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.6rem'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    border: '2px solid #FF9B6A',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    animation: 'pulse 1.2s infinite'
                                }}>
                                    <QrCode size={36} color="#FF9B6A" />
                                </div>
                                <span style={{ fontSize: '0.82rem', color: '#FF9B6A', fontWeight: 600 }}>
                                    Apuntando cámara al código QR de la misión...
                                </span>
                            </div>
                        )}

                        {/* Previsualización de Foto tomada */}
                        {fotoTomada && (
                            <div style={{
                                position: 'relative',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid rgba(76, 175, 80, 0.4)',
                                marginBottom: '1rem'
                            }}>
                                <img
                                    src={fotoTomada}
                                    alt="Evidencia de la misión"
                                    style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    insetInline: 0,
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                    padding: '0.5rem 0.75rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '0.78rem', color: '#81c784', fontWeight: 700 }}>
                                        ✓ Foto lista para validar
                                    </span>
                                    <button
                                        onClick={() => setFotoTomada(null)}
                                        style={{
                                            background: 'rgba(239, 83, 80, 0.8)',
                                            border: 'none',
                                            color: '#fff',
                                            borderRadius: '6px',
                                            padding: '0.2rem 0.5rem',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.2rem'
                                        }}
                                    >
                                        <Trash2 size={12} /> Quitar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Badge de QR escaneado */}
                        {qrEscaneado && (
                            <div style={{
                                background: 'rgba(76, 175, 80, 0.12)',
                                border: '1px solid rgba(76, 175, 80, 0.3)',
                                borderRadius: '10px',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.8rem',
                                color: '#81c784',
                                display: 'flex',
                                alignItems: 'center',
                                justifySpaceBetween: 'space-between',
                                marginBottom: '1rem'
                            }}>
                                <span>Código verificado: <strong>{qrEscaneado}</strong></span>
                                <button
                                    onClick={() => setQrEscaneado(null)}
                                    style={{ background: 'none', border: 'none', color: '#ef9090', cursor: 'pointer', fontSize: '0.75rem', marginLeft: 'auto' }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Mensaje de éxito al completar */}
                {mensajeExito && (
                    <div style={{
                        background: 'rgba(76, 175, 80, 0.2)',
                        border: '1px solid #4CAF50',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        color: '#81c784',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        marginBottom: '1rem',
                        animation: 'fadeIn 0.2s ease'
                    }}>
                        🎉 {mensajeExito}
                    </div>
                )}

                {/* Botón de acción: solo para misiones que ameritan evidencia de Foto/QR. Se elimina 'Marcar como Completada' manual */}
                {requiereEvidencia ? (
                    <button
                        onClick={handleCompletar}
                        disabled={botonBloqueado}
                        style={{
                            width: '100%',
                            padding: '0.9rem',
                            background: completada
                                ? '#2E7D32'
                                : botonBloqueado
                                    ? '#333'
                                    : 'linear-gradient(135deg, #FF9B6A 0%, #E8621A 100%)',
                            border: 'none',
                            borderRadius: '14px',
                            color: botonBloqueado && !completada ? 'rgba(255,255,255,0.4)' : '#fff',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            cursor: (completada || botonBloqueado) ? 'not-allowed' : 'pointer',
                            boxShadow: (completada || botonBloqueado) ? 'none' : '0 6px 20px rgba(232, 98, 26, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'transform 0.15s, opacity 0.15s',
                            opacity: completando ? 0.7 : 1
                        }}
                    >
                        {completada ? (
                            <>
                                <CheckCircle2 size={18} /> ¡Misión Completada!
                            </>
                        ) : faltaEvidenciaFoto ? (
                            <>
                                <Camera size={18} /> Toma una foto para validar
                            </>
                        ) : faltaEvidenciaQR ? (
                            <>
                                <QrCode size={18} /> Escanea el código QR para validar
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                {fotoTomada ? 'Enviar Foto y Validar (+XP)' : 'Validar QR y Reclamar (+XP)'}
                            </>
                        )}
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {completada ? (
                            <div style={{
                                width: '100%',
                                padding: '0.85rem',
                                background: '#2E7D32',
                                borderRadius: '14px',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}>
                                <CheckCircle2 size={18} /> ¡Misión Completada!
                            </div>
                        ) : (
                            <button
                                onClick={onClose}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '14px',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.92rem',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                            >
                                Entendido
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

export default MisionModal;
