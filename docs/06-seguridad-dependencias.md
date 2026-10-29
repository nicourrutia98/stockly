# 06 — Seguridad de dependencias (B-05)

> Cierre de la brecha **B-05** de [04-estado-y-brechas.md](04-estado-y-brechas.md):
> "No hay análisis de vulnerabilidades de dependencias — Muy bajo esfuerzo — la
> herramienta ya está configurada."
>
> Fecha del análisis: 2026-10-22. Herramientas: `pnpm audit` (frontend + shared) y
> `mvn dependency:tree` (backend).

---

## 1. Resultado

| | Antes | Después |
|---|---|---|
| Total | 25 | **1** |
| Críticas | 5 | **0** |
| Altas | 8 | **1** |
| Moderadas | 11 | 0 |
| Bajas | 1 | 0 |

El único aviso restante está en §4.

---

## 2. Qué encontró el análisis

### 2.1 Crítica alcanzable en producción

**Next.js 15.5.27 — RCE sin autenticar en Image Optimization**
(`GHSA`, parche en `>=15.5.28`).

El proyecto corría en 15.5.27, por debajo del parche. El proyecto **no usa
`next/image`** en ninguna ruta — `grep -rn "next/image" app/ src/` no devuelve
nada —, así que la ruta vulnerable no es alcanzable hoy. Se corrigió igualmente:
un parche de seguridad a una minor no debería depender de que nadie use la
superficie afectada.

### 2.2 Críticas en tooling de pruebas

Cuatro avisos críticos venían de `vitest 2.1.9`:

| Paquete | Aviso | Parche |
|---|---|---|
| `vitest` | RCE vía servidor UI (`vitest --ui`) | `>=3.2.6` |
| `tinypool` ×2 | Prototype pollution → RCE en opciones de worker | `>=2.1.2` |
| `happy-dom` | Escape de contexto VM → RCE | `>=20.0.0` |

Ninguno llega al bundle de producción: son `devDependencies`. Pero `tinypool` y
`happy-dom` se ejecutan en la máquina del desarrollador cada vez que se corre la
suite, que es exactamente el escenario del aviso.

### 2.3 Dependencias declaradas y nunca usadas

El hallazgo más cómodo de arreglar, y el que más síntomas dio:

- **`happy-dom`** estaba en `devDependencies`, pero `apps/web/vitest.config.ts`
  configura `environment: 'node'`. Nadie lo usa. Peor: vitest lo declara como
  *peer opcional*, así que quitarlo del `package.json` no lo sacaba del árbol —
  había que desactivar la instalación automática de peers.
- **`@vitejs/plugin-react`** estaba declarado y **no se referenciaba en ningún
  archivo**. Arrastraba `vite@5.4.21`, que a su vez traía avisos altos.

---

## 3. Cambios aplicados

Todos en el frontend. **El backend no se modificó** (ver §5).

| Archivo | Cambio | Efecto |
|---|---|---|
| `apps/web/package.json` | `next` `^15.0.0` → `^15.5.28` | Cierra el RCE de Image Optimization |
| `apps/web/package.json` | `vitest` `^2.1.4` → `^4.1.12` | Cierra las 4 críticas de tooling |
| `apps/web/package.json` | `vite` `^7.1.0` (explícito) | Peer obligatorio de vitest 4; cierra avisos altos de vite 5.4.21 |
| `apps/web/package.json` | **Eliminado** `happy-dom` | Dependencia muerta |
| `apps/web/package.json` | **Eliminado** `@vitejs/plugin-react` | Dependencia muerta |
| `apps/web/package.json` | **Añadido** `@testing-library/dom` | Peer que faltaba y que solo funcionaba por instalación automática (§3.1) |
| `package.json` (raíz) | `pnpm.overrides: { postcss: ^8.5.23 }` | Cierra 2 avisos altos transitivos |
| `.npmrc` | `auto-install-peers=false` | Saca `happy-dom` del árbol |

### 3.1 El peer que faltaba

`auto-install-peers=false` no es un detalle cosmético: al activarlo apareció un
`missing peer @testing-library/dom` que llevaba tiempo oculto. `@testing-library/react`
y `@testing-library/jest-dom` lo requieren y nunca estuvo declarado — se resolvía
por instalación automática de peers. Ahora está declarado explícitamente.

El criterio que se aplicó: **declarar en `package.json` todo lo que se usa, y
desactivar la instalación automática.** Si una dependencia no se usa, que no esté.

### 3.2 El salto de vitest 2 → 4 no fue directo

