# F1 — Inventario de flujos de usuario · Stockly (spec_id=13)

Fecha: 2026-10-15 · App viva verificada (`:3000` + `:8080` + pg5433 + redis).
Admin seed: `admin@stockly.co` / `Admin1234` (ROLE_ADMIN).

## FL-01 Landing `/` (pública, SSR)
- Marcadores observables: `Stockly`, `Inventario`, link `/about`.
- Éxito: 200 + `lang="es-CO"`.

## FL-02 About `/about` (pública, SSR)
- Autoría + licencia MIT visibles.
- Éxito: 200.

## FL-03 Login `/login` (pública, SSR parcial)
- Marcadores SSR: `Iniciar sesión`, `Email`, `Contraseña`, `Entrar`.
- Éxito: credenciales válidas → toast `Bienvenido` + redirect `/admin/products`, token en memoria (nunca localStorage).
- Error: credenciales malas → toast rojo con `ApiError.userMessage`, sin redirect.
- Validación: email formato + password requerido (Zod inline).

## FL-04 Lista `/admin/products` (protegida, CSR)
- Guardia: anónimo → `/login`; booting → `Loader`.
- Tabla: SKU (mono), Nombre, Categoría, Precio `$%.2f`, Stock, Estado (badge), Acciones (editar/eliminar).
- Paginación server (`page/size`, default 20, sort `updatedAt,desc`).
- Eliminar: `confirm()` → 204 → toast `Eliminado` + refetch.
- `Salir`: logout 204 + `location.replace('/login')`.

## FL-05 Crear `/admin/products/new` (protegida)
- Form RHF+Zod: SKU `^[A-Z0-9-]{3,32}`, nombre 1–200, precio >0 2dec, stock int ≥0, categoría 1–64, active switch.
- Éxito: 201 → toast `Creado` → redirect lista. Error: toast rojo, permanece en form.

## FL-06 Editar `/admin/products/[id]/edit` (protegida)
- Precarga por `useProduct(id)`; PATCH parcial (solo cambiados; `description:null` = limpiar, RFC 7396).
- Éxito: toast `Guardado` → redirect lista. Id inexistente → error API visible.

## FL-07 Auth transversal (todos los protegidos)
- `bootstrapAuth` al montar (silent `/refresh` por cookie HttpOnly).
- 401 en vuelo → 1 reintento tras refresh (coalescado `inFlightRefresh`); si falla → sesión anónima.
- Rotación single-use verificada E2E (replay 401); logout requiere Bearer → 204 + clear cookie.

## GAPS (no implementado — fuera de F3 hasta decidir)
- **G-1 i18n:** `src/i18n/` vacío; `lang="es-CO"` fijo, textos hardcodeados en español. EN no existe.
- **G-2 búsqueda/filtro UI:** API soporta `q/category/active` pero la lista no tiene inputs.
- **G-3 formato moneda:** `src/lib/format/` vacío; precio siempre `$%.2f` sin COP/USD por locale.
- **G-4 responsive:** sin verificación (viewport móvil pendiente en F3 con proyectos Playwright).
- **G-5 página 404 dedicada:** solo `_not-found` por defecto.

## Criterios observables (puerta a F3/F4)
- Cada FL tiene: URL, precondición auth, marcadores rol (getByRole/getByLabel), caso éxito + caso error con toast.
- SEQ se ancla al final de FL-03…FL-06; SUS al cierre de sesión completa; TLX en FL-05/FL-06.
