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

import apiClient, { apiLoginClient } from '@/lib/axios'
import type {
  AuthResponse,
  LoginPayload,
  ValidatedUser,
} from '@/types/auth.types'
import Cookies from 'js-cookie'
import { SendNotification } from './notification'
import {
  getNotificationPayload,
  NOTIFICATION_TYPES,
} from '@/constants/notification'
import type { AuthResponse as UserAuthData } from '@/types/auth.types'
import { auditService } from './audit'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'

const getCurrentUser = (): UserAuthData | null => {
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

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    try {
      // Extract .data from the AxiosResponse
      const response = await apiLoginClient.post<AuthResponse>(
        '/user/login',
        payload
      )
      // const notifPayload = getNotificationPayload(
      //   NOTIFICATION_TYPES.AUTH_LOGIN,
      //   {
      //     user_name: payload.user_name,
      //     action_timestamp: new Date().toISOString(),
      //     message: `User ${payload.user_name} logged in successfully.`,
      //   }
      // )
      // SendNotification(notifPayload)
      auditService.log(
        AUDIT_LOG_TYPES.LOGIN,
        `User ${payload.user_name} logged in successfully`,
        `Action: User Login
User: ${payload.user_name}
Status: Success
Description: User ${payload.user_name} has successfully authenticated and logged into the system.`
      )

      return response.data
    } catch (error: any) {
      const notifPayload = getNotificationPayload(
        NOTIFICATION_TYPES.AUTH_LOGIN_FAILED,
        {
          user_name: payload.user_name,
          error: error.message || 'Unknown error',
        }
      )
      // SendNotification(notifPayload)
      //       const errorResponse =
      //         error.response?.data?.error || error.message || 'Unknown error'
      //       auditService.log(
      //         AUDIT_LOG_TYPES.FAILED_LOGIN,
      //         `Login failed for user ${payload.user_name}. Error: ${errorResponse}`,
      //         `Action: User Login Failed
      // User: ${payload.user_name}
      // Status: Failed
      // Error Details: ${errorResponse}
      // Description: A login attempt for user ${payload.user_name} failed. Please verify credentials.`
      //       )
      throw error
    }
  },

  validateSession: async (): Promise<ValidatedUser> => {
    const response = await apiClient.get<ValidatedUser>('/user/validate')
    return response.data
  },

  logout: async () => {
    // Remove csrfToken parameter - not needed!
    const user = getCurrentUser()
    const username = user?.user_name || 'Unknown User'

    try {
      const payload = getNotificationPayload(NOTIFICATION_TYPES.AUTH_LOGOUT, {
        user_name: username,
        action_timestamp: new Date().toISOString(),
        message: `User ${username} logged out successfully.`,
      })
      const notificationStatus = await SendNotification(payload)
      const auditStatus = await auditService.addLog({
        log_type: AUDIT_LOG_TYPES.LOGOUT,
        log_message: `User ${username} logged out`,
        log_description: `Action: User Logout
User: ${username}
Status: Success
Description: User ${username} has successfully logged out of the system.`,
      })

      // The interceptor will automatically add X-CSRF-Token header
      if (notificationStatus && auditStatus) {
        await apiClient.delete('/user/logout')
      }
    } catch (error: any) {
      console.error('Logout error:', error)
      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.AUTH_LOGOUT_FAILED,
        {
          user_name: username,
          action_timestamp: new Date().toISOString(),
          error: error.message || 'Unknown error',
        }
      )
      await SendNotification(payload)
      const errorResponse =
        error.response?.data?.error || error.message || 'Unknown error'
      await auditService.log(
        AUDIT_LOG_TYPES.LOGOUT,
        `User ${username} logged out (Manual/Error)`,
        `Action: User Logout (Error)
User: ${username}
Status: Partial/Failed
Error Details: ${errorResponse}
Description: User ${username} logout process encountered an error but session local data is being cleared.`
      )
    } finally {
      // Clear tokens from storage
      localStorage.clear()

      // Clear cookies
      const allCookies = Cookies.get()
      Object.keys(allCookies).forEach(cookieName => {
        Cookies.remove(cookieName)
      })
    }
  },

  getCsrfToken: (): string | null => {
    return localStorage.getItem('csrfToken')
  },

  getNotificationsToken: (): string | null => {
    return localStorage.getItem('notificationsToken')
  },

  getSessionId: (): string | null => {
    return getCookie('Session-ID')
  },

  isSessionValid: (): boolean => {
    return getCookie('Session-Valid') === 'true'
  },
}

// Helper function to get cookie value
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}
