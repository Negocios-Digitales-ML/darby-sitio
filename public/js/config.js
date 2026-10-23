// Datos del negocio. Cambia lo que está entre corchetes [ ] y vuelve a publicar.
// Mientras un dato siga entre corchetes, la página lo oculta en lugar de mostrarlo.

export const CONFIG = {
  marca: 'Darby',

  // Tu dominio cuando lo compres, sin https:// (por ejemplo 'darby.com.mx').
  // Mientras esté vacío, los ejemplos de la página dicen darby.mx.
  dominio: '',

  // WhatsApp con lada de país y sin espacios ni signos: 52 + 10 dígitos.
  whatsapp: '[52XXXXXXXXXX]',
  mensajeWhatsApp: 'Hola, quiero información de las invitaciones digitales.',
  horario: 'Lunes a sábado, de 9:00 a 20:00',

  // Quién está detrás del negocio. Mostrarlo da confianza a quien va a transferir.
  responsable: 'Miguel Luna',
  respaldo: 'Infinity Films', // tu estudio de foto y video
  ciudad: '[Ciudad, Estado]',

  // Datos que se muestran a quien elige pagar por transferencia.
  // El titular debe ser la misma persona que aparece como responsable (da confianza).
  transferencia: {
    banco: '[Banco]',
    titular: '[Nombre del titular]',
    clabe: '[CLABE de 18 dígitos]',
    tarjeta: '', // opcional: número de tarjeta para depósito en OXXO o ventanilla
  },

  // Pon en false para ocultar el pago con tarjeta (por ejemplo, si aún no configuras Mercado Pago).
  pagoConTarjeta: true,

  // true si puedes emitir factura (CFDI). Si es false, no se piden datos fiscales.
  factura: false,

  // Garantía que se muestra en la página. Ajusta el texto a lo que realmente vas a cumplir.
  garantia: 'Si no entregamos tu primera versión en el tiempo de tu paquete, te devolvemos el 100% de tu pago.',

  redes: {
    instagram: '', // 'https://instagram.com/tu_cuenta'
    facebook: '',
    tiktok: '',
  },
  correo: '',
};

// Un dato está listo cuando no está vacío ni sigue entre corchetes.
export const listo = (v) => typeof v === 'string' && v.trim() !== '' && !v.trim().startsWith('[');

export function enlaceWhatsApp(texto = CONFIG.mensajeWhatsApp) {
  const numero = CONFIG.whatsapp.replace(/\D/g, '');
  // Sin número configurado, WhatsApp deja elegir el contacto (útil mientras pruebas).
  const base = listo(CONFIG.whatsapp) && numero.length >= 10 ? `https://wa.me/${numero}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(texto)}`;
}

// Dominio que se muestra en los textos y ejemplos de la página.
export function dominio() {
  return CONFIG.dominio || 'darby.mx';
}
