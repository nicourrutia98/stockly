/**
 * Stockly — admin edit product.
 *
 * FE-T4: `useProduct` runs only after `ProtectedRoute` confirms the session,
 * so a reload never fires a token-less GET that races the silent refresh.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Stack, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { AdminBreadcrumbs } from '../../../../../src/components/admin/AdminBreadcrumbs';
import { ProtectedRoute } from '../../../../../src/components/admin/ProtectedRoute';
import { AppShell } from '../../../../../src/components/layout/AppShell';
import { ProductForm } from '../../../../../src/components/products/ProductForm';
import { useI18n } from '../../../../../src/i18n/I18nProvider';
import { useProduct, useUpdateProduct } from '../../../../../src/hooks/useProducts';
import { ApiError } from '../../../../../src/lib/api/api-error';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ProtectedRoute requireAdmin>
      <AppShell>
        <EditProductContent params={params} />
      </AppShell>
    </ProtectedRoute>
  );
}

function EditProductContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useI18n();
  const numId = Number(id);
  const router = useRouter();
  const { data, isLoading } = useProduct(numId, Number.isFinite(numId));
  const update = useUpdateProduct(numId);

  return (
    <Stack p="lg">
      <AdminBreadcrumbs items={[{ label: `${t('admin.table.edit')} #${id}` }]} />
      <Title order={1} size="h2" c="stockly-blue.6">
        {t('admin.table.edit')} #{id}
      </Title>
      {isLoading || !data ? (
        <p>{t('admin.loading')}</p>
      ) : (
        <ProductForm
          initial={data}
          pending={update.isPending}
          onSubmit={(body) =>
            update.mutate(body as never, {
              onSuccess: () => {
                notifications.show({
                  closeButtonProps: { 'aria-label': 'Cerrar notificación' },
                  title: t('admin.saved.title'),
                  message: t('admin.saved.message'),
                  color: 'green',
                });
                router.replace('/admin/products');
              },
              onError: (e) =>
                notifications.show({
                  closeButtonProps: { 'aria-label': 'Cerrar notificación' },
                  title: t('admin.deleteError.title'),
                  message: e instanceof ApiError ? e.userMessage : t('admin.saveError.message'),
                  color: 'red',
                }),
            })
          }
        />
      )}
    </Stack>
  );
}
