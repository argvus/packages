import { defineMiddleware } from 'astro:middleware'
import siteConfig from './site-config.json'

const base = import.meta.env.BASE_URL

const maintenanceHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>ARGVUS - Maintenance</title>
    <link rel="icon" type="image/png" href="${base}favicon.png" />
    <link rel="stylesheet" href="${base}maintenance.css" />
  </head>
  <body>
    <main>
      <img src="${base}favicon.png" alt="ARGVUS logo" width="112" height="112" />
      <h1>ARGVUS</h1>
      <p>The site is under maintenance. We'll be back soon.</p>
    </main>
  </body>
</html>`

const assetPathPattern = /\.(?:css|js|mjs|json|png|jpe?g|webp|gif|svg|ico|txt|xml|woff2?)$/i

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url

  if (
    siteConfig.maintenance &&
    (context.request.method === 'GET' || context.request.method === 'HEAD') &&
    !pathname.startsWith(`${base}_astro/`) &&
    !pathname.startsWith(`${base}_image`) &&
    !assetPathPattern.test(pathname)
  ) {
    return new Response(context.request.method === 'HEAD' ? null : maintenanceHtml, {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': '3600',
      },
    })
  }

  return next()
})
