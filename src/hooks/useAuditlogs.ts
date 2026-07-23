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

import { useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

export interface AuditLogSearchPayload {
  start_date: string
  end_date: string
  log_message_keyword?: string
  from_user?: string
  log_type?: string
  ascending_order: boolean
  limit: number
  last_evaluated_key?: string
  last_evaluated_time?: string // This API likely expects ISO string for the cursor
}

export interface AuditLogEntry {
  log_id: string // Changed from audit_id
  organization_id: string
  log_time: number // It is a number (Unix seconds)
  from_user: string
  log_type: string
  log_message: string
  log_description: string
}

export const useAuditLogSearch = (options?: any) => {
  return useMutation<AuditLogEntry[], unknown, AuditLogSearchPayload>({
    mutationFn: async payload => {
      const response = await apiClient.post<AuditLogEntry[]>(
        '/audit/logs/list',
        payload
      )
      return response.data
    },
    ...options,
  })
}

export const useAuditLogCount = () => {
  return useMutation<number, unknown, AuditLogSearchPayload>({
    mutationFn: async payload => {
      const response = await apiClient.post<number>('/audit/logs/list/count', {
        ...payload,
        last_evaluated_key: null,
        last_evaluated_time: null,
      })
      return response.data
    },
  })
}
