/**
 * Stockly — protected route wrapper (client).
 *
 * - On mount runs bootstrapAuth() (silent /refresh via HttpOnly cookie).
 * - While booting shows a Mantine Loader.
 * - If anonymous redirects to /login.
 * - With `requireAdmin`, an authenticated ROLE_USER sees a 403 panel
 *   instead of the admin content.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, Center, Loader, Stack, Text, Title } from '@mantine/core';

import { bootstrapAuth } from '../../lib/api/auth-api';
import { useI18n } from '../../i18n/I18nProvider';
import { selectIsAdmin, useAuth } from '../../store/auth';
import { AppShell } from '../layout/AppShell';

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const status = useAuth((s) => s.status);
  const isAdmin = useAuth(selectIsAdmin);

  useEffect(() => {
    if (status === 'idle') void bootstrapAuth();
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <Center h="60vh">
        <Loader color="stockly-blue.6" />
      </Center>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <AppShell>
        <Center mih="60vh">
          <Stack align="center" gap="xs" maw={420} ta="center">
            <Title order={1} size="h2" c="stockly-blue.6">
              {t('auth.forbidden.title')}
            </Title>
            <Text c="dimmed">{t('auth.forbidden.body')}</Text>
            <Anchor component={Link} href="/" mt="sm">
              {t('auth.forbidden.back')}
            </Anchor>
          </Stack>
        </Center>
      </AppShell>
    );
  }

  return <>{children}</>;
}
