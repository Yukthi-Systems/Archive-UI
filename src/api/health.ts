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

import apiClient from '@/lib/axios'
import {
  type ApiHealthResponse,
  type MaintenanceResponse,
} from '@/types/health.types'

export const healthService = {
  // Check API health
  checkApiHealth: async (
    timeout: number = 120000
  ): Promise<ApiHealthResponse> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await apiClient.get<ApiHealthResponse>('/health/api', {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      // Add timestamp if not present
      return {
        ...response.data,
        timestamp: response.data.timestamp || new Date().toISOString(),
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  },

  // Check all components health (if you have separate endpoints)
  checkComponentHealth: async (): Promise<{
    api: ApiHealthResponse
    cache?: any
    database?: any
  }> => {
    const api = await healthService.checkApiHealth()

    return {
      api,
      // You can add other component checks here
      // cache: await checkCacheHealth(),
      // database: await checkDatabaseHealth(),
    }
  },

  checkMaintenanceStatus: async (): Promise<MaintenanceResponse> => {
    try {
      const response = await apiClient.get<MaintenanceResponse>(
        '/health/maintenance'
      )
      return response.data
    } catch (error) {
      // In case of error (e.g. 404 or network issue), default to false to prevent lockout
      // unless you want to block access on error.
      console.error('Failed to check maintenance status:', error)
      throw error
    }
  },
}
