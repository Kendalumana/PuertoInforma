/**
 * AnimalLogos.jsx — Logos vectoriales para los rangos de fauna de Puntarenas
 */

export function LogoCangrejo({ size = 32, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Cangrejo del Puerto"
        >
            {/* Tenazas */}
            <path d="M8 14C8 10 12 7 16 10C17 11 18 13 17 16C15 17 12 18 9 17C8.3 16 8 15 8 14Z" fill="#E84A36" />
            <path d="M40 14C40 10 36 7 32 10C31 11 30 13 31 16C33 17 36 18 39 17C39.7 16 40 15 40 14Z" fill="#E84A36" />
            <path d="M14 11C12 7 7 8 7 12C7 16 11 18 14 16" stroke="#C72E1B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M34 11C36 7 41 8 41 12C41 16 37 18 34 16" stroke="#C72E1B" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Patas laterales */}
            <path d="M12 28L5 32M13 33L6 39M15 37L9 44" stroke="#E84A36" strokeWidth="3" strokeLinecap="round" />
            <path d="M36 28L43 32M35 33L42 39M33 37L39 44" stroke="#E84A36" strokeWidth="3" strokeLinecap="round" />
            
            {/* Caparazón principal */}
            <ellipse cx="24" cy="28" rx="14" ry="10" fill="#E84A36" />
            <ellipse cx="24" cy="27" rx="11" ry="8" fill="#FF5E49" />
            <path d="M16 28C18 32 30 32 32 28" stroke="#C72E1B" strokeWidth="2" strokeLinecap="round" />
            
            {/* Ojos */}
            <circle cx="20" cy="17" r="3" fill="#fff" />
            <circle cx="20" cy="17" r="1.5" fill="#1A1A1A" />
            <circle cx="28" cy="17" r="3" fill="#fff" />
            <circle cx="28" cy="17" r="1.5" fill="#1A1A1A" />
        </svg>
    );
}

export function LogoPelicano({ size = 32, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Pelícano del Paseo"
        >
            {/* Alas */}
            <path d="M10 24C16 18 24 16 32 18C28 22 22 24 10 24Z" fill="#758A99" />
            <path d="M22 18C30 14 38 15 44 20C38 23 30 23 22 18Z" fill="#9FB4C4" />
            {/* Cuerpo */}
            <ellipse cx="22" cy="28" rx="8" ry="10" fill="#EAECEE" />
            {/* Cuello y Cabeza */}
            <path d="M22 20C22 15 25 10 28 8C31 8 33 11 32 14C31 17 28 21 27 24" fill="#EAECEE" />
            {/* Pico y Bolsa gular emblemática */}
            <path d="M32 9L42 12C39 16 33 18 30 15L32 9Z" fill="#F4A261" />
            <path d="M33 13C37 17 38 21 34 23C31 24 29 20 30 16" fill="#E76F51" opacity="0.85" />
            {/* Ojo */}
            <circle cx="29" cy="10" r="1.5" fill="#1A1A1A" />
        </svg>
    );
}

export function LogoTortuga({ size = 32, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Tortuga del Golfo"
        >
            {/* Aletas delanteras largas */}
            <path d="M18 18C12 12 6 12 5 16C4 20 10 24 16 23" fill="#2A9D8F" />
            <path d="M30 18C36 12 42 12 43 16C44 20 38 24 32 23" fill="#2A9D8F" />
            {/* Aletas traseras */}
            <path d="M17 34C13 37 12 41 15 42C18 43 20 39 19 35" fill="#2A9D8F" />
            <path d="M31 34C35 37 36 41 33 42C30 43 28 39 29 35" fill="#2A9D8F" />
            {/* Cabeza */}
            <ellipse cx="24" cy="10" rx="4.5" ry="6" fill="#2A9D8F" />
            {/* Caparazón redondeado */}
            <ellipse cx="24" cy="27" rx="12" ry="14" fill="#264653" />
            <ellipse cx="24" cy="27" rx="9" ry="11" fill="#2A9D8F" />
            {/* Placas hexagonales */}
            <polygon points="24,20 28,24 28,29 24,32 20,29 20,24" fill="#E76F51" opacity="0.8" />
        </svg>
    );
}

