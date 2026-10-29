import type { Page } from '@playwright/test';

/**
 * POM FL-04 Lista de productos.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
export class ProductsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/admin/products');
  }

  async expectRowVisible(sku: string) {
    // La lista cachea 15s (staleTime): si el seed se creó vía API después
    // del primer fetch, recargamos como haría un usuario real.
    await this.page.reload();
    await this.page.getByRole('heading', { name: /productos/i }).waitFor();
    await this.page.getByRole('cell', { name: sku }).first().waitFor();
  }

  async deleteBySku(sku: string) {
    const row = this.page.getByRole('row', { name: new RegExp(sku) });
    this.page.once('dialog', (d) => void d.accept());
    await row.getByRole('button', { name: /eliminar/i }).click();
  }

  async goNew() {
    await this.page.getByRole('link', { name: /nuevo/i }).click();
    await this.page.waitForURL(/\/admin\/products\/new/);
  }

  async logout() {
    await this.page.getByRole('button', { name: /salir/i }).click();
    await this.page.waitForURL(/\/login/);
  }
}
