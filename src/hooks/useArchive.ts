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
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { archiveService } from '@/api/archive'
import type {
  ArchiveSearchParams,
  ArchiveSearchResponse,
} from '@/types/archive.types'

export const emlQueryKeys = {
  all: ['archive', 'eml'] as const,
  detail: (domain: string, id: string) =>
    [...emlQueryKeys.all, domain, id] as const,
}

// Hook to search archives
export const useArchiveSearch = (
  options?: UseMutationOptions<
    ArchiveSearchResponse,
    Error,
    ArchiveSearchParams
  >
) => {
  return useMutation<ArchiveSearchResponse, Error, ArchiveSearchParams>({
    mutationFn: params => archiveService.searchArchives(params),
    ...options,
  })
}

// Hook to get archive search count
export const useArchiveSearchCount = () => {
  return useMutation<number, Error, ArchiveSearchParams>({
    mutationFn: params => archiveService.getSearchCount(params),
  })
}

// Hook to get email count for a domain
export const useDomainEmailCount = (domain_name: string | null) => {
  return useQuery({
    queryKey: ['archive', 'count', domain_name],
    queryFn: () => archiveService.getDomainEmailCount(domain_name!),
    enabled: !!domain_name,
    staleTime: 0,
    gcTime: 0,
  })
}

// Hook to fetch EML content (legacy mutation, preferably use useEml or queryClient directly)
export const useFetchEml = () => {
  return useMutation<
    string,
    Error,
    { domain_name: string; archive_id: string }
  >({
    mutationFn: ({ domain_name, archive_id }) =>
      archiveService.fetchEml(domain_name, archive_id),
  })
}

export const usePrefetchEml = () => {
  const queryClient = useQueryClient()

  return (domain_name: string, archive_id: string) => {
    queryClient.prefetchQuery({
      queryKey: emlQueryKeys.detail(domain_name, archive_id),
      queryFn: () => archiveService.fetchEml(domain_name, archive_id),
      staleTime: 1000 * 60 * 10, // 10 minutes
    })
  }
}

export const useRequestDownload = () => {
  return useMutation<void, Error, ArchiveSearchParams>({
    mutationFn: params => archiveService.requestDownload(params),
    retry: 0,
  })
}

// Hook to forward an archived email to one or more addresses
export const useForwardEmail = (
  options?: UseMutationOptions<
    void,
    Error,
    {
      domain_name: string
      archive_id: string
      forward_emails: string | string[]
      subject?: string
    }
  >
) => {
  return useMutation<
    void,
    Error,
    {
      domain_name: string
      archive_id: string
      forward_emails: string | string[]
      subject?: string
    }
  >({
    mutationFn: ({ domain_name, archive_id, forward_emails, subject }) =>
      archiveService.forwardEmail(
        domain_name,
        archive_id,
        forward_emails,
        subject
      ),
    ...options,
    retry: 0,
  })
}

// Hook to get archive stats
export const useArchiveStats = (domain_name: string | null) => {
  return useQuery({
    queryKey: ['archive', 'stats', domain_name],
    queryFn: () => archiveService.getArchiveStats(domain_name!),
    enabled: !!domain_name,
  })
}
