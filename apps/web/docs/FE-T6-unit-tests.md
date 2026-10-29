# FE-T6 — Suite unitaria de frontend + configuración de Vitest

**Sesión:** `sess-5288f8bd3d57c685` · spec derivada de `spec_id=11` (plan FE-T1..FE-T6)
**Archivos nuevos:** `vitest.config.ts`, `src/lib/stock.test.ts`, `src/lib/catalog-api.test.ts`, `src/i18n/messages/parity.test.ts`
**Alcance:** pruebas, tooling de pruebas y documentación de despliegue. Sin cambios en el comportamiento de la aplicación.

## Objetivo

FE-T1..FE-T5 dejaron el frontend cubierto **solo** por E2E de Playwright. Eso
detecta regresiones de interfaz pero no de lógica pura: un umbral de stock mal
escrito o una clave i18n borrada se descubrían en pantalla, no en el pipeline.
FE-T6 cierra el hueco y, de paso, corrige un defecto de tooling que llevaba el
script `pnpm test` roto desde el inicio del proyecto.

## Defecto encontrado y corregido: `pnpm test` estaba roto

`vitest run` sin configuración recolectaba **los 7 archivos de `tests/`** (los
specs de Playwright) junto a los unitarios:

```
Test Files  6 failed | 1 passed (7)
```

Los specs de Playwright importan `@playwright/test`, no `vitest`; fallaban por
`expect is not defined`. Es decir: el comando que la documentación da como
"pruebas unitarias" nunca pasó, y el defecto era invisible porque nadie lo
ejecutaba.

**Corrección:** `vitest.config.ts` acota `include` a `src/**/*.{test,spec}.{ts,tsx}`
y excluye `tests/**`. No se tocó ningún spec: el defecto estaba en el alcance de
recolección, no en las pruebas.

## Entregado

### 1. `src/lib/stock.test.ts` — umbrales de inventario
El mapeo de tono decide el color y la etiqueta traducida del badge en tabla y
detalle. Los casos fijan los bordes exactos (`0` agotado, `1..3` bajo, `>3`
disponible) porque un `>` por `>=` cambia el último producto con 3 unidades. El
cuarto caso **calcula la luminancia WCAG** de los tres colores y exige ≥ 4.5:1
contra texto blanco: si alguien cambia un color, la prueba falla en lugar de
producir un badge ilegible.

### 2. `src/lib/catalog-api.test.ts` — `formatCOP`
El catálogo es la única superficie sin sesión, así que es la que se renderiza en
SSR antes de cualquier login. Se cubre separador de miles `es-CO` (`1.299.900`),
cero, negativos (ajustes de stock), ausencia de centavos y estabilidad entre
llamadas.

### 3. `src/i18n/messages/parity.test.ts` — diccionarios
`en` ya está tipado `Record<MessageKey, string>`, así que una clave faltante es
error de compilación. Lo que el tipo no ve sí se prueba: valores vacíos o con
solo espacios, paridad efectiva de claves en ejecución, y **la regresión de
autoría** que exigen el test E2E FL-02 y el footer (los tres autores + MIT en
ambos locales). Ese último caso es el que hubiera detectado que un cambio de
copy borra a un autor del footer sin quejarse.

## Ajuste de expectativa (no de código)

Un test falló en la primera ejecución:

```
AssertionError: expected '1299901' to be '1299900'
```

La expectativa escrita era incorrecta: `Intl.NumberFormat` con
`maximumFractionDigits: 0` **redondea** (half-expand), no trunca, así que
`1.299.900,99` se muestra como `1.299.901`. Se corrigió la **prueba** para
documentar la semántica real y se añadió `not.toContain(',')` como prueba
explícita de que no aparecen centavos. No se modificó `formatCOP`.

## Verificación ejecutada

| Comprobación | Comando | Resultado |
|---|---|---|
| Unitarias | `pnpm exec vitest run` | **22 passed** (4 archivos, 322 ms) |
| Tipos | `pnpm exec tsc --noEmit` | sin errores |
| E2E + a11y | `pnpm exec playwright test` | **46 passed** (41.4 s) |
| Build de producción | `pnpm build` | 12/12 rutas generadas |
| Imagen backend | `docker build -t stockly-backend:verify apps/backend` | 520 MB, `USER=stockly` (uid 999), `HEALTHCHECK` activo, JRE 17.0.20.1 |
| Imagen **en ejecución** | contenedor contra la base local | arrancó en perfil `prod` (9.2 s) → **defecto encontrado**, ver abajo |

## Defecto de producción encontrado al ejecutar la imagen

La imagen compilaba, arrancaba y servía tráfico, pero
`GET /actuator/health` devolvía **404**:

```
{"message":"No static resource or handler found.","status":404}
```

Causa raíz: **`spring-boot-starter-actuator` no estaba en `pom.xml`.** Sin esa
dependencia la sección `management.*` de `application.yml` y las rutas
`/actuator/*` de `SecurityConfig.PUBLIC_PATHS` eran configuración muerta: el
404 no venía de la seguridad, venía de que no había endpoint. Consecuencia en
producción: el `HEALTHCHECK` del `Dockerfile` fallaría siempre y
Railway/Render marcarían el servicio como *unhealthy*, sin enrutar tráfico.

Corrección: dependencia añadida (versión gestionada por
`spring-boot-starter-parent`). Verificado después del cambio:

```
GET /actuator/health -> 200  {"status":"UP","groups":["liveness","readiness"]}
```

Este defecto no lo encuentra ni `mvn package`, ni `docker build`, ni la suite
de pruebas: solo falla cuando el proveedor de hosting consulta la salud real
del contenedor. Es el argumento de por qué §7 de
`docs/06-despliegue-produccion.md` exige verificar **en ejecución**.

## Nota operativa (defecto-costoso encontrado)

Ejecutar `next build` mientras `next start` sirve el **mismo** directorio
`.next` corrompe el artefacto:

```
[Error: Invariant: no direct app page entry found for /_not-found]
```

El síntoma aparece como error de código (`app/not-found.tsx` sí existe) porque
el manifiesto queda a medias (`BUILD_ID` vacío, sin entrada `/_not-found` en
`app-paths-manifest.json`). Procedimiento correcto: detener el servidor, `rm -rf
.next`, construir, volver a levantar.

La imagen de producción tampoco debe validarse solo con `docker build`: una
imagen puede compilar y no arrancar. `docs/06-despliegue-produccion.md` §7 define
la verificación en ejecución contra la base de datos real.