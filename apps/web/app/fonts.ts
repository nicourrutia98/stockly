/**
 * Stockly — self-hosted brand fonts.
 *
 * `next/font/google` downloads at build time and crashed in this
 * environment (Google returned extension-less font URLs). Self-hosting
 * the latin subset removes the network dependency, keeps builds
 * reproducible and still gives Next.js `display: swap` + size-adjust.
 *
 * Files live in `app/fonts/` (latin subset only: Spanish accents
 * — á é í ó ú ñ ü — are included in Google's latin bucket).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
import localFont from 'next/font/local';

/** Inter — primary UI font (weights 400/500/600/700). */
export const inter = localFont({
  src: [
    { path: './fonts/inter-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/inter-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/inter-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/inter-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});

/** JetBrains Mono — SKUs, codes, IDs, technical badges. */
export const jetbrainsMono = localFont({
  src: [
    { path: './fonts/jetbrains-mono-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/jetbrains-mono-500.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
});
