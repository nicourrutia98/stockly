/**
 * Stockly — route error boundary (FE-T5).
 *
 * Next renders this when a client render or a data fetch throws. It must be a
 * client component and stay inside the root layout (Providers, i18n, auth).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, Center, Group, Stack, Text, Title } from '@mantine/core';

import { AppShell } from '../src/components/layout/AppShell';
import { useI18n } from '../src/i18n/I18nProvider';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error('[stockly] route error', error);
  }, [error]);

  return (
    <AppShell>
      <Center mih={320} p="lg">
        <Stack align="center" gap="sm" maw={480}>
          <Text fz={44} fw={700} c="#B91C1C" aria-hidden>
            500
          </Text>
          <Title order={1} size="h3">
            {t('error.title')}
          </Title>
          <Text c="dimmed" ta="center">
            {t('error.body')}
          </Text>
          {error.digest ? (
            <Text size="xs" c="dimmed" ff="JetBrains Mono, monospace">
              {error.digest}
            </Text>
          ) : null}
          <Group gap="sm">
            <Button onClick={reset} color="#0F4C81">
              {t('admin.retry')}
            </Button>
            <Button component={Link} href="/catalogo" variant="default">
              {t('error.back')}
            </Button>
          </Group>
        </Stack>
      </Center>
    </AppShell>
  );
}