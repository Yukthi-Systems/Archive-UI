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

import { useQuery } from '@tanstack/react-query'
import {
  getAdminOrganizations,
  getAdminDomains,
  getAdminUsers,
  type AdminQueryParams,
} from '@/lib/axios'

export const useAdminOrganizations = (params: AdminQueryParams) => {
  return useQuery({
    queryKey: ['admin', 'organizations', params],
    queryFn: () => getAdminOrganizations(params),
    retry: false,
  })
}

export const useAdminDomains = (params: AdminQueryParams) => {
  return useQuery({
    queryKey: ['admin', 'domains', params],
    queryFn: () => getAdminDomains(params),
    retry: false,
  })
}

export const useAdminUsers = (params: AdminQueryParams) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => getAdminUsers(params),
    retry: false,
  })
}

// --- Mutations ---

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createAdminOrganization,
  updateAdminOrganization,
  deleteAdminOrganization,
  createAdminDomain,
  updateAdminDomain,
  deleteAdminDomain,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  type CreateOrgRequest,
  type DomainApiRequest,
  type NewUserRequest,
  type UpdateUserRequest,
} from '@/lib/axios'

export const useCreateOrganization = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrgRequest) => createAdminOrganization(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] }),
  })
}

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: CreateOrgRequest }) =>
      updateAdminOrganization(orgId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] }),
  })
}

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orgId: string) => deleteAdminOrganization(orgId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] }),
  })
}

export const useCreateDomain = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: DomainApiRequest }) =>
      createAdminDomain(orgId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] }),
  })
}

export const useUpdateDomain = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      orgId,
      domainId,
      data,
    }: {
      orgId: string
      domainId: string
      data: DomainApiRequest
    }) => updateAdminDomain(orgId, domainId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] }),
  })
}

export const useDeleteDomain = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, domainId }: { orgId: string; domainId: string }) =>
      deleteAdminDomain(orgId, domainId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] }),
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: NewUserRequest }) =>
      createAdminUser(orgId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: UpdateUserRequest }) =>
      updateAdminUser(orgId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      deleteAdminUser(orgId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}
