/**
 * Stockly — products table (Mantine + mantine-datatable).
 *
 * FE-T3: stock is rendered as a semantic badge (out / low / available)
 * instead of a bare number, and every label goes through i18n.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import Link from 'next/link';
import { Anchor, Badge, Group, ActionIcon } from '@mantine/core';
import { IconEdit, IconEye, IconRefresh, IconTrash } from '@tabler/icons-react';
import { DataTable } from 'mantine-datatable';

import type { Product } from '@stockly/shared/types/product';

import { useI18n } from '../../i18n/I18nProvider';
import { stockTone } from '../../lib/stock';
import { formatCOP } from '../../lib/format-money';

interface Props {
  records: Product[];
  total: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  onDelete: (id: number) => void;
  onReactivate: (id: number) => void;
}

export function ProductsTable({
  records,
  total,
  page,
  pageSize,
  onPage,
  onDelete,
  onReactivate,
}: Props) {
  const { t } = useI18n();

  return (
    <DataTable
      withTableBorder
      highlightOnHover
      records={records}
      totalRecords={total}
      recordsPerPage={pageSize}
      page={page + 1}
      onPageChange={(p) => onPage(p - 1)}
      columns={[
        {
          accessor: 'sku',
          title: t('admin.table.sku'),
          render: (r) => (
            <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>{r.sku}</code>
          ),
        },
        {
          accessor: 'name',
          title: t('admin.table.name'),
          render: (r) => (
            <Anchor component={Link} href={`/admin/products/${r.id}`} size="sm">
              {r.name}
            </Anchor>
          ),
        },
        { accessor: 'category', title: t('admin.table.category') },
        {
          accessor: 'price',
          title: t('admin.table.price'),
          render: (r) => formatCOP(Number(r.price)),
        },
        {
          accessor: 'stock',
          title: t('admin.table.stock'),
          render: (r) => {
            const tone = stockTone(r.stock);
            return (
              <Badge color={tone.color}>
                {tone.labelKey === 'admin.stock.low'
                  ? t(tone.labelKey, { n: r.stock })
                  : t(tone.labelKey)}
              </Badge>
            );
          },
        },
        {
          accessor: 'active',
          title: t('admin.table.status'),
          render: (r) => (
            <Badge color={r.active ? '#15803D' : '#64748B'}>
              {r.active ? t('admin.status.active') : t('admin.status.inactive')}
            </Badge>
          ),
        },
        {
          accessor: 'actions',
          title: t('admin.table.actions'),
          render: (r) => (
            <Group gap="xs">
              <ActionIcon
                component={Link}
                href={`/admin/products/${r.id}`}
                variant="subtle"
                aria-label={t('admin.table.view')}
              >
                <IconEye size={16} />
              </ActionIcon>
              <ActionIcon
                component={Link}
                href={`/admin/products/${r.id}/edit`}
                variant="subtle"
                aria-label={t('admin.table.edit')}
              >
                <IconEdit size={16} />
              </ActionIcon>
              {!r.active && (
                <ActionIcon
                  color="#15803D"
                  variant="subtle"
                  aria-label={t('admin.reactivate')}
                  onClick={() => onReactivate(r.id)}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              )}
              <ActionIcon
                color="red"
                variant="subtle"
                aria-label={t('admin.table.delete')}
                onClick={() => onDelete(r.id)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          ),
        },
      ]}
    />
  );
}
