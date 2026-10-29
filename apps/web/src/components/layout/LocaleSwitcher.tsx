/**
 * Stockly — locale switcher (es-CO | en).
 *
 * A two-option segmented control. Uses `aria-pressed` instead of relying
 * on color alone, and exposes the full language name as the accessible
 * label while showing the short code.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { Group, UnstyledButton } from '@mantine/core';

import { useI18n } from '../../i18n/I18nProvider';
import { LOCALES, type Locale } from '../../i18n/types';

const SHORT: Record<Locale, string> = { 'es-CO': 'ES', en: 'EN' };

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <Group
      gap={2}
      role="group"
      aria-label={t('shell.locale.label')}
      style={{
        border: '1px solid var(--color-gray-200)',
        borderRadius: 999,
        padding: 2,
        background: '#fff',
      }}
    >
      {LOCALES.map((option) => {
        const active = option === locale;
        const label = option === 'es-CO' ? t('shell.locale.es') : t('shell.locale.en');
        return (
          <UnstyledButton
            key={option}
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={() => setLocale(option)}
            style={{
              padding: compact ? '0.2rem 0.5rem' : '0.3rem 0.65rem',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              background: active ? 'var(--color-primary-500)' : 'transparent',
              color: active ? '#fff' : 'var(--color-gray-700)',
              transition: 'background 120ms ease, color 120ms ease',
            }}
          >
            {SHORT[option]}
          </UnstyledButton>
        );
      })}
    </Group>
  );
}
