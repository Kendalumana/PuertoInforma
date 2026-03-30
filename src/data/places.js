// ============================================================
// places.js — Toda la data del directorio
// Las imágenes se importan aquí porque pertenecen a cada
// comercio, no a App.jsx
// ============================================================

import imgMigdalia1 from '../Resources/migdalia1.png';
import imgMigdalia2 from '../Resources/migdalia2.png';
import imgMigdalia3 from '../Resources/migdalia3.png';

import imgMomyNails1 from '../Resources/momyNails1.png';
import imgMomyNails2 from '../Resources/momyNails2.png';
import imgMomyNails3 from '../Resources/momyNails3.png';

import imgFarmaValue from '../Resources/farmaValue.png';

import imgRocaDelMar1 from '../Resources/rocaDelMar1.png';
import imgRocaDelMar2 from '../Resources/rocaDelMar2.png';
import imgRocaDelMar3 from '../Resources/rocaDelMar3.png';

import imgIslitas1 from '../Resources/islitas1.png';
import imgIslitas2 from '../Resources/islitas2.png';
import imgIslitas3 from '../Resources/islitas3.png';

// ============================================================
// GUÍA PARA AGREGAR NUEVOS COMERCIOS
// 1. id        → número único, el siguiente en la lista
// 2. lat/lng   → clic derecho en Google Maps → copiar coords
// 3. phone     → formato internacional: +506XXXXXXXX
// 4. images    → importá las fotos arriba y referencialas aquí
// 5. acceptsSinpe → true o false
// 6. tags      → palabras clave para llamar la atención
// ============================================================
export const PLACES = [
    {
        id: 1,
        name: 'Soda Migdalia',
        category: 'Restaurantes',
        lat: 9.97974972638573,
        lng: -84.81682490319031,
        rating: 4.5,
        distance: 0.35,
        openNow: true,
        phone: '+50670051878',
        address: 'Av. 17, Diagonal al Parque El Cocal, Puntarenas',
        hours: 'Lun-Sab: 5:00 PM - 10:00 PM',
        acceptsSinpe: true,
        tags: ['Económico', 'Cantones', 'Acepta SINPE'],
        images: [imgMigdalia1, imgMigdalia2, imgMigdalia3]
    },
    {
        id: 2,
        name: 'Momy Nails',
        category: 'Uñas',
        lat: 9.976670216899546,
        lng: -84.84008648287417,
        rating: 4.8,
        distance: 0.15,
        openNow: true,
        phone: '+50670263379',
        address: '75 metros oeste del estadio Lito Pérez, Puntarenas',
        hours: 'Lun-Sab: 10:00 AM - 06:00 PM | Dom: 10:00 AM - 5:00 PM',
        acceptsSinpe: true,
        tags: ['Acrílicas', 'Pedicura', 'Atención personalizada'],
        images: [imgMomyNails1, imgMomyNails2, imgMomyNails3]
    },
    {
        id: 3,
        name: 'Farmacia Value Puntarenas',
        category: 'Farmacias',
        lat: 9.978854322103588,
        lng: -84.82983162838762,
        rating: 2.8,
        distance: 0.50,
        openNow: true,
        phone: '+50640367171',
        address: '600 metros norte de la gasolinera Delta, Puntarenas Centro',
        hours: 'Lun-Vier: 7:00 AM - 9:00 PM | Sab-Dom: 8:00 AM - 8:00 PM',
        acceptsSinpe: false,
        tags: ['Urgencias', 'Servicio a domicilio'],
        images: [imgFarmaValue]
    },
    {
        id: 4,
        name: 'Hotel Roca Del Mar',
        category: 'Alojamiento',
        lat: 9.980372190217345,
        lng: -84.81293944232912,
        rating: 4.3,
        distance: 3.20,
        openNow: true,
        phone: '+50688962637',
        address: 'Playa Puntarenas, frente al Mar',
        hours: 'Recepción 24/7',
        acceptsSinpe: true,
        tags: ['Piscina', 'Vista al mar', 'WiFi gratis'],
        images: [imgRocaDelMar1, imgRocaDelMar2, imgRocaDelMar3]
    },
    {
        id: 5,
        name: 'Islitas Drinks',
        category: 'Bares',
        lat: 9.974751836362385,
        lng: -84.845633118635,
        rating: 4.6,
        distance: 0.55,
        openNow: true,
        phone: '+50672960626',
        address: 'Calle 5, Paseo de los Turistas, Puntarenas',
        hours: 'Jue-Dom: 05:00 PM - 02:30 AM',
        acceptsSinpe: true,
        tags: ['Cócteles', 'Buen ambiente', 'Seguridad'],
        images: [imgIslitas1, imgIslitas2, imgIslitas3]
    }
];

export const CATEGORIES = [
    "Verduras", "Restaurantes", "Uñas", "Bares", "Cafés",
    "Farmacias", "Tecnología", "Gimnasios", "Ferreterías",
    "Bancos/ATM", "Copy/Librería", "Transporte", "Alojamiento", "Playas"
];