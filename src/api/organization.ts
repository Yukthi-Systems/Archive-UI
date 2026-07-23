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
import type { Organization } from '@/types/organization.types'

import { SendNotification } from './notification'
import {
  getNotificationPayload,
  NOTIFICATION_TYPES,
} from '@/constants/notification'
import { auditService } from './audit'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import type { AuthResponse } from '@/types/auth.types'

// Helper to get current user from storage
const getCurrentUser = (): AuthResponse | null => {
  try {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      return JSON.parse(storedUser)
    }
  } catch (error) {
    console.error('Failed to retrieve user from storage', error)
  }
  return null
}

export const organizationService = {
  // Get organization info
  getOrganizationInfo: async (): Promise<Organization> => {
    const response = await apiClient.get<Organization>('/organization/info')
    return response.data
  },

  // Update organization
  updateOrganization: async (
    data: Partial<Organization>
  ): Promise<Organization> => {
    const user = getCurrentUser()
    const username = user?.user_name || 'Unknown User'

    try {
      const response = await apiClient.put<Organization>(
        '/organization/update',
        data
      )

      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.ORGANIZATION_UPDATED,
        data
      )
      SendNotification(payload)

      // Audit Log: Success
      auditService.log(
        AUDIT_LOG_TYPES.SYSTEM_CONFIG,
        'Organization Updated',
        `User ${username} updated organization settings.`
      )

      return response.data
    } catch (error: any) {
      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.ORGANIZATION_UPDATE_FAILED,
        {
          ...data,
          error: error.message || 'Unknown error',
        }
      )
      SendNotification(payload)

      // Audit Log: Failure
      auditService.log(
        AUDIT_LOG_TYPES.SYSTEM_CONFIG,
        'Organization Update Failed',
        `User ${username} failed to update organization settings. Error: ${error.message || 'Unknown error'}`
      )

      throw error
    }
  },
}
