import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { InventoryItem } from './types'

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
