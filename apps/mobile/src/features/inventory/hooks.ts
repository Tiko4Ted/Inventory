import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { InventoryItem, StockMovement } from './types'

export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => api<{ items: InventoryItem[] }>('/api/inventory/items'),
  })
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      api<{ item: InventoryItem }>('/api/inventory/items', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory-items'] }),
  })
}

export function useInventoryItem(itemId: string) {
  return useQuery({
    queryKey: ['inventory-item', itemId],
    queryFn: () => api<{ item: InventoryItem }>(`/api/inventory/items/${itemId}`),
    enabled: Boolean(itemId),
  })
}

export function useInventoryMovements(itemId: string) {
  return useQuery({
    queryKey: ['inventory-movements', itemId],
    queryFn: () => api<{ movements: StockMovement[] }>(`/api/inventory/items/${itemId}/movements`),
    enabled: Boolean(itemId),
  })
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      api('/api/inventory/movements', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (_result, variables) => {
      const itemId = String(variables.itemId)
      void queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      void queryClient.invalidateQueries({ queryKey: ['inventory-item', itemId] })
      void queryClient.invalidateQueries({ queryKey: ['inventory-movements', itemId] })
    },
  })
}

export function useReconcileStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      api('/api/inventory/reconcile', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (_result, variables) => {
      const itemId = String(variables.itemId)
      void queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      void queryClient.invalidateQueries({ queryKey: ['inventory-item', itemId] })
      void queryClient.invalidateQueries({ queryKey: ['inventory-movements', itemId] })
    },
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: Record<string, unknown> }) =>
      api<{ item: InventoryItem }>(`/api/inventory/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      void queryClient.invalidateQueries({ queryKey: ['inventory-item', variables.itemId] })
    },
  })
}

export function useArchiveInventoryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) =>
      api(`/api/inventory/items/${itemId}/archive`, { method: 'POST' }),
    onSuccess: (_result, itemId) => {
      void queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      void queryClient.invalidateQueries({ queryKey: ['inventory-item', itemId] })
    },
  })
}
