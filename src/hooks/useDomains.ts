/*
 * Copyright (C) 2026 Yukthi Systems Private Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * version 3 along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type {
  Domain,
  DomainInfo,
  DomainsListResponse,
  DomainsQueryParams,
  CreateDomainPayload,
  UpdateDomainPayload,
  DomainCountResponse,
} from '@/types/domain.types'
import { domainService } from '@/api/domain'

export const DOMAINS_QUERY_KEY = 'domains'
export const DOMAINS_COUNT_QUERY_KEY = 'domains-count'

// Hook to get archive domains
export const useArchiveDomains = (
  options?: UseQueryOptions<string[], Error>
) => {
  return useQuery<string[], Error>({
    queryKey: ['archive-domains'],
    queryFn: () => domainService.getArchiveDomains(),
    staleTime: 5000,
    ...options,
  })
}

// Hook to get domains with pagination
export const useDomains = (
  params: DomainsQueryParams = {},
  options?: Omit<
    UseQueryOptions<DomainsListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<DomainsListResponse, Error>({
    queryKey: [DOMAINS_QUERY_KEY, params.search],
    queryFn: () => domainService.getDomains(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 3 * 60 * 1000, // 3 minutes
    placeholderData: keepPreviousData,
    ...options,
  })
}

// Hook to get total domain count
export const useDomainCount = (
  params: DomainsQueryParams = {},
  options?: Omit<
    UseQueryOptions<DomainCountResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<DomainCountResponse, Error>({
    queryKey: [DOMAINS_COUNT_QUERY_KEY, params.search],
    queryFn: () => domainService.getDomainsCount(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 3 * 60 * 1000, // 3 minutes
    placeholderData: keepPreviousData,
    ...options,
  })
}
// Hook to get single domain
export const useDomain = (domainId: string, enabled: boolean = true) => {
  return useQuery<DomainInfo, Error>({
    queryKey: [DOMAINS_QUERY_KEY, domainId],
    queryFn: () => domainService.getDomainById(domainId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 3 * 60 * 1000, // 3 minutes
    enabled: !!domainId && enabled,
  })
}

// Hook to create domain
export const useCreateDomain = () => {
  const queryClient = useQueryClient()

  return useMutation<Domain, Error, CreateDomainPayload>({
    mutationFn: domainData =>
      domainService.createDomain({ domainData, notify: true }),
    onSuccess: () => {
      // Invalidate both domains list and count queries
      queryClient.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [DOMAINS_COUNT_QUERY_KEY] })
      // toast.success('Domain created successfully')
    },
    retry: 0,
    onError: (_error: Error) => {
      // toast.error(`Failed to create domain: ${_error.message}`)
    },
  })
}

// Hook to update domain
export const useUpdateDomain = () => {
  const queryClient = useQueryClient()

  return useMutation<
    Domain,
    Error,
    { domainId: string; domainData: UpdateDomainPayload; domainName?: string }
  >({
    mutationFn: ({ domainId, domainData, domainName }) =>
      domainService.updateDomain(domainId, domainData, domainName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] })
      queryClient.invalidateQueries({
        queryKey: [DOMAINS_QUERY_KEY, variables.domainId],
      })
      // toast.success('Domain updated successfully')
    },
    retry: 0,
    onError: (_error: Error) => {
      // toast.error(`Failed to update domain: ${_error.message}`)
    },
  })
}
// Hook to delete domain
export const useDeleteDomain = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { domainId: string; domainName?: string }>({
    mutationFn: ({ domainId, domainName }) =>
      domainService.deleteDomain(domainId, domainName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [DOMAINS_COUNT_QUERY_KEY] })
    },
    retry: 0,
    onError: (_error: Error) => {
      // toast.error(`Failed to delete domain: ${_error.message}`)
    },
  })
}
