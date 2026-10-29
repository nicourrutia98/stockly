/**
 * Stockly — unit tests del mapeo de tono de inventario (FE-T6).
 *
 * Cubre los bordes exactos de los umbrales del producto (0 y 3) porque el
 * detalle y la tabla dependen de esta función para el color y la etiqueta
 * traducida; un `>`vs `>=` mal puesto rompe el badge en producción.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import { describe, expect, it } from 'vitest';

import { stockTone } from './stock';

describe('stockTone', () => {
  it('marca agotado en 0 y en negativos', () => {
    expect(stockTone(0)).toEqual({ color: '#B91C1C', labelKey: 'admin.stock.out' });
    expect(stockTone(-1)).toEqual({ color: '#B91C1C', labelKey: 'admin.stock.out' });
  });

  it('marca stock bajo de 1 a 3 (borde superior incluido)', () => {
    for (const qty of [1, 2, 3]) {
      expect(stockTone(qty)).toEqual({ color: '#B45309', labelKey: 'admin.stock.low' });
    }
  });

  it('marca disponible desde 4 en adelante', () => {
    for (const qty of [4, 5, 999]) {
      expect(stockTone(qty)).toEqual({ color: '#15803D', labelKey: 'admin.stock.inStock' });
    }
  });

  it('usa colores con contraste AA sobre texto blanco', () => {
    // WCAG AA para texto normal es 4.5:1; estos tres tonos superan ese umbral.
    const MIN_CONTRAST = 4.5;
    for (const qty of [0, 2, 9]) {
      const { color } = stockTone(qty);
      const hex = color.replace('#', '');
      const [r, g, b] = [0, 2, 4].map((i) => {
        const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      expect((1.05) / (luminance + 0.05)).toBeGreaterThan(MIN_CONTRAST);
    }
  });
});