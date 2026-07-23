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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'

import {
  authStateAtom,
  csrfTokenAtom,
  notificationsTokenAtom,
} from '@/atoms/auth'
import { type AuthResponse, type LoginPayload } from '@/types/auth.types'
import { AxiosError } from 'axios'
import { authService } from '@/api/auth'
import { getSessionValidCookie } from '@/utils/cookieUtils'
import { useEffect } from 'react'
import { userAtom } from '@/atoms/user'
import { organizationAtom } from '@/atoms/organization'
import {
  getNotificationPayload,
  NOTIFICATION_TYPES,
} from '@/constants/notification'
import { SendNotification } from '@/api/notification'
import { getDefaultLandingRoute } from '@/utils/accessPermission'

export const useLogin = () => {
  const navigate = useNavigate()
  // Set up Jotai setters
  const setAuthState = useSetAtom(authStateAtom)
  const setUser = useSetAtom(userAtom)

  return useMutation<AuthResponse, AxiosError, LoginPayload>({
    mutationFn: async payload => {
      // Set loading state
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

      return authService.login(payload)
    },
    onSuccess: async (userData: any) => {
      // Store user data
      setUser(userData)

      // Now validate session to check 2FA status
      try {
        const validatedUser: any = userData

        // Check 2FA status
        const has2FA =
          validatedUser.is_totp_2fa_active ||
          validatedUser.is_sms_2fa_active ||
          validatedUser.is_email_2fa_active

        // Check if session is validated (2FA completed)
        const isSessionValid = getSessionValidCookie()

        if (has2FA && !isSessionValid) {
          // Determine which 2FA methods are active
          const activeMethods: string[] = []
          if (validatedUser.is_totp_2fa_active) activeMethods.push('totp')
          if (validatedUser.is_sms_2fa_active) activeMethods.push('sms')
          if (validatedUser.is_email_2fa_active) activeMethods.push('email')

          // Store 2FA methods in sessionStorage for the 2FA page
          sessionStorage.setItem('2fa_methods', JSON.stringify(activeMethods))
          sessionStorage.setItem('user_id', validatedUser.user_id)

          // Navigate based on number of active methods
          if (activeMethods.length === 1) {
            navigate(`/2fa/${activeMethods[0]}`)
          } else {
            navigate('/2fa/select')
          }

          // Don't set authenticated state yet - wait for 2FA completion
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })

          toast.info('Two-factor authentication required')
          return
        }

        // Set authenticated state
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })

        toast.success('Welcome back to Archive')
        const fromPath = getDefaultLandingRoute(validatedUser)

        if (!has2FA) {
          const notifPayload = getNotificationPayload(
            NOTIFICATION_TYPES.AUTH_LOGIN,
            {
              user_name: userData?.user_name,
              action_timestamp: new Date().toISOString(),
              message: `User ${userData?.user_name} logged in successfully.`,
            }
          )
          SendNotification(notifPayload)
        }
        navigate(fromPath)
      } catch (error) {
        console.error('Session validation failed:', error)
        toast.error('Failed to validate session')

        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: 'Session validation failed',
        })
      }
    },
    onError: (error: any) => {
      // Use a fallback to prevent "undefined" or [object Object] from showing
      const apiError = error.response?.data as { error?: string }
      const errorMessage =
        apiError?.error || error.message || 'An unexpected error occurred'

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      })

      toast.error(errorMessage)
    },
    retry: 0,
  })
}

// Add session validation hook for app initialization
export const useValidateSession = () => {
  const setAuthState = useSetAtom(authStateAtom)
  const setUser = useSetAtom(userAtom)
  const navigate = useNavigate()
  // const loadOrganization = useLoadOrganization()

  return useMutation({
    mutationFn: () => authService.validateSession(),
    onSuccess: async (userData: any) => {
      // Check if user has pending 2FA
      const has2FA =
        userData.is_totp_2fa_active ||
        userData.is_sms_2fa_active ||
        userData.is_email_2fa_active

      const isSessionValid = getSessionValidCookie()

      if (has2FA && !isSessionValid) {
        // Redirect to 2FA if needed
        const activeMethods: string[] = []
        if (userData.is_totp_2fa_active) activeMethods.push('totp')
        if (userData.is_sms_2fa_active) activeMethods.push('sms')
        if (userData.is_email_2fa_active) activeMethods.push('email')

        sessionStorage.setItem('2fa_methods', JSON.stringify(activeMethods))
        sessionStorage.setItem('user_id', userData.user_id)

        if (activeMethods.length === 1) {
          navigate(`/2fa/${activeMethods[0]}`)
        } else {
          navigate('/2fa/select')
        }
        return
      }

      // Session is valid, proceed
      setUser(userData)

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    },
    onError: error => {
      console.error('Session validation failed:', error)
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Session validation failed',
      })

      // Clear invalid session
      localStorage.clear()
      navigate('/login')
    },
  })
}

// Logout hook
// Logout hook
export const useLogout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setAuthState = useSetAtom(authStateAtom)
  const setUser = useSetAtom(userAtom)
  const setCsrfToken = useSetAtom(csrfTokenAtom)
  const setNotificationsToken = useSetAtom(notificationsTokenAtom)
  const setOrganization = useSetAtom(organizationAtom)

  return async () => {
    try {
      // Call logout API - interceptor handles CSRF token automatically
      await authService.logout() // No parameter needed!

      // Clear all auth state
      setUser(null)
      setCsrfToken(null)
      setNotificationsToken(null)
      setOrganization(null)

      // Clear react-query cache
      queryClient.removeQueries()

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })

      // Clear 2FA session data
      sessionStorage.removeItem('2fa_methods')
      sessionStorage.removeItem('user_id')

      // Navigate to login
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Logout failed')
    }
  }
}

// Check auth status hook - updated with 2FA check
export const useCheckAuth = () => {
  const setAuthState = useSetAtom(authStateAtom)
  const user = useAtomValue(userAtom)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      // Check if session is valid (2FA completed)
      const isSessionValid = getSessionValidCookie()
      const has2FA =
        user?.is_totp_2fa_active ||
        user?.is_sms_2fa_active ||
        user?.is_email_2fa_active

      if (has2FA && !isSessionValid) {
        // Redirect to 2FA
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
        return
      }

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    }
  }, [user, setAuthState, navigate])
}
