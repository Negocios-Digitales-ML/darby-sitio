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
