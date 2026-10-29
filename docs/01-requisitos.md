# 01 — Requisitos

> Catálogo de requisitos del sistema. Los identificadores son estables y se
> mantienen aunque el catálogo cambie.

---

## 1. Cómo leer este documento

| Prefijo | Tipo | Qué expresa |
|---|---|---|
| `RF-nn` | **Funcional** | Algo que el sistema hace, observable desde fuera. |
| `RNF-nn` | **No funcional** | Una calidad que el sistema debe alcanzar: rendimiento, seguridad, accesibilidad, mantenibilidad. |
| `RN-nn` | **Regla de negocio** | Una restricción sobre los datos que el negocio impone y que se rompe si se viola. |

Cada requisito tiene una columna de **Estado** que describe la realidad verificada,
y una de **Verificación** que indica cómo se comprueba. La sección
[04](04-estado-y-brechas.md) desarrolla el estado; aquí se resume para poder leer
el catálogo completo de un vistazo.

---

## 2. Requisitos funcionales

### 2.1 Identidad y sesión

| ID | Requisito | Criterio de aceptación observable | Verificación | Estado |
|---|---|---|---|---|
| **RF-01** | Registro de usuario | `POST /api/v1/auth/register` con correo y contraseña válidos responde `201` y crea un usuario con rol `ROLE_USER`. Correo duplicado responde `409`. Contraseña débil responde `400`. | Pruebas de API + E2E del formulario | Implementado |
| **RF-02** | Autenticación | `POST /api/v1/auth/login` con credenciales válidas responde `200`, devuelve un token de acceso en el cuerpo y establece una cookie de refresco `HttpOnly`. Credenciales inválidas responden `401` sin revelar cuál de los dos datos falló. | Pruebas de API + E2E | Implementado |
| **RF-03** | Renovación de sesión | `POST /api/v1/auth/refresh` con la cookie válida emite un par de tokens nuevo e invalida el anterior. | Pruebas de API | Implementado |
| **RF-04** | Cierre de sesión | `POST /api/v1/auth/logout` invalida el token de refresco y borra la cookie. Un intento posterior de renovar con ese token responde `401`. | Pruebas de API + E2E | Implementado |
| **RF-05** | Consulta de sesión actual | `GET /api/v1/auth/me` devuelve identificador, correo, rol y estado del usuario autenticado; responde `401` sin credencial válida. | Pruebas de API | Implementado |

### 2.2 Catálogo público (comprador, sin cuenta)

| ID | Requisito | Criterio de aceptación observable | Verificación | Estado |
|---|---|---|---|---|
| **RF-06** | Listado del catálogo | `GET /catalogo` renderiza los productos activos con nombre, categoría, precio y disponibilidad, sin requerir sesión. | E2E Playwright | Implementado |
| **RF-07** | Detalle de producto | `GET /catalogo/[id]` muestra precio, descripción y disponibilidad de un producto concreto. Identificador inexistente muestra la vista de no encontrado. | E2E Playwright | Implementado |
| **RF-08** | Búsqueda y filtros | La API acepta búsqueda por texto (nombre o SKU), filtro por categoría, por estado y por rango de precio, combinados. | E2E Playwright | Implementado |
| **RF-09** | Paginación y orden | El listado devuelve páginas de tamaño configurable y acepta criterio de ordenamiento. Tamaño de página acotado para evitar respuestas desmedidas. | E2E Playwright | Implementado |
| **RF-10** | Señales de disponibilidad | Un producto con existencias ≤ 3 muestra "Solo quedan N"; con 0 muestra "Agotado". No se usan cuentas regresivas ni urgencia falsa. | E2E Playwright | Implementado |
| **RF-11** | Solicitud de cotización | Desde la ficha de producto el comprador puede acumular productos en una solicitud de cotización y verla en `/cotizacion`. | E2E Playwright | Parcial |

### 2.3 Panel de administración

