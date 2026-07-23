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

import { useState, useEffect } from 'react'
import { useDebounce } from './useDebounce'
import apiClient, { apiAdminClient } from '@/lib/axios'

export const useValidateUsername = (
  username: string,
  type: 'user' | 'admin' = 'user'
) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [isDebouncing, setIsDebouncing] = useState(false)

  const debouncedUsername = useDebounce(username, 500) // 500ms debounce

  useEffect(() => {
    // Reset states when username changes
    if (username !== debouncedUsername) {
      setIsDebouncing(true)
      setIsAvailable(null)
      setError(null)
      setData(null)
      return
    }

    setIsDebouncing(false)

    // Skip validation if username is empty or too short
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setIsAvailable(null)
      setData(null)
      return
    }

    // Check for valid username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(debouncedUsername)) {
      setIsAvailable(false)
      setData({ is_available: false, user_name: debouncedUsername })
      return
    }

    const validateUsername = async () => {
      setIsLoading(true)
      setError(null)

      let response

      try {
        if (type === 'admin') {
          response = await apiAdminClient.get(
            `/user/available/name/${encodeURIComponent(debouncedUsername)}`
          )
        } else {
          response = await apiClient.get(
            `/user/available/name/${encodeURIComponent(debouncedUsername)}`
          )
        }

        const result = await response.data

        // API returns: { "is_available": false, "user_name": "nikhil" }
        setIsAvailable(result.is_available)
        setData(result)
      } catch (err: any) {
        setError(err.message)
        setIsAvailable(null)
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    validateUsername()
  }, [debouncedUsername, username])

  return {
    isLoading,
    isAvailable,
    isDebouncing,
    error,
    data,
  }
}
