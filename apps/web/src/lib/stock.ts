/**
 * Stockly — stock tone mapping (shared by table and detail views).
 *
 * Thresholds are a product decision, not a backend rule:
 *   0      → out of stock (red)
 *   1..3   → low stock (amber)
 *   > 3    → available (green)
 *
 * All three colors keep ≥4.5:1 contrast against white label text (WCAG AA).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import type { MessageKey } from '../i18n/types';

export interface StockTone {
  color: string;
  labelKey: Extract<MessageKey, 'admin.stock.out' | 'admin.stock.low' | 'admin.stock.inStock'>;
}

export function stockTone(stock: number): StockTone {
  if (stock <= 0) return { color: '#B91C1C', labelKey: 'admin.stock.out' };
  if (stock <= 3) return { color: '#B45309', labelKey: 'admin.stock.low' };
  return { color: '#15803D', labelKey: 'admin.stock.inStock' };
}
