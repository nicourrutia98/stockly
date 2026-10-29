# E2E Stockly (Playwright, F2 spec_id=13)

Requisitos previos (una vez por máquina):
- `pg5433` + `redis` arriba (`docker ps`)
- Backend `:8080` (`mvn spring-boot:run` en `apps/backend` con `DATABASE_URL=...5433...`)
- Frontend `:3000` (`pnpm dev` en `apps/web`)
- Admin seed en pg5433: `admin@stockly.co` / `Admin1234` (ROLE_ADMIN)

Variables (opcionales, estos son los defaults):
```bash
E2E_BASE_URL=http://localhost:3000
E2E_API_URL=http://localhost:8080/api/v1
E2E_ADMIN_EMAIL=admin@stockly.co
E2E_ADMIN_PASSWORD=Admin1234
```

Comandos (desde `apps/web`):
```bash
pnpm test:e2e          # chromium + mobile
pnpm test:e2e:ui       # modo UI para depurar
pnpm test:e2e:report   # abre el reporte HTML
```

Diseño: sin `storageState` (el token vive en memoria Zustand; cada test
hace login real por UI vía fixture `authedPage`). Seed y limpieza por API
REST con SKU único por test. Trace guardado solo al primer reintento.
