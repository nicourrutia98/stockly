/**
 * Stockly — unit tests del formateo de moneda del catálogo (FE-T6).
 *
 * El catálogo es público y sin sesión, así que es el único módulo que puede
 * renderizar en SSR antes de cualquier login: un `formatCOP` que reviente con
 * decimales o sin separador de miles se ve en la landing.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import { describe, expect, it } from 'vitest';

import { formatCOP } from './catalog-api';

/** Deja solo los dígitos: inmune a espacios (incl. U+00A0) y signos. */
const digits = (value: string): string => value.replace(/\D/g, '');

describe('formatCOP', () => {
  it('agrupa miles con punto en locale es-CO', () => {
    const formatted = formatCOP(1299900);
    expect(formatted).toContain('1.299.900');
    expect(formatted).toContain('$');
  });

  it('formatea cero sin decimales', () => {
    expect(digits(formatCOP(0))).toBe('0');
    expect(formatCOP(0)).not.toContain(',');
  });

  it('redondea a pesos enteros (sin centavos)', () => {
    // maximumFractionDigits: 0 — los centavos no deben aparecer.
    expect(digits(formatCOP(1234.4))).toBe('1234');
    // Intl redondea (half-expand), no trunca: 1.299.900,99 → 1.299.901.
    expect(digits(formatCOP(1299900.99))).toBe('1299901');
    // En es-CO la coma es el separador decimal: si no aparece, no hay centavos.
    expect(formatCOP(1299900.99)).not.toContain(',');
  });

  it('conserva el signo en precios negativos (ajustes de stock)', () => {
    expect(formatCOP(-5000)).toContain('-');
    expect(digits(formatCOP(-5000))).toBe('5000');
  });

  it('es estable entre llamadas (misma entrada, misma salida)', () => {
    expect(formatCOP(45000)).toBe(formatCOP(45000));
  });
});