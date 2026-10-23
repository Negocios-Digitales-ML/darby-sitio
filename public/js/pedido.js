import { CONFIG, listo, enlaceWhatsApp, dominio } from './config.js';
import { PAQUETES, EXTRAS, DISENOS, PERMITE_ANTICIPO, calcularTotal, pesos } from './catalogo.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const form = $('#pedido');
const params = new URLSearchParams(location.search);
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const GUARDADO = 'darby-borrador';
const TOTAL_PASOS = 5;

// Direcciones que ya usa el sitio y no pueden ser de una invitación.
const RESERVADAS = ['pedido', 'pago', 'terminos', 'privacidad', 'css', 'js', 'img', 'admin', 'api', 'netlify', 'anayluis', 'sofiaxv', 'bautizoemi'];

const PALETAS = [
  ['Vino y dorado', '#5b1a2e', '#b88a3e'], ['Rosa palo', '#e8b4c0', '#b0476b'], ['Azul cielo', '#a9c9d8', '#3f6c80'],
  ['Verde salvia', '#b7c8ad', '#5f7d55'], ['Negro y oro', '#1f1a24', '#c9a75b'], ['Blanco y plata', '#f4f4f2', '#9aa0a6'],
  ['Lila', '#cdb8dd', '#7a5a96'], ['Terracota', '#d9a07c', '#8a4b2a'],
];

/* ---------- Construir las opciones ---------- */
const disenoInicial = DISENOS.find((d) => d.id === params.get('diseno'))?.id || DISENOS[0].id;
$('#opciones-diseno').innerHTML = DISENOS.map((d) => `
  <label class="op-diseno">
    <input type="radio" name="diseno" value="${d.id}" ${d.id === disenoInicial ? 'checked' : ''}>
    <span class="op-diseno-caja" style="--d-fondo:${d.fondo};--d-tinta:${d.tinta};--d-acento:${d.acento}">
      <span class="op-mini"><span class="op-nom">${escapar(d.nombres)}</span><span class="op-fecha">${d.fecha}</span></span>
      <b>${d.nombre}</b><small>${d.evento}</small>
    </span>
  </label>`).join('');

$('#paletas').innerHTML = PALETAS.map(([n, a, b]) => `
  <button type="button" class="paleta" data-nombre="${n}" aria-pressed="false" title="${n}">
    <span style="background:${a}"></span><span style="background:${b}"></span><small>${n}</small>
  </button>`).join('');

const paqueteInicial = PAQUETES[params.get('paquete')] ? params.get('paquete') : 'premium';
$('#opciones-paquete').innerHTML = Object.entries(PAQUETES).map(([id, p]) => `
  <label class="op-paquete">
    <input type="radio" name="paquete" value="${id}" ${id === paqueteInicial ? 'checked' : ''}>
    <span class="op-caja">
      ${p.destacado ? '<span class="op-insignia">El más elegido</span>' : ''}
      <b>${p.nombre}</b><span class="p">${pesos(p.precio)}</span><small>${p.para}</small>
      <ul>${p.incluye.slice(0, 4).map((i) => `<li>${escapar(i)}</li>`).join('')}</ul>
    </span>
  </label>`).join('');
$('#lista-extras').innerHTML = Object.entries(EXTRAS).map(([id, e]) => `
  <label class="extra"><input type="checkbox" name="extras" value="${id}"><span>${e.nombre}</span><b>+${pesos(e.precio)}</b></label>`).join('');
$$('.dom-pedido').forEach((el) => (el.textContent = dominio()));

if (!CONFIG.pagoConTarjeta) {
  $('#metodo-tarjeta').hidden = true;
  form.metodo_pago.value = 'transferencia';
}
if (CONFIG.factura) $('#factura-bloque').hidden = false;
$('#requiere-factura').addEventListener('change', (e) => { $('#factura-campos').hidden = !e.target.checked; });

