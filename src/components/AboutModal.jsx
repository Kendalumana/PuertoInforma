import { useState } from 'react';

function AboutModal({ onClose }) {
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');

    const handleSubmit = () => {
        if (!nombre.trim()) return;

        const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '50684748707';
        const message = encodeURIComponent(
            `🏢 Hola PuertoInforma!\nMe interesa registrar mi negocio.\n\nNombre: ${nombre}\nTeléfono: ${telefono}`
        );
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        onClose();
    };

    return (
        <div className="modal-overlay about-overlay" onClick={onClose} style={{ display: 'flex' }}>
            <div className="modal-content about-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">📰 Acerca de PuertoInforma</h2>
                    <button className="close-modal" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: '1rem' }}>
                        PuertoInforma es un directorio interactivo de comercios, lugares culturales y servicios de Puntarenas, Costa Rica.
                    </p>
                    <h3 style={{ color: 'var(--naranja)', marginBottom: '0.5rem' }}>¿Sos dueño de un negocio?</h3>
                    <p>Contactanos para aparecer en nuestra plataforma.</p>
                    <div className="contact-form">
                        <div className="form-group">
                            <input
                                id="about-nombre"
                                type="text"
                                className="form-input"
                                placeholder="Nombre del negocio / Servicio"
                                value={nombre}
                                onChange={(event) => setNombre(event.target.value)}
                            />
                            <input
                                id="about-telefono"
                                type="text"
                                className="form-input"
                                placeholder="Tu número de contacto"
                                value={telefono}
                                onChange={(event) => setTelefono(event.target.value)}
                            />
                        </div>
                        <button className="submit-btn" onClick={handleSubmit}>
                            💬 Enviar por WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AboutModal;
