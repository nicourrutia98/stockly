/**
 * Stockly — admin product detail.
 *
 * FE-T4: read-only view with breadcrumbs, status/stock badges, audit dates
 * and a reversible soft-delete action (reactivate) when the row is inactive.
 * Hooks live in `ProductDetailContent` so nothing fetches before the guard.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { use, type ReactNode } from 'react';
import Link from 'next/link';
import { Badge, Button, Divider, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { AdminBreadcrumbs } from '../../../../src/components/admin/AdminBreadcrumbs';
import { ProtectedRoute } from '../../../../src/components/admin/ProtectedRoute';
import { AppShell } from '../../../../src/components/layout/AppShell';
import { useI18n } from '../../../../src/i18n/I18nProvider';
import { useProduct, useSetProductActive } from '../../../../src/hooks/useProducts';
import { ApiError } from '../../../../src/lib/api/api-error';
import { formatCOP } from '../../../../src/lib/catalog-api';
import { stockTone } from '../../../../src/lib/stock';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={500}>{children}</Text>
    </Stack>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ProtectedRoute requireAdmin>
      <AppShell>
        <ProductDetailContent params={params} />
      </AppShell>
    </ProtectedRoute>
  );
}

function ProductDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const numId = Number(id);
  const { t, locale } = useI18n();
  const { data, isLoading, isError } = useProduct(numId, Number.isFinite(numId));
  const activate = useSetProductActive();

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

  return (
    <Stack p="lg" gap="md">
      <AdminBreadcrumbs items={[{ label: data?.sku ?? `#${id}` }]} />
      <Title order={1} size="h2" c="stockly-blue.6">
        {data?.name ?? `#${id}`}
      </Title>

      {isLoading ? (
        <p>{t('admin.loading')}</p>
      ) : isError || !data ? (
        <Stack gap="sm" align="flex-start">
          <Text>{t('admin.detail.notFound')}</Text>
          <Button component={Link} href="/admin/products" variant="default">
            {t('admin.detail.back')}
          </Button>
        </Stack>
      ) : (
        <>
          <Paper p="lg" withBorder radius="md">
            <Stack gap="md">
              <Group gap="xs">
                <Badge color={data.active ? '#15803D' : '#64748B'}>
                  {data.active ? t('admin.status.active') : t('admin.status.inactive')}
                </Badge>
                {(() => {
                  const tone = stockTone(data.stock);
                  return (
                    <Badge color={tone.color}>
                      {tone.labelKey === 'admin.stock.low'
                        ? t(tone.labelKey, { n: data.stock })
                        : t(tone.labelKey)}
                    </Badge>
                  );
                })()}
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Field label={t('admin.table.sku')}>
                  <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>{data.sku}</code>
                </Field>
                <Field label={t('admin.table.category')}>{data.category}</Field>
                <Field label={t('admin.table.price')}>{formatCOP(data.price)}</Field>
                <Field label={t('admin.table.stock')}>{data.stock}</Field>
                <Field label={t('admin.detail.createdAt')}>{formatDate(data.createdAt)}</Field>
                <Field label={t('admin.detail.updatedAt')}>{formatDate(data.updatedAt)}</Field>
              </SimpleGrid>

              <Divider />
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  {t('admin.detail.description')}
                </Text>
                <Text>{data.description?.trim() || t('admin.detail.noDescription')}</Text>
              </Stack>
            </Stack>
          </Paper>

          <Group>
            <Button component={Link} href={`/admin/products/${data.id}/edit`} color="#0F4C81">
              {t('admin.detail.edit')}
            </Button>
            {!data.active && (
              <Button
                color="#15803D"
                loading={activate.isPending}
                onClick={() =>
                  activate.mutate(
                    { id: data.id, active: true },
                    {
                      onSuccess: () =>
                        notifications.show({
                          closeButtonProps: { 'aria-label': 'Cerrar notificación' },
                          title: t('admin.reactivated.title'),
                          message: t('admin.reactivated.message', { id: data.id }),
                          color: 'green',
                        }),
                      onError: (e) =>
                        notifications.show({
                          closeButtonProps: { 'aria-label': 'Cerrar notificación' },
                          title: t('admin.deleteError.title'),
                          message:
                            e instanceof ApiError
                              ? e.userMessage
                              : t('admin.reactivateError.message'),
                          color: 'red',
                        }),
                    },
                  )
                }
              >
                {t('admin.reactivate')}
              </Button>
            )}
            <Button component={Link} href="/admin/products" variant="default">
              {t('admin.detail.back')}
            </Button>
          </Group>
        </>
      )}
    </Stack>
  );
}
