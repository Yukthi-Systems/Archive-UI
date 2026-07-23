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
import type {
  AddAuditLogPayload,
  AuditLogsResponse,
} from '@/types/auditlogs.types'

export const auditService = {
  /**
   * Add a new audit log entry.
   * Permission: None (Public/Internal)
   */
  addLog: async (payload: AddAuditLogPayload) => {
    // Note: This endpoint does not require auth, but sending the token
    // usually allows the backend to automatically associate the User ID.
    return apiClient.post('/audit/log/add', payload)
  },

  /**
   * View audit logs with optional filtering.
   * Permission: "audit:view"
   */
  getLogs: async (params?: {
    page?: number
    limit?: number
    search?: string
    type?: string
    startDate?: string
    endDate?: string
  }) => {
    return apiClient.get<AuditLogsResponse>('/audit/logs', { params })
  },

  /**
   * Get total count of audit logs (if separate endpoint exists,
   * otherwise usually included in getLogs metadata).
   * Permission: "audit:view"
   */
  getLogsCount: async () => {
    return apiClient.get<{ count: number }>('/audit/logs/count')
  },

  /**
   * Helper to quickly log an action without awaiting (fire-and-forget style)
   * Usage: auditService.log('LOGIN', 'User Logged In', 'User johndoe logged in from IP...')
   */
  log: (
    type: string,
    message: string,
    description: string,
    actor?: string,
    resource?: string
  ) => {
    // If actor or resource are provided, append them to the description
    let finalDescription = description
    if (actor) {
      finalDescription += `\nActor: ${actor}`
    }
    if (resource) {
      finalDescription += `\nResource: ${resource}`
    }

    // We purposefully don't await this to avoid blocking UI interactions
    auditService
      .addLog({
        log_type: type,
        log_message: message,
        log_description: finalDescription,
      })
      .catch(err => console.error('Failed to write audit log', err))
  },
}