/* ---------- Borrador guardado en este dispositivo ---------- */
function guardarBorrador() {
  const datos = {};
  for (const el of form.elements) {
    if (!el.name || el.type === 'hidden' || el.name === 'bot-field') continue;
    if (el.type === 'radio') { if (el.checked) datos[el.name] = el.value; }
    else if (el.type === 'checkbox') { (datos[el.name] ||= []); if (el.checked) datos[el.name].push(el.value); }
    else datos[el.name] = el.value;
  }
  datos._paso = paso;
  try { localStorage.setItem(GUARDADO, JSON.stringify(datos)); } catch {}
}
function cargarBorrador() {
  let datos;
  try { datos = JSON.parse(localStorage.getItem(GUARDADO) || 'null'); } catch {}
  if (!datos) return 1;
  for (const el of form.elements) {
    if (!el.name || !(el.name in datos) || el.type === 'hidden') continue;
    // Lo que viene en el enlace (diseño, paquete, nombres) manda sobre el borrador.
    if ((el.name === 'diseno' && params.get('diseno')) || (el.name === 'paquete' && params.get('paquete'))) continue;
    const v = datos[el.name];
    if (el.type === 'radio') el.checked = el.value === v;
    else if (el.type === 'checkbox') el.checked = Array.isArray(v) && v.includes(el.value);
    else el.value = v;
  }
  if (datos.direccion) slugEditado = true;
  $('#factura-campos').hidden = !$('#requiere-factura').checked;
  return Math.min(Math.max(1, datos._paso || 1), TOTAL_PASOS);
}

/* ---------- Dirección de la invitación ---------- */
const slug = $('#slug');
let slugEditado = false;
const limpiar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, 'y').replace(/[^a-z0-9-]+/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
function sugerirSlug() {
  if (!slugEditado) { slug.value = limpiar(form.nombres_evento.value.replace(/\s+y\s+/gi, 'y')); validarSlug(false); }
}
form.nombres_evento.addEventListener('input', sugerirSlug);
slug.addEventListener('input', () => { slugEditado = true; slug.value = limpiar(slug.value); validarSlug(false); });
function validarSlug(marcar = true) {
  const v = slug.value;
  const ayuda = $('#slug-ayuda');
  let msj = 'Solo minúsculas, números y guiones. Te confirmamos que esté disponible.';
  let ok = true;
  if (v && v.length < 3) { msj = 'Usa al menos 3 letras.'; ok = false; }
  if (RESERVADAS.includes(v)) { msj = 'Esa dirección no está disponible, prueba otra.'; ok = false; }
  if (marcar && !v) { msj = 'Escribe la dirección que quieres.'; ok = false; }
  ayuda.textContent = ok && v ? `Tu invitación quedará en ${dominio()}/${v}` : msj;
  ayuda.classList.toggle('mal', !ok);
  slug.parentElement.classList.toggle('invalido', !ok);
  return ok && v.length >= 3;
}

/* ---------- Paletas ---------- */
$('#paletas').addEventListener('click', (e) => {
  const b = e.target.closest('.paleta');
  if (!b) return;
  const activa = b.getAttribute('aria-pressed') !== 'true';
  $$('.paleta').forEach((x) => x.setAttribute('aria-pressed', 'false'));
  b.setAttribute('aria-pressed', String(activa));
  form.colores.value = activa ? b.dataset.nombre : '';
  guardarBorrador();
});
function marcarPaleta() {
  $$('.paleta').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.nombre === form.colores.value)));
}

/* ---------- Totales ---------- */
function leer() {
  const fd = new FormData(form);
  return {
    paquete: fd.get('paquete'),
    extras: fd.getAll('extras'),
    modalidad: fd.get('modalidad') || 'completo',
    metodo: fd.get('metodo_pago'),
    diseno: DISENOS.find((d) => d.id === fd.get('diseno')) || DISENOS[0],
  };
}

