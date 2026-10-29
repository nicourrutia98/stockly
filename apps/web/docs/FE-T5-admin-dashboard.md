# FE-T5 — Panel de administración (`/admin`) + estados del sistema

**Sesión:** `sess-1bbda94d371adc2d` · spec derivada de `spec_id=11` (FE-T1..FE-T6)
**Ruta:** `/admin` · **Archivos nuevos:** `app/admin/page.tsx`, `app/admin/loading.tsx`, `app/not-found.tsx`, `app/error.tsx`

## Objetivo

Cerrar el hueco de navegación del área administrativa: hasta FE-T4 el admin solo
tenía la tabla de productos. FE-T5 entrega un panel con indicadores accionables y
los estados de sistema (loading, error, 404) que faltaban para que la app no
quedara en blanco ante fallos.

## Entregado

### 1. Dashboard `/admin`
- 6 KPIs: Productos, Activos, Inactivos, Agotados, Stock bajo, Valor del inventario.
- Lista de stock bajo (producto, SKU, stock) con enlace al detalle.
- Últimos productos creados con enlace al detalle.
- Valor del inventario formateado con `formatCOP`.
- Shell: el ítem "Panel" ahora apunta a `/admin` (el login sigue aterrizando en
  `/admin/products`, que es el flujo del test FL-07/smoke).

### 2. Honestidad de datos capeados
La API pagina con `size` máximo 100. El panel trabaja sobre **los primeros 100
productos ordenados por stock ascendente** y lo declara en cada KPI afectado:
- `admin.dashboard.capped` = "Calculado sobre los primeros 100 productos".
- Presente en **Agotados**, **Stock bajo** y **Valor del inventario**. Sin este
  aviso el número parecería total y sería una mentira de interfaz.

> Corrección intra-loop: en la primera captura "Stock bajo" no llevaba el aviso
> mientras sí lo llevaban las otras dos tarjetas. Se unificó antes de publicar.

### 3. Estados de sistema
- `app/not-found.tsx` — 404 con shell, título, explicación y dos CTAs
  (Volver al panel / Ir al catálogo).
- `app/error.tsx` — error boundary de segmento con `reset()` y `digest` visible
  para soporte.
- `app/admin/loading.tsx` — esqueleto con `Loader` de Mantine durante la
  navegación al panel.

### 4. Hotfix de autoría (pedido del operador, mismo loop)
La página `/about` acreditaba a una sola persona. Se agregó el equipo real:
- Lista "Autores" con los tres nombres y códigos: Juan Nicolas Urrutia Salcedo
  (`u20182173626`), Luisa Maria Jose Coronel Vargas (`u20222208436`),
  Ana Sofía Montaña Cedeño (`u20212200775`).
- Badge de copyright MIT con los tres titulares.
- Pie de `/about` con nombres + códigos.
- `shell.footer.copyright` (es-CO y en) actualizado con paridad de claves.
- `app/layout.tsx`: `authors[]` con tres entradas, `other.author` y
  `other.student-id` con los tres códigos.

> Formato: los códigos se muestran con prefijo `u` para ser consistentes con el
> código ya existente (`u20182173626`). El identificador numérico es el mismo.

## Verificación ejecutada

| Comprobación | Resultado |
|---|---|
| `pnpm exec tsc --noEmit` | OK |
| `pnpm build` | OK (rutas `/admin`, `/_not-found` presentes) |
| Playwright completo (chromium + mobile) | **38 passed** |
| axe-core `wcag2a/wcag2aa`, impactos serious/critical | **0** en `/admin`, detalle, 404 y `/about` |
| `/about` server-rendered | 3 nombres y 3 códigos presentes en HTML |
| Consola del navegador en el recorrido | sin `pageerror` |

Evidencia visual: `apps/web/.fe5-shots/01-landing.png` … `09-about-autores.png`.

## Incidentes del entorno (no del código)

1. **Postgres caído** (`stockly-postgres-5433` en `Exited (0)`) → Liquibase falla
   → Spring no arranca → el frontend recibe `ERR_CONNECTION_REFUSED` en login.
   Los contenedores mueren cuando se interrumpen los grupos de proceso; los
   servicios se relanzan con `setsid`.
2. **CORS 403 por IP de LAN.** `http://192.168.207.51:3000` no estaba en
   `APP_CORS_ALLOWED_ORIGINS`; el backend respondía 403 sin
   `Access-Control-Allow-Origin` y el navegador bloqueaba el login sin que el
   servidor registrara el intento. Se relanzó con la IP incluida; preflight
   `OPTIONS` ahora responde 200.
3. **Resultado verde caducado.** Un `38 passed` anterior a los cambios de FE-T5
   se comunicó como estado vigente. Se revalidó la suite contra el build final;
   ese es el resultado que se reporta aquí.

## Deuda conocida (para FE-T6)

- No hay pruebas unitarias del frontend (i18n, auth store, `formatCOP`,
  `lib/stock.ts`).
- El E2E no cubre `/admin`, 404 ni el detalle; solo el flujo de productos.
- El valor de inventario y los conteos están capeados a 100: si se quiere el
  total real hace falta un endpoint de agregados en el backend.
