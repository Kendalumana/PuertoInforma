import { CalendarDays, Clock } from 'lucide-react';

function TransportDayTabs({ className, day, onDayChange }) {
    return (
        <div className={className}>
            <button
                className={`${className.replace('-tabs', '-tab')} ${day === 'hoy' ? 'active' : ''}`}
                onClick={() => onDayChange('hoy')}
            >
                <Clock size={13} /> HOY
            </button>
            <button
                className={`${className.replace('-tabs', '-tab')} ${day === 'manana' ? 'active' : ''}`}
                onClick={() => onDayChange('manana')}
            >
                <CalendarDays size={13} /> MAÑANA
            </button>
        </div>
    );
}

export default TransportDayTabs;
