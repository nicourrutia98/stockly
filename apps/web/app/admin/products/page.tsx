/**
 * Stockly — admin products list.
 *
 * FE-T3: search + category/status/stock filters on top of the FE-T2 shell.
 * FE-T4: the data hooks live in an inner component so they only mount once
 * `ProtectedRoute` confirms the session (avoids a token-less GET on reload
 * racing the silent refresh).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Group, Stack, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

import { AdminBreadcrumbs } from '../../../src/components/admin/AdminBreadcrumbs';
import { ProtectedRoute } from '../../../src/components/admin/ProtectedRoute';
import { ProductFilters, type ProductFiltersValue } from '../../../src/components/admin/ProductFilters';
import { AppShell } from '../../../src/components/layout/AppShell';
import { ProductsTable } from '../../../src/components/products/ProductsTable';
import { useI18n } from '../../../src/i18n/I18nProvider';
import { useDeleteProduct, useProducts, useSetProductActive } from '../../../src/hooks/useProducts';
import { ApiError } from '../../../src/lib/api/api-error';
import { listCategories } from '../../../src/lib/catalog-api';

const EMPTY_FILTERS: ProductFiltersValue = {
  q: '',
  category: '',
  status: '',
  inStockOnly: false,
};

export default function AdminProductsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AppShell>
        <AdminProductsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function AdminProductsContent() {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<ProductFiltersValue>(EMPTY_FILTERS);
  const [debouncedQ] = useDebouncedValue(filters.q, 300);
  const size = 20;

  // Categorías del inventario real: el filtro nunca ofrece opciones que
  // el backend no puede devolver.
  const [categories, setCategories] = useState<ReadonlyArray<string>>([]);
  useEffect(() => {
    let cancelled = false;
    void listCategories()
      .then((c) => {
        if (!cancelled) setCategories(c);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const hasFilters =
    debouncedQ.trim() !== '' ||
    filters.category !== '' ||
    filters.status !== '' ||
    filters.inStockOnly;

  // Any filter change invalidates the current offset.
  useEffect(() => {
    setPage(0);
  }, [debouncedQ, filters.category, filters.status, filters.inStockOnly]);

  const { data, isLoading, isError, refetch } = useProducts({
    page,
    size,
    sort: 'updatedAt',
    direction: 'desc',
    q: debouncedQ.trim() || undefined,
    category: filters.category || undefined,
    active: filters.status === '' ? undefined : filters.status === 'true',
    inStockOnly: filters.inStockOnly || undefined,
  });
  const del = useDeleteProduct();
  const activate = useSetProductActive();

  return (
    <Stack p="lg" gap="md">
      <AdminBreadcrumbs items={[]} />
      <Group justify="space-between">
        <Title order={1} size="h2" c="stockly-blue.6">
          {t('admin.title')}
        </Title>
        <Group>
          <Button component={Link} href="/admin/products/new" color="#0F4C81">
            {t('admin.new')}
          </Button>
        </Group>
      </Group>

      <ProductFilters
        value={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onClear={() => setFilters(EMPTY_FILTERS)}
        categories={categories}
      />

      {isError ? (
        <Stack gap="sm">
          <p>{t('admin.error')}</p>
          <Button variant="subtle" onClick={() => void refetch()}>
            {t('admin.retry')}
          </Button>
        </Stack>
      ) : isLoading || !data ? (
        <p>{t('admin.loading')}</p>
      ) : data.content.length === 0 && hasFilters ? (
        <p>{t('admin.empty')}</p>
      ) : (
        <ProductsTable
          records={data.content}
          total={data.totalElements}
          page={page}
          pageSize={size}
          onPage={setPage}
          onReactivate={(id) =>
            activate.mutate(
              { id, active: true },
              {
                onSuccess: () =>
                  notifications.show({
                    closeButtonProps: { 'aria-label': 'Cerrar notificación' },
                    title: t('admin.reactivated.title'),
                    message: t('admin.reactivated.message', { id }),
                    color: 'green',
                  }),
                onError: (e) =>
                  notifications.show({
                    closeButtonProps: { 'aria-label': 'Cerrar notificación' },
                    title: t('admin.deleteError.title'),
                    message: e instanceof ApiError ? e.userMessage : t('admin.reactivateError.message'),
                    color: 'red',
                  }),
              },
            )
          }
          onDelete={(id) => {
            if (!confirm(t('admin.deleteConfirm'))) return;
            del.mutate(id, {
              onSuccess: () =>
                notifications.show({
                  closeButtonProps: { 'aria-label': 'Cerrar notificación' },
                  title: t('admin.deleted.title'),
                  message: t('admin.deleted.message', { id }),
                  color: 'green',
                }),
              onError: (e) =>
                notifications.show({
                  closeButtonProps: { 'aria-label': 'Cerrar notificación' },
                  title: t('admin.deleteError.title'),
                  message: e instanceof ApiError ? e.userMessage : t('admin.deleteError.message'),
                  color: 'red',
                }),
            });
          }}
        />
      )}
    </Stack>
  );
}
