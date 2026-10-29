# 04 — Estado y brechas

> Qué se construyó realmente, cuánto de lo especificado está entregado, qué falta
> y qué riesgos siguen abiertos. Este documento contrasta la especificación con
> el código.

---

## 1. Cómo se establece el estado

El estado no se declara, se comprueba. Para cada elemento se siguió este
procedimiento:

1. **Existe el código.** El archivo, la ruta o el endpoint está en el repositorio.
2. **Compila.** Sin errores de tipado, y el paquete compartido se recompiló antes
   de compilar web (dependencia conocida, ver [02 §2.3](02-arquitectura.md)).
3. **Funciona contra la aplicación levantada.** La comprobación se hizo con
   PostgreSQL, Redis, backend y frontend en ejecución.
4. **Se registró el resultado.** Cada incremento tiene su nota de entrega en
   `apps/web/docs/` y su registro en el almacén de memoria del proyecto.

Lo que **no** se hizo, y por tanto no cuenta como verificado: inspección de código
sin ejecutar, y pruebas que se escribieron pero no se llegaron a correr.

## 2. Estado por frente

### 2.1 Backend — núcleo de catálogo

| Área | Estado | Evidencia |
|---|---|---|
| Entidad `Product` con validación, auditoría y versión | **Completo** | 314 líneas, 10/10 criterios de contrato |
| DTOs de entrada, salida y página | **Completo** | 4 registros Java, validación declarativa |
| Mapeo entidad ↔ DTO | **Completo** | MapStruct, 3 métodos, código generado |
| Repositorio con consultas por especificación | **Completo** | 5 fábricas de filtros (búsqueda, categoría, estado, rango de precio, existencias) |
| Esquema de base de datos | **Completo** | 6 migraciones Liquibase aplicadas |
| Servicio de negocio con borrado lógico | **Completo** | CRUD + búsqueda + 5 excepciones de dominio |
| Manejador global de errores | **Completo** | 8 manejadores, todos en RFC 7807 |
| Controlador REST con paginación y filtros | **Completo** | 5 operaciones bajo `/api/v1/products` |
| Documentación de la API | **Completo** | OpenAPI + interfaz de documentación |
| Localización de mensajes | **Completo** | Mensajes en dos idiomas, ambos con el mismo número de claves |
| Registro estructurado | **Completo** | Formato JSON en producción |

**Operación de la API verificada en ejecución:**

| Operación | Respuesta observada |
|---|---|
| Registrar usuario | `201`; duplicado `409`; contraseña débil `400` |
| Iniciar sesión | `200` + cookie; credenciales inválidas `401` |
| Consultar sesión actual | `200` con el usuario |
| Renovar sesión | `200` con par nuevo |
| Reutilizar un token revocado | `401` — confirms de un solo uso |
| Cerrar sesión | `204`; renovar después → `401` |
| Listar productos | `200` paginado |
| Crear producto | `201` como administrador; `403` como usuario común; `401` anónimo |
| Consultar producto | `200` / `404` |
| Editar producto | `200`; SKU repetido `409` |
| Dar de baja producto | `204` |

### 2.2 Frontend

| Área | Estado | Evidencia |
|---|---|---|
| Tema único y tipografía propia | **Completo** | Un solo tema; 10 matices por color; fuentes alojadas |
| Capas de idioma es-CO / en | **Completo** | Cambio persistido, atributo `lang` del documento actualizado |
| Marco de navegación, encabezado, pie | **Completo** | Enlace de salto, navegación con estado actual, acción de sesión según estado |
| Catálogo público | **Completo** | Listado y detalle con precio y disponibilidad |
| Solicitud de cotización | **Parcial** | Página y estado existen; falta el envío al servidor |
| Página de autoría y licencia | **Completo** | Visible y enlazada desde el pie de cada página |
| Inicio y registro de sesión | **Completo** | Validación en cliente, mensajes de error unificados |
| Restablecimiento global de sesión | **Completo** | Una sola renovación simultánea |
| Guardas de rol | **Completo** | Anónimo redirigido; rol insuficiente con aviso dentro del marco |
| Panel: listado con filtros | **Completo** | Búsqueda con retardo, filtros de categoría, estado y existencias; reinicio de página |
| Panel: alta y edición | **Completo** | Formulario con los mismos esquemas del servidor |
| Panel: detalle y baja | **Completo** | Confirmación con el nombre del producto; reversión de la baja |
| Estados de carga y vacío | **Completo** | Esqueletos y vacíos con diseño propio |
| Panel de indicadores del admin | **Completo** | 6 KPIs, lista de stock bajo y actualizados recientemente; declara el recorte de 100 registros |
| Estados del sistema | **Completo** | `loading.tsx`, `error.tsx` y `not-found.tsx`; sin pantalla en blanco ante fallo |
| Accesibilidad | **Completo** | 0 violaciones graves; navegación por teclado |