function actualizar() {
  const d = leer();
  $('#modalidad').hidden = !PERMITE_ANTICIPO.includes(d.paquete);
  const c = calcularTotal(d);
  $('#conceptos').innerHTML = c.conceptos.map((x) => `<li><span>${x.nombre}</span><span>${pesos(x.precio)}</span></li>`).join('');
  $('#total').textContent = pesos(c.total);
  $('#fila-hoy').hidden = !c.esAnticipo;
  $('#fila-despues').hidden = !c.esAnticipo;
  $('#hoy').textContent = pesos(c.aPagar);
  $('#despues').textContent = pesos(c.total - c.aPagar);
  $('#bt-etq').textContent = c.esAnticipo ? 'Pagas hoy' : 'Total';
  $('#bt-monto').textContent = pesos(c.aPagar);
  const tarjeta = d.metodo === 'tarjeta';
  $('#enviar').textContent = tarjeta ? `Pagar ${pesos(c.aPagar)} con tarjeta` : `Apartar con transferencia de ${pesos(c.aPagar)}`;
  $('#tranquilo-txt').textContent = c.esAnticipo
    ? `Hoy solo apartas con ${pesos(c.aPagar)}. Los otros ${pesos(c.total - c.aPagar)} los pagas cuando apruebes tu invitación.`
    : 'Pagas una sola vez y recibes tu comprobante con folio.';

  // Vista mínima del diseño elegido en el resumen
  const nombres = form.nombres_evento.value.trim() || d.diseno.nombres;
  const mini = $('#resumen-mini');
  mini.style.cssText = `--d-fondo:${d.diseno.fondo};--d-tinta:${d.diseno.tinta};--d-acento:${d.diseno.acento}`;
  mini.innerHTML = `<span class="rm-nom">${escapar(nombres)}</span><span class="rm-url">${dominio()}/${escapar(slug.value || limpiar(nombres))}</span>`;
  return c;
}

/* ---------- Pasos ---------- */
let paso = 1;
const pasos = $$('.paso');

