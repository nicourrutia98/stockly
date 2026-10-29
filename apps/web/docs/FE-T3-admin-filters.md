# FE-T3 — Búsqueda, filtros y badges de stock en el panel admin

> Vibe-loop FE-T3 (spec paraguas 11: FE-T1..FE-T6).
> Autor: Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial).
> Fecha: 2026-10-21.

## Alcance

1. Barra de filtros en `/admin/products`: búsqueda libre (SKU/nombre), categoría,
   estado (activos/inactivos) y "solo con stock".
2. Búsqueda con debounce de 300 ms; cualquier cambio de filtro reinicia la página a 0.
3. Badges semánticos de stock en la tabla (agotado / bajo / disponible) en lugar del
   número crudo.
4. Etiquetas de la tabla y del panel traducidas a es-CO/en (paridad de diccionario).
5. Estado vacío específico cuando hay filtros activos.

## Archivos

| Capa | Archivo |
|---|---|
| Front | `apps/web/src/components/admin/ProductFilters.tsx` (nuevo) |
| Front | `apps/web/app/admin/products/page.tsx` (estado + query + empty state) |
| Front | `apps/web/src/components/products/ProductsTable.tsx` (badges + i18n) |
| Front | `apps/web/src/lib/products-api.ts` (`inStockOnly` → query string) |
| Front | `apps/web/src/i18n/messages/es-CO.ts`, `en.ts` (bloque `admin.*`) |
| Shared | `packages/shared/src/types/product.ts` (`inStockOnly`) |

## Contrato con el backend

`GET /api/v1/products` ya soportaba los filtros (`ProductSearchCriteria`):

| UI | Query param | Semántica |
|---|---|---|
| Buscar | `search` | LIKE case-insensitive en `name` y `sku` |
| Categoría | `category` | igualdad exacta |
| Estado | `active` | `true` / `false`; ausente = todos |
| Solo con stock | `inStockOnly` | `stock > 0` |

`toQuery()` conserva la paginación y el orden (`updatedAt,desc`).

## Badges de stock

| Stock | Texto | Color | Contraste con blanco |
|---|---|---|---|
| `<= 0` | Agotado | `#B91C1C` | ~6.5:1 |
| `1..3` | Bajo · N | `#B45309` | ~5.0:1 |
| `> 3` | Disponible | `#15803D` | ~5.0:1 |

Se mantiene el badge de estado (`Activo`/`Inactivo`) de FE-T2.

## Accesibilidad

- Controles con `label` real (Mantine `TextInput`/`Select`/`Switch`).
- Icono de búsqueda `aria-hidden`.
- Botón "Limpiar filtros" deshabilitado cuando no hay filtros (evita acción muerta).
- axe (WCAG 2 A/AA) en `/admin/products`: **0 violaciones serious/critical**.

## Verificación

### Navegador (admin real, BD con 65 productos: 20 activos)

| Caso | Resultado |
|---|---|
| Carga inicial | 20 filas (página 1) |
| Buscar `café` | 14 filas, todas coinciden |
| Limpiar filtros | vuelve a 20 filas y campo vacío |
| Estado = Inactivos | 20 filas, todas `Inactivo` |
| Solo con stock | 20 filas, ninguna `Agotado` (solo `Disponible`) |
| Categoría = Despensa | 20 filas, todas `Despensa` |
| Estado = Activos | 20 filas, todas `Activo` |
| Errores de página | 0 |

### Suite completa

```
38 passed (7.5s) — chromium + mobile
```

Incluye FL-04 (soft-delete sigue mostrando `Inactivo`), FL-05/FL-06/FL-07,
catálogo M1 y axe en `/`, `/login`, `/admin/products`, `/admin/products/new`.

## Notas

- `@stockly/shared` se consume desde `dist`: se reconstruyó antes del build de web
  para que `inStockOnly` exista en runtime.
- En Playwright, Mantine duplica el `aria-labelledby` del `Select` (input + listbox):
  para automatizar usar `getByRole('textbox', { name })` o el `option` visible; no es
  un defecto de accesibilidad (axe lo acepta).
- El `Switch` de Mantine renderiza un input oculto: para tests, click sobre el label
  o `evaluate(el => el.click())`.

## Siguiente loop

- FE-T4: detalle admin, soft-delete con confirmación dedicada y breadcrumbs.
- FE-T5: dashboard, 404/error/loading.
- FE-T6: pruebas unitarias de i18n/auth + ampliación E2E/axe.
