# FE-T4 — Detalle admin, breadcrumbs y soft-delete reversible

> Vibe-loop FE-T4 (spec paraguas 11: FE-T1..FE-T6).
> Autor: Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial).
> Fecha: 2026-10-21.

## Alcance

1. Página de detalle `/admin/products/[id]`: nombre, SKU, categoría, precio en COP,
   stock, fechas de creación/actualización y descripción.
2. Breadcrumbs consistentes (`Inicio › Productos › hoja`) en lista, create, edit y detalle.
3. Soft-delete reversible: `PATCH { "active": true }` reactiva una fila inactiva,
   disponible tanto en la tabla como en el detalle.
4. Navegación: el nombre de la fila enlaza al detalle; acción "Ver detalle".
5. Endurecimiento de sesión descubierto durante la verificación (ver §"Carrera de refresh").

## Archivos

| Capa | Archivo |
|---|---|
| Front | `apps/web/app/admin/products/[id]/page.tsx` (nuevo detalle) |
| Front | `apps/web/src/components/admin/AdminBreadcrumbs.tsx` (nuevo) |
| Front | `apps/web/src/lib/stock.ts` (tonos de stock compartidos) |
| Front | `apps/web/src/components/products/ProductsTable.tsx` (link, Ver, Reactivar, i18n) |
| Front | `apps/web/src/hooks/useProducts.ts` (`useSetProductActive`) |
| Front | `apps/web/app/admin/products/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx` |
| Front | `apps/web/src/i18n/messages/{es-CO,en}.ts` (`admin.status.*`, `admin.detail.*`, `admin.reactivate`) |
| Front | `apps/web/src/lib/api/client.ts` + `auth-api.ts` (refresh único y reintento transitorio) |
| Back | `product/api/dto/UpdateProductRequest.java` (`active`) |
| Back | `auth/service/AuthService.java` + `auth/security/TokenStoreService.java` (ventana de gracia 20 s) |
| Shared | `packages/shared/src/types/product.ts` (`zUpdateProduct.active` ya existía) |

## Contrato de reactivación

`PATCH /api/v1/products/{id}` con `{ "active": true }` → `200` con el producto ya activo.
El DTO de actualización no incluía `active` (Jackson rechazaba el body con `400
"Invalid request content."`); se añadió el campo y MapStruct lo mapea por nombre.

## Carrera de refresh (hallazgo y dos correcciones)

La suite E2E era intermitente (~1 de cada 40) aterrizando en `/login` tras un reload.
Diagnóstico con logs del backend: `Refresh token has been revoked`.

1. **Hooks antes del guard.** Las páginas admin llamaban `useProducts`/`useProduct` en el
   cuerpo del componente, es decir antes de que `ProtectedRoute` confirmara la sesión. En
   un reload se disparaba un GET sin token → 401 → refresh paralelo al bootstrap → dos
   rotaciones con la misma cookie → reuso → sesión revocada.
   - Corrección: cada página es ahora un wrapper (`ProtectedRoute` + `AppShell`) y un
     componente interno que contiene los hooks.
2. **Dos implementaciones de refresh.** `client.ts` tenía su propio
   `performSilentRefresh` (fetch crudo) separado de `bootstrapAuth()`. Ahora hay un único
   `refreshSession()` deduplicado; `apiFetch` lo comparte en el retry 401 y nunca intenta
   refrescar las rutas `/auth/*`.
3. **Respuesta perdida en un reload.** Si el servidor rota y el navegador descarta el
   `Set-Cookie` porque la navegación se abortó, la cookie queda blacklisted. El backend
   marca el JTI rotado con TTL de 20 s; un replay dentro de esa ventana reemite el par en
   lugar de forzar re-login (fuera de la ventana sigue rechazándose).

Resultado: `110 passed` con `--repeat-each=3` y la ventana de gracia activándose 1 vez
(evidencia de la carrera real, ahora recuperada).

## Accesibilidad

- `Breadcrumbs` con `aria-label` y `aria-current="page"` en la hoja.
- Badges de estado en singular (`Activo`/`Inactivo`) y de stock con contraste AA.
- axe (WCAG 2 A/AA): **0 serious/critical** en detalle activo, detalle inactivo, detalle
  reactivado y lista.

## Verificación

### Navegador

| Caso | Resultado |
|---|---|
| Lista → breadcrumb | `Inicio › Productos` |
| Clic en nombre → detalle | `h1` = nombre del producto |
| Campos | SKU, Categoría, Precio COP (`$ 10.000`), Stock, Creado, Actualizado |
| Fechas | `21/10/2026, 11:28 a. m.` |
| Detalle inactivo | badge `Inactivo` + botón `Reactivar` |
| Reactivar desde detalle | `PATCH 200`, toast `Reactivado`, badge pasa a `Activo` |
| Editar desde detalle | `/admin/products/{id}/edit` con breadcrumb y `h1` |
| Errores de página | 0 |

### API

```
PATCH /products/182 {"active": true}  -> 200 (active=true)
PATCH /products/182 {"active": false} -> 200 (active=false)
```

### Suite

```
38 passed (8.0s)          # corrida normal
110 passed (25.7s)        # --repeat-each=3 (chromium + mobile)
```

## Notas / riesgos residuales

- El detalle usa `GET /products/{id}` (público) pero la página exige `ROLE_ADMIN`.
- La ventana de gracia de 20 s es una mitigación de robustez; no sustituye la detección
  de reuso fuera de ventana.
- Siguiente: FE-T5 (dashboard, 404/error/loading) y FE-T6 (unit tests + ampliación E2E/axe).