### 2.3 Infraestructura y herramientas

| Elemento | Estado |
|---|---|
| Entorno de desarrollo con un comando | Completo |
| Orquestación de tareas entre paquetes | Completo |
| Contratos compartidos | Completo |
| Pruebas de extremo a extremo | **Completo — 46 en verde**, escritorio y móvil |
| Suite de pruebas unitarias de frontend | **Parcial** — 22 pruebas en 4 archivos (`pnpm vitest run` en verde). Cubre `src/lib` y el paralelismo de i18n; **faltan componentes, hooks y estados** |
| Pruebas de backend | **Ausentes** |
| Configuración de integración continua | **Ausente** |
| Bitácora de cambios | **Ausente** |
| Registros de decisión arquitectónica como archivos | **Ausentes** (el contenido está en [02 §7](02-arquitectura.md)) |

## 3. Estado de las 15 tareas de la especificación

| Tarea | Contenido | Estado |
|---|---|---|
| `T1` | Estructura del monorepo, configuración, infraestructura local, documentación inicial | Completada |
| `T2` | Entidad, DTOs y mapeo del catálogo | Completada |
| `T3` | Repositorio y migraciones de base de datos | Completada |
| `T4` | Servicio de negocio y manejador global de errores | Completada |
| `T5` | Controlador REST y documentación de la API | Completada |
| `T6` | Seguridad: autenticación, rotación de refresco, revocación | Completada |
| `T7` | Localización de mensajes del servidor | Completada |
| `T8` | Arranque del frontend, marco de navegación | Completada |
| `T9` | Pantallas de catálogo, formularios, estado de sesión | Completada |
| `T10` | Idiomas del frontend y formato de moneda | Completada |
| `T11` | Pruebas de backend (unidad, integración, contrato) + compuertas de cobertura y mutación | **No iniciada** |
| `T12` | Pruebas de frontend: unitarias, integración y escenarios ejecutables | **Parcial** — la parte E2E existe; faltan unitarias, de integración y los escenarios escritos |
| `T13` | Seguridad y carga: análisis de dependencias, escaneo dinámico, límite de tasa, manipulación de token | **No iniciada** (parte de la manipulación de token verificada a mano) |
| `T14` | Documentación: API, código, archivos de decisión, bitácora de cambios | **Parcial** — API y código documentados; faltan decisiones y bitácora |
| `T15` | Cierre de brechas: matriz de trazabilidad, análisis de huecos, criterios ejecutables, priorización por riesgo, informe final | **No iniciada** |

**Balance:** 10 tareas completas, 2 parciales, 3 sin iniciar.

## 4. Brechas abiertas

Ordenadas por relación entre esfuerzo y valor. "Valor" estima cuánto improves la
calidad del proyecto como pieza de ingeniería, no el producto.