function irA(n, enfocar = true) {
  paso = n;
  pasos.forEach((p) => { p.hidden = Number(p.dataset.paso) !== n; });
  $$('#progreso li').forEach((li) => {
    const i = Number(li.dataset.paso);
    li.classList.toggle('hecho', i < n);
    li.classList.toggle('actual', i === n);
    if (i === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  $('#atras').hidden = n === 1;
  $('#siguiente').hidden = n === TOTAL_PASOS;
  $('#enviar').hidden = n !== TOTAL_PASOS;
  $('#bt-siguiente').textContent = n === TOTAL_PASOS ? $('#enviar').textContent : 'Continuar';
  $('#error').hidden = true;
  if (n === TOTAL_PASOS) pintarRevision($('#revision'), true);
  const actual = pasos[n - 1];
  if (!reducido) actual.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
    { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
  if (enfocar) {
    const arriba = $('#progreso').getBoundingClientRect().top + scrollY - 90;
    if (scrollY > arriba) scrollTo({ top: arriba, behavior: reducido ? 'auto' : 'smooth' });
    actual.querySelector('h2').setAttribute('tabindex', '-1');
    actual.querySelector('h2').focus({ preventScroll: true });
  }
  guardarBorrador();
}

function mostrarError(html) {
  const e = $('#error');
  e.innerHTML = html;
  e.hidden = false;
}

function validarPaso(n) {
  const caja = pasos[n - 1];
  let primero = null;
  const grupos = new Set();
  for (const el of caja.querySelectorAll('[required]')) {
    let ok;
    if (el.type === 'radio') {
      if (grupos.has(el.name)) continue;
      grupos.add(el.name);
      ok = !!form.querySelector(`input[name="${el.name}"]:checked`);
      el.closest('.pastillas')?.classList.toggle('invalido', !ok);
    } else if (el.type === 'checkbox') ok = el.checked;
    else ok = el.checkValidity() && el.value.trim() !== '';
    if (el.type !== 'radio') el.classList.toggle('invalido', !ok);
    if (!ok && !primero) primero = el;
  }
  if (n === 2 && !validarSlug(true)) primero ||= slug;
  if (n === 4) {
    const tel = form.whatsapp.value.replace(/\D/g, '');
    if (tel.length < 10) { form.whatsapp.classList.add('invalido'); primero ||= form.whatsapp; }
  }
  if (n === 1 && form.fecha_evento.value) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (new Date(form.fecha_evento.value + 'T12:00') < hoy) { form.fecha_evento.classList.add('invalido'); primero ||= form.fecha_evento; }
  }
  if (primero) {
    primero.focus();
    let msj = 'Revisa los campos marcados en rojo.';
    if (primero.name === 'acepto_terminos') msj = 'Acepta los términos para continuar.';
    else if (primero.name === 'tipo_evento') msj = 'Elige qué vas a celebrar.';
    else if (primero === form.whatsapp) msj = 'Escribe tu WhatsApp a 10 dígitos para poder contactarte.';
    else if (primero === form.fecha_evento && form.fecha_evento.value) msj = 'La fecha del evento ya pasó. Revisa el año.';
    mostrarError(msj);
    return false;
  }
  return true;
}

$('#siguiente').addEventListener('click', () => { if (validarPaso(paso)) irA(paso + 1); });
$('#atras').addEventListener('click', () => irA(paso - 1));
$('#bt-siguiente').addEventListener('click', () => {
  if (paso < TOTAL_PASOS) $('#siguiente').click(); else form.requestSubmit();
});
$('#progreso').addEventListener('click', (e) => {
  const li = e.target.closest('li.hecho');
  if (li) irA(Number(li.dataset.paso));
});

/* ---------- Revisión ---------- */
function filasResumen() {
  const fd = new FormData(form);
  const d = leer();
  const c = calcularTotal(d);
  const fecha = fd.get('fecha_evento')
    ? new Date(fd.get('fecha_evento') + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  return [
    [1, 'Evento', [fd.get('tipo_evento'), fd.get('nombres_evento')].filter(Boolean).join(' de ')],
    [1, 'Fecha', [fecha, fd.get('hora_evento')].filter(Boolean).join(', ')],
    [1, 'Lugar', [fd.get('ciudad'), fd.get('invitados') && `${fd.get('invitados')} invitados`].filter(Boolean).join(' · ')],
    [2, 'Diseño', `${d.diseno.nombre}${fd.get('colores') ? ` en ${fd.get('colores')}` : ''} · ${fd.get('estilo')}`],
    [2, 'Dirección', `${dominio()}/${fd.get('direccion')}`],
    [3, 'Paquete', `${PAQUETES[d.paquete].nombre}${c.extras.length ? ` + ${c.extras.map((e) => EXTRAS[e].nombre).join(', ')}` : ''}`],
    [4, 'Contacto', [fd.get('nombre'), fd.get('whatsapp'), fd.get('email')].filter(Boolean).join(' · ')],
  ];
}
function pintarRevision(dl, editable) {
  dl.innerHTML = filasResumen().map(([p, k, v]) => `<div><dt>${k}</dt><dd>${escapar(v || '—')}</dd>${editable
    ? `<button type="button" class="editar" data-ir="${p}">Cambiar</button>` : ''}</div>`).join('');
}
$('#revision').addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b) irA(Number(b.dataset.ir)); });

/* ---------- Envío ---------- */
form.addEventListener('change', () => { actualizar(); guardarBorrador(); });
form.addEventListener('input', () => { actualizar(); guardarBorrador(); });
form.colores.addEventListener('input', marcarPaleta);

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
  for (let n = 1; n <= TOTAL_PASOS; n++) {
    if (!validarPaso(n)) { if (n !== paso) { irA(n); validarPaso(n); } return; }
  }

  const c = actualizar();
  const d = leer();
  const folio = nuevoFolio();
  form.folio.value = folio;
  form.total.value = c.total;
  form.a_pagar.value = c.aPagar;
  form.restante.value = c.total - c.aPagar;
  form.paquete_elegido.value = PAQUETES[d.paquete].nombre + (c.esAnticipo ? ' (anticipo 50%)' : '');
  form.diseno_elegido.value = `${d.diseno.nombre} (${d.diseno.evento})`;
  form.extras_lista.value = c.extras.map((e) => EXTRAS[e].nombre).join(', ');

  const boton = $('#enviar');
  const textoBoton = boton.textContent;
  boton.disabled = true;
  $('#bt-siguiente').disabled = true;
  boton.textContent = d.metodo === 'tarjeta' ? 'Abriendo Mercado Pago…' : 'Guardando tu pedido…';

  await guardarPedido();

  const pedido = {
    folio, paquete: PAQUETES[d.paquete].nombre, total: c.total, aPagar: c.aPagar, esAnticipo: c.esAnticipo,
    nombres: form.nombres_evento.value.trim(), direccion: slug.value, metodo: d.metodo,
    entrega: c.extras.includes('urgente') ? '24 horas' : PAQUETES[d.paquete].entrega, resumen: filasResumen().map(([, k, v]) => [k, v]), fecha: new Date().toISOString(),
  };
  try { sessionStorage.setItem('darby-pedido', JSON.stringify(pedido)); } catch {}

  if (d.metodo === 'transferencia') {
    try { localStorage.removeItem(GUARDADO); } catch {}
    mostrarComprobante(pedido);
    return;
  }

  try {
    const r = await fetch('/.netlify/functions/crear-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folio, paquete: d.paquete, extras: d.extras, modalidad: d.modalidad }),
    });
    const res = await r.json().catch(() => ({}));
    if (!r.ok || !res.url) throw new Error([res.error, res.detalle].filter(Boolean).join(': ') || 'sin respuesta');
    try { localStorage.removeItem(GUARDADO); } catch {}
    location.href = res.url;
  } catch (e) {
    console.error('Mercado Pago:', e);
    boton.disabled = false;
    $('#bt-siguiente').disabled = false;
    boton.textContent = textoBoton;
    const wa = enlaceWhatsApp(`Hola, quise pagar con tarjeta mi pedido ${folio} (${pedido.paquete}, ${pesos(c.aPagar)}) y no se abrió Mercado Pago.`);
    mostrarError(`No pudimos abrir el pago con tarjeta y no se hizo ningún cargo. Intenta de nuevo, elige transferencia o <a href="${wa}" target="_blank" rel="noopener">escríbenos por WhatsApp</a> con tu folio ${folio}.`);
  }
});