El primer intento falló con `ERR_PACKAGE_PATH_NOT_EXPORTED`: vitest 4 exige
`vite ^6 || ^7 || ^8` y el árbol traía un `vite@5.4.21` residual. Declarar `vite`
explícitamente lo resolvió. Queda registrado porque el error no dice "actualiza
vite", dice `PACKAGE_PATH_NOT_EXPORTED`, que no señala la causa.

---

## 4. Lo que queda

**`zod@3.25.76` — agotamiento de memoria al validar arrays sin cota (alto, CVE-2023-54404).**

- Ruta: `apps/web → zod@3.25.76` y `packages/shared → zod@3.25.76`
- `affected_versions: <4.6.6` — el parche está en la rama 4.x; no hay versión 3.x
  corregida. Lo detecto `pnpm audit` en la primera corrida real del CI.
- Qué es: `$ZodArray` acumula un issue de validación por cada elemento que
  falla, sin tope ni terminación temprana. Un array muy grande agota la memoria
  del proceso que valida (CWE-770, CVSS 4.0: 8.2).

**Por qué no se sube a zod 4 ahora.** La migración es de versión mayor y toca
dos superficies que no se tocan a la ligera: los contratos compartidos
(`@stockly/shared` exporta los esquemas que consume el frontend) y el resolver
de React Hook Form (`@hookform/resolvers` v3 solo habla el API de zod v3).
Además, el riesgo residual que se acepta es **de cliente**: zod no corre en el
backend —ese es Java—, así que el array que se valida tiene que llegar de la
propia API o de la propia consola de quien lo envía. El peor caso es agotar la
memoria de la pestaña del atacante, no la del servidor.

**Mitigación aplicada.** Los cuatro esquemas con array del paquete compartido
quedaron acotados, que es justamente lo que el advisory señala como requisito
para no ser vulnerable:

| Esquema | Cota |
|---|---|
| `zCursorPage.items` | 100 (igual que `max-page-size` del backend) |
| `zProductPage.content` | 100 |
| `zBatchResult.errors` | 100 |
| `zProblemDetail.fieldErrors[]` | 20 mensajes por campo |

**Excepción de la compuerta.** `pnpm.auditConfig.ignoreGhsas` en el
`package.json` raíz ignora **solo** `GHSA-mrhx-c7xc-m3w5`. El gate sigue
fallando (`--audit-level=high`) ante cualquier otro advisory de nivel alto o
crítico. El aviso **continúa apareciendo** en la salida de `pnpm audit`: la
excepción es explícita y documentada, no silenciosa.

**Revisar** al migrar a zod 4, o el día que zod 3 deje de usarse.

---

**`braces@3.0.3` — agotamiento de pila por cadenas anidadas (alto, sin parche).**

- Ruta: `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`
- `patched_versions: <0.0.0` — **el aviso no tiene versión corregida publicada.**
- No es alcanzable en runtime: es una dependencia de ESLint, que no recibe
  entrada no confiable durante el arranque de la aplicación. El ataque documentado
  es sobre el *matching* de globs con entradas profundamente anidadas.

Se acepta el riesgo. No hay acción disponible salvo esperar a que `micromatch` o
`fast-glob` publiquen una versión corregida.

---

## 5. Lo que NO se hizo, y por qué

### 5.1 El backend no tiene análisis de vulnerabilidades

`mvn dependency:tree` se ejecutó y da el inventario (156 líneas), pero el proyecto
**no tiene OWASP `dependency-check` ni ningún escáner** configurado. Añadirlo implica
descargar la base de datos NVD (~300 MB), que es exactamente lo que bloqueó este
proyecto antes por el desfase del reloj del sistema (`RK-09`).

**Riesgo real y no medido:** Spring Boot **3.4.1** y Spring Framework **6.2.1**
son de diciembre de 2024 — 22 meses de antigüedad a la fecha de este análisis.
También Jackson 2.18.2, Tomcat 10.1.34 y jjwt 0.12.6. Es una pila madura y
razonablemente mantenida, pero sin escáner **no hay forma de afirmar que no tenga
avisos**. Decir "sin vulnerabilidades conocidas" sin haber ejecutado un escáner
sería afirmar algo que nadie verificó.

### 5.2 Sin CI

El análisis se ejecutó **a mano**. Nada lo ejecuta automáticamente, así que la
brecha no está cerrada en el sentido que importa: mañana las dependencias
vuelven a envejecer sin que nadie lo note. Eso es **B-01**, y es el siguiente paso.

---

## 6. Cómo repetirlo

```bash
# Frontend y paquete compartido
pnpm audit

# Inventario del backend (no escaneo; ver §5.1)
cd apps/backend && mvn dependency:tree -DoutputFile=/tmp/deps.txt
```