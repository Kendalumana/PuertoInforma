import { useRef, useEffect, useState } from 'react';
import { MapPin, CheckCircle2, Circle } from 'lucide-react';
import '../styles/LocationPermissionModal.css';

const LocationPermissionModal = ({ onAllow, onDeny }) => {
  const [accuracy, setAccuracy] = useState('precisa');
  // Ref para mover el foco al botón principal al montar el modal (accesibilidad).
  const primaryBtnRef = useRef(null);

  useEffect(() => {
    // Focus automático al botón "Permitir" cuando el modal aparece.
    primaryBtnRef.current?.focus();
  }, []);

  const handleAllow = () => {
    if (onAllow) onAllow(accuracy);
  };

  return (
    <div
      className="location-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div className="location-modal-content">
        <div className="location-modal-header">
          <div className="location-icon-wrapper" aria-hidden="true">
            <MapPin size={20} color="var(--naranja)" />
          </div>
          <h3 id="location-modal-title">
            PuertoInforma desea usar la ubicación de tu dispositivo
          </h3>
        </div>

        <div className="location-options" role="radiogroup" aria-label="Precisión de la ubicación">
          <div
            className={`location-option ${accuracy === 'precisa' ? 'selected' : ''}`}
            onClick={() => setAccuracy('precisa')}
            role="radio"
            aria-checked={accuracy === 'precisa'}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setAccuracy('precisa')}
          >
            <div className="option-icon-bg precise-bg" aria-hidden="true"></div>
            <div className="option-text">
              <h4>Precisa</h4>
              <p>Ubicación exacta</p>
            </div>
            <div className="option-check" aria-hidden="true">
              {accuracy === 'precisa' ? (
                <CheckCircle2 size={24} color="var(--naranja)" fill="var(--naranja)" stroke="var(--gris-oscuro)" />
              ) : (
                <Circle size={24} color="#a19c98" />
              )}
            </div>
          </div>

          <div
            className={`location-option ${accuracy === 'aproximada' ? 'selected' : ''}`}
            onClick={() => setAccuracy('aproximada')}
            role="radio"
            aria-checked={accuracy === 'aproximada'}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setAccuracy('aproximada')}
          >
            <div className="option-icon-bg approx-bg" aria-hidden="true"></div>
            <div className="option-text">
              <h4>Aproximada</h4>
              <p>Solo tu zona general</p>
            </div>
            <div className="option-check" aria-hidden="true">
              {accuracy === 'aproximada' ? (
                <CheckCircle2 size={24} color="var(--naranja)" fill="var(--naranja)" stroke="var(--gris-oscuro)" />
              ) : (
                <Circle size={24} color="#a19c98" />
              )}
            </div>
          </div>
        </div>

        {accuracy === 'aproximada' && (
          <div className="location-warning" role="alert">
            ⚠️ Con ubicación aproximada, puede costar más estimar tiempos de llegada de buses y paradas cercanas.
          </div>
        )}

        <div className="location-actions">
          <button
            ref={primaryBtnRef}
            className="location-btn allow-btn"
            onClick={handleAllow}
            aria-label={`Permitir acceso a ubicación ${accuracy}`}
          >
            Permitir acceso a mi ubicación
          </button>
          <button
            className="location-btn deny-btn"
            onClick={onDeny}
            aria-label="No permitir acceso a la ubicación"
          >
            No permitir
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
