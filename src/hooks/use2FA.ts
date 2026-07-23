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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { authStateAtom } from '@/atoms/auth'
import apiClient from '@/lib/axios'
import { auditService } from '@/api/audit'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import { getCurrentUser } from '@/api/domain'

interface Verify2FAPayload {
  user_id: string
  method: 'totp' | 'sms' | 'email'
  code: string
  organization_id?: string
}

interface Resend2FAPayload {
  user_id: string
  method: 'totp' | 'sms' | 'email'
  organization_id?: string
}

interface Verify2FAResponse {
  success: boolean
  message: string
  session_valid?: boolean
}

export interface TOTPDevice {
  totp_name: string
  totp_id: string
  created_at?: string
}

export const useTOTPList = (userId?: string) => {
  return useQuery({
    queryKey: ['totp-list', userId],
    queryFn: async () => {
      if (!userId) return []
      const response = await apiClient.get<TOTPDevice[]>(
        `/2fa/totp/list/${userId}`
      )
      return response.data ?? []
    },
    enabled: !!userId,
  })
}

export const useTOTPCount = (userId?: string) => {
  return useQuery({
    queryKey: ['totp-count', userId],
    queryFn: async () => {
      if (!userId) return 0
      const response = await apiClient.get<{ count: number }>(
        `/2fa/totp/count/${userId}`
      )
      return response.data?.count ?? 0
    },
    enabled: !!userId,
  })
}

export const useUpdate2FAStatus = () => {
  const queryClient = useQueryClient()
  return useMutation<
    any,
    Error,
    {
      userId: string
      method: 'totp' | 'sms' | 'email'
      enabled: boolean
      organizationId?: string
    }
  >({
    mutationFn: async ({ userId, method, enabled, organizationId }) => {
      // API expects 'enable' query param
      let url = `/user/2fa/update/${userId}/${method}?enable=${enabled}`
      if (organizationId) {
        url += `&organization_id=${organizationId}`
      }
      const response = await apiClient.put(url)
      return response.data
    },
    onSuccess: (data, variables) => {
      const user = getCurrentUser()
      const username = user?.display_name || 'Unknown User'

      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })

      const logType = variables.enabled
        ? AUDIT_LOG_TYPES.TWO_FA_ENABLE
        : AUDIT_LOG_TYPES.TWO_FA_DISABLE
      const actionText = variables.enabled ? 'Enabled' : 'Disabled'

      auditService.log(
        logType,
        `User ${username} ${actionText.toLowerCase()} TFA method ${variables.method}`,
        `Action: TFA ${actionText}
Initiated By: ${username}
User ID: ${variables.userId}
Method: ${variables.method}
Status: Success
Description: TFA method ${variables.method} was ${actionText.toLowerCase()} for user ${username}`
      )
    },
    onError: (error, variables) => {
      const user = getCurrentUser()
      const username = user?.display_name || 'Unknown User'
      const logType = variables.enabled
        ? AUDIT_LOG_TYPES.TWO_FA_ENABLE_FAILED
        : AUDIT_LOG_TYPES.TWO_FA_DISABLE_FAILED
      const actionText = variables.enabled ? 'Enable' : 'Disable'

      toast.error(`Failed to update TFA settings: ${error.message}`)

      auditService.log(
        logType,
        `User ${username} failed to ${actionText.toLowerCase()} TFA method ${variables.method}`,
        `Action: TFA ${actionText} Failed
Initiated By: ${username}
User ID: ${variables.userId}
Method: ${variables.method}
Error: ${error.message}
Status: Failed
Description: Failed to ${actionText.toLowerCase()} TFA method ${variables.method} for user ${username}`
      )
    },
  })
}

export const useDeleteTOTP = (userId?: string) => {
  const queryClient = useQueryClient()
  return useMutation<any, Error, { user_id: string; totp_id: string }>({
    mutationFn: async ({ user_id, totp_id }) => {
      const response = await apiClient.delete(
        `/2fa/totp/delete/${user_id}/${totp_id}`
      )
      return response.data
    },
    onSuccess: (data, variables) => {
      const user = getCurrentUser()
      const username = user?.display_name || 'Unknown User'

      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['totp-list', userId] })
        queryClient.invalidateQueries({ queryKey: ['totp-count', userId] })
      }
      auditService.log(
        AUDIT_LOG_TYPES.TWO_FA_DEVICE_DELETED,
        `User ${username} deleted TOTP device ${variables.totp_id}`,
        `Action: TOTP Device Deleted
Initiated By: ${username}
User ID: ${variables.user_id}
Device ID: ${variables.totp_id}
Status: Success
Description: TOTP device ${variables.totp_id} deleted for user ${username}`
      )
    },
    onError: (error, variables) => {
      const user = getCurrentUser()
      const username = user?.display_name || 'Unknown User'
      auditService.log(
        AUDIT_LOG_TYPES.TWO_FA_DEVICE_DELETED_FAILED,
        `User ${username} failed to delete TOTP device ${variables.totp_id}`,
        `Action: TOTP Device Deletion Failed
Initiated By: ${username}
User ID: ${variables.user_id}
Device ID: ${variables.totp_id}
Error: ${error.message}
Status: Failed
Description: Failed to delete TOTP device ${variables.totp_id} for user ${username}`
      )
    },
  })
}

