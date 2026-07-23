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
  CountResponse,
  User,
  UsersListResponse,
  UsersQueryParams,
} from '@/types/user.types'
import { SendNotification } from './notification'
import {
  getNotificationPayload,
  NOTIFICATION_TYPES,
} from '@/constants/notification'
import { auditService } from './audit'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import type { AuthResponse } from '@/types/auth.types'

// Helper to get current user from the atom's storage (localStorage)
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

export const userService = {
  getUsers: async (params: UsersQueryParams): Promise<UsersListResponse> => {
    const { limit = 50, offset = 0, search } = params

    const response = await apiClient.get<UsersListResponse>(
      `/user/list/${limit}/${offset}`,
      { params: { query: search || undefined } }
    )

    return response.data
  },

  getUserCount: async (params?: UsersQueryParams): Promise<number> => {
    const search = params?.search
    const response = await apiClient.get<CountResponse>('/user/count', {
      params: { query: search || undefined },
    })
    return response.data || 0
  },

  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get<User>(`/user/info/${userId}`)
    return response.data
  },

  createUser: async ({
    userData,
    notify = true,
  }: {
    userData: Partial<User>
    notify: boolean
  }): Promise<User> => {
    const actor = getCurrentUser()
    const actorName = actor?.user_name || 'Unknown User'

    try {
      const response = await apiClient.post<User>('/user/create', userData)

      if (notify) {
        const payload = getNotificationPayload(
          NOTIFICATION_TYPES.USER_CREATED,
          {
            // ...userData,
            password: '*******',
            user_name: userData.display_name,
            action_timestamp: new Date().toISOString(),
            message: `User ${userData.display_name} created successfully.`,
          }
        )
        SendNotification(payload)

        // Audit Log: Success
        auditService.log(
          AUDIT_LOG_TYPES.USER_CREATE,
          `User ${actorName} created user ${userData.display_name}`,
          `Action: User Creation
Initiated By: ${actorName}
User Name: ${userData.display_name}
Email: ${userData.user_email || 'N/A'}
Status: Success
Message: ${response.data ? JSON.stringify(response.data) : ''}
Description: The user ${userData.display_name} has been successfully created and added to the system.
Payload: ${JSON.stringify({
            ...userData,
            password: '*******',
          })}`
        )
      }
      return response.data
    } catch (error: any) {
      if (notify) {
        const payload = getNotificationPayload(
          NOTIFICATION_TYPES.USER_CREATION_FAILED,
          {
            // ...userData,
            error: error.message || 'Unknown error',
            user_name: userData.display_name,
            action_timestamp: new Date().toISOString(),
            message: `User ${userData.display_name} creation failed.`,
          }
        )
        SendNotification(payload)
        const errorResponse =
          error.response?.data?.error || error.message || 'Unknown error'
        // Audit Log: Failure
        auditService.log(
          AUDIT_LOG_TYPES.USER_CREATE_FAILED,
          `User ${actorName} failed to create user ${userData.display_name}`,
          `Action: User Creation Failed
Initiated By: ${actorName}
User Name: ${userData.display_name}
Status: Failed
Error Details: ${errorResponse}
Description: The attempt to create user ${userData.display_name} failed.
Payload: ${JSON.stringify({
            ...userData,
            password: '*******',
          })}`
        )
      }
      throw error
    }
  },

  updateUser: async (
    userId: string,
    userData: Partial<User>,
    username: string
  ): Promise<User> => {
    const actor = getCurrentUser()
    const actorName = actor?.user_name || 'Unknown User'
    let payloadData = userData
    if (userData.password) {
      payloadData = {
        ...userData,
        password: '*******',
      }
    }
    try {
      const response = await apiClient.put<User>(`/user/update`, userData)

      const payload = getNotificationPayload(NOTIFICATION_TYPES.USER_UPDATED, {
        ...payloadData,
        user_name: username,
      })
      SendNotification(payload)

      // Audit Log: Success
      auditService.log(
        AUDIT_LOG_TYPES.USER_UPDATE,
        `User ${actorName} updated user ${username}`,
        `Action: User Update
Initiated By: ${actorName}
User Name: ${username || 'N/A'}
User ID: ${userId}
Status: Success
Message: ${response.data ? JSON.stringify(response.data) : ''}
Description: The user details for ${username} have been successfully updated.
Payload: ${JSON.stringify(payloadData)}`
      )

      return response.data
    } catch (error: any) {
      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.USER_UPDATE_FAILED,
        {
          ...userData,
          user_name: username,
          error: error.message || 'Unknown error',
        }
      )
      SendNotification(payload)
      const errorResponse =
        error.response?.data?.error || error.message || 'Unknown error'
      // Audit Log: Failure
      auditService.log(
        AUDIT_LOG_TYPES.USER_UPDATE_FAILED,
        `User ${actorName} failed to update user ${username}`,
        `Action: User Update Failed
Initiated By: ${actorName}
User Name: ${username || 'N/A'}
User ID: ${userId}
Status: Failed
Error Details: ${errorResponse}
Description: The attempt to update user ${username || userId} failed.
Payload: ${JSON.stringify(payloadData)}`
      )

      throw error
    }
  },

  deleteUser: async (userId: string, userName?: string): Promise<void> => {
    const actor = getCurrentUser()
    const actorName = actor?.user_name || 'Unknown User'

    try {
      const response = await apiClient.delete(`/user/delete/${userId}`)

      const payload = getNotificationPayload(NOTIFICATION_TYPES.USER_DELETED, {
        user_id: userId,
        user_name: userName,
      })
      SendNotification(payload)

      // Audit Log: Success
      auditService.log(
        AUDIT_LOG_TYPES.USER_DELETE,
        `User ${actorName} deleted user ${userName || userId}`,
        `Action: User Deletion
Initiated By: ${actorName}
User Name: ${userName || 'N/A'}
User ID: ${userId}
Status: Success
Message: ${response.data ? JSON.stringify(response.data) : ''}
Description: The user ${userName || userId} has been successfully deleted from the system.`
      )
    } catch (error: any) {
      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.USER_DELETION_FAILED,
        {
          user_id: userId,
          error: error.message || 'Unknown error',
          user_name: userName,
        }
      )
      SendNotification(payload)
      const errorResponse =
        error.response?.data?.error || error.message || 'Unknown error'
      // Audit Log: Failure
      auditService.log(
        AUDIT_LOG_TYPES.USER_DELETE_FAILED,
        `User ${actorName} failed to delete user ${userName || userId}`,
        `Action: User Deletion Failed
Initiated By: ${actorName}
User Name: ${userName || 'N/A'}
User ID: ${userId}
Status: Failed 
Error Details: ${errorResponse}
Description: The attempt to delete user ${userName || userId} failed.`
      )

      throw error
    }
  },

  updateUserStatus: async (userData: any, username: string): Promise<User> => {
    const actor = getCurrentUser()
    const actorName = actor?.user_name || 'Unknown User'
    const statusAction = userData.is_active ? 'Activated' : 'Deactivated'

    try {
      const response = await apiClient.put<User>(`/user/update`, userData)

      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.USER_STATUS_UPDATED,
        { ...userData, user_name: username }
      )
      SendNotification(payload)

      // Audit Log: Success
      auditService.log(
        AUDIT_LOG_TYPES.USER_UPDATE,
        `User ${actorName} changed status for user ${username || userData.user_id} to ${statusAction}`,
        `Action: User Status Update
Initiated By: ${actorName}
User Name: ${username || 'N/A'}
User ID: ${userData.user_id}
New Status: ${statusAction}
Status: Success
Message: ${response.data ? JSON.stringify(response.data) : ''}
Description: The status for user ${username || userData.user_id} was successfully updated to ${statusAction}.
Payload: ${JSON.stringify(userData)}`
      )

      return response.data
    } catch (error: any) {
      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.USER_STATUS_UPDATE_FAILED,
        {
          ...userData,
          error: error.message || 'Unknown error',
          user_name: username,
        }
      )
      SendNotification(payload)
      const errorResponse =
        error.response?.data?.error || error.message || 'Unknown error'
      // Audit Log: Failure
      auditService.log(
        AUDIT_LOG_TYPES.USER_UPDATE_FAILED,
        `User ${actorName} failed status update for user ${username || userData.user_id}`,
        `Action: User Status Update Failed
Initiated By: ${actorName}
User Name: ${username || 'N/A'}
User ID: ${userData.user_id}
Attempted Status: ${statusAction}
Status: Failed
Error Details: ${errorResponse}
Description: The attempt to change status for user ${userData.display_name || userData.user_id} failed.
Payload: ${JSON.stringify(userData)}`
      )

      throw error
    }
  },

  resetPassword: async (
    userId: string,
    password: string,
    userName?: string
  ): Promise<void> => {
    const actor = getCurrentUser()
    const actorName = actor?.user_name || 'Unknown User'

    try {
      const response = await apiClient.put(`/user/update`, {
        user_id: userId,
        password,
        user_name: userName,
      })

      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.PASSWORD_RESET,
        {
          user_id: userId,
          user_name: userName,
        }
      )
      SendNotification(payload)

      // Audit Log: Success
      auditService.log(
        AUDIT_LOG_TYPES.PASSWORD_CHANGE,
        `User ${actorName} reset password for user ${userName || userId}`,
        `Action: Password Reset
Initiated By: ${actorName}
User Name: ${userName || 'N/A'}
User ID: ${userId}
Status: Success
Message: ${response.data ? JSON.stringify(response.data) : ''}
Description: A password reset was successfully performed for user ${userName || userId}.`
      )
    } catch (error: any) {
      const payload = getNotificationPayload(
        NOTIFICATION_TYPES.PASSWORD_RESET_FAILED,
        {
          user_id: userId,
          error: error.message || 'Unknown error',
        }
      )
      SendNotification(payload)
      const errorResponse =
        error.response?.data?.error || error.message || 'Unknown error'
      // Audit Log: Failure
      auditService.log(
        AUDIT_LOG_TYPES.PASSWORD_CHANGE_FAILED,
        `User ${actorName} failed password reset for user ${userName || userId}`,
        `Action: Password Reset Failed
Initiated By: ${actorName}
User Name: ${userName || 'N/A'}
User ID: ${userId}
Status: Failed
Error Details: ${errorResponse}
Description: The attempt to reset password for user ${userName || userId} failed.`
      )

      throw error
    }
  },
}
