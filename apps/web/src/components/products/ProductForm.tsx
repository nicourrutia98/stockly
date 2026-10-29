/**
 * Stockly — product form (create + edit). RHF + Zod.
 *
 * @since 0.1.0
 * @author Juan Nicolas Urrutia Salcedo — Universidad Surcolombiana de Neiva (Materia Inteligencia Artificial)
 */
'use client';

import { Button, Group, NumberInput, Stack, Switch, Textarea, TextInput } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  zCreateProduct,
  zUpdateProduct,
  type CreateProduct,
  type Product,
  type UpdateProduct,
} from '@stockly/shared/types/product';

interface Props {
  initial?: Product | null;
  pending?: boolean;
  onSubmit: (body: CreateProduct | UpdateProduct) => void;
}

export function ProductForm({ initial, pending, onSubmit }: Props) {
  const isEdit = Boolean(initial);
  const schema = isEdit ? zUpdateProduct : zCreateProduct;
  const { control, handleSubmit, register, formState } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: {
      sku: initial?.sku ?? '',
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      price: initial?.price ?? 0,
      stock: initial?.stock ?? 0,
      category: initial?.category ?? '',
      active: initial?.active ?? true,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => {
        if (isEdit) {
          const patch: UpdateProduct = {};
          if (v.sku && v.sku !== initial?.sku) patch.sku = v.sku;
          if (v.name && v.name !== initial?.name) patch.name = v.name;
          if ((v.description ?? '') !== (initial?.description ?? '')) patch.description = v.description || null;
          if (v.price !== initial?.price) patch.price = v.price;
          if (v.stock !== initial?.stock) patch.stock = v.stock;
          if (v.category !== initial?.category) patch.category = v.category;
          if (v.active !== initial?.active) patch.active = v.active;
          onSubmit(patch);
        } else {
          onSubmit(v as CreateProduct);
        }
      })}
    >
      <Stack gap="md" maw={560}>
        <TextInput label="SKU" placeholder="ABC-123" withAsterisk {...register('sku')} error={formState.errors.sku?.message as string} />
        <TextInput label="Nombre" withAsterisk {...register('name')} error={formState.errors.name?.message as string} />
        <Textarea label="Descripción" rows={3} {...register('description')} />
        <Controller name="price" control={control} render={({ field }) => <NumberInput label="Precio" min={0} decimalScale={2} withAsterisk value={field.value} onChange={field.onChange} />} />
        <Controller name="stock" control={control} render={({ field }) => <NumberInput label="Stock" min={0} allowDecimal={false} withAsterisk value={field.value} onChange={field.onChange} />} />
        <TextInput label="Categoría" withAsterisk {...register('category')} error={formState.errors.category?.message as string} />
        <Controller name="active" control={control} render={({ field }) => <Switch label="Activo" checked={field.value} onChange={(e) => field.onChange(e.currentTarget.checked)} />} />
        <Group>
          <Button type="submit" color="#0F4C81" loading={pending}>
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
