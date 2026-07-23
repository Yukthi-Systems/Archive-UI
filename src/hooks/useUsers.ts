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
  User,
  UsersQueryParams,
  UsersListResponse,
} from '@/types/user.types'
import { userService } from '@/api/user'

const USERS_QUERY_KEY = 'users'

// src/hooks/useUsers.ts
export const useUsers = (
  params: UsersQueryParams = { limit: 50, offset: 0 },
  options?: Omit<
    UseQueryOptions<UsersListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<UsersListResponse, Error>({
    // Ensure the queryKey is truly unique to the params (including search)
    queryKey: [USERS_QUERY_KEY, params.limit, params.offset, params.search],
    queryFn: () => userService.getUsers(params),
    staleTime: 1 * 60 * 1000, // 1 minutes
    gcTime: 1 * 60 * 1000, // 1 minutes
    placeholderData: keepPreviousData,
    ...options,
  })
}

export const useUserCount = (
  params?: UsersQueryParams,
  options?: Omit<UseQueryOptions<number, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['userCount', params?.search],
    queryFn: () => userService.getUserCount(params),
    staleTime: 1 * 60 * 1000, // 1 minutes
    gcTime: 1 * 60 * 1000, // 1 minutes
    placeholderData: keepPreviousData,
    ...(options as any),
  })
}

// ... rest of the hooks remain the same
export const useUser = (userId: string, enabled: boolean = true) => {
  return useQuery<User, Error>({
    queryKey: [USERS_QUERY_KEY, userId],
    queryFn: () => userService.getUserById(userId),
    enabled: !!userId && enabled,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation<User, Error, Partial<User>>({
    mutationFn: userData => userService.createUser({ userData, notify: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
    },
    retry: 0,
    onError: (error: Error) => {
      console.error(error)
    },
  })
}
export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation<
    User,
    Error,
    { userId: string; userData: Partial<User>; username: string }
  >({
    mutationFn: ({ userId, userData, username }) =>
      userService.updateUser(userId, userData, username),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
      queryClient.invalidateQueries({
        queryKey: [USERS_QUERY_KEY, variables.userId],
      })
    },
    retry: 0,
    onError: (error: Error) => {
      console.error(error)
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { userId: string; userName?: string }>({
    mutationFn: ({ userId, userName }) =>
      userService.deleteUser(userId, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
    },
    retry: 0,
    onError: (error: Error) => {
      console.error(error)
    },
  })
}

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient()

  return useMutation<User, Error, { userData: any; username: string }>({
    mutationFn: ({ userData, username }) =>
      userService.updateUserStatus(userData, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
    },
    retry: 0,
    onError: (error: Error) => {
      console.error(error)
    },
  })
}
