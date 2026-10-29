import { test, expect } from './fixtures';
import { ProductsPage } from './pom/ProductsPage';
import { ProductFormPage } from './pom/ProductFormPage';
import { uniqueSku } from './helpers/api';

/**
 * F3 — FL-04/FL-05/FL-06/FL-07-logout (spec_id=13).
 * CRUD completo por UI con seed y limpieza por API.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
test('FL-05 crear válido aparece en la lista', async ({ authedPage }) => {
  const sku = uniqueSku('F3');
  const products = new ProductsPage(authedPage);
  await products.goNew();
  const form = new ProductFormPage(authedPage);
  await form.fill({ sku, name: 'Café F3', price: '12500.50', stock: '10', category: 'Bebidas' });
  await form.submitCreate();
  await products.expectRowVisible(sku);
});

test('FL-05 crear con SKU inválido no sale del form', async ({ authedPage }) => {
  const products = new ProductsPage(authedPage);
  await products.goNew();
  const form = new ProductFormPage(authedPage);
  await form.fill({ sku: 'mal', name: 'X', price: '1', stock: '1', category: 'Y' });
  await authedPage.getByRole('button', { name: /crear producto/i }).click();
  await expect(authedPage).toHaveURL(/\/admin\/products\/new/);
  await expect(authedPage.getByText(/sku/i).first()).toBeVisible();
});

test('FL-06 editar renombra y persiste', async ({ authedPage, seededProduct }) => {
  const products = new ProductsPage(authedPage);
  await authedPage.goto(`/admin/products/${seededProduct.id}/edit`);
  const form = new ProductFormPage(authedPage);
  const nuevo = `Renombrado ${Date.now().toString(36)}`;
  await form.fill({ name: nuevo });
  await form.submitSave();
  await products.expectRowVisible(nuevo);
});

test('FL-04 eliminar por UI desactiva la fila (soft-delete)', async ({ authedPage, seededProduct }) => {
  const products = new ProductsPage(authedPage);
  await products.goto();
  await products.expectRowVisible(seededProduct.sku);
  await products.deleteBySku(seededProduct.sku);
  // Soft-delete por diseño (T4): la fila sigue visible con badge Inactivo.
  const row = authedPage.getByRole('row', { name: new RegExp(seededProduct.sku) });
  await expect(row.getByText(/inactivo/i)).toBeVisible();
});

test('FL-07 logout vuelve al login', async ({ authedPage }) => {
  const products = new ProductsPage(authedPage);
  await products.goto();
  await products.logout();
  await expect(authedPage.getByRole('button', { name: /entrar/i })).toBeVisible();
});
