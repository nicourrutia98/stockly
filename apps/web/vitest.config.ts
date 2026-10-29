/**
 * Stockly — configuración de Vitest (FE-T6).
 *
 * Los unit tests viven en `src/**\/*.test.ts`. Los E2E de Playwright viven en
 * `tests/**` y corren con `pnpm test:e2e`. Sin este `include`, Vitest también
 * recolectaba los specs de Playwright y `pnpm test` fallaba con 6 archivos
 * (importan `@playwright/test`, no `vitest`).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'tests/**', '.next/**', 'playwright-report/**'],
    environment: 'node',
  },
});