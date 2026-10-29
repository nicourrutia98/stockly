import { test as base, type Page } from '@playwright/test';
import { LoginPage } from './pom/LoginPage';
import {
  createProductSeed,
  deleteProductSeed,
  loginAdmin,
  type SeedProduct,
} from './helpers/api';

/**
 * Fixtures F2 (spec_id=13).
 *
 * - `authedPage`: login real por UI (FL-03) en cada test. Sin storageState
 *   a propósito: el token vive en memoria Zustand, y simularlo por fuera
 *   falsearía el flujo que más importa.
 * - `seededProduct`: producto vía API con SKU único; se elimina al cerrar
 *   el test aunque este falle (aislamiento total entre workers).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
type Fixtures = {
  authedPage: Page;
  adminToken: string;
  seededProduct: SeedProduct;
};

export const test = base.extend<Fixtures>({
  authedPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login();
    await login.expectLandedOnAdmin();
    await use(page);
  },
  adminToken: async ({}, use) => {
    const { accessToken } = await loginAdmin();
    await use(accessToken);
  },
  seededProduct: async ({ adminToken }, use) => {
    const seed = await createProductSeed(adminToken);
    await use(seed);
    await deleteProductSeed(adminToken, seed.id).catch(() => undefined);
  },
});

export { expect } from '@playwright/test';
