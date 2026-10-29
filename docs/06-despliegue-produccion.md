# 06 — Despliegue en producción

> Dónde vive cada pieza en producción, con qué variables de entorno se
> configura, en qué orden se despliega y cómo se verifica que el conjunto
> funciona. Incluye la decisión de por qué el backend **no** puede ir en Vercel.

---

## 1. Topología de producción

| Pieza | Dónde vive | Artefacto | URL pública |
|---|---|---|---|
| Frontend (Next.js 15) | **Vercel** | `apps/web` (monorepo pnpm) | `https://<proyecto>.vercel.app` |
| Backend (Spring Boot 3.4.1 / Java 17) | **Host de contenedores** (Railway, Render, Fly.io, Cloud Run) | `apps/backend/Dockerfile` | `https://<backend>.up.railway.app` |
| PostgreSQL 16 | Gestionado del mismo proveedor | — | red privada del proveedor |
| Redis 7 | Gestionado (Upstash o el del proveedor) | — | red privada del proveedor |

Regla mental: **Vercel sirve el frontend; el backend es un servicio de
contenedores.** Vercel aloja el HTML y los assets; el navegador del usuario es
quien llama a la API, por eso la URL del backend tiene que ser pública y el
frontend necesita conocerla en tiempo de build.

---

## 2. Por qué el backend no puede desplegarse en Vercel

Vercel ejecuta funciones **serverless de corta vida** sobre runtimes_NODE,
Python, Go y Ruby. Un backend Spring Boot es un proceso JVM de larga duración
que, además, necesita:

| Necesidad | Vercel | Railway / Render / Cloud Run |
|---|---|---|
| Runtime Java (JVM 17) | No existe | Sí (imagen `eclipse-temurin:17-jre`) |
| Proceso de larga duración (conexión WebSocket, pools Hikari, scheduler) | No | Sí |
| PostgreSQL persistente con `LISTEN/NOTIFY` y Liquibase | No | Sí |
| Redis persistente | No | Sí |
| Migraciones al arrancar (Liquibase) | No (la función se apaga) | Sí |

Alternativas descartadas y por qué:

- **Reescribir la API en functions de Vercel:** convertiría el backend de Java
  en Node duplicando toda la lógica de negocio, el modelo de datos y las
  pruebas. No es un despliegue, es un segundo proyecto.
- **Proxy en Vercel hacia el backend:** seguiría necesitando el backend en un
  host de contenedores; solo añade una capa.
- **Túnel público (ngrok / Cloudflare Tunnel) hacia el backend local:** sirve
  para una demo de un día, **no** para producción (depende de que esta máquina
  esté encendida, sin TLS propio y con el secreto JWT de desarrollo expuesto).

---

## 3. Variables de entorno del backend

Todas se inyectan desde el panel del proveedor. Los valores entre `()` son los
defaults de desarrollo y **no** deben usarse en producción.

| Variable | Obligatoria | Valor en producción | Por qué |
|---|---|---|---|
| `PORT` | No | puerto que inyecta el proveedor | `server.port: ${PORT:8080}`; Railway/Render lo fijan solos |
| `DATABASE_URL` | Sí | `jdbc:postgresql://<host>:<puerto>/<db>?sslmode=require` | Datasource principal (JDBC, no URL de plataforma) |
| `DATABASE_USERNAME` | Sí | usuario del plan gestionado | |
| `DATABASE_PASSWORD` | Sí | contraseña del plan gestionado | nunca en el repositorio |
| `REDIS_HOST` / `REDIS_PORT` | Sí | host del Redis gestionado | cache y rate limiting |
| `REDIS_PASSWORD` | Según proveedor | token de Upstash o contraseña | vacío solo si el Redis no exige auth |
| `JWT_SECRET` | Sí | **≥ 256 bits aleatorios** | firma HS256; con el default de desarrollo cualquiera puede falsificar un token |
| `COOKIE_SECURE` | Sí | `true` | exige HTTPS en la cookie de refresh |
| `COOKIE_SAME_SITE` | Sí | `None` | ver §5: frontend y backend están en dominios distintos |
| `APP_CORS_ALLOWED_ORIGINS` | Sí | `https://<proyecto>.vercel.app` | allowlist; el backend rechaza cualquier otro origen |
| `SPRING_PROFILES_ACTIVE` | Sí | `prod` | silencia SQL de Hibernate y sube el log a `INFO` |

Generar el secreto JWT:

```bash
openssl rand -base64 48
```

Configuración relevante ya incluida en `apps/backend/src/main/resources/application.yml`:

- `spring.jpa.hibernate.ddl-auto: validate` — Liquibase es la única fuente del
  esquema; si entidades y base de datos divergen, la aplicación **falla al
  arrancar** en vez de corromper datos.
- Las migraciones de Liquibase se ejecutan automáticamente en el arranque del
  contenedor, antes de aceptar tráfico.

---

## 4. Variables de entorno del frontend

| Variable | Valor en producción | Nota |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<backend>/api/v1` | incluye el prefijo `/api/v1`; se **inyecta en el build**, por eso cambiarla exige redeploy, no solo reinicio |

Resolución de la variable en `apps/web/src/lib/env.ts`: valor explícito →
`API_INTERNAL_URL` → default `http://localhost:8080/api/v1`. Sin
`NEXT_PUBLIC_API_URL` en el build, el sitio desplegado intenta llamar a
`localhost` del navegador del visitante y no carga datos.

---

## 5. Cookies y CORS entre dominios distintos

En producción el frontend (`*.vercel.app`) y el backend (`*.up.railway.app`)
son **sitios distintos**. Eso rompe dos cosas si no se configuran:

| Mecanismo | Qué pasa por defecto | Configuración obligatoria |
|---|---|---|
| Cookie de refresh (`stockly_rt`) | `SameSite=Lax` → el navegador no la envía en peticiones de otro sitio → la sesión muere a los 15 min del access token | `COOKIE_SECURE=true` + `COOKIE_SAME_SITE=None` |
| CORS | El navegador bloquea `/api/v1/**` desde el origen del frontend | `APP_CORS_ALLOWED_ORIGINS` con el dominio exacto de Vercel (con esquema, sin barra final) |

El access token vive en memoria (Zustand) y por eso el síntoma inicial de esta
configuración faltante es "todo funciona y de repente cierra sesión"; la
cookie de refresh es la que hay que revisar primero.

---

## 6. Orden de despliegue

1. **Base de datos y Redis** — aprovisionar en el proveedor y guardar las
   credenciales. Sin esto el contenedor de Spring Boot no pasa de Liquibase.
2. **Backend** — en Railway: *New Project → Deploy from GitHub* (o
   `railway up`), se detecta `apps/backend/Dockerfile` automáticamente. En
   Render: servicio *Docker*, context `apps/backend`, health check
   `/actuator/health`. Configurar las variables de §3.
   Esperar a que `/actuator/health` responda `{"status":"UP"}`.
3. **Frontend** — en Vercel, proyecto nuevo conectado al repositorio:

   |Ajuste | Valor |
|---|---|
   | Root Directory | `apps/web` |
   | Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
   | Build Command | `cd ../.. && pnpm --filter @stockly/shared build && pnpm --filter @stockly/web build` |
   | Output Directory | `.next` (lo resuelve el preset de Next.js) |

   El build de `@stockly/shared` es **obligatorio**: el paquete se consume desde
   `dist/`, y sin recompilarlo el frontend compila contra tipos obsoletos o
   falla. Equivalente en el panel: `pnpm --filter @stockly/shared build && pnpm build`.
   Configurar `NEXT_PUBLIC_API_URL` y desplegar.
4. **CORS** — añadir el dominio exacto de producción del frontend a
   `APP_CORS_ALLOWED_ORIGINS` del backend y **re desplegar el backend** (la
   allowlist se lee al arranque). Si el dominio es de preview
   (`*.vercel.app`), conviene fijar un dominio de producción para no editar la
   allowlist en cada preview.
5. **Verificación** — §7.

Archivos que soportan este procedimiento:

| Archivo | Para qué |
|---|---|
| `apps/backend/Dockerfile` | imagen de producción multi-etapa (build Maven → runtime JRE 17, usuario sin privilegios, `HEALTHCHECK`) |
| `apps/backend/.dockerignore` | acota el contexto de build |
| `apps/web/vercel.json` | comandos de instalación y build del monorepo |
| `.vercelignore` | excluye `node_modules`, `target`, artefactos de prueba del upload |

> **El health check no es decorativo.** `/actuator/health` existe porque
> `spring-boot-starter-actuator` está en `pom.xml`. Si esa dependencia falta, la
> ruta devuelve 404 (la sección `management.*` y las rutas públicas de
> `SecurityConfig` no crean endpoints: es configuración muerta), el `HEALTHCHECK`
> del contenedor queda rojo y el proveedor nunca enruta tráfico hacia el
> servicio. Una imagen puede compilar, arrancar y aun así estar inservible para
> el despliegue: por eso §7 exige probarla **en ejecución**.

---

## 7. Verificación posterior al despliegue

```bash
# 1. Backend arriba (200/UP)
curl -fsS https://<backend>/actuator/health

# 2. Login real (200 + accessToken)
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<backend>/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<admin>","password":"<password>"}'

# 3. CORS: el preflight desde el dominio de Vercel debe ser 200 y traer el origen
curl -s -i -X OPTIONS https://<backend>/api/v1/products \
  -H 'Origin: https://<proyecto>.vercel.app' \
  -H 'Access-Control-Request-Method: GET' | grep -i 'HTTP/\|access-control-allow-origin'

# 4. El frontend apunta al backend correcto (y no a localhost)
curl -fsS https://<proyecto>.vercel.app | grep -o 'https://[^"]*api/v1' | head -1
```

Checklist manual sobre `https://<proyecto>.vercel.app`:

| # | Verificación | Resultado esperado |
|---|---|---|
| 1 | Landing, catálogo y `/about` cargan con datos reales | sin `localhost` ni errores de red |
| 2 | Login como administrador | entra al panel `/admin` |
| 3 | Sesión sobrevive más de 15 min (expiración del access token) | el refresh funciona: la cookie exige `SameSite=None; Secure` |
| 4 | Alta y edición de un producto | persiste y aparece en el catálogo público |
| 5 | Cerrar sesión y volver a `/admin` | redirige al login |
| 6 | Consola del navegador | sin errores CORS ni 401 en bucle |

---

## 8. Rollback

| Cambio | Cómo revertirlo |
|---|---|
| Migración Liquibase aplicada | restaurar el snapshot de la base de datos del proveedor y desplegar el commit anterior |
| Frontend | Vercel conserva cada despliegue: *Deployments → ⋯ → Promote to Production* |
| Backend | el proveedor permite redeploy del commit anterior; `ddl-auto: validate` impide que una versión vieja arranque contra un esquema incompatible |
| Variable mal configurada | corregir la variable y **re desplegar** (las variables se leen al arranque; no hay recarga en caliente) |

---

**Autor:** Juan Nicolas Urrutia Salcedo (u20182173626) — Universidad
Surcolombiana de Neiva, Materia Inteligencia Artificial, 2026.
**Licencia:** MIT.