| # | Brecha | Requisitos afectados | Esfuerzo | Valor |
|---|---|---|---|---|
| **B-01** | No hay integración continua. Nada de lo anterior se ejecuta automáticamente. **Bloqueada 2026-10-22:** el proyecto no está en un repositorio git (no existe `.git`). Se escribió `.github/workflows/ci.yml`, pero **nunca se ha ejecutado** — sigue siendo un borrador hasta que exista repositorio y remota, y haya una primera corrida real. | `RNF-29` | Bajo | **Muy alto** — sin esto, las demás compuertas son configuración muerta. |
| **B-02** | No hay pruebas de backend. La lógica de negocio está verificada a mano y no es reproducible. | `RNF-11`, `RNF-12`, `RF-01`–`RF-05`, `RF-13`–`RF-15` | Alto | **Muy alto** — es la brecha central del proyecto. |
| **B-03** | No existe la matriz de trazabilidad requisito ↔ prueba. | `RNF-13`, `OG-07` | Medio | Alto — sin ella, `T15` no se puede cerrar. |
| **B-04** | Los criterios de aceptación no están escritos como escenarios ejecutables. | `RNF-14`, `T15` | Medio | Alto — convierte la especificación en algo verificable. |
| **B-05** | ~~No hay análisis de vulnerabilidades de dependencias.~~ **CERRADA 2026-10-22** — 25 → 1 avisos, 5 críticas → 0. Ver [06-seguridad-dependencias.md](06-seguridad-dependencias.md). Queda `braces` sin parche, aceptado por escrito. Pendiente: el análisis se ejecutó a mano, así que depende de B-01 para que se repita solo. | `RNF-06` | Muy bajo | Medio — la herramienta ya está configurada. |
| **B-06** | No hay escaneo dinámico de seguridad ni límite de tasa en el acceso. | `RNF-07`, `RNF-08` | Medio | Medio |
| **B-07** | No hay prueba de carga. Los umbrales de rendimiento son afirmaciones. | `RNF-18`, `RNF-19` | Medio | Medio |
| **B-08** | La usabilidad no se ha medido. El protocolo existe, la medición no. | `RNF-23`, `OG-06` | Bajo | Medio — una sesión de 40 minutos con un participante real cierra la meta. |
| **B-09** | ~~La suite de pruebas unitarias de frontend está ausente.~~ **Corregida 2026-10-22:** no estaba ausente, sino **documentada como tal por error** — existen 22 pruebas en 4 archivos, todas en verde. La brecha real es menor: no cubre componentes React, hooks ni estados, solo `src/lib` y el paralelismo de i18n. | `T12` | Medio | Medio |
| **B-10** | No hay bitácora de cambios. | `RNF-30` | Muy bajo | Bajo |
| **B-11** | No hay archivos de decisión arquitectónica. | `T14` | Bajo | Bajo — el contenido ya está escrito en [02 §7](02-arquitectura.md), solo falta separarlo. |
| **B-12** | No hay integración continua que ejecute la auditoría de accesibilidad. Hoy la ejecuta la suite E2E, que a su vez solo corre a mano. | `RNF-21` | Bajo | Medio |
| **B-13** | El envío de la solicitud de cotización no existe. | `RF-11` | Medio | Medio — depende de decidir si se persiste o se envía por correo. |
| **B-14** | Cobertura de línea del frontend sin umbral configurado. | `RNF-11` (parcial) | Muy bajo | Bajo |
| **B-15** | La moneda no cambia con el idioma: el formateador siempre fija COP/es-CO, así que la mitad de `RF-20` (USD en inglés) no está implementada. Corregido el defecto grave que había (la tabla del admin pintaba importes en formato US), pero la conmutación de moneda sigue pendiente. | `RF-20` | Bajo | Medio — es una línea de código, pero exige decidir la regla de conversión. |

### 4.2 Defectos encontrados y corregidos durante la revisión del 22 de octubre

Estos no son brechas de alcance: son defectos reales que aparecieron al preparar la
documentación y revisar la aplicación en ejecución. Se registran porque un
defecto que se encuentra solo al leer el código es un defecto que se va a volver
a encontrar.

| # | Defecto | Causa | Alcance real | Estado |
|---|---|---|---|---|
| **D-01** | El catálogo público mostraba productos dados de baja a partir de la segunda página, y el contador announcing un total que incluía los inactivos. | `listCatalog` nunca enviaba `active=true`; la primera página se veía bien solo por el orden de inserción. | Alto: contradice `RN-10` y muestra al comprador productos que el comercio ya retiró. | **Corregido** — `sp.set('active','true')` en `src/lib/catalog-api.ts` |
| **D-02** | La tabla de productos del panel pintaba los importes como `$8900.00` mientras el catálogo público pintaba `$ 8.900`. | `ProductsTable.tsx` tenía su propio formateador hardcodeado en lugar de usar el canónico. | Medio: dos importes distintos para el mismo dato según la pantalla. | **Corregido** — formateador único en `src/lib/format-money.ts` |
| **D-03** | El catálogo público anunciaba un conteo de productos que no correspondía con los mostrados. | Mismo origen que `D-01`. | Medio: credibilidad del dato ante el comprador. | **Corregido** con `D-01` |

> Los tres comparten una causa de fondo: **lógica duplicada en dos sitios en
> lugar de una fuente compartida**. Es exactamente el riesgo que describe
> `RK-04` para el paquete de contratos, ocurrido con el formateador monetario.
> La lección operativa es la misma: la próxima vez, extraer antes de usar.

### 4.1 Secuencia sugerida

El orden no es caprichoso: cada paso hace posible el siguiente.

```
B-01  Integración continua
        │  (sin ella, nada más se ejecuta solo)
        ├─► B-02  Pruebas de backend  ──► B-12 (accesibilidad en la tubería)
        │        │
        │        └─► B-03  Matriz de trazabilidad ──► B-04  Escenarios ejecutables
        │
        ├─► B-05  Análisis de dependencias  (una orden)
        │
        ├─► B-06  Escaneo dinámico + límite de tasa
        │
        ├─► B-07  Prueba de carga
        │
        ├─► B-08  Medición de usabilidad  (independiente del resto: necesita una persona)
        │
        └─► B-10, B-11  Bitácora y decisiones  (cierre documental)
```

