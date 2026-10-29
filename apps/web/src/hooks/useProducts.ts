/**
 * Stockly — TanStack Query hooks for products.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ProductPageQuery } from '@stockly/shared/types/product';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '../lib/products-api';

export const qk = {
  list: (q: ProductPageQuery) => ['products', 'list', q] as const,
  detail: (id: number) => ['products', 'detail', id] as const,
};

export function useProducts(q: ProductPageQuery) {
  return useQuery({ queryKey: qk.list(q), queryFn: () => listProducts(q), staleTime: 15_000 });
}

export function useProduct(id: number, enabled = true) {
  return useQuery({ queryKey: qk.detail(id), queryFn: () => getProduct(id), enabled });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'list'] }),
  });
}

export function useUpdateProduct(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof updateProduct>[1]) => updateProduct(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(id) });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'list'] }),
  });
}

/**
 * Re-activate a soft-deleted product (PATCH `{ active: true }`).
 *
 * FE-T4: soft-delete is reversible; the list shows a "Reactivar" action on
 * inactive rows so an accidental delete does not require the edit form.
 */
export function useSetProductActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      updateProduct(id, { active }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['products', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
    },
  });
}
