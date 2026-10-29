import type { Page } from '@playwright/test';

/**
 * POM FL-05/FL-06 Formulario producto (crear + editar comparten componente).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
export interface ProductInput {
  sku?: string;
  name?: string;
  description?: string;
  price?: string;
  stock?: string;
  category?: string;
}

export class ProductFormPage {
  constructor(private readonly page: Page) {}

  async fill(input: ProductInput) {
    if (input.sku !== undefined) await this.page.getByLabel(/sku/i).fill(input.sku);
    if (input.name !== undefined) await this.page.getByLabel(/nombre/i).fill(input.name);
    if (input.description !== undefined)
      await this.page.getByLabel(/descripci.n/i).fill(input.description);
    if (input.price !== undefined) await this.page.getByLabel(/precio/i).fill(input.price);
    if (input.stock !== undefined) await this.page.getByLabel(/stock/i).fill(input.stock);
    if (input.category !== undefined)
      await this.page.getByLabel(/categor.a/i).fill(input.category);
  }

  async submitCreate() {
    await this.page.getByRole('button', { name: /crear producto/i }).click();
    await this.page.waitForURL(/\/admin\/products\/?$/);
  }

  async submitSave() {
    await this.page.getByRole('button', { name: /guardar cambios/i }).click();
    await this.page.waitForURL(/\/admin\/products\/?$/);
  }
}
