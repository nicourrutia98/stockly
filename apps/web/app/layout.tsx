import type { Metadata, Viewport } from 'next';
import './globals.css';

import { Providers } from '../src/components/Providers';
import { getServerLocale } from '../src/i18n/server';
import { inter, jetbrainsMono } from './fonts';

/**
 * Inter — primary UI font (weights 400/500/600/700), self-hosted.
 * JetBrains Mono — used for SKU, codes, IDs, technical badges.
 */

export const metadata: Metadata = {
  title: {
    default: 'Stockly',
    template: '%s · Stockly',
  },
  description:
    'Stockly — Inventario inteligente. Plataforma fullstack para gestión de productos (es-CO / en).',
  applicationName: 'Stockly',
  authors: [
    {
      name: 'Juan Nicolas Urrutia Salcedo',
      url: 'https://www.usco.edu.co',
    },
    {
      name: 'Luisa Maria Jose Coronel Vargas',
      url: 'https://www.usco.edu.co',
    },
    {
      name: 'Ana Sofía Montaña Cedeño',
      url: 'https://www.usco.edu.co',
    },
  ],
  creator: 'Juan Nicolas Urrutia Salcedo',
  publisher: 'Universidad Surcolombiana de Neiva',
  keywords: [
    'inventario',
    'inventory',
    'productos',
    'products',
    'stockly',
    'fullstack',
    'inteligencia artificial',
    'universidad surcolombiana',
    'usco',
  ],
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  other: {
    'author':
      'Juan Nicolas Urrutia Salcedo, Luisa Maria Jose Coronel Vargas, Ana Sofía Montaña Cedeño',
    'student-id': 'u20182173626, u20222208436, u20212200775',
    'license': 'MIT',
    'academic-institution': 'Universidad Surcolombiana de Neiva',
    'academic-course': 'Inteligencia Artificial (2026)',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F4C81',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}