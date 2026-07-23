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

import { Navigate, Outlet } from 'react-router-dom'
import { useAtomValue } from 'jotai'
import { isAuthenticatedAtom, authLoadingAtom } from '@/atoms/auth'
import { Loader2 } from 'lucide-react'
import { useCheck2FA } from '@/hooks/use2FA'
import { userAtom } from '@/atoms/user'

export const ProtectedRoute = () => {
  const user = useAtomValue(userAtom)
  const isLoading = useAtomValue(authLoadingAtom)
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)
  const { check2FAStatus } = useCheck2FA()

  // 1. Handle Loading State
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  // 2. Handle Unauthenticated State (No user or session)
  if (!user || !isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  // 3. Handle 2FA Requirement
  // Uses your hook logic: returns true if user has 2FA enabled but session cookie is missing
  if (check2FAStatus(user)) {
    const activeMethods: string[] = []
    if (user.is_totp_2fa_active) activeMethods.push('totp')
    if (user.is_sms_2fa_active) activeMethods.push('sms')
    if (user.is_email_2fa_active) activeMethods.push('email')

    // Determine destination based on method count
    const target =
      activeMethods.length === 1 ? `/2fa/${activeMethods[0]}` : '/2fa/select'

    return <Navigate to={target} replace />
  }

  // 4. Authorized Access
  return <Outlet />
}