| ID | Requisito | Criterio de aceptación observable | Verificación | Estado |
|---|---|---|---|---|
| **RF-12** | Listado administrativo | `GET /admin/products` muestra tabla con SKU, nombre, categoría, precio, existencias, estado y acciones, con paginación y filtros. | E2E Playwright | Implementado |
| **RF-13** | Alta de producto | `POST /api/v1/products` exige `ROLE_ADMIN` y responde `201`. Un usuario con rol inferior recibe `403`; un anónimo, `401`. | Pruebas de API + E2E | Implementado |
| **RF-14** | Edición parcial | `PATCH /api/v1/products/{id}` actualiza solo los campos enviados, exige `ROLE_ADMIN` y responde `200`. Un SKU repetido responde `409`. | Pruebas de API + E2E | Implementado |
| **RF-15** | Baja lógica | `DELETE /api/v1/products/{id}` marca el producto como inactivo sin eliminarlo físicamente, exige `ROLE_ADMIN` y muestra confirmación con el nombre del producto antes de ejecutar. | Pruebas de API + E2E | Implementado |
| **RF-16** | Detalle administrativo | `GET /admin/products/[id]` muestra el detalle completo con ruta de navegación y la posibilidad de editar o reactivar. | E2E Playwright | Implementado |
| **RF-17** | Guardas de rol | Las rutas administrativas redirigen a `/login` a un anónimo y muestran un aviso de acceso restringido a un usuario sin permisos, **dentro** del marco de navegación (el usuario puede seguir cerrando sesión). | E2E Playwright | Implementado |

### 2.4 Idioma, moneda y estados

| ID | Requisito | Criterio de aceptación observable | Verificación | Estado |
|---|---|---|---|---|
| **RF-18** | Interfaz bilingüe | Toda la interfaz de cliente existe en español (Colombia, por defecto) e inglés. El cambio de idioma se persiste entre navegaciones y se refleja en el atributo `lang` del documento. | E2E Playwright | Implementado |
| **RF-19** | Mensajes del servidor localizados | Los mensajes de validación y los títulos de error se resuelven según el idioma de la petición, en ambos idiomas. | Pruebas de API | Implementado |
| **RF-20** | Formato de moneda por idioma | Los importes se presentan en el formato del idioma activo: pesos colombianos para español, dólares para inglés. | E2E Playwright | Parcial |
| **RF-21** | Errores estandarizados | Toda respuesta de error de la API responde en formato RFC 7807 (`ProblemDetail`) con tipo estable, título, estado, detalle e instancia. | Pruebas de API | Implementado |
| **RF-22** | Estados de carga y vacío | Ninguna vista muestra un estado de carga plano ni un vacío genérico; ambas situaciones tienen diseño propio. | E2E Playwright | Implementado |
| **RF-23** | Página de autoría y licencia | `/about` muestra autor, código estudiantil, universidad, materia y licencia MIT, y es alcanzable desde el pie de cada página. | E2E Playwright | Implementado |
| **RF-24** | Panel de indicadores | `/admin` muestra seis indicadores (productos, activos, inactivos, agotados, stock bajo y valor del inventario), más la lista de productos con stock bajo y los actualizados recientemente. | E2E Playwright | Implementado |
| **RF-25** | Honestidad de los indicadores | Cuando un indicador se calcula sobre un subconjunto del catálogo, la interfaz declara el recorte en lugar de presentar el número como total. | E2E Playwright + inspección | Implementado |
| **RF-26** | Estados de sistema del sistema | Toda ruta tiene estado de carga, estado de error recuperable y estado de no encontrado, con diseño propio y sin pantalla en blanco. | E2E Playwright | Implementado |

---

## 3. Requisitos no funcionales

### 3.1 Seguridad