function mostrarComprobante(p) {
  const t = CONFIG.transferencia;
  const bancoListo = listo(t.clabe) && listo(t.titular);
  $('#c-folio').textContent = p.folio;
  $('#c-fecha').textContent = new Date(p.fecha).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  $('#c-monto').textContent = pesos(p.aPagar) + (p.esAnticipo ? ' para apartar' : '');
  $('#c-banco').hidden = !bancoListo;
  $('#c-sin-banco').hidden = bancoListo;
  $('#c-banco-nombre').textContent = listo(t.banco) ? t.banco : '';
  $('#c-titular').textContent = t.titular;
  $('#c-clabe').textContent = t.clabe;
  $('#c-concepto').textContent = p.folio;
  if (listo(t.tarjeta)) { $('#c-tarjeta').textContent = t.tarjeta; $('#c-tarjeta-fila').hidden = false; }
  $('#c-resumen').innerHTML = p.resumen.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapar(v || '—')}</dd></div>`).join('');
  $('#c-total').textContent = pesos(p.total);
  $('#c-hoy').textContent = pesos(p.aPagar);
  $('#c-despues').textContent = pesos(p.total - p.aPagar);
  $('#c-despues-fila').hidden = !p.esAnticipo;
  $('#c-entrega').textContent = p.entrega;
  $('#c-wa').href = enlaceWhatsApp(
    `Hola, hice mi pedido ${p.folio}: paquete ${p.paquete} para ${p.nombres} (${dominio()}/${p.direccion}). ` +
    `Te envío el comprobante de mi transferencia por ${pesos(p.aPagar)}.`);
  form.hidden = true;
  $('#titulo').hidden = true;
  $('#progreso').hidden = true;
  $('#barra-total').hidden = true;
  const listoSec = $('#listo');
  listoSec.hidden = false;
  scrollTo({ top: 0 });
  listoSec.focus({ preventScroll: true });
}
$('#c-imprimir').addEventListener('click', () => print());

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copiar]');
  if (!b) return;
  const texto = $('#' + b.dataset.copiar).textContent.replace(/\s/g, '');
  try { await navigator.clipboard.writeText(texto); b.textContent = 'Copiado'; }
  catch { b.textContent = 'Mantén presionado para copiar'; }
  setTimeout(() => (b.textContent = 'Copiar'), 2000);
});

/* ---------- Inicio ---------- */
const pasoGuardado = cargarBorrador();
if (params.get('nombres') && !form.nombres_evento.value) form.nombres_evento.value = params.get('nombres');
const tipo = DISENOS.find((x) => x.id === params.get('diseno'))?.evento;
if (tipo && !form.querySelector('input[name="tipo_evento"]:checked')) {
  const r = form.querySelector(`input[name="tipo_evento"][value="${tipo}"]`);
  if (r) r.checked = true;
}
sugerirSlug();
marcarPaleta();
actualizar();
irA(pasoGuardado, false);
