/**
 * Stockly — admin create product.
 *
 * FE-T4: hooks live inside `NewProductContent` so nothing runs before the
 * session guard resolves.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useRouter } from 'next/navigation';
import { Stack, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { AdminBreadcrumbs } from '../../../../src/components/admin/AdminBreadcrumbs';
import { ProtectedRoute } from '../../../../src/components/admin/ProtectedRoute';
import { AppShell } from '../../../../src/components/layout/AppShell';
import { ProductForm } from '../../../../src/components/products/ProductForm';
import { useI18n } from '../../../../src/i18n/I18nProvider';
import { useCreateProduct } from '../../../../src/hooks/useProducts';
import { ApiError } from '../../../../src/lib/api/api-error';

export default function NewProductPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AppShell>
        <NewProductContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function NewProductContent() {
  const { t } = useI18n();
  const router = useRouter();
  const create = useCreateProduct();

  return (
    <Stack p="lg">
      <AdminBreadcrumbs items={[{ label: t('admin.new') }]} />
      <Title order={1} size="h2" c="stockly-blue.6">
        {t('admin.new')}
      </Title>
      <ProductForm
        pending={create.isPending}
        onSubmit={(body) =>
          create.mutate(body as never, {
            onSuccess: () => {
              notifications.show({
                closeButtonProps: { 'aria-label': 'Cerrar notificación' },
                title: t('admin.created.title'),
                message: t('admin.created.message'),
                color: 'green',
              });
              router.replace('/admin/products');
            },
            onError: (e) =>
              notifications.show({
                closeButtonProps: { 'aria-label': 'Cerrar notificación' },
                title: t('admin.deleteError.title'),
                message: e instanceof ApiError ? e.userMessage : t('admin.createError.message'),
                color: 'red',
              }),
          })
        }
      />
    </Stack>
  );
}
