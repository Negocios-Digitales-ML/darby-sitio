# Darby · sitio de ventas

Sitio estático en Netlify con dos funciones para Mercado Pago. Sin costo mensual: Netlify gratis,
Netlify Forms gratis (100 pedidos al mes) y Mercado Pago cobra solo su comisión por venta.

## Qué hay aquí

```
netlify.toml                  configuración de Netlify (no hace falta tocarla)
public/                       todo lo que se publica
  index.html                  página principal de ventas
  pedido/                     formulario de pedido (tarjeta o transferencia)
  pago/                       página a la que regresa Mercado Pago (aprobado, pendiente, rechazado)
  terminos/, privacidad/      textos legales (llenar lo que está entre [ ])
  404.html                    "esta dirección no existe"
  anayluis/                   invitación de ejemplo  ->  tudominio.com/anayluis
  js/config.js                WhatsApp, datos de transferencia, dominio  <- EDITA ESTO
  js/catalogo.js              paquetes, extras y precios                <- y esto si cambias precios
netlify/functions/
  crear-pago.mjs              crea el cobro en Mercado Pago (el precio sale de catalogo.js)
  mp-webhook.mjs              recibe la confirmación de pago y te la manda por correo
```

## Publicar una invitación en tudominio.com/miguelyarely

1. Pon la carpeta de la invitación dentro de `public/` con el nombre que quieres en la dirección:
   `public/miguelyarely/index.html` (más sus carpetas `img/`, `audio/`, etc.).
2. Publica (ver abajo). Listo: queda en `tudominio.com/miguelyarely`.

Reglas del nombre de carpeta: minúsculas, números y guiones, sin espacios ni acentos.
No uses `pedido`, `pago`, `terminos`, `privacidad`, `css`, `js` ni `img`.

**Pega esta línea como primera línea dentro de `<head>` de cada invitación** (justo después de
`<meta charset>`). Hace que `/miguelyarely` se abra como `/miguelyarely/` y así cargan sus fotos,
estilos y música con rutas relativas:

```html
<script>if(!location.pathname.endsWith('/')&&!/\.[a-z0-9]+$/i.test(location.pathname))location.replace(location.pathname+'/'+location.search+location.hash)</script>
```

No subas la carpeta `wallet/` de una invitación: tiene scripts de servidor que no deben ser públicos.

## Cómo publicar (recomendado: GitHub + Netlify)

Arrastrar la carpeta a Netlify **no publica las funciones de Mercado Pago**. Para que el pago con
tarjeta funcione, conecta el sitio a un repositorio:

1. Crea un repositorio en GitHub (puede ser privado) y sube todo el contenido de esta carpeta.
2. En Netlify: Add new site > Import an existing project > GitHub > elige el repositorio.
   No hace falta "build command"; Netlify lee `netlify.toml`.
3. Cada invitación nueva: en GitHub entra a `public/`, "Add file > Upload files", arrastra la carpeta
   de la invitación y "Commit". Netlify publica solo en menos de un minuto.

Alternativa sin GitHub: Netlify CLI (`npm i -g netlify-cli`, `netlify login`, `netlify deploy --prod`
desde esta carpeta). Esa sí sube las funciones.

## Activar los pedidos por correo (Netlify Forms)

Netlify > tu sitio > Forms > **Enable form detection**, y vuelve a publicar. Aparecen dos formularios:
- `pedidos`: cada pedido (tarjeta o transferencia) con folio, paquete, datos del evento y del cliente.
- `pagos`: cada pago con tarjeta aprobado por Mercado Pago, con su folio.
En Forms > Form notifications agrega tu correo para que te llegue cada uno.

## Mercado Pago (primero en modo de prueba)

1. Entra a https://www.mercadopago.com.mx/developers/panel/app y crea una aplicación
   (Checkout Pro, pagos en línea).
2. Copia el **Access Token de prueba** (empieza con `TEST-`).
3. Netlify > Site configuration > Environment variables > agrega:
   - `MP_ACCESS_TOKEN` = el Access Token
   - `SITIO_URL` = `https://tu-sitio.netlify.app` (o tu dominio cuando lo tengas)
4. Webhooks: en tu aplicación de Mercado Pago > Webhooks, URL
   `https://tu-sitio.netlify.app/.netlify/functions/mp-webhook`, evento **Pagos**. Copia la
   "clave secreta" y agrégala en Netlify como `MP_WEBHOOK_SECRET`.
5. Vuelve a publicar (Deploys > Trigger deploy) y prueba con las tarjetas de prueba de Mercado Pago.
6. Cuando todo funcione, cambia `MP_ACCESS_TOKEN` por el **Access Token de producción** y vuelve a publicar.

Nunca pongas el Access Token en los archivos del sitio: solo en las variables de Netlify.

## Dominio propio

Cuando compres el dominio: Netlify > Domain management > Add a domain, sigue los pasos de DNS,
pon el dominio en `public/js/config.js` (`dominio: 'darby.mx'`) y en `SITIO_URL`.
Las invitaciones quedan automáticamente en `tudominio.com/nombre`.
