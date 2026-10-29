/**
 * Stockly — admin product filter bar.
 *
 * Presentational only: the page owns the filter state (URL-agnostic) and
 * debounces the free-text term before it reaches the API.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { Button, Group, Paper, Select, Switch, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import { useI18n } from '../../i18n/I18nProvider';

export type StatusFilter = '' | 'true' | 'false';

export interface ProductFiltersValue {
  q: string;
  category: string;
  status: StatusFilter;
  inStockOnly: boolean;
}

interface Props {
  value: ProductFiltersValue;
  onChange: (patch: Partial<ProductFiltersValue>) => void;
  onClear: () => void;
  /**
   * Categorías del inventario real. Las recibe la página en vez de leerlas
   * de una constante: una lista fija se desincroniza del catálogo y termina
   * ofreciendo filtros que no devuelven nada.
   */
  categories: ReadonlyArray<string>;
}

/**
 * Search + category + status + stock filter controls.
 *
 * Labels come from the dictionary so the panel works in es-CO and en; the
 * Spanish strings stay byte-identical to the previous hardcoded copy.
 */
export function ProductFilters({ value, onChange, onClear, categories }: Props) {
  const { t } = useI18n();
  const dirty =
    value.q.trim() !== '' ||
    value.category !== '' ||
    value.status !== '' ||
    value.inStockOnly;

  return (
    <Paper p="md" withBorder radius="md">
      <Group align="flex-end" gap="sm" wrap="wrap">
        <TextInput
          label={t('admin.filters.search')}
          placeholder={t('admin.filters.searchPlaceholder')}
          leftSection={<IconSearch size={16} aria-hidden />}
          value={value.q}
          onChange={(e) => onChange({ q: e.currentTarget.value })}
          w={{ base: '100%', sm: 240 }}
        />
        <Select
          label={t('admin.filters.category')}
          data={[
            { value: '', label: t('admin.filters.allCategories') },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
          value={value.category}
          onChange={(v) => onChange({ category: v ?? '' })}
          allowDeselect={false}
          w={{ base: '100%', sm: 200 }}
        />
        <Select
          label={t('admin.filters.status')}
          data={[
            { value: '', label: t('admin.filters.allStatuses') },
            { value: 'true', label: t('admin.filters.active') },
            { value: 'false', label: t('admin.filters.inactive') },
          ]}
          value={value.status}
          onChange={(v) => onChange({ status: (v ?? '') as StatusFilter })}
          allowDeselect={false}
          w={{ base: '100%', sm: 160 }}
        />
        <Switch
          label={t('admin.filters.inStock')}
          checked={value.inStockOnly}
          onChange={(e) => onChange({ inStockOnly: e.currentTarget.checked })}
          mb={6}
        />
        <Button variant="subtle" onClick={onClear} disabled={!dirty} mb={2}>
          {t('admin.filters.clear')}
        </Button>
      </Group>
    </Paper>
  );
}
