/**
 * Stockly — Mantine theme + brand tokens (single source of truth).
 *
 * Mirrors `assets/BRANDING.md` §2 (palette) and §3 (typography). Every
 * Mantine surface consumes these values, so a brand tweak only needs to
 * happen here — not in twenty inline `style={{ color: '#0F4C81' }}` props.
 *
 * Both ramps expose the full 10 shades Mantine expects. The 500/600/700
 * slots are pinned to the documented brand hex values so that
 * `color="stockly-blue"` lands on `#0F4C81` in light mode.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import { createTheme, type MantineColorsTuple } from '@mantine/core';

/** Raw hex tokens — use for non-Mantine surfaces (CSS vars, SVG, emails). */
export const brandTokens = {
  primary500: '#0F4C81',
  primary400: '#1E5AA8',
  primary600: '#0A3B66',
  accent500: '#F5B700',
  gray900: '#0F172A',
  gray700: '#334155',
  gray500: '#64748B',
  gray200: '#E2E8F0',
  gray100: '#F1F5F9',
  gray50: '#F8FAFC',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
} as const;

/** Cognitive blue — primary. Index 6 === #0F4C81 (Mantine default shade). */
export const stocklyBlue: MantineColorsTuple = [
  '#eef4fb',
  '#d9e7f5',
  '#b3cfee',
  '#8ab4e4',
  '#639ad9',
  '#3f80c9',
  '#0F4C81', // 6 — primary
  '#1E5AA8', // 7 — hover / gradient start
  '#0A3B66', // 8 — active
  '#072a4a', // 9
];

/** Accent yellow — highlights, badges, secondary CTA. */
export const stocklyYellow: MantineColorsTuple = [
  '#fffaeb',
  '#fff3c6',
  '#ffe588',
  '#ffd149',
  '#F5B700', // 4 — accent
  '#e0a500',
  '#c08d00',
  '#97700a',
  '#6b530e',
  '#3f3208',
];

export const theme = createTheme({
  primaryColor: 'stockly-blue',
  primaryShade: { light: 6, dark: 7 },
  colors: {
    'stockly-blue': stocklyBlue,
    'stockly-yellow': stocklyYellow,
  },
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", ui-monospace, "JetBrains Mono", monospace',
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Button: {
      defaultProps: { radius: 'md' },
    },
    Paper: {
      defaultProps: { radius: 'md' },
    },
    TextInput: {
      defaultProps: { radius: 'md' },
    },
    PasswordInput: {
      defaultProps: { radius: 'md' },
    },
  },
});

export type StocklyTheme = typeof theme;
