import { ExternalLink } from 'lucide-react';

function ReservationLink({ className, href, label = 'Reservar espacio' }) {
    if (!href) return null;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
        >
            <ExternalLink size={14} /> {label}
        </a>
    );
}

export default ReservationLink;
