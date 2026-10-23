import { CONFIG, enlaceWhatsApp, dominio } from './config.js';
import { PAQUETES, EXTRAS, pesos } from './catalogo.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const icono = (id) => `<svg aria-hidden="true"><use href="/img/iconos.svg#${id}"/></svg>`;

// Enlaces de WhatsApp: <a data-wa> usa el mensaje general, <a data-wa="texto"> uno propio.
function activarWhatsApp(raiz = document) {
  $$('[data-wa]', raiz).forEach((a) => {
    a.href = enlaceWhatsApp(a.dataset.wa || undefined);
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

// Cambia "darby.mx" en los textos por el dominio configurado.
function aplicarDominio() {
  const d = dominio();
  if (d === 'darby.mx') return;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    if (w.currentNode.nodeValue.includes('darby.mx')) {
      w.currentNode.nodeValue = w.currentNode.nodeValue.replaceAll('darby.mx', d);
    }
  }
}

function pintarPaquetes() {
  const planes = $('#planes');
  if (planes) {
    planes.innerHTML = Object.entries(PAQUETES).map(([id, p]) => `
      <article class="plan${p.destacado ? ' destacado' : ''}">
        ${p.destacado ? '<span class="insignia">El más elegido</span>' : ''}
        <h3>${p.nombre}</h3>
        <p class="para">${p.para}</p>
        <p class="precio">${pesos(p.precio)}<small>MXN</small></p>
        <ul>${p.incluye.map((i) => `<li>${icono('check')}<span>${i}</span></li>`).join('')}</ul>
        <a class="btn ${p.destacado ? 'btn-claro' : 'btn-vino'}" href="/pedido/?paquete=${id}">Elegir ${p.nombre}</a>
        <p class="entrega">Entrega en ${p.entrega}</p>
      </article>`).join('');
  }
  const extras = $('#extras');
  if (extras) {
    extras.innerHTML = Object.values(EXTRAS)
      .map((e) => `<li>${e.nombre} <b>+${pesos(e.precio)}</b></li>`).join('');
  }
}

// Animación del hero: escribe la dirección y abre el sobre, con tres ejemplos.
const EJEMPLOS = [
  { slug: 'sofiaxv', etiqueta: 'Mis XV años', nombres: 'Sofía', fecha: '22 · 05 · 2027', lugar: 'Salón Los Arcos · Monterrey', dias: 210,
    fondo: '#fbe9ef', tinta: '#4a2433', acento: '#b0476b' },
  { slug: 'bautizoemi', etiqueta: 'Mi bautizo', nombres: 'Emiliano', fecha: '06 · 03 · 2027', lugar: 'Parroquia San José · Querétaro', dias: 134,
    fondo: '#eaf1f4', tinta: '#22343d', acento: '#3f6c80' },
  { slug: 'anayluis', etiqueta: 'Nos casamos', nombres: 'Ana & Luis', fecha: '14 · 02 · 2027', lugar: 'Hacienda Santa Cruz · Puebla', dias: 114,
    fondo: '#f7efe9', tinta: '#3e2a2f', acento: '#7a2740' },
];

function animarHero() {
  const escena = $('#escena');
  if (!escena) return;
  $$('.dom', escena).forEach((el) => (el.textContent = dominio()));
  const slug = $('#slug');
  const tarjeta = $('#tarjeta');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  const poner = (e) => {
    $('#inv-etiqueta').textContent = e.etiqueta;
    $('#inv-nombres').textContent = e.nombres;
    $('#inv-fecha').textContent = e.fecha;
    $('#inv-lugar').textContent = e.lugar;
    $('#inv-dias').textContent = e.dias;
    tarjeta.style.setProperty('--inv-fondo', e.fondo);
    tarjeta.style.setProperty('--inv-tinta', e.tinta);
    tarjeta.style.setProperty('--inv-acento', e.acento);
  };

  if (reducido) {
    poner(EJEMPLOS[2]);
    slug.textContent = EJEMPLOS[2].slug;
    escena.classList.add('abierto');
    return;
  }

  (async () => {
    await espera(500);
    for (const e of EJEMPLOS) {
      escena.classList.remove('abierto');
      await espera(700);
      poner(e);
      slug.textContent = '';
      for (const letra of e.slug) {
        slug.textContent += letra;
        await espera(85);
      }
      await espera(350);
      escena.classList.add('abierto');
      if (e !== EJEMPLOS[EJEMPLOS.length - 1]) await espera(3200);
    }
  })();
}

function encabezado() {
  const h = $('.encabezado');
  if (!h) return;
  const f = () => h.classList.toggle('con-borde', scrollY > 8);
  addEventListener('scroll', f, { passive: true });
  f();
}

activarWhatsApp();
aplicarDominio();
pintarPaquetes();
animarHero();
encabezado();
$$('[data-anio]').forEach((el) => (el.textContent = new Date().getFullYear()));

export { activarWhatsApp, icono, $, $$ };
