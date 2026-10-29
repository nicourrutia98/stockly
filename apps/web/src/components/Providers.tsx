/**
 * Stockly — providers (Mantine + i18n + QueryClient + Notifications).
 *
 * Order matters: Mantine first (styles), then i18n, then data fetching.
 * Theme comes from `src/shared/config/theme.ts` — this file only wires.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import 'mantine-datatable/styles.css';

import { I18nProvider } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/types';
import { theme } from '../shared/config/theme';
import { AuthBootstrap } from './AuthBootstrap';

export function Providers({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [qc] = useState(() => new QueryClient());
  return (
    <MantineProvider theme={theme}>
      <I18nProvider initialLocale={initialLocale}>
        <Notifications position="top-right" />
        <QueryClientProvider client={qc}>
          <AuthBootstrap />
          {children}
        </QueryClientProvider>
      </I18nProvider>
    </MantineProvider>
  );
}
