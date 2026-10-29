# Stockly

> Inventario inteligente — Bilingual product inventory platform (es-CO / en) built as a university fullstack showcase.

---

## ⚖️ Autoría y licencia · Authorship & License

**Autor:** Juan Nicolas Urrutia Salcedo
**Código estudiantil:** u20182173626
**Institución:** Universidad Surcolombiana de Neiva (USCO) — Neiva, Huila, Colombia
**Materia:** Inteligencia Artificial
**Año:** 2026

**Licencia:** MIT — ver [`LICENSE`](./LICENSE).

> Este proyecto fue desarrollado con fines académicos en el marco de la materia
> "Inteligencia Artificial" de la Universidad Surcolombiana de Neiva. Su
> distribución y reutilización, conforme a los términos de la Licencia MIT,
> debe conservar el aviso de copyright y los textos de permiso y limitación
> de responsabilidad incluidos en `LICENSE`.

---

## 🇪🇸 Español

**Stockly** es una plataforma fullstack para gestión de inventario de productos, construida como proyecto universitario con stack de producción real. El objetivo es demostrar dominio de:

- **Frontend moderno:** Next.js 15 (App Router) + React 19 + TypeScript estricto + Mantine v7.
- **Backend robusto:** Spring Boot 3 + JPA/Hibernate + PostgreSQL + Redis + JWT con rotación.
- **Calidad verificable:** JaCoCo (line coverage ≥80%), PIT (mutation score ≥60%), Testcontainers, Contract tests.
- **Gobernanza:** Cada cambio auditable vía [dark-memory](https://github.com/anomalyco/opencode) — la spec viva es `spec_id=6`.

### Inicio rápido

Requisitos: Node 20+, pnpm 9+, JDK 17+, Maven 3.9+, Docker.

```bash
pnpm install
docker compose up -d
pnpm dev
```

Backend: <http://localhost:8080> · Frontend: <http://localhost:3000> · Swagger UI: <http://localhost:8080/swagger-ui.html>

### Estructura del monorepo

| Carpeta           | Descripción                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `apps/web`        | Next.js 15 App Router (UI pública, panel admin, i18n es-CO/en).   |
| `apps/backend`    | Spring Boot 3 (REST API, JWT auth, JPA, Redis, OpenAPI/Swagger).  |
| `packages/shared` | Tipos TypeScript + esquemas Zod compartidos entre web y backend.  |

### Archivos legales en la raíz

| Archivo       | Contenido                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `LICENSE`     | Licencia MIT (Copyright 2026 Juan Nicolas Urrutia Salcedo).                                      |
| `README.md`   | Este archivo.                                                                                   |

> La página visible en UI con toda la información de autoría y licencia se
> encuentra en `apps/web/app/about/page.tsx` y se renderiza en
> <http://localhost:3000/about> cuando la app está corriendo.

### Comandos

| Comando       | Acción                                                  |
| ------------- | ------------------------------------------------------- |
| `pnpm dev`    | Levanta web + backend en paralelo (Turborepo).          |
| `pnpm build`  | Compila todos los paquetes y apps en orden de deps.    |
| `pnpm test`   | Ejecuta tests + cobertura (JaCoCo + PIT en backend).    |
| `pnpm lint`   | ESLint (web) + Checkstyle/Spotless (backend).           |
| `pnpm clean`  | Borra artefactos (`dist`, `.next`, `target`, `.turbo`). |

### Branding

Paleta, tipografía y reglas visuales están en [`assets/BRANDING.md`](assets/BRANDING.md). Logos: `assets/logo-mark.svg`, `assets/logo-wordmark.svg`, `assets/favicon.svg`. WCAG AAA validado en combinaciones primarias.

### Gobernanza

Este proyecto se desarrolla bajo contrato de especificación versionada: **`dark-memory` spec_id=6**. Cada entregable (T1…T14) es publicado, juzgado y resuelto por un operador humano vía `vibe_publish` + `drift_judge`. Cambios fuera del contrato requieren `drift_log` + `resolve_drift`.

---

## 🇬🇧 English

**Stockly** is a fullstack product inventory platform built as a university project with a production-grade stack. It showcases:

- **Modern frontend:** Next.js 15 (App Router) + React 19 + strict TypeScript + Mantine v7.
- **Robust backend:** Spring Boot 3 + JPA/Hibernate + PostgreSQL + Redis + JWT with refresh rotation.
- **Verifiable quality:** JaCoCo (line coverage ≥80%), PIT (mutation score ≥60%), Testcontainers, contract tests.
- **Governance:** Every change audited through [dark-memory](https://github.com/anomalyco/opencode) — the living spec is `spec_id=6`.

### Quick start

Prerequisites: Node 20+, pnpm 9+, JDK 17+, Maven 3.9+, Docker.

```bash
pnpm install
docker compose up -d
pnpm dev
```

Backend: <http://localhost:8080> · Frontend: <http://localhost:3000> · Swagger UI: <http://localhost:8080/swagger-ui.html>

### Workspace structure

| Folder     | Description                                                     |
| ----------------- | ----------------------------------------------------------------- |
| `apps/web`        | Next.js 15 App Router (public UI, admin panel, es-CO/en i18n).    |
| `apps/backend`    | Spring Boot 3 (REST API, JWT auth, JPA, Redis, OpenAPI/Swagger).  |
| `packages/shared` | Shared TypeScript types + Zod schemas between web and backend.    |

### Development commands

| Command       | Action                                                  |
| ------------- | ------------------------------------------------------- |
| `pnpm dev`    | Start web + backend in parallel (Turborepo).            |
| `pnpm build`  | Compile all packages and apps in dependency order.      |
| `pnpm test`   | Run tests + coverage (JaCoCo + PIT on backend).         |
| `pnpm lint`   | ESLint (web) + Checkstyle/Spotless (backend).           |
| `pnpm clean`  | Remove artifacts (`dist`, `.next`, `target`, `.turbo`).  |

### Branding

Palette, typography, and visual rules live in [`assets/BRANDING.md`](assets/BRANDING.md). Logos: `assets/logo-mark.svg`, `assets/logo-wordmark.svg`, `assets/favicon.svg`. WCAG AAA validated on primary combinations.

### Spec governance

This project is developed under a versioned spec contract: **`dark-memory` spec_id=6**. Each deliverable (T1…T14) is published, judged, and resolved by a human operator via `vibe_publish` + `drift_judge`. Out-of-contract changes require `drift_log` + `resolve_drift`.

---

## License

MIT (educational project).