# 02 — Arquitectura

> Cómo está construido Stockly: pila tecnológica, estructura de paquetes, modelo
> de datos, flujo de sesión y decisiones arquitectónicas con su justificación.

---

## 1. Vista general

```
                    Navegador
                        │
        ┌───────────────┴───────────────┐
        │  apps/web — Next.js 15        │
        │  App Router · React 19        │
        │  SSR + renderizado cliente    │
        └───────┬───────────────────────┘
                │ HTTP/JSON sobre HTTPS
                │ Authorization: Bearer <access>
                │ Cookie: refresh (HttpOnly)
        ┌───────┴───────────────────────┐
        │  apps/backend — Spring Boot   │
        │  controlador → servicio →     │
        │  repositorio                  │
        └───┬───────────────────────┬───┘
            │ JPA/Hibernate         │ Spring Data Redis
    ┌───────┴────────┐      ┌───────┴─────────┐
    │ PostgreSQL 16  │      │ Redis 7         │
    │ + Liquibase    │      │ lista negra JTI │
    └────────────────┘      └─────────────────┘

    packages/shared — contratos: tipos TypeScript + esquemas Zod
    (fuente única consumida por web; referenciada por backend)
```

## 2. Pila tecnológica

### 2.1 Frontend — `apps/web`

| Capa | Tecnología | Versión | Por qué esta y no otra |
|---|---|---|---|
| Marco | Next.js (App Router) | 15.x | Renderizado en servidor para las páginas públicas (catálogo, autoría): mejora el primer resultado visible y el posicionamiento. |
| Biblioteca | React | 19.x | Versión estable emparejada con Next 15. |
| Lenguaje | TypeScript | 5.6.x | `strict` activado: el error de tipos se detecta en el editor y en la compilación, no en producción. |
| Interfaz | Mantine | 7.13.x | Sistema de componentes accesible por defecto, temas por token y soporte de modo oscuro sin CSS propio. |
| Tablas | mantine-datatable | 7.14.x | Tabla con servidor: paginación, orden y filtros resueltos en el backend, que es donde están los datos. |
| Formularios | React Hook Form + Zod | 7.x / 3.23.x | Rendimiento con formularios grandes y validación declarativa reutilizable desde el paquete compartido. |
| Estado de servidor | TanStack Query | 5.59.x | Caché, reintento, invalidación y deduplicación de peticiones; evita reescribir la lógica a mano. |
| Estado de sesión | Zustand | 5.x | Un almacén mínimo que mantiene el token de acceso **en memoria**. Nada persistente. |
| Pruebas E2E | Playwright | 1.64.x | Ejecución real en navegador, con aislamiento de almacenamiento y por proyecto. |
| Accesibilidad | axe-core | vía Playwright | Se ejecuta en cada prueba E2E, no como revisión aparte. |

### 2.2 Backend — `apps/backend  `

| Capa | Tecnología | Versión | Por qué esta y no otra |
|---|---|---|---|
| Marco | Spring Boot | 3.4.1 | Ecosistema estable, arranque rápido, integración directa con lo que el proyecto necesita. |
| Lenguaje | Java | 17 | `record` para los datos inmutables y las expresiones `switch`. Java 17 es la línea base de Spring Boot 3. |
| Persistencia | Spring Data JPA / Hibernate | del framework | Mapeo objeto-relacional estándar; las consultas dinámicas se resuelven con especificaciones tipadas. |
| Base de datos | PostgreSQL | 16 | Integridad referencial, índices parciales y `IDENTITY` para claves generadas. |
| Esquema | Liquibase | del framework | Cada cambio de esquema es un archivo versionado y reproducible. El ORM nunca crea tablas por su cuenta. |
| Caché / revocación | Redis | 7 | Lista negra de identificadores de token con tiempo de vida alineado a la expiración natural. |
| Seguridad | Spring Security + JJWT | 0.12.6 | Cadena de filtros sin estado; HS256 con biblioteca mantenida. |
| Mapeo DTO ↔ entidad | MapStruct | 1.5.5 | Código de mapeo generado en compilación, sin reflexión ni copia manual. |
| API | springdoc-openapi | 2.6.0 | La especificación se genera del código, con lo que no puede quedar desactualizada por olvido. |
| Pruebas de integración | Testcontainers | 1.20.4 | PostgreSQL real en contenedor: las pruebas no dependen de un motor de base de datos emulado. |
| Cobertura | JaCoCo / PIT | 0.8.12 / 1.16.1 | Compuertas automáticas en la fase de verificación. |
| Registros | Logback + encoder JSON | — | Registros consultables en producción. |

### 2.3 Paquete compartido — `packages/shared`

Tipos TypeScript y esquemas Zod que definen el contrato de datos entre frontend
y backend: producto, autenticación, error y tipos comunes de API. Se publica
como paquete del espacio de trabajo y se consume compilado (`dist`).

