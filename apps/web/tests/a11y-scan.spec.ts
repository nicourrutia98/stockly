import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

/**
 * Diagnóstico a11y (turno intuición/accesibilidad): escaneo axe en las
 * 3 páginas troncales. Falla solo ante violaciones `serious`/`critical`
 * para no bloquear por falsos positivos `moderate`.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
const PAGES = ['/', '/login', '/admin/products', '/admin/products/new'] as const;

for (const url of PAGES) {
  test(`a11y ${url} sin violaciones serious/critical`, async ({ authedPage }) => {
    await authedPage.goto(url);
    // Deja asentar la hidratación CSR antes de escanear.
    await authedPage.getByRole('heading').first().waitFor().catch(() => undefined);
    const results = await new AxeBuilder({ page: authedPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const grave = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    for (const v of grave) {
      // eslint-disable-next-line no-console
      console.log(`[axe] ${url} ${v.id} (${v.impact}): ${v.nodes.length} nodos — ${v.help}`);
    }
    expect(grave, `${url}: ${grave.map((v) => v.id).join(', ')}`).toHaveLength(0);
  });
}