export const useManage2FA = (userId?: string) => {
  const totpListQuery = useTOTPList(userId)
  const totpCountQuery = useTOTPCount(userId)
  const update2FAStatus = useUpdate2FAStatus()
  const deleteTOTP = useDeleteTOTP(userId)

  return {
    totpList: totpListQuery.data || [],
    totpCount: totpCountQuery.data || 0,
    isLoadingTOTP: totpListQuery.isLoading,
    toggle2FA: update2FAStatus, // mapping back to toggle2FA for compatibility
    deleteTOTP,
  }
}

export const use2FAVerification = () => {
  const setAuthState = useSetAtom(authStateAtom)

  const verify2FA = useMutation<Verify2FAResponse, Error, Verify2FAPayload>({
    mutationFn: async (payload: Verify2FAPayload) => {
      const url =
        payload.method == 'totp'
          ? `/validate/2fa/${payload.method}/${payload.user_id}/${payload.code}`
          : `/validate/2fa/${payload.method}/${payload.code}`
      const response = await apiClient.post<Verify2FAResponse>(url)
      return response.data
    },
    onSuccess: (data: any) => {
      if (
        data === 'TOTP code is valid' ||
        data === 'SMS OTP is valid' ||
        data === 'E-Mail OTP is valid'
      ) {
        // Update session cookie (server should set this)
        document.cookie = 'Session-Valid=true; path=/;'

        // Clear 2FA session data
        sessionStorage.removeItem('2fa_methods')
        sessionStorage.removeItem('user_id')
        sessionStorage.removeItem('selected_2fa_method')

        // Update auth state
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
        toast.success('TFA verification successful')
      } else {
        toast.error(data.message || 'Verification failed')
      }
    },
    onError: error => {
      toast.error('Verification failed. Please try again.')
      console.error('TFA verification error:', error)
    },
    retry: 0,
  })

  const resend2FACode = useMutation({
    mutationFn: async (payload: Resend2FAPayload) => {
      const response = await apiClient.post(`/2fa/${payload.method}/send`)
      // toast.success(response?.data)
      return response.data
    },
    onError: error => {
      // toast.error(error?.message)
      console.error('Failed to resend 2FA code:', error)
    },
    retry: 0,
  })

  return {
    verify2FA: verify2FA.mutateAsync,
    resend2FACode: resend2FACode.mutateAsync,
    isLoading: verify2FA.isPending,
    error: verify2FA.error?.message,
  }
}

// Hook to check if 2FA is required
export const useCheck2FA = () => {
  const navigate = useNavigate()

  const check2FAStatus = (user: any) => {
    const has2FA =
      user?.is_totp_2fa_active ||
      user?.is_sms_2fa_active ||
      user?.is_email_2fa_active

    if (!has2FA) return false

    const isSessionValid = document.cookie.includes('Session-Valid=true')
    return !isSessionValid
  }

  const redirectTo2FA = (user: any) => {
    if (!user) return

    const activeMethods: string[] = []
    if (user.is_totp_2fa_active) activeMethods.push('totp')
    if (user.is_sms_2fa_active) activeMethods.push('sms')
    if (user.is_email_2fa_active) activeMethods.push('email')

    sessionStorage.setItem('2fa_methods', JSON.stringify(activeMethods))
    sessionStorage.setItem('user_id', user.user_id)

    if (activeMethods.length === 1) {
      navigate(`/2fa/${activeMethods[0]}`)
    } else {
      navigate('/2fa/select')
    }
  }

  return {
    check2FAStatus,
    redirectTo2FA,
  }
}