> **Trampa operativa documentada:** web consume `@stockly/shared` desde `dist`.
> Editar `src` sin recompilar el paquete deja al frontend validando contra el
> esquema antiguo, y el síntoma es silencioso (el formulario no envía y no muestra
> error). Recompilar el paquete compartido es paso obligatorio antes de
> compilar web.

### 2.4 Entorno de desarrollo

| Servicio | Imagen | Puerto local | Notas |
|---|---|---|---|
| PostgreSQL | `postgres:16-alpine` | `5432` | Comprobación de salud activa; volumen persistente. |
| Redis | `redis:7-alpine` | `6379` | Persistencia activada; política de.memory limitada. |

Coordinación de tareas entre paquetes mediante Turborepo 2.x sobre pnpm 9.

## 3. Estructura de paquetes

```
/
├── apps/
│   ├── web/                     Next.js 15
│   │   ├── app/                 Rutas (App Router)
│   │   │   ├── catalogo/        Público: listado y detalle
│   │   │   ├── cotizacion/      Público: solicitud de cotización
│   │   │   ├── login, register/ Público: autenticación
│   │   │   ├── admin/           Protegido: gestión de catálogo
│   │   │   ├── about/           Público: autoría y licencia
│   │   │   └── layout.tsx       Raíz: idioma, tema, fuentes
│   │   ├── src/
│   │   │   ├── components/      Componentes de interfaz
│   │   │   ├── lib/             Cliente HTTP, API por dominio, formato
│   │   │   ├── store/           Estado global mínimo (sesión, cotización)
│   │   │   ├── i18n/            Diccionarios es-CO / en
│   │   │   └── shared/config/   Tema Mantine
│   │   └── tests/               Playwright: flujos, modelos de página, reportería
│   └── backend/                 Spring Boot 3
│       └── src/main/
│           ├── java/com/stockly/
│           │   ├── product/      Catálogo: dominio, api, dto, service, persistence
│           │   ├── auth/         Sesión: domain, security, service, api
│           │   ├── config/       OpenAPI, CORS
│           │   └── shared/       Utilidad transversal
│           └── resources/
│               ├── db/changelog/  Migraciones Liquibase
│               ├── messages_*.properties  Mensajes localizados
│               └── application.yml         Configuración por perfiles
├── packages/shared/             Contratos TypeScript + Zod
└── docs/                        Esta documentación
```

### 3.1 Convenciones de nombres en el backend

Los DTOs de entrada llevan sufijo `Request`, los de salida `Response`. El
servicio devuelve siempre DTOs, nunca entidades: así la forma de la base de datos
no se filtra a la API y cambiar una columna no obliga a tocar al cliente.

### 3.2 Orden de capas

```
petición HTTP
   ↓  JwtAuthenticationFilter  (¿token válido y no revocado?)
   ↓  @PreAuthorize            (¿el rol alcanza?)
   ↓  ProductController        (valida forma y formato de la entrada)
   ↓  ProductService           (reglas de negocio, transacciones)
   ↓  ProductRepository        (persistencia; especificaciones tipadas)
   ↓  PostgreSQL
```

Cada capa solo conoce a la de abajo. El controlador no escribe consultas, el
servicio no conoce HTTP, el repositorio no conoce el negocio.

## 4. Modelo de datos

### 4.1 Entidad `Product`

| Campo | Tipo | Restricción | Notas |
|---|---|---|---|
| `id` | `Long` | Clave primaria, autogenerada | `IDENTITY` desde la migración 0006 |
| `sku` | `String` | Único, 3–32, `^[A-Z0-9-]+$`, **inmutable** | La inmutabilidad se aplica en dos capas: columna no actualizable + el mapeo ignora el campo |
| `name` | `String` | Obligatorio, ≤ 200 | |
| `description` | `String` | Opcional, ≤ 2000, admite nulo | Único campo limpiable por edición parcial |
| `price` | `BigDecimal` | `(19,2)`, ≥ 0 | Único campo numérico decimal |
| `stock` | `Integer` | ≥ 0 | 0 significa agotado, no desconocido |
| `category` | `String` | Obligatorio, ≤ 64 | |
| `active` | `Boolean` | Por defecto `true` | Base del borrado lógico (RN-10) |
| `created_at` | `Instant` | Auditoría, solo lectura | Fecha de creación automática |
| `updated_at` | `Instant` | Auditoría, solo lectura | Fecha de última modificación automática |
| `version` | `Long` | Versión optimista | Dos ediciones simultáneas: la segunda detecta el conflicto |

### 4.2 Entidad `User`

