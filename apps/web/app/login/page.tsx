/**
 * Stockly — login page. RHF + Zod → POST /auth/login → /admin/products.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { zLoginRequest, type LoginRequest } from '@stockly/shared/types/auth';
import { notifications } from '@mantine/notifications';

import { login } from '../../src/lib/api/auth-api';
import { ApiError } from '../../src/lib/api/api-error';
import { useT } from '../../src/i18n/I18nProvider';

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const [pending, setPending] = useState(false);
  const { register, handleSubmit, formState } = useForm<LoginRequest>({
    resolver: zodResolver(zLoginRequest),
  });

  return (
    <Stack align="center" justify="center" mih="80vh" gap="md">
      <Paper withBorder shadow="sm" p="xl" w={380}>
        <Title order={1} size="h2" c="stockly-blue.6">{t('login.title')}</Title>
        <Text size="sm" c="dimmed">{t('login.subtitle')}</Text>
        <form
          onSubmit={handleSubmit(async (v) => {
            setPending(true);
            try {
              await login(v);
              notifications.show({closeButtonProps: { 'aria-label': 'Cerrar notificación' },  title: t('login.welcome.title'), message: t('login.welcome.message'), color: 'green' });
              router.replace('/admin/products');
            } catch (e) {
              const msg = e instanceof ApiError ? e.userMessage : t('login.error.message');
              notifications.show({closeButtonProps: { 'aria-label': 'Cerrar notificación' },  title: t('login.error.title'), message: msg, color: 'red' });
            } finally {
              setPending(false);
            }
          })}
        >
          <Stack mt="md">
            <TextInput label={t('login.email')} placeholder="admin@stockly.co" withAsterisk {...register('email')} error={formState.errors.email?.message} />
            <PasswordInput label={t('login.password')} withAsterisk {...register('password')} error={formState.errors.password?.message} />
            <Button type="submit" color="stockly-blue.6" loading={pending}>{t('login.submit')}</Button>
          </Stack>
        </form>

        <Text size="sm" mt="md" ta="center">
          {t('login.noAccount')}{' '}
          <Anchor component={Link} href="/register" size="sm" underline="always">
            {t('login.registerLink')}
          </Anchor>
        </Text>
      </Paper>
    </Stack>
  );
}
