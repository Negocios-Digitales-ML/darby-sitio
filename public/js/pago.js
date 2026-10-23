import { enlaceWhatsApp, dominio } from './config.js';
import { pesos } from './catalogo.js';

// Mercado Pago regresa aquí con ?estado=aprobado|pendiente|rechazado y agrega
// external_reference (nuestro folio), payment_id y status.
const q = new URLSearchParams(location.search);
const estado = q.get('estado') || q.get('status') || 'pendiente';
let pedido = {};
try { pedido = JSON.parse(sessionStorage.getItem('darby-pedido') || '{}'); } catch {}
const folio = q.get('external_reference') || pedido.folio || '';
const idPago = q.get('payment_id') || '';

const $ = (s) => document.querySelector(s);
const textos = {
  aprobado: {
    ico: 'check', titulo: '¡Pago recibido!',
    texto: 'Gracias por tu compra. Mándanos por WhatsApp los nombres, la fecha, los lugares, tus fotos y tu canción, y en 48 horas te enseñamos tu invitación.',
    wa: `Hola, ya pagué mi invitación. Folio ${folio}${idPago ? `, pago ${idPago}` : ''}. Te mando mis datos y fotos.`,
    boton: 'Mandar mis datos por WhatsApp',
  },
  pendiente: {
    ico: 'reloj', titulo: 'Tu pago está en proceso',
    texto: 'Mercado Pago aún está confirmando tu pago (pasa con pagos en efectivo o algunas tarjetas). Te avisamos por WhatsApp en cuanto se acredite.',
    wa: `Hola, mi pago del folio ${folio} quedó pendiente en Mercado Pago.`,
    boton: 'Avisar por WhatsApp',
  },
  rechazado: {
    ico: 'tarjeta', titulo: 'El pago no se completó',
    texto: 'No se hizo ningún cargo. Puedes intentar con otra tarjeta o pagar por transferencia.',
    wa: `Hola, mi pago con tarjeta del folio ${folio} no pasó. ¿Me ayudas?`,
    boton: 'Pedir ayuda por WhatsApp',
    otro: { texto: 'Intentar de nuevo', href: '/pedido/' },
  },
};
const t = textos[estado === 'approved' ? 'aprobado' : estado === 'rejected' || estado === 'failure' ? 'rechazado' : estado] || textos.pendiente;

document.title = `${t.titulo} · Darby`;
$('#resultado').classList.add(estado);
$('#r-ico use').setAttribute('href', `/img/iconos.svg#${t.ico}`);
$('#r-titulo').textContent = t.titulo;
let texto = t.texto;
if (estado === 'aprobado' && pedido.aPagar && pedido.folio === folio) {
  texto = `Recibimos ${pesos(pedido.aPagar)} de tu paquete ${pedido.paquete}. ` + texto;
  if (pedido.direccion) texto += ` Tu dirección: ${dominio()}/${pedido.direccion}.`;
}
$('#r-texto').textContent = texto;
if (folio) { $('#r-folio').hidden = false; $('#r-folio b').textContent = folio; }
$('#r-wa').href = enlaceWhatsApp(t.wa);
$('#r-wa span').textContent = t.boton;
if (t.otro) { $('#r-otro').textContent = t.otro.texto; $('#r-otro').href = t.otro.href; }
