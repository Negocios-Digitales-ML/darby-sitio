// Datos del negocio. Cambia lo que está entre corchetes [ ] y vuelve a publicar.

export const CONFIG = {
  marca: 'Darby',

  // Tu dominio cuando lo compres, sin https:// (por ejemplo 'darby.com.mx').
  // Mientras esté vacío, los ejemplos de la página dicen darby.mx.
  dominio: '',

  // WhatsApp con lada de país y sin espacios ni signos: 52 + 10 dígitos.
  whatsapp: '[52XXXXXXXXXX]',
  mensajeWhatsApp: 'Hola, quiero información de las invitaciones digitales.',

  // Datos que se muestran a quien elige pagar por transferencia.
  transferencia: {
    banco: '[Banco]',
    titular: '[Nombre del titular]',
    clabe: '[CLABE de 18 dígitos]',
    tarjeta: '', // opcional: número de tarjeta para depósito en OXXO o ventanilla
  },

  // Pon en false para ocultar el pago con tarjeta (por ejemplo, si aún no configuras Mercado Pago).
  pagoConTarjeta: true,

  redes: {
    instagram: '', // 'https://instagram.com/tu_cuenta'
    facebook: '',
    tiktok: '',
  },
  correo: '',
};

export function enlaceWhatsApp(texto = CONFIG.mensajeWhatsApp) {
  const numero = CONFIG.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

// Dominio que se muestra en los textos y ejemplos de la página.
export function dominio() {
  return CONFIG.dominio || 'darby.mx';
}
