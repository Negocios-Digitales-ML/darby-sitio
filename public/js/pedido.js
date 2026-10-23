import { CONFIG, enlaceWhatsApp, dominio } from './config.js';
import { PAQUETES, EXTRAS, PERMITE_ANTICIPO, calcularTotal, pesos } from './catalogo.js';

const $ = (s, el = document) => el.querySelector(s);
const form = $('#pedido');
const params = new URLSearchParams(location.search);

// Direcciones que ya usa el sitio y no pueden ser de una invitación.
const RESERVADAS = ['pedido', 'pago', 'terminos', 'privacidad', 'css', 'js', 'img', 'admin', 'api', 'netlify', 'anayluis'];

// Opciones de paquete y extras a partir del catálogo
const inicial = PAQUETES[params.get('paquete')] ? params.get('paquete') : 'premium';
$('#opciones-paquete').innerHTML = Object.entries(PAQUETES).map(([id, p]) => `
  <label class="op-paquete">
    <input type="radio" name="paquete" value="${id}" ${id === inicial ? 'checked' : ''}>
    <span class="op-caja"><b>${p.nombre}</b><span class="p">${pesos(p.precio)}</span><small>${p.para}</small></span>
  </label>`).join('');
$('#lista-extras').innerHTML = Object.entries(EXTRAS).map(([id, e]) => `
  <label class="extra"><input type="checkbox" name="extras" value="${id}"><span>${e.nombre}</span><b>+${pesos(e.precio)}</b></label>`).join('');
document.querySelectorAll('.dom-pedido').forEach((el) => (el.textContent = dominio()));

if (!CONFIG.pagoConTarjeta) {
  $('#metodo-tarjeta').hidden = true;
  form.metodo_pago.value = 'transferencia';
}

function leer() {
  const fd = new FormData(form);
  return {
    paquete: fd.get('paquete'),
    extras: fd.getAll('extras'),
    modalidad: fd.get('modalidad') || 'completo',
    metodo: fd.get('metodo_pago'),
  };
}

function actualizar() {
  const d = leer();
  const permite = PERMITE_ANTICIPO.includes(d.paquete);
  $('#modalidad').hidden = !permite;
  const c = calcularTotal(d);
  $('#conceptos').innerHTML = c.conceptos.map((x) => `<li><span>${x.nombre}</span><span>${pesos(x.precio)}</span></li>`).join('');
  $('#total').textContent = pesos(c.total);
  $('#fila-hoy').hidden = !c.esAnticipo;
  $('#hoy').textContent = pesos(c.aPagar);
  const tarjeta = d.metodo === 'tarjeta';
  $('#enviar').textContent = tarjeta ? `Pagar ${pesos(c.aPagar)} con tarjeta` : 'Ver datos para transferir';
  $('#seguro-txt').textContent = tarjeta ? 'Pago seguro en Mercado Pago' : 'Te mostramos la CLABE en el siguiente paso';
  return c;
}

