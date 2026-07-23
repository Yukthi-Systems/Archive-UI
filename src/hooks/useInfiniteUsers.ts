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

import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { userService } from '@/api/user'
import { useDebounce } from 'use-debounce'
import { useState } from 'react'

export const useInfiniteUsers = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch] = useDebounce(searchQuery, 500)

  const query = useInfiniteQuery({
    queryKey: ['users', 'infinite', debouncedSearch],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const data = await userService.getUsers({
        limit: 100,
        offset: pageParam,
        search: debouncedSearch,
      })
      return data
    },
    getNextPageParam: (lastPage, allPages) => {
      // FIX: Changed 'lastItem' to 'lastPage'
      if (!lastPage || lastPage.length < 100) return undefined

      // Calculate next offset
      return allPages.length * 100
    },
    placeholderData: keepPreviousData,
  })

  const users = query.data?.pages.flatMap(page => page) || []

  return {
    users,
    searchQuery,
    setSearchQuery,
    ...query,
  }
}
