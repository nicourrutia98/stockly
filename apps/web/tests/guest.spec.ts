import { test, expect } from './fixtures';
import { LoginPage } from './pom/LoginPage';

/**
 * F3 — FL-01/FL-02/FL-03-negativo/FL-07-guardia (spec_id=13).
 * Sin auth: landing, about, login inválido, guardia de rutas.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
test('FL-01 landing pública con marca y link about', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/stockly/i).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Acerca de', exact: true })).toBeVisible();
});

test('FL-02 about muestra autoría y licencia MIT', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByText('Juan Nicolas Urrutia Salcedo', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/mit/i).first()).toBeVisible();
});

test('FL-03 login inválido no redirige y avisa', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('nadie@stockly.co', 'ClaveMala1');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(/error/i).first()).toBeVisible();
});

test('FL-07 anónimo es llevado al login', async ({ page }) => {
  await page.goto('/admin/products');
  await expect(page).toHaveURL(/\/login/);
});
