import { CONFIG, listo, enlaceWhatsApp, dominio } from './config.js';
import { PAQUETES, EXTRAS, DISENOS, pesos } from './catalogo.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const icono = (id) => `<svg aria-hidden="true"><use href="/img/iconos.svg#${id}"/></svg>`;
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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

// Llena los textos marcados con data-config; si el dato no está listo, deja el texto por defecto o esconde la fila.
function aplicarConfig() {
  const numero = CONFIG.whatsapp.replace(/\D/g, '');
  const valores = {
    ...CONFIG,
    titularVisible: listo(CONFIG.transferencia.titular) ? CONFIG.transferencia.titular : CONFIG.responsable,
    whatsappVisible: listo(CONFIG.whatsapp) ? numero.replace(/^52(\d{2})(\d{4})(\d{4})$/, '$1 $2 $3') : '',
  };
  $$('[data-config]').forEach((el) => {
    const v = valores[el.dataset.config];
    if (listo(v)) el.textContent = v;
  });
  $$('[data-config-fila]').forEach((el) => { el.hidden = !listo(CONFIG[el.dataset.configFila]); });
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
        <p class="entrega">Entrega en ${p.entrega}${id !== 'basico' ? ' · aparta con 50%' : ''}</p>
      </article>`).join('');
  }
  const extras = $('#extras');
  if (extras) {
    extras.innerHTML = Object.values(EXTRAS)
      .map((e) => `<li>${e.nombre} <b>+${pesos(e.precio)}</b></li>`).join('');
  }
  const tabla = $('#tabla-comparar');
  if (tabla) {
    const filas = [
      ['Diseño con tus colores', 1, 1, 1], ['Ubicación con Maps y Waze', 1, 1, 1], ['Cuenta regresiva', 1, 1, 1],
      ['Confirmación por WhatsApp', 0, 1, 1], ['Música de fondo', 0, 1, 1], ['Itinerario y vestimenta', 0, 1, 1],
      ['Mesa de regalos', 0, 1, 1], ['Galería de fotos', 0, 1, 1], ['Rondas de cambios', 'Correcciones', '2', 'Hasta tu evento'],
      ['Enlace por familia con pases', 0, 0, 1], ['Pase QR y Wallet', 0, 0, 1], ['Español e inglés', 0, 0, 1],
      ['En línea', '6 meses', '12 meses', '12 meses'], ['Entrega', '48 h', '48 h', '72 h'],
      ['Precio', ...Object.values(PAQUETES).map((p) => pesos(p.precio))],
    ];
    const celda = (v) => v === 1 ? `<td>${icono('check')}<span class="sr">Incluido</span></td>`
      : v === 0 ? '<td class="no">—<span class="sr">No incluido</span></td>' : `<td>${v}</td>`;
    tabla.innerHTML = `<thead><tr><th scope="col"><span class="sr">Función</span></th>${Object.values(PAQUETES)
      .map((p) => `<th scope="col"${p.destacado ? ' class="dest"' : ''}>${p.nombre}</th>`).join('')}</tr></thead>
      <tbody>${filas.map(([n, ...v]) => `<tr><th scope="row">${n}</th>${v.map(celda).join('')}</tr>`).join('')}</tbody>`;
  }
}

/* ---------- Hero: el sobre se abre con la invitación del visitante ---------- */
function hero() {
  const escena = $('#escena');
  if (!escena) return;
  $$('.dom', escena).forEach((el) => (el.textContent = dominio()));
  const tarjeta = $('#tarjeta');
  const slug = $('#slug');
  const entrada = $('#probador-nombres');
  const chips = $('#chips-evento');
  const pedir = $('#hero-pedir');
  const dias = { lacre: 114, quince: 210, bautizo: 134, salvia: 177, brindis: 78, gala: 49 };
  let actual = DISENOS[0];
  let propio = '';
  let turno = 0;

  const aSlug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+y\s+|&/g, 'y').replace(/[^a-z0-9]+/g, '').slice(0, 24);

  function pintar() {
    const nombres = propio || actual.nombres;
    $('#inv-etiqueta').textContent = actual.etiqueta;
    $('#inv-nombres').textContent = nombres;
    $('#inv-fecha').textContent = actual.fecha;
    $('#inv-lugar').textContent = actual.lugar;
    $('#inv-dias').textContent = dias[actual.id] || 100;
    tarjeta.style.setProperty('--inv-fondo', actual.fondo);
    tarjeta.style.setProperty('--inv-tinta', actual.tinta);
    tarjeta.style.setProperty('--inv-acento', actual.acento);
    const q = new URLSearchParams({ diseno: actual.id });
    if (propio) q.set('nombres', propio);
    pedir.href = `/pedido/?${q}`;
  }

  async function escribir(texto) {
    const mio = ++turno;
    if (reducido) { slug.textContent = texto; return; }
    while (slug.textContent && !texto.startsWith(slug.textContent)) {
      if (mio !== turno) return;
      slug.textContent = slug.textContent.slice(0, -1);
      await espera(28);
    }
    for (const letra of texto.slice(slug.textContent.length)) {
      if (mio !== turno) return;
      slug.textContent += letra;
      await espera(70);
    }
  }

  // Cerrar el sobre, cambiar la invitación y volver a abrirlo: el momento principal de la página.
  async function cambiarDiseno(d) {
    actual = d;
    chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-checked', String(c.dataset.id === d.id)));
    if (reducido) { pintar(); slug.textContent = aSlug(propio || d.nombres); return; }
    escena.classList.remove('abierto');
    await espera(650);
    pintar();
    await escribir(aSlug(propio || d.nombres));
    await espera(200);
    escena.classList.add('abierto');
  }

  chips.innerHTML = DISENOS.map((d) =>
    `<button type="button" class="chip" role="radio" aria-checked="false" data-id="${d.id}">${d.evento}</button>`).join('');
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (b && b.dataset.id !== actual.id) cambiarDiseno(DISENOS.find((d) => d.id === b.dataset.id));
  });
  // Flechas del teclado dentro del grupo de opciones
  chips.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const lista = [...chips.children];
    const i = lista.indexOf(document.activeElement);
    const sig = lista[(i + (e.key === 'ArrowRight' ? 1 : lista.length - 1)) % lista.length];
    sig.focus(); sig.click();
  });

  let pausa;
  entrada.addEventListener('input', () => {
    propio = entrada.value.trim();
    $('#inv-nombres').textContent = propio || actual.nombres;
    pintar();
    clearTimeout(pausa);
    pausa = setTimeout(() => escribir(aSlug(propio || actual.nombres)), 250);
  });

  chips.firstElementChild.setAttribute('aria-checked', 'true');
  pintar();
  if (reducido) {
    slug.textContent = aSlug(actual.nombres);
    escena.classList.add('abierto');
  } else {
    (async () => {
      await espera(500);
      await escribir(aSlug(actual.nombres));
      await espera(300);
      escena.classList.add('abierto');
    })();
  }

  // Confirmaciones que van llegando (se detiene si la página no está visible).
  const avisos = [['Tía Lupe confirmó', '4 personas asistirán'], ['Familia Pérez confirmó', '5 personas asistirán'],
    ['Primo Jorge confirmó', '2 personas asistirán'], ['Madrina Carmen confirmó', '3 personas asistirán']];
  const aviso = $('#aviso-rsvp');
  let n = 0;
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(escena);
  if (!reducido) {
    setInterval(async () => {
      if (!visible || document.hidden) return;
      aviso.classList.add('salir');
      await espera(450);
      n = (n + 1) % avisos.length;
      $('#aviso-quien').textContent = avisos[n][0];
      $('#aviso-cuantos').textContent = avisos[n][1];
      aviso.classList.remove('salir');
    }, 4200);
  }
}

/* ---------- Galería de diseños ---------- */
function galeria() {
  const g = $('#galeria');
  if (!g) return;
  g.innerHTML = DISENOS.map((d) => `
    <article class="diseno" data-evento="${escapar(d.evento)}">
      <div class="mini" style="--d-fondo:${d.fondo};--d-tinta:${d.tinta};--d-acento:${d.acento}">
        <svg aria-hidden="true"><use href="/img/iconos.svg#flor"/></svg>
        <p class="m-et">${escapar(d.etiqueta)}</p>
        <p class="m-nom">${escapar(d.nombres)}</p>
        <p class="m-fecha">${d.fecha}</p>
        <p class="m-lugar">${escapar(d.lugar)}</p>
        <span class="m-btn">Confirmar asistencia</span>
      </div>
      <div class="diseno-info"><b>${d.nombre}</b><span>${d.evento}</span></div>
      <div class="diseno-acciones">
        ${d.demo ? `<a class="btn btn-borde" href="${d.demo}">Ver ejemplo</a>` : ''}
        <a class="btn btn-vino" href="/pedido/?diseno=${d.id}">Elegir</a>
      </div>
    </article>`).join('');

  const filtro = $('#filtro-disenos');
  const eventos = ['Todos', ...new Set(DISENOS.map((d) => d.evento))];
  filtro.innerHTML = eventos.map((e, i) =>
    `<button type="button" class="chip" role="radio" aria-checked="${i === 0}" data-evento="${escapar(e)}">${e}</button>`).join('');
  filtro.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    filtro.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-checked', String(c === b)));
    const cambiar = () => $$('.diseno', g).forEach((el) => {
      el.hidden = b.dataset.evento !== 'Todos' && el.dataset.evento !== b.dataset.evento;
    });
    if (document.startViewTransition && !reducido) document.startViewTransition(cambiar); else cambiar();
    g.scrollTo({ left: 0 });
  });

  $$('[data-mover]').forEach((b) => b.addEventListener('click', () => {
    g.scrollBy({ left: Number(b.dataset.mover) * 290 * (innerWidth > 700 ? 2 : 1), behavior: reducido ? 'auto' : 'smooth' });
  }));
}

/* ---------- La ruta del pago se dibuja al llegar a ella ---------- */
function ruta() {
  const r = $('.ruta');
  if (!r || reducido || !('IntersectionObserver' in window)) return;
  const caja = r.getBoundingClientRect();
  if (caja.top < innerHeight) return; // ya está en pantalla: se queda dibujada
  r.style.setProperty('--progreso', 0);
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { r.style.setProperty('--progreso', 1); io.disconnect(); }
  }, { threshold: 0.4 });
  io.observe(r);
}

function encabezado() {
  const h = $('.encabezado');
  if (!h) return;
  const f = () => h.classList.toggle('con-borde', scrollY > 8);
  addEventListener('scroll', f, { passive: true });
  f();
}

aplicarConfig();
pintarPaquetes();
galeria();
activarWhatsApp();
aplicarDominio();
hero();
ruta();
encabezado();
$$('[data-anio]').forEach((el) => (el.textContent = new Date().getFullYear()));

export { activarWhatsApp, icono, $, $$ };
