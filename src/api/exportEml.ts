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

import axios from 'axios'
import { EXPORT_API_KEY, EXPORT_API_URL } from '@/constants/constants'
import { auditService } from './audit'
import { SendNotification } from './notification'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import {
  getNotificationPayload,
  NOTIFICATION_TYPES,
} from '@/constants/notification'

const getCurrentUser = () => {
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

export const exportEml = async (query: string) => {
  const actor = getCurrentUser()
  const actorName = actor?.user_name || 'Unknown User'

  try {
    const res = await axios({
      method: 'GET',
      url: `${EXPORT_API_URL}api/files?job=${query}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': EXPORT_API_KEY,
      },
      timeout: 30000, // 30 seconds for AI response
    })

    // Notification and Audit Log: Success
    const notificationPayload = getNotificationPayload(
      NOTIFICATION_TYPES.EML_EXPORT_VIEW,
      { jobId: query }
    )
    SendNotification(notificationPayload)

    auditService.log(
      AUDIT_LOG_TYPES.EML_EXPORT_VIEW,
      `User ${actorName} viewed EML Zip files for job ID: ${query}`,
      `Action: EML Zip files View
Initiated By: ${actorName}
Job ID: ${query}
Status: Success`,
      undefined,
      query
    )

    return res.data
  } catch (error: any) {
    const response = error?.response || {}
    const errorMessage =
      response?.data?.message ||
      error.message ||
      'Failed to get AI support response.'

    // Notification and Audit Log: Failure
    const notificationPayload = getNotificationPayload(
      NOTIFICATION_TYPES.EML_EXPORT_VIEW_FAILED,
      { jobId: query, error: errorMessage }
    )
    SendNotification(notificationPayload)

    auditService.log(
      AUDIT_LOG_TYPES.EML_EXPORT_VIEW_FAILED,
      `User ${actorName} failed to view EML Zip files for job ID: ${query}`,
      `Action: EML Zip files View Failed
Initiated By: ${actorName}
Job ID: ${query}
Status: Failed
Error Details: ${errorMessage}`,
      undefined,
      query
    )

    throw new Error(errorMessage)
  }
}
