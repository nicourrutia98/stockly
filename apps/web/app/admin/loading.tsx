/**
 * Stockly — admin route loading state (FE-T5).
 *
 * Rendered while the segment's server/client work is pending so navigation
 * never shows an empty screen.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { Center, Loader, Stack, Text } from '@mantine/core';

import { AppShell } from '../../src/components/layout/AppShell';
import { useI18n } from '../../src/i18n/I18nProvider';

export default function AdminLoading() {
  const { t } = useI18n();

  return (
    <AppShell>
      <Center mih={220} p="lg">
        <Stack align="center" gap="xs">
          <Loader size="lg" aria-hidden />
          <Text size="sm" c="dimmed">
            {t('admin.loading')}
          </Text>
        </Stack>
      </Center>
    </AppShell>
  );
}