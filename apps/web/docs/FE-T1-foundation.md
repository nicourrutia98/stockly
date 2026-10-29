# FE-T1 — Foundation (artefacto de revisión)

> Spec: FE-T1 del plan de 6 vibe-loops (`spec_id=11`).
> Alcance: theme Mantine único, i18n es-CO/en SSR-safe, AppShell reutilizable, fuentes self-hosted.
> Autor: Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial).

## 1. Tema Mantine único

Archivo: `apps/web/src/shared/config/theme.ts`

- `brandTokens` con los hex de `assets/BRANDING.md`.
- `stocklyBlue`: 10 shades, índice 6 = `#0F4C81`, índice 7 = `#1E5AA8`, índice 8 = `#0A3B66`.
- `stocklyYellow`: 10 shades, índice 4 = `#F5B700`.
- `createTheme({ primaryColor: 'stockly-blue', primaryShade: { light: 6, dark: 7 }, ... })` con `headings`, `defaultRadius` y defaults de `Button`/`Paper`/`TextInput`/`PasswordInput`.

Consumo: `apps/web/src/components/Providers.tsx` importa `theme` y envuelve:

```
MantineProvider(theme) > I18nProvider(initialLocale) > Notifications > QueryClientProvider
```

## 2. i18n es-CO / en

Archivos:

- `apps/web/src/i18n/types.ts` — `Locale = 'es-CO' | 'en'`, `DEFAULT_LOCALE = 'es-CO'`, `LOCALE_COOKIE = 'stockly_locale'`, `MessageKey = keyof typeof esCO`, `TFunction`.
- `apps/web/src/i18n/messages/es-CO.ts` — diccionario canónico (default).
- `apps/web/src/i18n/messages/en.ts` — tipado `Record<MessageKey, string>` (una clave faltante es error de compilación).
- `apps/web/src/i18n/index.ts` — `translate(locale, key, vars)` con interpolación `{var}`; `translator(locale)`.
- `apps/web/src/i18n/I18nProvider.tsx` — contexto cliente; `setLocale` escribe cookie (1 año, SameSite=Lax), actualiza `document.documentElement.lang` y llama `router.refresh()` para re-renderizar Server Components.
- `apps/web/src/i18n/server.ts` — `getServerLocale()` con `await cookies()`; `getServerT()` devuelve `{ locale, t }`.

SSR: `app/layout.tsx` es `async`, resuelve el locale de la cookie y renderiza `<html lang={locale}>`; pasa `initialLocale` a `Providers`. El HTML inicial ya sale en el idioma correcto (sin flash en español).

Cadenas E2E preservadas en es-CO: `Inicio`, `Catálogo`, `Acerca de`, `Iniciar sesión`, `Contraseña`, `Entrar`, `Volver al catálogo`.

## 3. AppShell reutilizable

Archivos:

- `apps/web/src/components/layout/AppShell.tsx`
- `apps/web/src/components/layout/LocaleSwitcher.tsx`

Contenido del shell:

- Skip link como primer elemento enfocable (`#contenido`).
- Header sticky con logo + wordmark, nav `aria-label`, `aria-current="page"` en la ruta activa, links Inicio/Catálogo/Acerca de, link Panel si hay sesión autenticada.
- LocaleSwitcher ES/EN con `aria-pressed` y nombre accesible completo.
- Ícono de cotización con badge de cantidad y nombre accesible `{n} productos en tu cotización`.
- CTA Ingresar cuando no hay sesión.
- Footer con copyright, licencia MIT, link a /about y a /BRANDING.md.
- Contenido en `<div id="contenido">`, de modo que cada página conserva su `<main>` (sin `<main>` anidados).

Páginas que lo usan:

- `apps/web/app/page.tsx` (landing, Server Component + `getServerT()`)
- `apps/web/app/about/page.tsx`
- `apps/web/app/catalogo/page.tsx`
- `apps/web/app/catalogo/[id]/page.tsx`
- `apps/web/app/cotizacion/page.tsx`
- `apps/web/app/login/page.tsx` usa `useT()` y un `h1` accesible.

## 4. Fuentes self-hosted

Archivos:

- `apps/web/app/fonts.ts` — `next/font/local` con `Inter` 400/500/600/700 y `JetBrains Mono` 400/500.
- `apps/web/app/fonts/*.woff2` — subset latin (incluye acentos del español).
- `apps/web/app/layout.tsx` ya no importa `next/font/google`; `next build` no descarga fuentes.

## 5. Verificación ejecutada

```
pnpm exec tsc --noEmit -p tsconfig.json   -> exit 0
pnpm build                                -> Compiled successfully; 10 rutas
```

Rutas generadas: `/`, `/_not-found`, `/about`, `/admin/products`, `/admin/products/[id]/edit`, `/admin/products/new`, `/catalogo`, `/catalogo/[id]`, `/cotizacion`, `/login`.

Smoke con `next start -p 3100` + Chromium (Playwright):

- `/`, `/about`, `/login`, `/cotizacion`, `/catalogo` → HTTP 200 y `h1` presente.
- `Cookie: stockly_locale=en` → `lang="en"`, copy en inglés (`Skip to content`, `Smart inventory`, `About`).
- Cambio EN desde la UI → `document.documentElement.lang === 'en'` y H1 `Stockly · Smart inventory`.
- Consola: 0 errores; respuestas 4xx/5xx: 0 (se agregó `public/LICENSE` para el link legal).

## 6. Criterios de aceptación

| Criterio | Estado | Evidencia |
|---|---|---|
| Theme único con rampas de 10 shades | PASS | `src/shared/config/theme.ts` |
| Providers consume el theme y monta i18n | PASS | `src/components/Providers.tsx` |
| Diccionarios es-CO/en con el mismo set de claves | PASS | `src/i18n/messages/*.ts`, `Record<MessageKey,string>` |
| Layout async + cookie + `<html lang>` | PASS | `app/layout.tsx` |
| AppShell en 5 superficies públicas | PASS | `src/components/layout/AppShell.tsx` + páginas |
| Cambio de idioma actualiza SSR y `lang` | PASS | smoke con cookie + click EN |
| Strings E2E en español intactas | PASS | claves es-CO |
| Fuentes self-hosted, build sin red | PASS | `app/fonts.ts`, `app/fonts/*.woff2` |
| `tsc` y `next build` limpios | PASS | comandos arriba |
