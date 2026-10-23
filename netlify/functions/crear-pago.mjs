// Crea una preferencia de Checkout Pro en Mercado Pago y regresa la URL de pago.
// Variables de entorno en Netlify (Site configuration > Environment variables):
//   MP_ACCESS_TOKEN  Access Token de Mercado Pago (de prueba primero: empieza con TEST- o APP_USR- de un usuario de prueba)
//   SITIO_URL        opcional, por ejemplo https://darby.mx (si no, se usa la URL del sitio en Netlify)
import { PAQUETES, calcularTotal } from '../../public/js/catalogo.js';

const json = (datos, status = 200) =>
  new Response(JSON.stringify(datos), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return json({ error: 'El pago con tarjeta aún no está configurado' }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Datos inválidos' }, 400); }

  const { folio, paquete, extras = [], modalidad } = body;
  if (!PAQUETES[paquete]) return json({ error: 'Paquete no válido' }, 400);
  if (typeof folio !== 'string' || !/^DB-\d{6}-[A-Z0-9]{4}$/.test(folio)) return json({ error: 'Folio no válido' }, 400);
  if (!Array.isArray(extras)) return json({ error: 'Extras no válidos' }, 400);

  // El monto se calcula aquí con el catálogo, nunca con lo que mande el navegador.
  const c = calcularTotal({ paquete, extras, modalidad });
  const p = PAQUETES[paquete];
  const base = (process.env.SITIO_URL || process.env.URL || new URL(req.url).origin).replace(/\/$/, '');
  const publico = base.startsWith('https://');

  const preferencia = {
    items: [{
      id: paquete,
      title: `Invitación digital ${p.nombre}${c.esAnticipo ? ' (anticipo 50%)' : ''}`,
      description: c.conceptos.map((x) => x.nombre).join(', ').slice(0, 250),
      category_id: 'services',
      quantity: 1,
      currency_id: 'MXN',
      unit_price: c.aPagar,
    }],
    external_reference: folio,
    metadata: { folio, paquete, extras: c.extras.join(','), modalidad: c.modalidad, total: c.total },
    back_urls: {
      success: `${base}/pago/?estado=aprobado`,
      pending: `${base}/pago/?estado=pendiente`,
      failure: `${base}/pago/?estado=rechazado`,
    },
    statement_descriptor: 'DARBY INVITACIONES',
  };
  // No mandamos el correo del cliente como "payer": con credenciales de prueba, un correo real
  // hace que Mercado Pago rechace el cobro. El cliente lo escribe en la página de pago y ya lo tenemos en Netlify Forms.
  // Mercado Pago solo acepta regreso automático y avisos hacia direcciones https públicas.
  if (publico) {
    preferencia.auto_return = 'approved';
    preferencia.notification_url = `${base}/.netlify/functions/mp-webhook`;
  }

  const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': folio,
    },
    body: JSON.stringify(preferencia),
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('Mercado Pago rechazó la preferencia', r.status, JSON.stringify(datos));
    return json({ error: 'Mercado Pago no respondió, intenta de nuevo', detalle: datos.message || datos.error || `HTTP ${r.status}` }, 502);
  }

  const prueba = token.startsWith('TEST-');
  const url = prueba ? datos.sandbox_init_point || datos.init_point : datos.init_point;
  console.log(`Preferencia ${datos.id} creada para ${folio}: ${c.aPagar} MXN`);
  return json({ url, prueba });
};

