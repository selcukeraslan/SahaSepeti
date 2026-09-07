import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteCustomer, getCustomer, getCustomerHistory, saveCustomer, searchCustomers } from '../services/customers.service'
import type { CustomerFilter } from '../customers.schemas'

export function useCustomers(venueId: string, query: string, filter: CustomerFilter = 'all', page = 0, limit = 25) {
  const [debounced, setDebounced] = useState(query)
  useEffect(() => { const timer = setTimeout(() => setDebounced(query), 250); return () => clearTimeout(timer) }, [query])
  const result = useQuery({
    queryKey: ['venue-customers', venueId, debounced, filter, page, limit],
    queryFn: () => searchCustomers({ venueId, query: debounced, filter, limit, offset: page * limit }),
    enabled: Boolean(venueId),
  })
  // Önceki sorgunun sonuçları yeni metnin altında seçilemez.
  return { ...result, data: query === debounced ? result.data : undefined, isDebouncing: query !== debounced }
}
export function useCustomer(id: string) {
  return useQuery({ queryKey: ['venue-customer', id], queryFn: () => getCustomer(id) })
}
export function useCustomerHistory(id: string, page: number) {
  return useQuery({ queryKey: ['venue-customer-history', id, page], queryFn: () => getCustomerHistory(id, page) })
}
export function useSaveCustomer() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: saveCustomer, onSuccess: () => {
    for (const key of ['venue-customers', 'venue-customer', 'venue-customer-history']) {
      void cache.invalidateQueries({ queryKey: [key] })
    }
  } })
}
export function useDeleteCustomer() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: deleteCustomer, onSuccess: () => {
    for (const key of ['venue-customers', 'venue-customer', 'venue-customer-history']) {
      void cache.invalidateQueries({ queryKey: [key] })
    }
  } })
}
