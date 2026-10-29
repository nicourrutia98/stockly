/**
 * Stockly — formato monetario unico.
 *
 * Se extrajo de `catalog-api.ts` porque el mismo formato lo necesitan la
 * tienda publica, el panel de indicadores y la tabla de productos del admin.
 * Tres copias del formateador es como la tabla del admin termino pintando
 * `$8900.00` (estilo US) mientras el catalogo pintaba `$ 8.900` (es-CO).
 *
 * Que la moneda cambie con el idioma activo (COP en es-CO, USD en en) sigue
 * siendo una brecha abierta: ver `docs/04-estado-y-brechas.md` B-15.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}