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

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Shield,
  Smartphone,
  Mail,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { use2FAVerification } from '@/hooks/use2FA'
import Cookies from 'js-cookie'
// import { useOrganization } from '@/hooks/useOrganization'
import { SendNotification } from '@/api/notification'
import {
  getNotificationPayload,
  NOTIFICATION_TYPES,
} from '@/constants/notification'
import { isAuthenticatedAtom } from '@/atoms/auth'
import { userAtom } from '@/atoms/user'
import { getDefaultLandingRoute } from '@/utils/accessPermission'
import { useAtomValue } from 'jotai'
import { auditService } from '@/api/audit'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'

export const TwoFAVerifyPage = () => {
  const { method } = useParams<{ method: 'totp' | 'sms' | 'email' }>()
  const navigate = useNavigate()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState<string | null>(null)
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)
  const user = useAtomValue(userAtom)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Get user ID from session storage
  const userId = sessionStorage.getItem('user_id') || ''

  // Initialize 2FA verification
  const {
    verify2FA,
    resend2FACode,
    isLoading: isVerifying,
    error: verifyError,
  } = use2FAVerification()

  useEffect(() => {
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }

    // Start cooldown for resend
    setResendCooldown(30)
  }, [])

  // Handle cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      )
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Handle input change
  const handleInputChange = (index: number, value: string) => {
    // Validation based on method
    const regex = method === 'totp' ? /^\d*$/ : /^[a-zA-Z0-9]*$/
    if (!regex.test(value)) return

    const newCode = [...code]
    newCode[index] = method === 'totp' ? value : value.toUpperCase()
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      handleVerify()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6)

    const isValid =
      method === 'totp'
        ? /^\d{6}$/.test(pastedData)
        : /^[a-zA-Z0-9]{6}$/.test(pastedData)

    if (isValid) {
      const digits = pastedData.toUpperCase().split('')
      setCode(digits)
      inputRefs.current[5]?.focus()
    }
  }

  // Handle verification
  const handleVerify = async () => {
    const verificationCode = code.join('')

    if (verificationCode.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    setIsSubmitting(true)

    try {
      const result: any = await verify2FA({
        user_id: userId,
        method: method!,
        code: verificationCode,
      })

      if (result === 'TOTP code is valid') {
        const notifPayload = getNotificationPayload(
          NOTIFICATION_TYPES.TWO_FA_VERIFICATION,
          {
            // user_id: userId,
            // user_name is not readily available here, backend handles logic or we can fetch.
            // But payload usually expects user_name.
            // Assuming backend/user details extraction inside SendNotification or relying on minimal data.
            // If user_name is mandatory for display, we might need to store it in stash or fetch it.
            // However, looking at previous code, user_name was passed.
            // Let's check stash or sessionStorage. authService.login stashes nothing?
            // Actually, we are just verifying 2FA. The login happened before.
            // We can fetch user details if needed, but for now let's send what we have.
            // Or better, let's rely on backend context if possible, or omit name relying on 'User logged in' generic message fallback
            // But wait, the notification constants use `data.user_name`.
            // We can try to get it from local storage 'user' if available, but it might not be set fully until validation.
            // Let's try to read 'user' from localStorage if it exists, as login might have set it (partially).
            // Actually, `useLogin` sets userAtom, but maybe not localStorage 'user' persistently across refreshes if not fully authed?
            // `SendNotification` implementation reads `localStorage.getItem('user')`.
            // So if `localStorage.getItem('user')` is there, `SendNotification` will pick up user props for the WRAPPER.
            // But `getNotificationPayload` uses `data.user_name` for the MESSAGE.
            // let's grab it from localStorage if possible.
            user_name:
              JSON.parse(localStorage.getItem('user') || '{}').user_name ||
              'User',
            action_timestamp: new Date().toISOString(),
            message: `User ${user?.user_name} TFA verification successful`,
          }
        )
        const authPayload = getNotificationPayload(
          NOTIFICATION_TYPES.AUTH_LOGIN,
          {
            user_name: user?.user_name,
            action_timestamp: new Date().toISOString(),
            message: `User ${user?.user_name} logged in successfully.`,
          }
        )
        SendNotification(authPayload)
        SendNotification(notifPayload)
        auditService.log(
          AUDIT_LOG_TYPES.TWO_FA_VERIFICATION,
          `User ${user?.user_name} TFA verification successful`,
          `Action: User TFA Verification
User: ${user?.user_name}
Status: Success
Description: User ${user?.user_name} has successfully verified their TFA.`
        )
        toast.success('Verification successful!')
        // refetchOrganization()
        navigate(getDefaultLandingRoute(user), { replace: true })
      }
    } catch (error: any) {
      console.error('TFA verification failed:', error)
      const notifPayload = getNotificationPayload(
        NOTIFICATION_TYPES.TWO_FA_VERIFICATION_FAILED,
        {
          user_name: user?.user_name,
          error: error.message || 'Unknown error',
        }
      )
      SendNotification(notifPayload)
      auditService.log(
        AUDIT_LOG_TYPES.TWO_FA_VERIFICATION_FAILED,
        `User ${user?.user_name} TFA verification failed`,
        `Action: User TFA Verification
User: ${user?.user_name}
Status: Failed
Error Details: ${error.message || 'Unknown error'}
Description: User ${user?.user_name} has failed to verify their TFA.`
      )
      localStorage.clear()
      const allCookies = Cookies.get()
      Object.keys(allCookies).forEach(cookieName => {
        Cookies.remove(cookieName)
      })
      navigate('/login')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle resend code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return

    setIsResending(true)

    try {
      await resend2FACode({
        user_id: userId,
        method: method!,
      })

      // toast.success('Verification code sent')
      setResendCooldown(30)
    } catch (error) {
      // toast.error('Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  // Get method details
  const getMethodDetails = () => {
    switch (method) {
      case 'totp':
        return {
          title: 'Authenticator App',
          description: 'Enter the 6-digit code from your authenticator app',
          icon: Shield,
        }
      case 'sms':
        return {
          title: 'SMS Verification',
          description: 'Enter the 6-digit code sent to your phone',
          icon: Smartphone,
        }
      case 'email':
        return {
          title: 'Email Verification',
          description: 'Enter the 6-digit code sent to your email',
          icon: Mail,
        }
      default:
        return {
          title: 'Two-Factor Authentication',
          description: 'Enter your verification code',
          icon: Lock,
        }
    }
  }

  const { title, description, icon: Icon } = getMethodDetails()

  const hasSentRef = useRef(false)

  useEffect(() => {
    if (method !== 'totp' && !hasSentRef.current) {
      hasSentRef.current = true
      const sendCode = async () => {
        const response = await resend2FACode({
          user_id: userId,
          method: method!,
        })
        setIsCodeSent(response)
      }
      sendCode()
    }
  }, [])

  useEffect(() => {
    const sessionID = Cookies.get('Session-ID')

    if ((isAuthenticated && user) || sessionID) {
      navigate(getDefaultLandingRoute(user), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4'>
      <div className='w-full max-w-md'>
        <Card className='p-8 border border-gray-200 shadow-lg bg-white'>
          {/* Header */}
          <div className='text-center mb-4'>
            <div className='w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4'>
              <Icon className='w-8 h-8 text-blue-600' />
            </div>
            <h1 className='text-2xl font-bold text-gray-900'>{title}</h1>
            <p className='text-gray-500 mt-2'>{description}</p>
          </div>

          {/* Code Input */}
          <div className='space-y-4 mb-3'>
            <Label className='text-gray-900'>Enter 6-digit code</Label>
            <div className='flex justify-center gap-2' onPaste={handlePaste}>
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={el => (inputRefs.current[index] = el)}
                  type='text'
                  inputMode={method === 'totp' ? 'numeric' : 'text'}
                  pattern={method === 'totp' ? '[0-9]*' : '[a-zA-Z]*'}
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInputChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className='w-12 h-14 text-center text-2xl font-semibold bg-white border-gray-200 text-gray-900 focus-visible:ring-blue-500'
                  disabled={isSubmitting || isVerifying}
                />
              ))}
            </div>

            {/* Error Message */}
            {verifyError && (
              <p className='text-sm text-red-600 text-center'>{verifyError}</p>
            )}
          </div>

          {/* Resend Code */}
          {method !== 'totp' && (
            <div className='text-center mb-2'>
              {isCodeSent && (
                <div className='text-center mb-2'>
                  <p className='text-xs text-gray-500'>{isCodeSent}</p>
                </div>
              )}
              <Button
                variant='link'
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isResending}
                className='text-sm text-blue-600 hover:text-blue-700'
              >
                {isResending ? (
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                ) : (
                  <RefreshCw className='w-4 h-4 mr-2' />
                )}
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
              </Button>
            </div>
          )}

          <Separator className='mb-4 bg-gray-200' />

          {/* Actions */}
          <div className='flex flex-col gap-3'>
            <Button
              onClick={handleVerify}
              disabled={
                code.join('').length !== 6 || isSubmitting || isVerifying
              }
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
            >
              {isSubmitting || isVerifying ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>

            <Button
              variant='outline'
              onClick={() => navigate('/2fa/select')}
              className='w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Method Selection
            </Button>
          </div>

          {/* Security Info */}
          <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
            {method === 'totp' ? (
              <p className='text-xs text-gray-500 text-center'>
                ⏱️ Each code is valid for 30 seconds. For security, codes can
                only be used once.
              </p>
            ) : (
              <p className='text-xs text-gray-500 text-center'>
                ⏱️ Each code is valid for 5 minutes. For security, codes can
                only be used once.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TwoFAVerifyPage
