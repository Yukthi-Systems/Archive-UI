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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { toast } from 'sonner'
import type { Organization } from '@/types/organization.types'
import { organizationService } from '@/api/organization'
import { organizationAtom } from '@/atoms/organization'
import { useEffect } from 'react'

const ORG_KEY = ['organization']

// Hook to fetch and store organization info
export const useOrganization = (enabled = true) => {
  const setOrganization = useSetAtom(organizationAtom)

  const query = useQuery({
    queryKey: ORG_KEY,
    queryFn: organizationService.getOrganizationInfo,
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Sync Jotai atom whenever query data changes
  useEffect(() => {
    if (query.data) {
      setOrganization(query.data)
    }
  }, [query.data, setOrganization])

  return query
}

export const useLoadOrganization = () => {
  const queryClient = useQueryClient()
  const setOrganization = useSetAtom(organizationAtom)
  // Return a stable function that doesn't rely on hook execution order
  return async () => {
    const data = await queryClient.fetchQuery({
      queryKey: ORG_KEY,
      queryFn: organizationService.getOrganizationInfo,
      staleTime: 5 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    })
    setOrganization(data)
    return data
  }
}

// Hook to update organization
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient()
  const setOrganization = useSetAtom(organizationAtom)

  return useMutation<Organization, Error, Partial<Organization>>({
    mutationFn: organizationData =>
      organizationService.updateOrganization(organizationData),
    onSettled: (data, error: any) => {
      if (data) {
        setOrganization(data)
        queryClient.invalidateQueries({ queryKey: ORG_KEY })
        toast.success('Organization updated successfully')
      }
      if (error) {
        const errorMessage = error?.response?.data?.error || error.message
        toast.error(`Failed to update organization: ${errorMessage}`)
      }
    },
    retry: 0,
  })
}
