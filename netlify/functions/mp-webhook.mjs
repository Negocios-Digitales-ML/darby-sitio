// Recibe los avisos de pago de Mercado Pago, consulta el pago y,
// si quedó aprobado, lo registra en el formulario "pagos" de Netlify (te llega un correo).
// Variables de entorno:
//   MP_ACCESS_TOKEN     el mismo de crear-pago
//   MP_WEBHOOK_SECRET   "clave secreta" de Webhooks en tu aplicación de Mercado Pago (recomendado)
import crypto from 'node:crypto';

const ok = () => new Response('ok', { status: 200 });

function firmaValida(req, idDato, secreto) {
  const firma = req.headers.get('x-signature') || '';
  const idSolicitud = req.headers.get('x-request-id') || '';
  const partes = Object.fromEntries(firma.split(',').map((p) => p.trim().split('=')));
  if (!partes.ts || !partes.v1) return false;
  const id = /^[a-z0-9]+$/i.test(idDato) ? idDato.toLowerCase() : idDato;
  const manifiesto = `id:${id};request-id:${idSolicitud};ts:${partes.ts};`;
  const esperado = crypto.createHmac('sha256', secreto).update(manifiesto).digest('hex');
  const a = Buffer.from(esperado);
  const b = Buffer.from(partes.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async (req) => {
  const url = new URL(req.url);
  let body = {};
  try { body = await req.json(); } catch {}

  const tipo = url.searchParams.get('type') || url.searchParams.get('topic') || body.type;
  const idPago = String(url.searchParams.get('data.id') || body?.data?.id || url.searchParams.get('id') || '');
  if (tipo !== 'payment' || !idPago) return ok();

  // El estado real siempre se consulta a la API de Mercado Pago; la firma es una revisión extra.
  // Los avisos antiguos (IPN) llegan sin firma, por eso solo se revisa cuando viene.
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (secreto && req.headers.get('x-signature') && !firmaValida(req, url.searchParams.get('data.id') || idPago, secreto)) {
    console.warn('Aviso de Mercado Pago con firma no válida', idPago);
    return new Response('firma no válida', { status: 401 });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return ok();
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(idPago)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    console.error('No se pudo consultar el pago', idPago, r.status);
    return new Response('reintentar', { status: 500 });
  }
  const pago = await r.json();
  const folio = pago.external_reference || '';
  console.log(`Pago ${pago.id} · folio ${folio} · ${pago.status} · ${pago.transaction_amount} ${pago.currency_id}`);

  if (pago.status === 'approved') {
    const base = (process.env.SITIO_URL || process.env.URL || url.origin).replace(/\/$/, '');
    const datos = new URLSearchParams({
      'form-name': 'pagos',
      folio,
      estado: pago.status,
      monto: `${pago.transaction_amount} ${pago.currency_id}`,
      id_pago: String(pago.id),
      correo_pagador: pago.payer?.email || '',
      detalle: pago.description || '',
    });
    try {
      await fetch(`${base}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: datos.toString(),
      });
    } catch (e) {
      console.error('No se pudo registrar el pago en Netlify Forms', e);
    }
  }
  return ok();
};