export function LogoDelfin({ size = 32, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Delfín Porteño"
        >
            {/* Cola */}
            <path d="M10 38C6 35 4 41 6 43C9 41 12 39 15 36" fill="#457B9D" />
            <path d="M10 38C12 35 15 37 17 38C15 41 10 44 9 44" fill="#457B9D" />
            {/* Cuerpo curvado */}
            <path d="M12 37C16 33 20 27 23 20C25 15 29 10 35 11C40 12 42 15 40 18C38 20 33 22 28 25C21 29 16 35 12 37Z" fill="#457B9D" />
            {/* Vientre claro */}
            <path d="M15 36C19 31 23 26 27 21C31 17 34 16 36 17C33 20 28 24 23 28C19 32 16 35 15 36Z" fill="#A8DADC" />
            {/* Aleta dorsal */}
            <path d="M25 14C24 9 27 8 29 11C28 13 27 15 26 17" fill="#1D3557" />
            {/* Aleta pectoral */}
            <path d="M29 22C31 27 34 29 35 27C35 25 33 23 31 22" fill="#1D3557" />
            {/* Ojo y hocico */}
            <circle cx="36" cy="13" r="1.5" fill="#1D3557" />
        </svg>
    );
}

export function LogoBallena({ size = 32, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Ballena del Pacífico"
        >
            {/* Chorro de agua */}
            <path d="M34 8C34 5 36 3 38 4M33 7C31 4 28 4 29 6M35 7C37 6 39 8 36 10" stroke="#64DFDF" strokeWidth="2" strokeLinecap="round" />
            {/* Cuerpo majestuoso */}
            <path d="M6 24C10 24 16 28 22 29C29 30 38 29 42 24C44 21 42 17 38 16C31 15 22 16 14 20C10 22 7 23 6 24Z" fill="#1D3557" />
            {/* Vientre estriado */}
            <path d="M14 24C18 25 24 27 31 27C37 27 41 24 41 23C37 27 30 28 22 28C16 27 12 25 14 24Z" fill="#F1FAEE" />
            {/* Aleta caudal gigante */}
            <path d="M6 24C4 18 2 17 3 20C5 23 6 24 6 24C5 25 4 27 3 29C2 31 5 30 6 24Z" fill="#1D3557" />
            <path d="M4 19C7 22 8 23 7 24C8 25 7 27 4 30C2 32 1 29 2 24C1 20 2 17 4 19Z" fill="#457B9D" />
            {/* Aleta pectoral */}
            <path d="M26 26C28 32 32 35 33 33C33 31 31 28 28 26" fill="#457B9D" />
            {/* Ojo */}
            <circle cx="39" cy="19" r="1.5" fill="#F1FAEE" />
        </svg>
    );
}

export function ObtenerLogoRango({ animal = '', size = 32, className = '' }) {
    const normalizado = String(animal).toLowerCase();
    if (normalizado.includes('cangrejo') || normalizado.includes('camaron') || normalizado.includes('camarón')) {
        return <LogoCangrejo size={size} className={className} />;
    }
    if (normalizado.includes('lapa') || normalizado.includes('guacamaya')) {
        return (
            <span style={{ fontSize: `${size * 0.85}px`, display: 'inline-block', lineHeight: 1 }} className={className} role="img" aria-label="Lapa">
                🦜
            </span>
        );
    }
    if (normalizado.includes('iguana') || normalizado.includes('garrobo')) {
        return (
            <span style={{ fontSize: `${size * 0.85}px`, display: 'inline-block', lineHeight: 1 }} className={className} role="img" aria-label="Iguana">
                🦎
            </span>
        );
    }
    if (normalizado.includes('zanate') || normalizado.includes('clarinero')) {
        return (
            <span style={{ fontSize: `${size * 0.85}px`, display: 'inline-block', lineHeight: 1 }} className={className} role="img" aria-label="Zanate">
                🦅
            </span>
        );
    }
    if (normalizado.includes('cocodrilo') || normalizado.includes('caiman') || normalizado.includes('caimán')) {
        return (
            <span style={{ fontSize: `${size * 0.85}px`, display: 'inline-block', lineHeight: 1 }} className={className} role="img" aria-label="Cocodrilo">
                🐊
            </span>
        );
    }
    if (normalizado.includes('pelicano') || normalizado.includes('pelícano') || normalizado.includes('pardo')) {
        return <LogoPelicano size={size} className={className} />;
    }
    if (normalizado.includes('tortuga') || normalizado.includes('baula') || normalizado.includes('lora')) {
        return <LogoTortuga size={size} className={className} />;
    }
    if (normalizado.includes('delfin') || normalizado.includes('delfín')) {
        return <LogoDelfin size={size} className={className} />;
    }
    if (normalizado.includes('ballena') || normalizado.includes('jorobada')) {
        return <LogoBallena size={size} className={className} />;
    }
    return <LogoCangrejo size={size} className={className} />;
}
