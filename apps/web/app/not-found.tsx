/**
 * Stockly — global 404 (FE-T5).
 *
 * Rendered by Next when no route matches. Keeps the shell so the visitor can
 * navigate without going through the login screen.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import Link from 'next/link';
import { Button, Center, Group, Stack, Text, Title } from '@mantine/core';

import { AppShell } from '../src/components/layout/AppShell';
import { useI18n } from '../src/i18n/I18nProvider';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <AppShell>
      <Center mih={320} p="lg">
        <Stack align="center" gap="sm" maw={420}>
          <Text fz={44} fw={700} c="stockly-blue.6" aria-hidden>
            404
          </Text>
          <Title order={1} size="h3">
            {t('notfound.title')}
          </Title>
          <Text c="dimmed" ta="center">
            {t('notfound.body')}
          </Text>
          <Group gap="sm">
            <Button component={Link} href="/" color="#0F4C81">
              {t('notfound.back')}
            </Button>
            <Button component={Link} href="/catalogo" variant="default">
              {t('shell.nav.catalog')}
            </Button>
          </Group>
        </Stack>
      </Center>
    </AppShell>
  );
}