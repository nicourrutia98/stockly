import type { Page } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../helpers/api';

/**
 * POM FL-03 Login. Locators por rol/label visible (nunca clases CSS).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/contrase.a/i).fill(password);
    await this.page.getByRole('button', { name: /entrar/i }).click();
  }

  /** Éxito = llegamos al panel con la tabla de productos. */
  async expectLandedOnAdmin() {
    await this.page.waitForURL(/\/admin\/products\/?$/);
    await this.page.getByRole('heading', { name: /productos/i }).waitFor();
  }
}