| ID | Requisito | Criterio verificable | Verificación | Estado |
|---|---|---|---|---|
| **RNF-01** | Rotación de token de un solo uso | Cada renovación emite un identificador nuevo y revoca el anterior. Reutilizar un token revocado devuelve `401`. | E2E: refresco seguido de reutilización deliberada | Implementado |
| **RNF-02** | Revocación distribuida | Los identificadores revocados quedan en Redis con un tiempo de vida igual al del token, de modo que no se acumulen entradas indefinidamente. | Inspección del diseño + prueba de API | Implementado |
| **RNF-03** | El token de acceso no persiste en el cliente | El token de acceso vive solo en memoria del proceso del navegador; el de refresco solo en cookie `HttpOnly`/`SameSite`. Nunca hay secretos en almacenamiento accesible por scripts. | Inspección de código | Implementado |
| **RNF-04** | Contraseñas con hash adaptativo | Las contraseñas se almacenan con BCrypt, factor de coste 10. | Inspección de código | Implementado |
| **RNF-05** | Autorización por rol en el servidor | Cada escritura de producto exige `ROLE_ADMIN`, comprobado en el servidor y no solo ocultando botones en la interfaz. | Pruebas de API con `ROLE_USER` y anónimo | Implementado |
| **RNF-06** | Gestión de dependencias sin vulnerabilidades altas | El análisis de dependencias falla la compilación ante cualquier vulnerabilidad con CVSS ≥ 7. | Configuración Maven; ejecución pendiente | Configurado, no ejecutado |
| **RNF-07** | Análisis dinámico de seguridad | Un escaneo OWASP ZAP de línea base se ejecuta contra la aplicación levantada. | Script + ejecución en CI; pendiente | Pendiente |
| **RNF-08** | Protección contra fuerza bruta | El inicio de sesión está limitado por tasa por dirección IP. | Bucket4j en `/auth/login` | Pendiente |
| **RNF-09** | Aislamiento entre orígenes | El navegador solo puede llamar a la API desde los orígenes declarados, configurables por entorno. | Configuración CORS | Implementado |
| **RNF-10** | Gestión de secretos por entorno | Las credenciales de desarrollo viven en un archivo de ejemplo; ningún secreto real está versionado. | `.env.example` y Compose | Implementado |

### 3.2 Calidad y mantenibilidad

| ID | Requisito | Criterio verificable | Verificación | Estado |
|---|---|---|---|---|
| **RNF-11** | Cobertura de líneas del backend ≥ 80 % | La compilación falla si la cobertura baja del umbral. | JaCoCo configurado en `verify` | Configurado, sin pruebas backend |
| **RNF-12** | Puntaje de mutación ≥ 60 % en el dominio | La compilación falla si los mutantes supervivientes superan el umbral. | PIT configurado | Configurado, no ejecutado |
| **RNF-13** | Trazabilidad requisito ↔ prueba | Existe una matriz que declara, para cada requisito, la prueba que lo cubre; y para cada prueba, el requisito que cubre. Detecta requisitos huérfanos y pruebas sin requisito. | RTM + script de detección de brechas | Pendiente |
| **RNF-14** | Criterios de aceptación ejecutables | Cada historia tiene escenarios Given/When/Then ejecutables, no sólo descritos en prosa. | Escenarios BDD | Pendiente |
| **RNF-15** | Código sin deuda oculta | Cero marcadores `TODO`, `FIXME` o `XXX` en el código entregado. | Búsqueda en el repositorio | Cumplido |
| **RNF-16** | Documentación de API publicada y vigente | La especificación OpenAPI se genera desde el código y describe parámetros, respuestas y esquemas de seguridad. | springdoc en `/swagger-ui.html` | Parcial |
| **RNF-17** | Evolución controlada del esquema | Ninguna tabla se crea o altera por convención del ORM: todo cambio de esquema pasa por una migración versionada y reproducible. | Liquibase, 6 cambios applied | Implementado |

### 3.3 Rendimiento