`id`, `email` (único), `password` (hash BCrypt), `role` (`ROLE_USER` /
`ROLE_ADMIN`), `active`, `created_at`, `updated_at`. Correo único garantizado por
restricción en base de datos, no solo por código: la verificación previa mejora
el mensaje de error, la restricción es la garantía real.

### 4.3 Migraciones

Seis cambios Liquibase aplicados, en orden: tabla de productos, sus índices, sus
restricciones; tabla de usuarios, sus índices, e identidad autogenerada. La
identidad se añadió como migración aparte porque el registro de usuarios fallaba
sin ella: es exactamente el caso que un esquema declarativo evita.

### 4.4 Concurrencia

Dos mecanismos complementarios:

- **Versión optimista (`@Version`):** si dos sesiones editan el mismo producto,
  la segunda recibe `409` con la indicación de reintentar, en vez de pisar el
  trabajo de la primera.
- **Restricción de unicidad en base de datos** sobre `sku` y `email`: la última
  línea de defensa cuando dos peticiones pasan simultáneamente la verificación
  previa. El manejador de errores traduce esa violación a `409`.

## 5. Autenticación y sesión

### 5.1 Emisión

```
1. POST /api/v1/auth/login { email, password }
2. El servidor busca el usuario y verifica el hash con BCrypt
3. Emite un token de acceso  (15 min, HS256)
4. Emite un token de refresco (7 días, HS256, con identificador único)
5. Responde 200 con el token de acceso en el cuerpo
   y el token de refresco en una cookie HttpOnly + SameSite=Lax
```

### 5.2 Uso

El cliente guarda el token de acceso **solo en memoria** y lo envía en la
cabecera `Authorization: Bearer`. El token de refresco nunca es visible para
JavaScript: viaja en una cookie que el navegador adjunta automáticamente y que
ningún script puede leer.

Cuando una petición devuelve `401`, el cliente:
1. Pausa todas las peticiones en vuelo (una sola renovación simultánea).
2. Llama a `/auth/refresh` con la cookie.
3. Si tiene éxito, reintenta la petición original una vez.
4. Si falla, descarta la sesión y lleva al usuario a la pantalla de acceso.

> El paso 1 no es cosmético: sin él, varias peticiones que fallan a la vez
> disparan varias renovaciones con el mismo token. Como el token es de un solo
> uso, la segunda se lee como reutilización maliciosa y mata una sesión legítima.
> Ese fallo se presenció durante el desarrollo y su corrección es la coalescencia
> de la renovación.

### 5.3 Revocación

Cada renovación genera un identificador nuevo y envía el anterior a una lista
negra en Redis con un tiempo de vida igual al que le faltaba al token. Si alguien
presenta un token ya revocado, el servidor responde `401` y revoca la familia
completa.

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Token de acceso en memoria | Almacenamiento local del navegador | El almacenamiento local es legible por cualquier script inyectado: un XSS se convierte en robo de sesión. La opción en memoria limita el daño a la pestaña viva. |
| Cookie `HttpOnly` + `SameSite=Lax` | Cookie accesible por JavaScript | Anula por completo la función del `HttpOnly`. |
| HS256 (firma simétrica) | RS256 (firma asimétrica) | Un solo servicio emite y verifica. RS256 solo aporta valor cuando hay varios emisores o verificadores externos. |
| Lista negra de identificadores | Sin revocación hasta expirar | Un cierre de sesión no sería real: el token seguiría vivo hasta 7 días. |

## 6. Errores

Toda respuesta de error usa `ProblemDetail` (RFC 7807): un `type` que es un
identificador estable, `title`, `status`, `detail` localizado e `instance` con la
ruta. El `type` es un identificador, no una URL que haya que resolver: el cliente
reacciona al código, nunca al texto.

| Situación | Estado | Tipo |
|---|---|---|
| Producto inexistente | 404 | `product-not-found` |
| SKU repetido | 409 | `product-sku-conflict` |
| Datos inválidos | 400 | `validation-failed` (con detalle por campo) |
| Petición malformada | 400 | `malformed-request` |
| Conflicto de versión | 409 | `optimistic-lock-conflict` (marcado como reintentable) |
| Violación de integridad | 409 | `integrity-violation` |
| Sin autenticar / sin permiso | 401 / 403 | Delegado al marco de seguridad |
| Fallo inesperado | 500 | `internal-error` — **sin detalle interno**, para no filtrar información |

## 7. Decisiones arquitectónicas

