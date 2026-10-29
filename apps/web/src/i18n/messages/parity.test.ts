/**
 * Stockly — paridad y calidad de los diccionarios i18n (FE-T6).
 *
 * `en` ya está tipado como `Record<MessageKey, string>` (una clave faltante es
 * error de compilación). Este test cubre lo que el tipo no puede ver: valores
 * vacíos, textos con padding y la regresión de autoría/licencia que los E2E
 * FL-02 y el footer exigen (3 autores + MIT).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import { describe, expect, it } from 'vitest';

import { en } from './en';
import { esCO } from './es-CO';

const DICTIONARIES = [
  ['es-CO', esCO],
  ['en', en],
] as const;

describe('diccionarios i18n', () => {
  it('ambos locales exponen exactamente las mismas claves', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(esCO).sort());
  });

  it('ningún valor está vacío ni es solo espacios', () => {
    for (const [locale, dictionary] of DICTIONARIES) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value, `${locale}:${key} está vacío`).not.toBe('');
        expect(value.trim(), `${locale}:${key} es solo espacios`).not.toBe('');
      }
    }
  });

  it('el copyright nombra a los tres autores y la licencia MIT', () => {
    for (const [locale, dictionary] of DICTIONARIES) {
      const copyright = dictionary['shell.footer.copyright'];
      expect(copyright, `${locale} sin copyright`).toContain('Juan Nicolas Urrutia Salcedo');
      expect(copyright, `${locale} sin 2o autor`).toContain('Luisa Maria Jose Coronel Vargas');
      expect(copyright, `${locale} sin 3er autor`).toContain('Ana Sofía Montaña Cedeño');
      expect(copyright, `${locale} sin año`).toContain('2026');
      expect(dictionary['shell.footer.license'], `${locale} sin licencia`).toContain('MIT');
    }
  });

  it('las etiquetas del panel de admin existen en ambos locales', () => {
    for (const key of [
      'admin.stock.out',
      'admin.stock.low',
      'admin.stock.inStock',
    ] as const) {
      expect(esCO[key], `es-CO:${key}`).toBeTruthy();
      expect(en[key], `en:${key}`).toBeTruthy();
    }
  });
});