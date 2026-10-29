# FE-T2 — Registro, sesión global y guardas de rol

> Vibe-loop FE-T2 (spec paraguas 11: FE-T1..FE-T6).
> Autor: Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial).
> Fecha: 2026-10-21.

## Alcance

1. **Alta de usuarios** (`/register`): formulario accesible (RHF + Zod) con confirmación de
   contraseña y redirección a `/login`.
2. **Endpoint de registro** en backend (`POST /api/v1/auth/register`, 201) — no existía.
3. **Sesión global silenciosa**: `AuthBootstrap` restaura la sesión una sola vez por carga,
   deduplicando el refresh (rotación de refresh-token + detección de reuso).
4. **Shell autenticado**: header con `Panel` + `Salir`; logout vuelve a `/login`.
5. **Guardas de rol**: `ProtectedRoute requireAdmin` con panel 403 dentro del shell.
6. Endurecimiento: escrituras de productos exigen `ROLE_ADMIN`.

## Archivos principales

| Capa | Archivo |
|---|---|
| Front | `apps/web/app/register/page.tsx` |
| Front | `apps/web/app/login/page.tsx` (enlaces + a11y) |
| Front | `apps/web/src/components/AuthBootstrap.tsx` |
| Front | `apps/web/src/components/layout/AppShell.tsx` |
| Front | `apps/web/src/components/admin/ProtectedRoute.tsx` |
| Front | `apps/web/src/lib/api/auth-api.ts` (`register()`, `bootstrapAuth()` deduplicado) |
| Front | `apps/web/src/components/products/ProductsTable.tsx` (badges accesibles) |
| Front | `apps/web/app/globals.css` (contraste AA) |
| Back | `auth/api/RegisterRequest.java`, `auth/api/AuthController.java` |
| Back | `auth/service/AuthService.java` (registro + rol por defecto) |
| Back | `auth/security/SecurityConfig.java` (público `/auth/register`, ROLE_ADMIN en escrituras, CORS configurable) |
| Back | `product/api/ProductController.java` (`@PreAuthorize` en POST/PATCH/DELETE) |
| Back | `db/changelog/0006-users-id-identity.xml` (`users.id` IDENTITY + `setval`) |
| Shared | `packages/shared/src/types/auth.ts` (`displayName` opcional) |

## Decisiones

- `displayName` **opcional**: la tabla `users` del backend v0.1.0 no tiene columna de nombre;
  se acepta por compatibilidad futura pero no se persiste. El formulario no lo pide.
- El registro público hacía visible un hueco de autorización: cualquier usuario podía escribir
  productos. Ahora `POST/PATCH/DELETE /products` exigen `ROLE_ADMIN` (regla en
  `SecurityConfig` + `@PreAuthorize` como segunda barrera).
- CORS externalizado (`app.cors.allowed-origins`), por defecto `localhost:3000` y
  `127.0.0.1:3000` para desarrollo y E2E.
- `bootstrapAuth()` comparte una única promesa en vuelo: dos llamadas simultáneas
  (`AuthBootstrap` + `ProtectedRoute`) reutilizaban el mismo refresh token y la segunda
  podía interpretarse como reuso (sesión invalidada). El bug se manifestaba como tests
  E2E intermitentes que aterrizaban en `/login`.

## Accesibilidad (axe, WCAG 2 A/AA)

- `--mantine-color-dimmed` subido a `gray-7` (3.32:1 → ~7:1 sobre blanco).
- Descripción de notificaciones: override del `gray-6` hardcodeado de Mantine.
- Badge "Activo": verde `#15803D` (5.0:1 con texto blanco); "Inactivo" `#64748B` (~4.7:1).
- Botones de cierre de notificación con `aria-label="Cerrar notificación"`.
- Enlace "Regístrate" con `underline="always"` (distinción sin depender del color).

## Verificación

### API (curl)

| Caso | Resultado |
|---|---|
| `POST /auth/register` válido | 201 |
| `POST /auth/register` email duplicado | 409 `email-already-registered` |
| `POST /auth/register` contraseña débil | 400 |
| `POST /auth/login` | 200 + tokens |
| `GET /auth/me` con token | 200 |
| `POST /products` anónimo | 401 |
| `POST /products` ROLE_USER | 403 |
| `POST /products` ROLE_ADMIN | 201 |
| `DELETE /products/{id}` ROLE_ADMIN | 204 |

### UI (Playwright, Chromium + Mobile Chrome)

- `/register` → 201 → `/login`.
- Registro duplicado → toast "ese email ya está registrado", sin salir del formulario.
- Login ROLE_USER → `/admin/products` con panel 403 dentro del shell.
- `/catalogo` autenticado → header con `Panel` y `Salir`; logout → `/login`.
- Login ROLE_ADMIN → tabla con 18 filas, `h1` "Productos".
- `/admin/products/new` → shell + `h1` "Nuevo producto".
- 0 errores de página.

### Suite completa

```
38 passed (7.1s)  —  proyectos: chromium + mobile
```

Incluye a11y (`serious`/`critical`) en `/`, `/login`, `/admin/products`,
`/admin/products/new`, flujos FL-01..FL-07 y catálogo M1.

## Notas operativas

- `@stockly/shared` se consume desde `dist`: editar `src` sin
  `pnpm --filter @stockly/shared build` deja al front validando con el esquema viejo
  (fallo silencioso: el formulario no dispara red). Rebuild obligatorio antes del build de web.
- `resolve_drift` devuelve un **nuevo** `drift_id` (el de la resolución).
- El juez de drift anclado a artefacto requiere proveedor OAuth configurado; si no está,
  la publicación queda en compuerta humana (`accept`).

## Riesgos residuales / siguiente loop

- FE-T3: búsqueda, filtros y badges de stock en el panel admin.
- FE-T4: detalle admin, soft-delete con confirmación y breadcrumbs.
- FE-T5: dashboard, 404/error/loading.
- FE-T6: pruebas unitarias de i18n/auth + ampliación E2E/axe.
