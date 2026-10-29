/**
 * Stockly — admin dashboard (FE-T5).
 *
 * KPIs derived from the paginated product API:
 *   total / active / inactive  → `totalElements` of three filtered queries
 *   agotados / stock bajo      → first page sorted by stock ascending
 *   valor del inventario       → Σ (price × stock) over that same page
 *
 * Hooks live in `AdminDashboardContent` so nothing fetches before the guard
 * resolves (same rule as the rest of the admin tree).
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import Link from 'next/link';
import { Badge, Button, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';

import { AdminBreadcrumbs } from '../../src/components/admin/AdminBreadcrumbs';
import { ProtectedRoute } from '../../src/components/admin/ProtectedRoute';
import { AppShell } from '../../src/components/layout/AppShell';
import { useI18n } from '../../src/i18n/I18nProvider';
import { useProducts } from '../../src/hooks/useProducts';
import { formatCOP } from '../../src/lib/catalog-api';

/** API page size cap is 100; the dashboard works over a single page. */
const SCAN_SIZE = 100;

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AppShell>
        <AdminDashboardContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Paper p="md" withBorder radius="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text fz={26} fw={700} lh={1.2}>
        {value}
      </Text>
      {hint ? (
        <Text size="xs" c="dimmed">
          {hint}
        </Text>
      ) : null}
    </Paper>
  );
}

function ProductRows({
  items,
  emptyLabel,
  showStock,
}: {
  items: { id: number; sku: string; name: string; stock: number; category: string }[];
  emptyLabel: string;
  showStock: boolean;
}) {
  if (items.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {emptyLabel}
      </Text>
    );
  }
  return (
    <Table verticalSpacing="xs">
      <Table.Tbody>
        {items.map((p) => (
          <Table.Tr key={p.id}>
            <Table.Td>
              <Link
                href={`/admin/products/${p.id}`}
                style={{ color: 'var(--color-primary-500)', textDecoration: 'underline' }}
              >
                {p.name}
              </Link>
              <Text size="xs" c="dimmed" ff="JetBrains Mono, monospace">
                {p.sku}
              </Text>
            </Table.Td>
            <Table.Td w={110}>
              {showStock ? (
                <Badge color={p.stock <= 3 ? '#B45309' : '#15803D'}>{p.stock}</Badge>
              ) : (
                <Text size="xs">{p.category}</Text>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function AdminDashboardContent() {
  const { t } = useI18n();

  const totals = useProducts({ page: 0, size: 1, sort: 'updatedAt', direction: 'desc' });
  const actives = useProducts({ page: 0, size: 1, sort: 'updatedAt', direction: 'desc', active: true });
  const inactives = useProducts({
    page: 0,
    size: 1,
    sort: 'updatedAt',
    direction: 'desc',
    active: false,
  });
  const scan = useProducts({ page: 0, size: SCAN_SIZE, sort: 'stock', direction: 'asc' });
  const recent = useProducts({ page: 0, size: 5, sort: 'updatedAt', direction: 'desc' });

  const loading =
    totals.isLoading || actives.isLoading || inactives.isLoading || scan.isLoading || recent.isLoading;

  const rows = scan.data?.content ?? [];
  const outOfStock = rows.filter((p) => p.stock <= 0).length;
  const lowStock = rows.filter((p) => p.stock > 0 && p.stock <= 3);
  const inventoryValue = rows.reduce((acc, p) => acc + Number(p.price) * p.stock, 0);
  const truncated = (scan.data?.totalElements ?? 0) > rows.length;

  return (
    <Stack p="lg" gap="md">
      <AdminBreadcrumbs items={[{ label: t('admin.dashboard.title') }]} />

      <Group justify="space-between">
        <Title order={1} size="h2" c="stockly-blue.6">
          {t('admin.dashboard.title')}
        </Title>
        <Group>
          <Button component={Link} href="/admin/products" variant="default">
            {t('admin.dashboard.allProducts')}
          </Button>
          <Button component={Link} href="/admin/products/new" color="#0F4C81">
            {t('admin.new')}
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Text>{t('admin.loading')}</Text>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
          <Kpi label={t('admin.dashboard.kpi.total')} value={String(totals.data?.totalElements ?? 0)} />
          <Kpi
            label={t('admin.dashboard.kpi.active')}
            value={String(actives.data?.totalElements ?? 0)}
          />
          <Kpi
            label={t('admin.dashboard.kpi.inactive')}
            value={String(inactives.data?.totalElements ?? 0)}
          />
          <Kpi
            label={t('admin.dashboard.kpi.out')}
            value={String(outOfStock)}
            hint={truncated ? t('admin.dashboard.capped') : undefined}
          />
          <Kpi
            label={t('admin.dashboard.kpi.low')}
            value={String(lowStock.length)}
            hint={truncated ? t('admin.dashboard.capped') : undefined}
          />
          <Kpi
            label={t('admin.dashboard.kpi.value')}
            value={formatCOP(inventoryValue)}
            hint={truncated ? t('admin.dashboard.capped') : undefined}
          />
        </SimpleGrid>
      )}

      {!loading && (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          <Paper p="md" withBorder radius="md">
            <Text fw={600} mb="xs">
              {t('admin.dashboard.lowStock')}
            </Text>
            <ProductRows
              items={lowStock.slice(0, 8).map((p) => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                stock: p.stock,
                category: p.category,
              }))}
              emptyLabel={t('admin.dashboard.empty')}
              showStock
            />
          </Paper>

          <Paper p="md" withBorder radius="md">
            <Text fw={600} mb="xs">
              {t('admin.dashboard.recent')}
            </Text>
            <ProductRows
              items={(recent.data?.content ?? []).map((p) => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                stock: p.stock,
                category: p.category,
              }))}
              emptyLabel={t('admin.dashboard.recentEmpty')}
              showStock={false}
            />
          </Paper>
        </SimpleGrid>
      )}
    </Stack>
  );
}