// Sugerir la dirección a partir de los nombres, mientras el cliente no la edite.
const slug = $('#slug');
let slugEditado = false;
const limpiar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, 'y').replace(/[^a-z0-9-]+/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
form.nombres_evento.addEventListener('input', () => {
  if (!slugEditado) { slug.value = limpiar(form.nombres_evento.value.replace(/\s+y\s+/gi, 'y')); validarSlug(); }
});
slug.addEventListener('input', () => {
  slugEditado = true;
  const pos = slug.value;
  slug.value = limpiar(pos);
  validarSlug();
});
function validarSlug() {
  const v = slug.value;
  const ayuda = $('#slug-ayuda');
  let msj = 'Solo minúsculas, números y guiones. Te confirmamos que esté disponible.';
  let ok = true;
  if (v && v.length < 3) { msj = 'Usa al menos 3 letras.'; ok = false; }
  if (RESERVADAS.includes(v)) { msj = 'Esa dirección no está disponible, prueba otra.'; ok = false; }
  ayuda.textContent = ok && v ? `Tu invitación quedará en ${dominio()}/${v}` : msj;
  ayuda.classList.toggle('mal', !ok);
  slug.parentElement.classList.toggle('invalido', !ok);
  return ok && v.length >= 3;
}

form.addEventListener('change', actualizar);
actualizar();

function mostrarError(html) {
  const e = $('#error');
  e.innerHTML = html;
  e.hidden = false;
}

function validar() {
  let primero = null;
  for (const el of form.querySelectorAll('[required]')) {
    const ok = el.type === 'checkbox' ? el.checked : el.checkValidity() && el.value.trim() !== '';
    el.classList.toggle('invalido', !ok);
    if (!ok && !primero) primero = el;
  }
  const tel = form.whatsapp.value.replace(/\D/g, '');
  if (tel.length < 10) { form.whatsapp.classList.add('invalido'); primero ||= form.whatsapp; }
  if (!validarSlug()) primero ||= slug;
  if (primero) {
    primero.focus();
    mostrarError(primero.name === 'acepto_terminos'
      ? 'Acepta los términos para continuar.'
      : 'Revisa los campos marcados en rojo.');
    return false;
  }
  return true;
}

const nuevoFolio = () => {
  const f = new Date();
  const fecha = `${String(f.getFullYear()).slice(2)}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}`;
  const az = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
  return `DB-${fecha}-${az}`;
};

// Guarda el pedido en Netlify Forms. Si falla (por ejemplo, al probar en tu compu) el pedido sigue.
async function guardarPedido() {
  const fd = new FormData(form);
  fd.delete('extras');
  try {
    const r = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fd).toString(),
    });
    return r.ok;
  } catch {
    return false;
  }
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  $('#error').hidden = true;
  if (!validar()) return;

  const c = actualizar();
  const d = leer();
  const folio = nuevoFolio();
  form.folio.value = folio;
  form.total.value = c.total;
  form.a_pagar.value = c.aPagar;
  form.paquete_elegido.value = PAQUETES[d.paquete].nombre + (c.esAnticipo ? ' (anticipo 50%)' : '');
  form.extras_lista.value = c.extras.map((e) => EXTRAS[e].nombre).join(', ');

  const boton = $('#enviar');
  const textoBoton = boton.textContent;
  boton.disabled = true;
  boton.textContent = d.metodo === 'tarjeta' ? 'Abriendo Mercado Pago…' : 'Guardando tu pedido…';

  await guardarPedido();

  const pedido = {
    folio, paquete: PAQUETES[d.paquete].nombre, total: c.total, aPagar: c.aPagar, esAnticipo: c.esAnticipo,
    nombres: form.nombres_evento.value.trim(), direccion: slug.value, metodo: d.metodo,
  };
  try { sessionStorage.setItem('darby-pedido', JSON.stringify(pedido)); } catch {}

  if (d.metodo === 'transferencia') {
    mostrarTransferencia(pedido);
    return;
  }

  try {
    const r = await fetch('/.netlify/functions/crear-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folio, paquete: d.paquete, extras: d.extras, modalidad: d.modalidad,
        nombre: form.nombre.value.trim(), email: form.email.value.trim(), telefono: form.whatsapp.value.trim(),
      }),
    });
    const res = await r.json().catch(() => ({}));
    if (!r.ok || !res.url) throw new Error([res.error, res.detalle].filter(Boolean).join(': ') || 'sin respuesta');
    location.href = res.url;
  } catch (e) {
    console.error('Mercado Pago:', e);
    boton.disabled = false;
    boton.textContent = textoBoton;
    const wa = enlaceWhatsApp(`Hola, quise pagar con tarjeta mi pedido ${folio} (${pedido.paquete}, ${pesos(c.aPagar)}) y no se abrió Mercado Pago.`);
    mostrarError(`No pudimos abrir el pago con tarjeta. Intenta de nuevo, elige transferencia o <a href="${wa}" target="_blank" rel="noopener">escríbenos por WhatsApp</a> con tu folio ${folio}.`);
  }
});

function mostrarTransferencia(p) {
  const t = CONFIG.transferencia;
  $('#l-folio').textContent = p.folio;
  $('#l-monto').textContent = pesos(p.aPagar) + (p.esAnticipo ? ' de anticipo' : '');
  $('#l-banco').textContent = t.banco;
  $('#l-titular').textContent = t.titular;
  $('#l-clabe').textContent = t.clabe;
  $('#l-concepto').textContent = p.folio;
  if (t.tarjeta) { $('#l-tarjeta').textContent = t.tarjeta; $('#l-tarjeta-fila').hidden = false; }
  $('#l-wa').href = enlaceWhatsApp(
    `Hola, hice mi pedido ${p.folio}: paquete ${p.paquete} para ${p.nombres} (${dominio()}/${p.direccion}). ` +
    `Te envío el comprobante de mi transferencia por ${pesos(p.aPagar)}.`);
  form.hidden = true;
  $('#titulo').hidden = true;
  const listo = $('#listo');
  listo.hidden = false;
  scrollTo({ top: 0 });
  listo.focus({ preventScroll: true });
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copiar]');
  if (!b) return;
  const texto = $('#' + b.dataset.copiar).textContent.replace(/\s/g, '');
  try { await navigator.clipboard.writeText(texto); b.textContent = 'Copiado'; }
  catch { b.textContent = 'Mantén presionado para copiar'; }
  setTimeout(() => (b.textContent = 'Copiar'), 2000);
});