// Hook for 2FA Setup
export const use2FASetup = () => {
  // Initiate TOTP Setup
  const initiateTOTP = useMutation<
    { name: string; qr_code_url: string; secret: string },
    Error,
    { user_id: string; totp_name: string; organization_id?: string }
  >({
    mutationFn: async payload => {
      const url = `/2fa/totp/new/${payload.user_id}?totp_name=${payload.totp_name}`
      const response = await apiClient.post(url)
      return response.data
    },
    retry: 0,
    onSuccess: (data, variables) => {
      const user = getCurrentUser()
      const username = user?.display_name || 'Unknown User'
      auditService.log(
        AUDIT_LOG_TYPES.TWO_FA_SETUP_INITIATED,
        `User ${username} initiated TOTP setup`,
        `Action: TOTP Setup Initiated
Initiated By: ${username}
User ID: ${variables.user_id}
TOTP Name: ${variables.totp_name}
Status: Success
Description: TOTP setup initiated for user ${username}` // Changed ${variables.user_id} to ${username} here too for consistency if needed, but 'user_id' in description is usually fine for audit. But log_message MUST be username.
      )
    },
    onError: (error: any, variables) => {
      const errorType = error.response?.data?.error || 'Unknown'
      const user = getCurrentUser()
      const username = user?.display_name || 'Unknown User'
      toast.error(`Failed to initiate TOTP: ${errorType}`)
      auditService.log(
        AUDIT_LOG_TYPES.TWO_FA_SETUP_FAILED,
        `User ${username} failed to initiate TOTP setup`,
        `Action: TOTP Setup Failed
Initiated By: ${username}
User ID: ${variables.user_id}
TOTP Name: ${variables.totp_name}
Error Type: ${errorType}
Status: Failed
Description:  Failed to initiate TOTP setup for user ${username}`
      )
    },
  })

  // Initiate SMS/Email Setup (Send code)
  const initiateOTP = useMutation<
    { success: boolean; message: string },
    Error,
    { user_id: string; method: 'sms' | 'email'; organization_id?: string }
  >({
    mutationFn: async payload => {
      const response = await apiClient.post(`/2fa/${payload.method}/send`, {
        user_id: payload.user_id,
        organization_id: payload.organization_id,
      })
      return response.data
    },
    onError: error => {
      toast.error(`Failed to send code: ${error.message}`)
    },
    retry: 0,
  })

  // Verify and Enable 2FA Method
  const verifyAndEnable = useMutation<
    Verify2FAResponse,
    Error,
    {
      user_id: string
      method: 'totp' | 'sms' | 'email'
      code: string
      secret?: string
      organization_id?: string
    }
  >({
    mutationFn: async payload => {
      const url =
        payload.method === 'totp'
          ? `/validate/2fa/totp/${payload.user_id}/${payload.code}`
          : `/2fa/${payload.method}/${payload.code}`
      const response = await apiClient.post(url)
      return response.data
    },
    onError: error => {
      toast.error(`Failed to verify: ${error.message}`)
    },
    retry: 0,
  })

  // Final completion step (if needed by API, or just a UI state transition)
  const completeSetup = useMutation<
    any,
    Error,
    { user_id: string; method: string; organization_id?: string }
  >({
    mutationFn: async payload => {
      const url = `/user/2fa/update/${payload.user_id}/${payload.method}?enable=true`
      const response = await apiClient.put(url)
      return response.data
    },
    onSuccess: (data, variables) => {
      const user = getCurrentUser()
      const username = user?.display_name || 'Unknown User'
      toast.success('TFA enabled successfully')
      auditService.log(
        AUDIT_LOG_TYPES.TWO_FA_ENABLE,
        `User ${username} enabled TFA method: ${variables.method}`,
        `Action: TFA Enable
Initiated By: ${username}
Method: ${variables.method}
Status: Success
Description: TFA enabled successfully for user ${username}
Payload: ${JSON.stringify(variables)}`
      )
    },
    onError: (error: any, variables) => {
      const errorType = error.response?.data?.error || 'Unknown'
      const user = getCurrentUser()
      const username = user?.display_name || 'Unknown User'
      toast.error(`Failed to enable TFA: ${errorType}`)
      auditService.log(
        AUDIT_LOG_TYPES.TWO_FA_ENABLE_FAILED,
        `User ${username} failed to enable TFA method: ${variables.method}`,
        `Action: TFA Enable Failed
Initiated By: ${username}
Method: ${variables.method}
Error Type: ${errorType}
Status: Failed
Description: Failed to enable TFA for user ${username}`
      )
    },
    retry: 0,
  })

  return {
    initiateTOTP,
    initiateOTP,
    verifyAndEnable,
    completeSetup,
  }
}