| ID | Requisito | Criterio verificable | Verificación | Estado |
|---|---|---|---|---|
| **RNF-18** | Latencia de lectura de catálogo | El percentil 95 de la lista de productos se mantiene por debajo de 200 ms con carga de referencia. | Prueba de carga k6 (50 usuarios virtuales, 5 minutos) | Pendiente |
| **RNF-19** | Tasa de error bajo carga | Menos del 1 % de respuestas con error durante la prueba de carga. | Prueba de carga k6 | Pendiente |
| **RNF-20** | Confinamiento del tamaño de página | El tamaño de página tiene un máximo; una petición sin límite acotado se rechaza o se recorta. | Inspección del controlador | Implementado |

### 3.4 Usabilidad y accesibilidad

| ID | Requisito | Criterio verificable | Verificación | Estado |
|---|---|---|---|---|
| **RNF-21** | Accesibilidad WCAG 2.0 nivel AA | Cero violaciones `serious` o `critical` en los flujos principales; contraste de texto por encima de 4,5:1. | axe-core en cada prueba E2E | Implementado |
| **RNF-22** | Operable solo con teclado | Todos los flujos se completan con teclado; el foco es visible y vuelve a un lugar predecible. | Auditoría manual + E2E | Implementado |
| **RNF-23** | Usabilidad medida | Tasa de éxito de tareas ≥ 90 %, SUS ≥ 68, SEQ ≥ 5 por flujo, NASA-TLX ≤ 60 en el flujo más pesado. | Protocolo F4 + reporte automatizado | Protocolo listo, medición pendiente |
| **RNF-24** | Recuperación ante error | Un fallo de red muestra un mensaje accionable, no una pantalla en blanco ni una traza técnica. | E2E de casos de error | Implementado |
| **RNF-25** | Estados vacíos con sentido | Un resultado sin datos explica qué hacer a continuación, en el idioma activo. | E2E | Implementado |

### 3.5 Operación

| ID | Requisito | Criterio verificable | Verificación | Estado |
|---|---|---|---|---|
| **RNF-26** | Arranque reproducible | Tres comandos levantan el entorno completo desde cero: instalar dependencias, levantar infraestructura, ejecutar. | `pnpm install && docker compose up -d && pnpm dev` | Implementado |
| **RNF-27** | Registros estructurados | Los registros de producción se emiten en JSON con campos consultables. | `logback-spring.xml` | Implementado |
| **RNF-28** | Una sola fuente de contratos | Los esquemas de validación compartidos tienen una sola definición, consumida por web y referenciada por backend, sin copias divergentes. | `packages/shared` | Implementado |
| **RNF-29** | Compilación continua | Cada entrega ejecuta compilación, pruebas y análisis en un entorno automatizado. | Configuración de CI | Pendiente |
| **RNF-30** | Historial de cambios navegable | Bitácora de versiones con entradas agrupadas por tipo de cambio. | `CHANGELOG.md` | Pendiente |

---

## 4. Reglas de negocio

