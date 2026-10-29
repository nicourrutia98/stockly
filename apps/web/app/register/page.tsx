/**
 * Stockly — registration page.
 *
 * Creates a ROLE_USER account via `POST /auth/register`, then redirects
 * to /login. The confirmation field is client-only (never sent): it is
 * validated with a Zod refinement before RHF submits.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { zRegisterRequest } from '@stockly/shared/types/auth';

import { register } from '../../src/lib/api/auth-api';
import { ApiError } from '../../src/lib/api/api-error';
import { useT } from '../../src/i18n/I18nProvider';

/** Wire payload: same rules as the shared schema, plus a local confirm field. */
const zForm = zRegisterRequest
  .extend({ confirmPassword: z.string().min(1) })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'register.confirmMismatch',
  });

type FormValues = z.infer<typeof zForm>;

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const [pending, setPending] = useState(false);
  const { register: field, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(zForm),
  });

  return (
    <Stack align="center" justify="center" mih="80vh" gap="md">
      <Paper withBorder shadow="sm" p="xl" w={400}>
        <Title order={1} size="h2" c="stockly-blue.6">
          {t('register.title')}
        </Title>
        <Text size="sm" c="dimmed">
          {t('register.subtitle')}
        </Text>

        <form
          onSubmit={handleSubmit(async (values) => {
            setPending(true);
            try {
              const { confirmPassword: _confirm, ...body } = values;
              await register(body);
              notifications.show({closeButtonProps: { 'aria-label': 'Cerrar notificación' }, 
                title: t('register.created.title'),
                message: t('register.created.message'),
                color: 'green',
              });
              router.replace('/login');
            } catch (e) {
              const message =
                e instanceof ApiError
                  ? e.status === 409
                    ? t('register.emailTaken')
                    : e.userMessage
                  : t('register.error.message');
              notifications.show({closeButtonProps: { 'aria-label': 'Cerrar notificación' },  title: t('register.error.title'), message, color: 'red' });
            } finally {
              setPending(false);
            }
          })}
        >
          <Stack mt="md">
            <TextInput
              label={t('register.email')}
              placeholder="operador@stockly.co"
              autoComplete="email"
              withAsterisk
              {...field('email')}
              error={formState.errors.email?.message}
            />
            <PasswordInput
              label={t('register.password')}
              autoComplete="new-password"
              withAsterisk
              {...field('password')}
              error={formState.errors.password?.message}
            />
            <PasswordInput
              label={t('register.confirm')}
              autoComplete="new-password"
              withAsterisk
              {...field('confirmPassword')}
              error={
                formState.errors.confirmPassword?.message
                  ? t('register.confirmMismatch')
                  : undefined
              }
            />
            <Button type="submit" color="stockly-blue.6" loading={pending}>
              {t('register.submit')}
            </Button>
          </Stack>
        </form>

        <Text size="sm" mt="md" ta="center">
          {t('register.haveAccount')}{' '}
          <Anchor component={Link} href="/login" size="sm">
            {t('register.signIn')}
          </Anchor>
        </Text>
      </Paper>
    </Stack>
  );
}