`B-08` puede ejecutarse en paralelo porque su insumo es un participante humano,
no una herramienta.

## 5. Riesgos

| # | Riesgo | Probabilidad | Impacto | Mitigación actual | Plan |
|---|---|---|---|---|---|
| **RK-01** | Entregar sin pruebas de backend deja la lógica de negocio sin red de seguridad ante cualquier refactor. | Alta | Alto | Ninguna automática | `B-02` |
| **RK-02** | Regresión de accesibilidad o de seguridad entra sin que nadie lo note. | Media | Alto | Auditoría manual periódica | `B-01` |
| **RK-03** | Diferencia silenciosa entre documentación y código. | Media | Medio | Gobierno de desviaciones en el proceso | `B-03` |
| **RK-04** | El formato del paquete compartido hace que el frontend valide contra un esquema viejo y el fallo sea silencioso. | Media | Medio | Conocido y documentado | Recompilación obligatoria antes de compilar web; ordenarlo en la tubería |
| **RK-05** | Una dependencia con vulnerabilidad alta se incorpora sin detección. | Media | Medio | Ninguna | `B-05` |
| **RK-06** | Los umbrales de rendimiento son afirmaciones sin medición. | Media | Medio | Ninguna | `B-07` |
| **RK-07** | La superficie del catálogo público recibe tráfico y no se ha medido su comportamiento bajo carga. | Baja | Alto | Límite de tamaño de página | `B-07` |
| **RK-08** | Equipo de tres personas: ausencia o concentración de conocimiento en quien conoce cada parte. | Media | Medio | Documentación de arquitectura y de ingeniería; decisiones registradas con motivo | Rotación de responsables y decisiones registradas |
| **RK-09** | El reloj del sistema quedó desfasado en una ventana y la verificación de certificados falló, bloqueando la descarga de dependencias. | Ocurrió | Bajo | Ninguna | Resolver al actualizar la confianza del sistema; documentar el síntoma |

## 6. Riesgos aceptados

Riesgos que se conocen, se aceptan y se documentan en vez de ocultarse:

| Riesgo aceptado | Justificación |
|---|---|
| Sin alta disponibilidad ni escalado horizontal. | El destino es un despliegue único de un comercio pequeño. La arquitectura no lo impide, pero no se ha construido. |
| Sin copia de seguridad automatizada. | El volumen de datos de la prueba es pequeño y reproducible desde la carga inicial. En producción es un requisito bloqueante. |
| Sin registro de auditoría de cambios de negocio. | Las marcas de tiempo y el campo de versión registran *cuándo* y *qué versión*, no *quién* cambió qué. Es una limitación conocida del modelo actual. |
| Sin limitación de tasa. | Se acepta en desarrollo; en producción es requisito de despliegue. |
| Sin gestión centralizada de secretos. | Valores de desarrollo únicamente; ningún secreto real está en el repositorio. |

## 7. Cómo se cerró el resto

Un cierre honesto incluye lo que se resolvió durante el camino. Estos casos
quedan registrados porque son parte del resultado:

| Problema encontrado | Resolución |
|---|---|
| Exportación duplicada de un tipo compartido que rompía la compilación. | Se consolidó la definición en un solo módulo y se reexportó. |
| Semántica indefinida de la edición parcial. | Se adoptó la fusión JSON (RFC 7396) y se documentó la tabla de significado de cada valor. |
| El registro de usuarios fallaba en base de datos. | Faltaba la identidad autogenerada de la clave; se añadió como migración aparte. |
| Dos renovaciones simultáneas mataban una sesión legítima. | La renovación se coalescó en una sola operación en vuelo. |
| Cualquier usuario registrado podía crear y editar productos. | Se añadió comprobación de rol en el servidor; la interfaz ya ocultaba el botón, lo que enmascaraba el fallo. |
| Dos violaciones de contraste en textos secundarios. | Se sustituyó el gris por defecto por uno que cumple el nivel AA. |
| Confirmación de borrado con diálogo del navegador. | Sustituida por un diálogo propio, accesible y que nombra el producto. |
| La interfaz de administración no tenía buscador pese a que la API ya lo soportaba. | Se conectaron los filtros a la API existente. |
| Intereses de color ilegibles por bajo contraste en insignias de estado. | Se reajustaron los colores a relaciones de contraste por encima del umbral. |