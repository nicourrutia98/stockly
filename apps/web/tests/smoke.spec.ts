import { test, expect } from './fixtures';
import { ProductsPage } from './pom/ProductsPage';

/**
 * Smoke del harness F2 (prueba de que el harness funciona, no la matriz F3):
 * FL-03 login válido aterriza en FL-04 con la tabla visible.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
test('login válido aterriza en el panel de productos', async ({ authedPage, seededProduct }) => {
  const products = new ProductsPage(authedPage);
  await products.expectRowVisible(seededProduct.sku);
  await expect(authedPage.getByRole('link', { name: /nuevo/i })).toBeVisible();
});
