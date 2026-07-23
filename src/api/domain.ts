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
  Domain,
  DomainInfo,
  DomainsListResponse,
  DomainsQueryParams,
  CreateDomainPayload,
  UpdateDomainPayload,
  DomainCountResponse,
} from '@/types/domain.types'
import { SendNotification } from './notification'
import {
  getNotificationPayload,
  NOTIFICATION_TYPES,
} from '@/constants/notification'
import { auditService } from './audit'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import type { AuthResponse } from '@/types/auth.types'

// Helper to get current user from the atom's storage (localStorage)
export const getCurrentUser = (): AuthResponse | null => {
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

export const domainService = {
  // Get domains list with pagination
  getDomains: async (
    params: DomainsQueryParams
  ): Promise<DomainsListResponse> => {
    const { limit = 10, offset = 0, search } = params

    const response = await apiClient.get<Domain[]>(`/domain/list`, {
      params: { query: search || undefined },
    })

    return {
      data: response.data,
      total: response.data.length,
      page: Math.floor(offset / limit) + 1,
      limit,
    }
  },

  // Get total domain count
  getDomainsCount: async (
    params?: DomainsQueryParams
  ): Promise<DomainCountResponse> => {
    const search = params?.search
    const response = await apiClient.get<DomainCountResponse>('/domain/count', {
      params: { query: search || undefined },
    })
    return response.data
  },

  // Get archive domains
  getArchiveDomains: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/archive/domains')
    return response.data
  },

  // Get single domain info
  getDomainById: async (domainId: string): Promise<DomainInfo> => {
    const response = await apiClient.get<DomainInfo>(`/domain/info/${domainId}`)
    return response.data
  },

  // Create new domain
  createDomain: async ({
    domainData,
    notify = true,
  }: {
    domainData: CreateDomainPayload
    notify: boolean
  }): Promise<Domain> => {
    const user = getCurrentUser()
    const username = user?.user_name || 'Unknown User'

    try {
      const response = await apiClient.post<Domain>(
        '/domain/create',
        domainData
      )
      if (notify) {
        // Notifications
        const payload = getNotificationPayload(
          NOTIFICATION_TYPES.DOMAIN_CREATED,
          domainData
        )
        SendNotification(payload)

        // Audit Log: Success
        auditService.log(
          AUDIT_LOG_TYPES.DOMAIN_CREATE,
          `User ${username} created domain ${domainData.domain_name}`,
          `Action: Domain Creation
Initiated By: ${username}
Domain Name: ${domainData.domain_name}
Status: Success
Message: ${response.data ? JSON.stringify(response.data) : ''}
Description: The domain ${domainData.domain_name} has been successfully created. Initial configuration has been applied and the domain is now active in the system.
Payload: ${JSON.stringify(domainData)}`
        )
      }
      return response.data
    } catch (error: any) {
      if (notify) {
        // Notifications: Failure
        const payload = getNotificationPayload(
          NOTIFICATION_TYPES.DOMAIN_CREATION_FAILED,
          {
            ...domainData,
            error: error.message || 'Unknown error',
          }
        )
        SendNotification(payload)
        const errorResponse =
          error.response?.data?.error || error.message || 'Unknown error'
        // Audit Log: Failure
        auditService.log(
          AUDIT_LOG_TYPES.DOMAIN_CREATE_FAILED,
          `User ${username} failed to create domain ${domainData.domain_name}`,
          `Action: Domain Creation Failed
Initiated By: ${username}
Domain Name: ${domainData.domain_name}
Status: Failed
Error Details: ${errorResponse}
Description: The attempt to create domain ${domainData.domain_name} was unsuccessful. Please verify the domain details and system logs for further investigation.
Payload: ${JSON.stringify(domainData)}`
        )
      }
      throw error
    }
  },

  // Update domain
  updateDomain: async (
    domainId: string,
    domainData: UpdateDomainPayload,
    domainName?: string
  ): Promise<Domain> => {
    const user = getCurrentUser()
    const username = user?.user_name || 'Unknown User'

    try {
      const response = await apiClient.put<Domain>(
        `/domain/update/${domainId}`,
        domainData
      )

      // Notifications
      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.DOMAIN_UPDATED,
        { ...domainData, domain_name: domainName }
      )
      SendNotification(payload)

      // Audit Log: Success
      auditService.log(
        AUDIT_LOG_TYPES.DOMAIN_UPDATE,
        `User ${username} updated domain ${domainName}`,
        `Action: Domain Update
Initiated By: ${username}
Domain Name: ${domainName}
Domain ID: ${domainId}
Status: Success
Message: ${response.data ? JSON.stringify(response.data) : ''}
Description: The domain configuration for ${domainData.domain_name || domainId} has been successfully updated. All changes have been saved and applied to the system.
Payload: ${JSON.stringify(domainData)}`
      )

      return response.data
    } catch (error: any) {
      // Notifications: Failure
      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.DOMAIN_UPDATE_FAILED,
        {
          ...domainData,
          error: error.message || 'Unknown error',
          domain_name: domainName,
        }
      )
      SendNotification(payload)
      const errorResponse =
        error.response?.data?.error || error.message || 'Unknown error'
      // Audit Log: Failure
      auditService.log(
        AUDIT_LOG_TYPES.DOMAIN_UPDATE_FAILED,
        `User ${username} failed to update domain ${domainName}`,
        `Action: Domain Update Failed
Initiated By: ${username}
Domain Name: ${domainName}
Domain ID: ${domainId}
Status: Failed
Error Details: ${errorResponse}
Description: The attempt to update domain ${domainData.domain_name || domainId} failed. No changes were applied. Check the error details and system logs for troubleshooting.
Payload: ${JSON.stringify(domainData)}`
      )

      throw error
    }
  },

  // Delete domain
  deleteDomain: async (
    domainId: string,
    domainName?: string
  ): Promise<void> => {
    const user = getCurrentUser()
    const username = user?.user_name || 'Unknown User'

    try {
      await apiClient.delete(`/domain/${domainId}`)

      // Notifications
      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.DOMAIN_DELETED,
        {
          domain_id: domainId,
          domain_name: domainName,
        }
      )
      SendNotification(payload)

      // Audit Log: Success
      auditService.log(
        AUDIT_LOG_TYPES.DOMAIN_DELETE,
        `User ${username} deleted domain ${domainName || domainId}`,
        `Action: Domain Deletion
Initiated By: ${username}
Domain Name: ${domainName || 'N/A'}
Domain ID: ${domainId}
Status: Success
Description: The domain ${domainName || domainId} has been successfully deleted from the system. Associated data and resources have been removed or scheduled for removal.`
      )
    } catch (error: any) {
      // Notifications: Failure
      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.DOMAIN_DELETION_FAILED,
        {
          domain_id: domainId,
          error: error.message || 'Unknown error',
          domain_name: domainName,
        }
      )
      SendNotification(payload)
      const errorResponse =
        error.response?.data?.error || error.message || 'Unknown error'
      // Audit Log: Failure
      auditService.log(
        AUDIT_LOG_TYPES.DOMAIN_DELETE_FAILED,
        `User ${username} failed to delete domain ${domainName || domainId}`,
        `Action: Domain Deletion Failed
Initiated By: ${username}
Domain Name: ${domainName || 'N/A'}
Domain ID: ${domainId}
Status: Failed
Error Details: ${errorResponse}
Description: The attempt to delete domain ${domainName || domainId} was unsuccessful. The domain and its associated data remain intact in the system.`
      )

      throw error
    }
  },
}