| # | Decisión | Alternativas consideradas | Motivo | Consecuencia |
|---|---|---|---|---|
| **AD-01** | Arquitectura en capas clásica (controlador → servicio → repositorio) | Hexagonal / Clean Architecture | Equipo de tres personas y dominio pequeño. La hexagonal añade indirección y archivos de mapeo que aquí no aportan a esta escala. | Menos ceremonia; a cambio, el dominio queda acoplado a JPA. Aceptable a esta escala. |
| **AD-02** | Monorepo con paquete compartido | Dos repositorios con contratos duplicados | Un solo origen de verdad para los esquemas de validación. | Obliga a recompilar el paquete compartido antes de compilar web (ver §2.3). |
| **AD-03** | Next.js con App Router | Vite + SPA, Next con páginas | El catálogo público necesita renderizado en servidor; el panel administrativo necesita interactividad. App Router permite ambos en un solo proyecto. | Dos modelos de renderizado conviviendo; hay que entender en qué modo corre cada ruta. |
| **AD-04** | Tokens JWT sin estado + lista negra en Redis | Sesiones en servidor | Escalado horizontal sin afinidad de sesión. | La revocación deja de ser instantánea y depende de Redis. |
| **AD-05** | Errores en RFC 7807 nativo | Formato propio | Es estándar, lo entienden herramientas y clientes, y Spring lo resuelve de serie. | Los mensajes localizados se resuelven por código, no por tipo. |
| **AD-06** | Borrado lógico en lugar de físico | `DELETE` físico | Preserva integridad referencial y hace reversible una eliminación accidental. | El borrado físico solo es posible si alguien ejecuta una migración de purga. |
| **AD-07** | SKU inmutable | SKU editable | El comercio ya puede tener el SKU impreso en etiquetas y publicados. | La corrección de un SKU mal capturado exige una operación de soporte específica. |
| **AD-08** | Arquitectura bilingüe propia (ligera) | `next-intl` / `react-i18next` | Dos idiomas y un diccionario propio pesan menos que la maquinaria de carga por ruta de una librería de i18n completa. | Menos funciones (sin traducción por segmento, sin plurales complejos). |
| **AD-09** | Esquemas Zod solo en TypeScript; el backend valida con Bean Validation | Un único lenguaje de esquema compartido entre ambos | Java y TypeScript no comparten un validador razonable sin una capa de generación. | Los esquemas están duplicados conceptualmente; el riesgo se acota con la Asimetría documentada de AD-10. |
| **AD-10** | El cliente es más estricto que el servidor en el precio | Reglas idénticas en ambos lados | El servidor acepta 0 para no bloquear operaciones administrativas; la interfaz pública no ofrece productos gratuitos. | Asimetría intencional y documentada en ambos lados; no es un error. |
| **AD-11** | Frontend en estado limitado: Zustand solo para sesión y cotización; el resto con TanStack Query | Redux completo | El estado del servidor no necesita un almacén global: la librería de consultas ya lo resuelve con caché e invalidación. | Menos boilerplate, pero hay que saber cuándo usar cada herramienta. |
| **AD-12** | Fuentes tipográficas alojadas en el propio repositorio | Descarga desde un servicio externo | Evita depender de la red de terceros en compilación y en ejecución; garantiza que la marca se ve igual siempre. | Hay que administrar los archivos de fuente a mano cuando cambia la tipografía. |

### 7.1 Decisiones pendientes de formalizar

La especificación contempla cuatro registros de decisión arquitectónica que aún no
existen como archivos independientes. Su contenido está repartido entre la
sección 7 de este documento y los comentarios del código:

| Registro previsto | Contenido | Dónde está hoy |
|---|---|---|
| `docs/adr/0001-arquitectura-en-capas.md` | AD-01 | Este documento |
| `docs/adr/0002-rotacion-de-refresco.md` | AD-04, §5 | Este documento |
| `docs/adr/0003-mantine-frente-a-otra-biblioteca.md` | Decisión de interfaz de usuario | Este documento §2.1 |
| `docs/adr/0004-contratos-compartidos.md` | AD-02, AD-09 | Este documento §2.3 |

Convertirlos en archivos separados es trabajo de `T14` (documentación), hoy
pendiente.

## 8. Decisiones de seguridad embebidas

| Decisión | Detalle |
|---|---|
| La escritura exige rol **en el servidor** | `@PreAuthorize("hasRole('ADMIN')")` sobre crear, editar y dar de baja. Ocultar el botón en la interfaz no es un control de seguridad. |
| El registro público no otorga permisos | Un usuario recién registrado es `ROLE_USER`. No existe escalada de privilegios por registro. |
| Origen permitido configurable | La lista de orígenes viene de configuración, con los de desarrollo como valor por defecto. Documentada como algo que debe cambiarse al desplegar. |
| Sin sesión en servidor | El filtro es sin estado; no hay cookie de sesión de contenedor, lo que elimina la clase de ataques de fijación de sesión. |
| Comparison de contraseña con coste | BCrypt con factor 10. El coste se eleva automáticamente con el hardware. |
| Nada de secretos en el repositorio | Solo existe un archivo de ejemplo con valores de desarrollo. |