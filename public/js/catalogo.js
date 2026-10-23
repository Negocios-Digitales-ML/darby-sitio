// Paquetes, extras y precios (MXN, IVA incluido).
// Este archivo lo usan la página y también la función de cobro,
// así que el precio que paga el cliente siempre sale de aquí.

export const PAQUETES = {
  basico: {
    nombre: 'Básico',
    precio: 590,
    para: 'Bautizos, cumpleaños y baby showers',
    incluye: [
      'Diseño de plantilla con tus colores',
      'Nombres, fecha y una foto de portada',
      'Ubicación con Google Maps y Waze',
      'Cuenta regresiva',
      'Tu enlace en línea por 6 meses',
    ],
    entrega: '48 horas',
  },
  premium: {
    nombre: 'Premium',
    precio: 1190,
    para: 'Bodas y XV años',
    destacado: true,
    incluye: [
      'Todo lo del Básico',
      'Confirmación de asistencia por WhatsApp',
      'Música de fondo',
      'Itinerario y código de vestimenta',
      'Mesa de regalos y datos bancarios',
      'Galería de fotos',
      'Dos rondas de cambios',
      'Tu enlace en línea por 12 meses',
    ],
    entrega: '48 horas',
  },
  deluxe: {
    nombre: 'Deluxe',
    precio: 2290,
    para: 'Bodas grandes y bodas destino',
    incluye: [
      'Todo lo del Premium',
      'Enlace por familia con su número de pases',
      'Pase con código QR para la entrada',
      'Pase para Apple Wallet y Google Wallet',
      'Versión en español e inglés',
      'Diseño a la medida de tu evento',
      'Atención por WhatsApp hasta el día del evento',
    ],
    entrega: '72 horas',
  },
};

export const EXTRAS = {
  urgente: { nombre: 'Entrega en 24 horas', precio: 250 },
  dominio: { nombre: 'Dominio propio por un año (anayluis.com)', precio: 450 },
  video: { nombre: 'Video invitación para historias', precio: 350 },
  savethedate: { nombre: 'Save the date', precio: 290 },
  agradecimiento: { nombre: 'Agradecimiento después del evento', precio: 290 },
};

// Premium y Deluxe se pueden apartar con 50% de anticipo.
export const ANTICIPO = 0.5;
export const PERMITE_ANTICIPO = ['premium', 'deluxe'];

export function calcularTotal({ paquete, extras = [], modalidad = 'completo' }) {
  const p = PAQUETES[paquete];
  if (!p) throw new Error('Paquete no válido');
  const extrasValidos = [...new Set(extras)].filter((e) => EXTRAS[e]);
  const conceptos = [
    { nombre: `Paquete ${p.nombre}`, precio: p.precio },
    ...extrasValidos.map((e) => ({ nombre: EXTRAS[e].nombre, precio: EXTRAS[e].precio })),
  ];
  const total = conceptos.reduce((s, c) => s + c.precio, 0);
  const esAnticipo = modalidad === 'anticipo' && PERMITE_ANTICIPO.includes(paquete);
  const aPagar = esAnticipo ? Math.round(total * ANTICIPO) : total;
  return {
    conceptos,
    extras: extrasValidos,
    total,
    aPagar,
    esAnticipo,
    modalidad: esAnticipo ? 'anticipo' : 'completo',
  };
}

export const pesos = (n) =>
  '$' + n.toLocaleString('es-MX', { maximumFractionDigits: 0 });

// Diseños de la galería. "demo" es la carpeta de la invitación de ejemplo, si existe.
export const DISENOS = [
  { id: 'lacre', nombre: 'Lacre', evento: 'Boda', demo: '/anayluis/', etiqueta: 'Nos casamos', nombres: 'Ana & Luis',
    fecha: '14 · 02 · 2027', lugar: 'Hacienda Santa Cruz · Puebla', fondo: '#f7efe9', tinta: '#3e2a2f', acento: '#7a2740' },
  { id: 'quince', nombre: 'Quince', evento: 'XV años', demo: '/sofiaxv/', etiqueta: 'Mis XV años', nombres: 'Sofía',
    fecha: '22 · 05 · 2027', lugar: 'Salón Los Arcos · Monterrey', fondo: '#fbe9ef', tinta: '#4a2433', acento: '#b0476b' },
  { id: 'bautizo', nombre: 'Cielo', evento: 'Bautizo', demo: '/bautizoemi/', etiqueta: 'Mi bautizo', nombres: 'Emiliano',
    fecha: '06 · 03 · 2027', lugar: 'Parroquia San José · Querétaro', fondo: '#eaf1f4', tinta: '#22343d', acento: '#3f6c80' },
  { id: 'salvia', nombre: 'Salvia', evento: 'Baby shower', etiqueta: 'Baby shower', nombres: 'Bebé Ramírez',
    fecha: '18 · 04 · 2027', lugar: 'Jardín Las Flores · León', fondo: '#eef2ea', tinta: '#2e3a2c', acento: '#5f7d55' },
  { id: 'brindis', nombre: 'Brindis', evento: 'Cumpleaños', etiqueta: 'Celebra conmigo', nombres: 'Los 50 de Rosa',
    fecha: '09 · 01 · 2027', lugar: 'Terraza Alameda · CDMX', fondo: '#faf1df', tinta: '#3d2e12', acento: '#a8781f' },
  { id: 'gala', nombre: 'Gala', evento: 'Evento de empresa', etiqueta: 'Cena anual', nombres: 'Grupo Norte',
    fecha: '11 · 12 · 2026', lugar: 'Hotel Mirador · Guadalajara', fondo: '#1f1a24', tinta: '#f3ecf5', acento: '#c9a75b' },
];
