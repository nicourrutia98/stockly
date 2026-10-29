import { defineConfig, devices } from '@playwright/test';

/**
 * Stockly E2E — Playwright harness (F2, spec_id=13).
 *
 * Decisiones SOTA (playwright.dev best-practices):
 * - Sin `storageState`: el access token vive en memoria (Zustand), nunca en
 *   localStorage/cookies JS. Cada test se autentica por la UI (FL-03), que es
 *   además el flujo más crítico. Ver tests/fixtures.ts (`authedPage`).
 * - Seed de datos vía API REST (helpers/api.ts), nunca acoplado a la UI.
 * - `global.setup.ts` falla rápido si el backend o el front no están arriba.
 *
 * Requisitos previos (ver docs/F1-flujos-usuario.md):
 *   backend :8080 (pg5433 + redis) y front :3000 (`pnpm dev`).
 * Variables: E2E_BASE_URL, E2E_API_URL, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }], ['./tests/reporters/psych-reporter.ts']],
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'health',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['health'],
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      dependencies: ['health'],
      testMatch: /.*\.(spec|mobile\.spec)\.ts/,
    },
  ],
});