| ID | Regla | Consecuencia de violarla |
|---|---|---|
| **RN-01** | El SKU es único en todo el catálogo. | El alta o la edición con un SKU repetido se rechaza con conflicto (`409`). |
| **RN-02** | El SKU no se modifica después del alta. | La edición ignora el SKU; es inmutable a propósito, para no romper la referencia externa que el comercio ya imprimió o publicó. |
| **RN-03** | Formato del SKU: letras mayúsculas, dígitos y guiones, entre 3 y 32 caracteres. | Validación en cliente y servidor; error `400`. |
| **RN-04** | El nombre es obligatorio, entre 1 y 200 caracteres. | Validación en cliente y servidor; error `400`. |
| **RN-05** | La descripción es opcional, hasta 2000 caracteres, y puede quedar vacía. | Debe poder enviarse `null` para limpiarla (ver RN-09). |
| **RN-06** | El precio admite cero o más, con exactamente dos decimales. | `BigDecimal(19,2)` en el modelo; la interfaz exige mayor que cero. |
| **RN-07** | Las existencias son un entero no negativo. | Negativos se rechazan; cero significa agotado, no desconocido. |
| **RN-08** | La categoría es obligatoria, hasta 64 caracteres. | Validación en cliente y servidor; error `400`. |
| **RN-09** | La edición parcial sigue la semántica de fusión JSON (RFC 7396): campo ausente = no cambia; `null` = limpia; valor = sobrescribe. | Documentada en el esquema compartido y respetada por el mapeo del servidor. |
| **RN-10** | La baja de un producto es lógica: se marca inactivo y el registro permanece. | No existe el borrado físico; una baja se puede revertir reactivando. |
| **RN-11** | Cada producto activo tiene existencias mayores que cero o una señal explícita de agotado. | La interfaz distingue "pocas unidades" de "agotado"; nunca ambas. |
| **RN-12** | La honestidad del estado es un requisito, no una cortesía: no se muestran cuentas regresivas, escasez inventada ni urgencia falsa. | Revisión contra la evidencia de investigacion de mercado usada en la definición. |
| **RN-13** | El token de refresco sirve una sola vez. | Reutilizarlo revoca la familia y devuelve `401`. |
| **RN-14** | Solo `ROLE_ADMIN` escribe el catálogo; solo un usuario autenticado tiene sesión. | `403` para rol insuficiente, `401` para anónimo. |
| **RN-15** | El idioma por defecto es español de Colombia; el inglés es la alternativa. | La ausencia de preferencia explícita produce español. |

---

## 5. Requisitos heredados del contrato de ingeniería

Estos requisitos no nacieron de una necesidad del negocio, sino de la exigencia de
que el proyecto **demuestre un proceso de ingeniería verificable**. Son tan
obligatorios como los funcionales y están respaldados por normas de la industria:

| ID | Requisito | Norma de referencia |
|---|---|---|
| **RNF-31** | La especificación es un artefacto versionado, no un documento de texto libre: cada cambio es una revisión auditable. | ISO/IEC/IEEE 29119-2 (administración de requisitos) |
| **RNF-32** | Cada entregable se juzga contra la especificación y la diferencia se registra antes de avanzar. | IEEE 1012-2016 §5 (verificación y validación) |
| **RNF-33** | Los requisitos se validan con la persona interesada, no solo contra el código. | ISO/IEC/IEEE 29119-2 §8.3 (validación de requisitos) |
| **RNF-34** | La priorización del esfuerzo se hace por riesgo, agrupando los requisitos críticos, medios y bajos. | ISO/IEC/IEEE 29119-2 §10 (técnicas de prueba basadas en riesgo) |

---

## 6. Trazabilidad de alto nivel

Este cuadro resume la cobertura por tipo. El detalle requisito por requisito está
en [04 Estado y brechas](04-estado-y-brechas.md).

| Tipo | Total | Cumplidos | Configurados sin ejecutar | Parciales | Pendientes |
|---|---|---|---|---|---|
| Funcionales (`RF`) | 26 | 24 | 0 | 2 (RF-11, RF-20) | 0 |
| No funcionales (`RNF`) | 34 | 21 | 3 (RNF-06, 11, 12) | 2 (RNF-16, 23) | 8 |
| Reglas de negocio (`RN`) | 15 | 15 | 0 | 0 | 0 |
| **Total** | **75** | **60** | **3** | **4** | **8** |

> "Cumplido" significa *existe y se verificó en ejecución*, no *tiene pruebas
> automatizadas asociadas*. Esa distinción —comportamiento correcto verificado
> frente a comportamiento cubierto por una prueba que alguien pueda volver a
> ejecutar— es el trabajo pendiente de `OG-05` y `OG-07`, y se detalla en
> [03 Calidad y verificación](03-calidad-y-verificacion.md).