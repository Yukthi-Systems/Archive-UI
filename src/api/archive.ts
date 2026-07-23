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
  ArchiveSearchParams,
  ArchiveSearchResponse,
  ArchiveStats,
} from '@/types/archive.types'
import { SendNotification } from './notification'
import {
  getNotificationPayload,
  NOTIFICATION_TYPES,
} from '@/constants/notification'
import { auditService } from './audit'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import type { AuthResponse } from '@/types/auth.types'

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

export const archiveService = {
  // Search archives
  searchArchives: async (
    params: ArchiveSearchParams
  ): Promise<ArchiveSearchResponse> => {
    const actor = getCurrentUser()
    const actorName = actor?.user_name || 'Unknown User'
    try {
      const response = await apiClient.post<ArchiveSearchResponse>(
        '/archive/search',
        params
      )
      auditService.log(
        AUDIT_LOG_TYPES.ARCHIVE_SEARCH,
        `User ${actorName} searched archives`,
        `Action: Archive Search
Initiated By: ${actorName}
Domain: ${params.domain_name || 'All'}
Status: Success
Description: User performed an archive search with params: ${JSON.stringify(params)}`
      )
      return response.data
    } catch (error: any) {
      const errorResponse =
        error.response?.data?.error || error.message || 'Unknown error'
      auditService.log(
        AUDIT_LOG_TYPES.ARCHIVE_SEARCH_FAILED,
        `User ${actorName} failed to search archives`,
        `Action: Archive Search Failed
Initiated By: ${actorName}
Domain: ${params.domain_name || 'All'}
Status: Failed
Error Details: ${errorResponse}
Description: The attempt to search archives failed.`
      )
      throw error
    }
  },

  // Get search count
  getSearchCount: async (params: ArchiveSearchParams): Promise<number> => {
    const response = await apiClient.post<{ count: number }>(
      '/archive/search/count',
      params
    )
    return Number(response.data || 0)
  },

  // Get email count for a domain
  getDomainEmailCount: async (domain_name: string): Promise<number> => {
    const response = await apiClient.get<{ count: number }>(
      `/archive/count/emails/${domain_name}`
    )
    return Number(response.data || 0)
  },

  // Fetch EML content
  fetchEml: async (
    domain_name: string,
    archive_id: string,
    notify: boolean = true,
    type: string = 'view',
    subject: string = ''
  ): Promise<string> => {
    const actor = getCurrentUser()
    const actorName = actor?.user_name || 'Unknown User'

    try {
      const response = await apiClient.get<string>(
        `/archive/fetch/${domain_name}/${archive_id}/eml`
      )

      if (notify) {
        const payload = getNotificationPayload(
          NOTIFICATION_TYPES.ARCHIVE_EML_DOWNLOADED,
          {
            archive_id,
            domain_name,
          }
        )
        // SendNotification(payload) // Uncomment if we want UI toaster notifications for downloads

        // Audit Log: Success
        auditService.log(
          type === 'view'
            ? AUDIT_LOG_TYPES.ARCHIVE_VIEW
            : AUDIT_LOG_TYPES.ARCHIVE_DOWNLOAD,
          `User ${actorName} ${type === 'view' ? 'viewed' : 'downloaded'} EML  ${subject ? ` - Subject: ${subject}` : ''} (${domain_name})`,
          `Action: Archive EML ${type === 'view' ? 'View' : 'Download'}
Initiated By: ${actorName}
Archive ID: ${archive_id}
Domain: ${domain_name}
Subject: ${subject || 'N/A'}
Status: Success
Description: The EML file for archive ID ${archive_id} in domain ${domain_name} has been successfully ${type === 'view' ? 'viewed' : 'downloaded'}.`
        )
      }
      return response.data
    } catch (error: any) {
      if (notify) {
        const payload = getNotificationPayload(
          NOTIFICATION_TYPES.ARCHIVE_EML_DOWNLOAD_FAILED,
          {
            archive_id,
            domain_name,
            error: error.message || 'Unknown error',
          }
        )
        SendNotification(payload)
        const errorResponse =
          error.response?.data?.error || error.message || 'Unknown error'
        // Audit Log: Failure
        auditService.log(
          type === 'view'
            ? AUDIT_LOG_TYPES.ARCHIVE_VIEW_FAILED
            : AUDIT_LOG_TYPES.ARCHIVE_DOWNLOAD_FAILED,
          `User ${actorName} failed EML ${type === 'view' ? 'view' : 'download'} EML  ${subject ? ` - Subject: ${subject}` : ''} (${domain_name})`,
          `Action: Archive EML ${type === 'view' ? 'View' : 'Download'} Failed
Initiated By: ${actorName}
Archive ID: ${archive_id}
Domain: ${domain_name}
Subject: ${subject || 'N/A'}
Status: Failed
Error Details: ${errorResponse}
Description: The attempt to ${type === 'view' ? 'view' : 'download'} EML for archive ID ${archive_id} failed.`
        )
      }

      throw error
    }
  },

  // Request download
  requestDownload: async (params: ArchiveSearchParams): Promise<void> => {
    const actor = getCurrentUser()
    const actorName = actor?.user_name || 'Unknown User'
    try {
      const response = await apiClient.put('/archive/request', params)
      auditService.log(
        AUDIT_LOG_TYPES.ARCHIVE_DOWNLOAD_REQUESTED,
        `User ${actorName} requested download of EML for domain ${params.domain_name}`,
        `Action: Archive EML Download Requested
Initiated By: ${actorName}
Domain: ${params.domain_name}
Status: Success
Params: ${JSON.stringify(params)}
Description: ${response.data || 'The user requested a download of EML files.'}`
      )
      return response.data
    } catch (error: any) {
      const errorResponse =
        error.response?.data?.error || error.message || 'Unknown error'
      auditService.log(
        AUDIT_LOG_TYPES.ARCHIVE_DOWNLOAD_REQUEST_FAILED,
        `User ${actorName} failed to request download of EML for domain ${params.domain_name}`,
        `Action: Archive EML Download Requested Failed
Initiated By: ${actorName}
Domain: ${params.domain_name}
Status: Failed
Params: ${JSON.stringify(params)}
Error Details: ${errorResponse}
Description: ${errorResponse || 'The attempt to request a download of EML files failed.'}`
      )
      throw error
    }
  },

  // Forward email
  forwardEmail: async (
    domain_name: string,
    archive_id: string,
    forward_emails: string | string[],
    subject: string = ''
  ): Promise<void> => {
    const actor = getCurrentUser()
    const actorName = actor?.user_name || 'Unknown User'
    const emailList = Array.isArray(forward_emails)
      ? forward_emails.join(',')
      : forward_emails

    try {
      const response = await apiClient.post(
        `/archive/forward/${domain_name}/${archive_id}/${emailList}`
      )
      auditService.log(
        AUDIT_LOG_TYPES.ARCHIVE_FORWARD,
        `User ${actorName} forwarded email${subject ? ` "${subject}"` : ''} (${domain_name}) to ${emailList}`,
        `Action: Archive Email Forward
Initiated By: ${actorName}
Archive ID: ${archive_id}
Domain: ${domain_name}
Subject: ${subject || 'N/A'}
Forward To: ${emailList}
Status: Success
Description: ${response.data || 'The email for archive ID ${archive_id} in domain ${domain_name} was successfully forwarded to ${emailList}.'}`
      )
      return response.data
    } catch (error: any) {
      const errorResponse =
        error.response?.data?.error || error.message || 'Unknown error'
      auditService.log(
        AUDIT_LOG_TYPES.ARCHIVE_FORWARD_FAILED,
        `User ${actorName} failed to forward email${subject ? ` "${subject}"` : ''} (${domain_name}) to ${emailList}`,
        `Action: Archive Email Forward Failed
Initiated By: ${actorName}
Archive ID: ${archive_id}
Domain: ${domain_name}
Subject: ${subject || 'N/A'}
Forward To: ${emailList}
Status: Failed
Error Details: ${errorResponse}
Description: ${errorResponse || 'The attempt to forward email for archive ID ${archive_id} to ${emailList} failed.'}`
      )
      throw error
    }
  },

  // Get archive stats
  getArchiveStats: async (domain_name: string): Promise<ArchiveStats> => {
    const response = await apiClient.get<ArchiveStats>(
      `/archive/stats/${domain_name}`
    )
    return response.data
  },
}
