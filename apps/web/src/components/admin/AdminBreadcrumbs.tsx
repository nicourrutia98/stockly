/**
 * Stockly — admin breadcrumbs.
 *
 * One component for every admin page so the trail is consistent:
 * Inicio / Productos / <leaf>.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import Link from 'next/link';
import { Anchor, Breadcrumbs } from '@mantine/core';

import { useI18n } from '../../i18n/I18nProvider';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function AdminBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const { t } = useI18n();

  return (
    <Breadcrumbs aria-label={t('admin.breadcrumb.label')} separator="›">
      <Anchor component={Link} href="/" size="sm">
        {t('admin.breadcrumb.home')}
      </Anchor>
      <Anchor component={Link} href="/admin/products" size="sm">
        {t('admin.title')}
      </Anchor>
      {items.map((item, index) =>
        item.href ? (
          <Anchor key={`${item.label}-${index}`} component={Link} href={item.href} size="sm">
            {item.label}
          </Anchor>
        ) : (
          <span key={`${item.label}-${index}`} aria-current="page">
            {item.label}
          </span>
        ),
      )}
    </Breadcrumbs>
  );
}
