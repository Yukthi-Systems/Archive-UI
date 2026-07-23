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

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Smartphone,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { use2FAVerification } from '@/hooks/use2FA'
import Cookies from 'js-cookie'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atoms/user'
import { isAuthenticatedAtom } from '@/atoms/auth'
import { getDefaultLandingRoute } from '@/utils/accessPermission'

const TwoFAMethodCard = ({
  method,
  title,
  description,
  icon: Icon,
  isActive,
  isSelected,
  onSelect,
}: {
  method: string
  title: string
  description: string
  icon: any
  isActive: boolean
  isSelected: boolean
  onSelect: () => void
}) => {
  return (
    <Card
      className={`
        p-3 border-2 cursor-pointer transition-all duration-200 bg-white
        ${
          isSelected
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }
        ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={isActive ? onSelect : undefined}
    >
      <div className='flex items-start gap-4'>
        <div
          className={`
          w-12 h-12 rounded-full flex items-center justify-center
          ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
        `}
        >
          <Icon className='w-6 h-6' />
        </div>

        <div className='flex-1'>
          <div className='flex items-center justify-between'>
            <h3 className='font-semibold text-base text-gray-900'>{title}</h3>
            {isActive && isSelected && (
              <CheckCircle2 className='w-5 h-5 text-green-600' />
            )}
          </div>

          <p className='text-xs text-gray-500'>{description}</p>
        </div>
      </div>
    </Card>
  )
}

export const TwoFASelectPage = () => {
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)
  const user = useAtomValue(userAtom)

  // Get active methods from session storage
  const activeMethods = JSON.parse(
    sessionStorage.getItem('2fa_methods') || '[]'
  )
  const userId = sessionStorage.getItem('user_id') || ''

  const handleSelectMethod = (method: string) => {
    setSelectedMethod(method)
  }

  const handleProceed = async () => {
    if (!selectedMethod) {
      toast.error('Please select a 2FA method')
      return
    }

    setIsSubmitting(true)

    // Store selected method and redirect
    sessionStorage.setItem('selected_2fa_method', selectedMethod)

    // Simulate API call to initiate 2FA
    setTimeout(() => {
      setIsSubmitting(false)
      navigate(`/2fa/${selectedMethod}`)
    }, 1000)
  }

  const handleBack = () => {
    // Clear 2FA session data and any potential auth state
    sessionStorage.removeItem('2fa_methods')
    sessionStorage.removeItem('selected_2fa_method')
    sessionStorage.removeItem('user_id')

    // Clear cookies
    const allCookies = Cookies.get()
    Object.keys(allCookies).forEach(cookieName => {
      Cookies.remove(cookieName)
    })

    navigate('/login')
  }

  const methods = [
    {
      id: 'totp',
      title: 'Authenticator App',
      description: 'Use Google Authenticator, Authy, or similar app',
      icon: Shield,
      isActive: activeMethods.includes('totp'),
    },
    {
      id: 'sms',
      title: 'SMS Verification',
      description: 'Receive a code via SMS to your registered phone',
      icon: Smartphone,
      isActive: activeMethods.includes('sms'),
    },
    {
      id: 'email',
      title: 'Email Verification',
      description: 'Receive a code via email to your registered address',
      icon: Mail,
      isActive: activeMethods.includes('email'),
    },
  ]

  useEffect(() => {
    const sessionID = Cookies.get('Session-ID')

    if ((isAuthenticated && user) || sessionID) {
      navigate(getDefaultLandingRoute(user), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4'>
      <div className='w-full max-w-md'>
        <Card className='p-4 border border-gray-200 shadow-lg bg-white'>
          {/* Header */}
          <div className='text-center mb-2'>
            <div className='w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2'>
              <Lock className='w-8 h-8 text-blue-600' />
            </div>
            <h1 className='text-xl font-bold text-gray-900'>
              Two-Factor Authentication
            </h1>
            <p className='text-gray-500 text-sm mt-1'>
              Select your preferred verification method
            </p>
          </div>

          {/* Methods */}
          <div className='space-y-2 mb-2'>
            {methods.map(method => (
              <TwoFAMethodCard
                key={method.id}
                method={method.id}
                title={method.title}
                description={method.description}
                icon={method.icon}
                isActive={method.isActive}
                isSelected={selectedMethod === method.id}
                onSelect={() => handleSelectMethod(method.id)}
              />
            ))}
          </div>

          <Separator className='mb-2 bg-gray-200' />

          {/* Actions */}
          <div className='flex flex-col gap-3'>
            <Button
              onClick={handleProceed}
              disabled={!selectedMethod || isSubmitting}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </Button>

            <Button
              variant='outline'
              onClick={handleBack}
              className='w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Login
            </Button>
          </div>

          {/* Security Info */}
          <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
            <p className='text-xs text-gray-500 text-center'>
              🔒 Two-factor authentication adds an extra layer of security to
              your account. You'll need to enter a verification code in addition
              to your password.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TwoFASelectPage
