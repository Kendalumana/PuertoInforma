import React, { useState } from 'react';
import { MapPin, CheckCircle2, Circle } from 'lucide-react';
import '../styles/LocationPermissionModal.css';

const LocationPermissionModal = ({ onAllow, onDeny }) => {
  const [accuracy, setAccuracy] = useState('precisa');

  const handleAllow = () => {
    // Aquí puedes manejar la lógica antes de pedir el permiso real del navegador
    // onAllow puede recibir la "precisión" seleccionada si deseas usarla para algo,
    // aunque el navegador siempre pedirá lat/lng real.
    if (onAllow) {
      onAllow(accuracy);
    }
  };

  return (
    <div className="location-modal-overlay">
      <div className="location-modal-content">
        <div className="location-modal-header">
          <div className="location-icon-wrapper">
            <MapPin size={20} color="#f9a826" />
          </div>
          <h3>www.puertoinforma.com desea usar la ubicación de tu dispositivo</h3>
        </div>

        <div className="location-options">
          <div 
            className={`location-option ${accuracy === 'precisa' ? 'selected' : ''}`}
            onClick={() => setAccuracy('precisa')}
          >
            <div className="option-icon-bg precise-bg"></div>
            <div className="option-text">
              <h4>Precisa</h4>
              <p>Ubicación exacta</p>
            </div>
            <div className="option-check">
              {accuracy === 'precisa' ? (
                <CheckCircle2 size={24} color="#f9a826" fill="#f9a826" stroke="#38312b" />
              ) : (
                <Circle size={24} color="#a19c98" />
              )}
            </div>
          </div>

          <div 
            className={`location-option ${accuracy === 'aproximada' ? 'selected' : ''}`}
            onClick={() => setAccuracy('aproximada')}
          >
            <div className="option-icon-bg approx-bg"></div>
            <div className="option-text">
              <h4>Aproximada</h4>
              <p>Colonia</p>
            </div>
            <div className="option-check">
              {accuracy === 'aproximada' ? (
                <CheckCircle2 size={24} color="#f9a826" fill="#f9a826" stroke="#38312b" />
              ) : (
                <Circle size={24} color="#a19c98" />
              )}
            </div>
          </div>
        </div>

        {accuracy === 'aproximada' && (
          <div className="location-warning">
            ⚠️ Aviso: Si eliges la ubicación aproximada, te costará más acceder a las paradas y estimar los tiempos de llegada de los buses.
          </div>
        )}

        <div className="location-actions">
          <button className="location-btn allow-btn" onClick={handleAllow}>
            Permitir mientras visito el sitio
          </button>
          <button className="location-btn allow-btn" onClick={handleAllow}>
            Permitir esta vez
          </button>
          <button className="location-btn deny-btn" onClick={onDeny}>
            No permitir nunca
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
