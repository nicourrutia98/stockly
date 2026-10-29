import { test as setup } from '@playwright/test';

/**
 * Health gate (F2): falla rápido con mensaje accionable si el backend
 * o el frontend no están arriba. Corre antes que `chromium`/`mobile`.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
const API = process.env.E2E_API_URL ?? 'http://localhost:8080/api/v1';

setup('backend alive', async ({ request }) => {
  const res = await request.post(`${API}/auth/login`, {
    data: { email: 'probe@stockly.co', password: 'wrong' },
  });
  // 400/401 = el backend responde (rechaza credenciales malas). Otro código = caído.
  if (![400, 401].includes(res.status())) {
    throw new Error(
      `Backend no responde en ${API} (status ${res.status()}). Levanta pg5433 + redis + :8080.`,
    );
  }
});

setup('frontend alive', async ({ page }) => {
  const res = await page.goto('/login');
  if (!res || !res.ok()) {
    throw new Error(
      `Frontend no responde en ${process.env.E2E_BASE_URL ?? 'http://localhost:3000'}. Corre \`pnpm dev\`.`,
    );
  }
});
