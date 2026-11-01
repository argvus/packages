import { defineMiddleware } from 'astro:middleware'
import siteConfig from './site-config.json'

const base = import.meta.env.BASE_URL
const notFoundPath = `${base}404/`

const maintenanceHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>ARGVUS - A modular desktop environment for Wayland and Arch Linux, built on Hyprland.</title>
    <link rel="icon" type="image/png" href="${base}favicon.png" />
    <link rel="stylesheet" href="${base}maintenance.css" />
  </head>
  <body>
    <main>
      <img class="logo" src="${base}favicon.png" alt="" width="112" height="112" />
      <h1>
        <img
          class="wordmark"
          src="${base}brand/argvus-wordmark.svg"
          alt="ARGVUS"
          width="240"
          height="32"
        />
      </h1>
      <p style="margin-bottom: 20px; color: white; opacity: 0.82;">A modular desktop environment for Wayland and Arch Linux, built on Hyprland.</p>
      <p><small>ARGVUS 0.1.0 will be released soon! <br/>Follow the development on our <a href="https://github.com/argvus/">GitHub</a></small></p>
    </main>
  </body>
</html>`

const assetPathPattern = /\.(?:css|js|mjs|json|png|jpe?g|webp|gif|svg|ico|txt|xml|woff2?)$/i

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url

  if (
    siteConfig.maintenance &&
    pathname !== notFoundPath &&
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
