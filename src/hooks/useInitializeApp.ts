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

import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { authStateAtom } from '@/atoms/auth'
import { authService } from '@/api/auth'
import { userAtom } from '@/atoms/user'

export const useInitializeApp = () => {
  const [authState, setAuthState] = useAtom(authStateAtom)
  const [user, setUser] = useAtom(userAtom)

  useEffect(() => {
    const init = async () => {
      // If we have a user in storage, validate the session with the server
      if (user) {
        try {
          const validatedUser = await authService.validateSession()

          if (validatedUser == 'Session is valid!') {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } else {
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              error: 'Session Invalid',
            })
          }
        } catch (error) {
          console.error('Session validation failed:', error)
          // Session is invalid: clear user and stop loading to allow redirect
          setUser(null)
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      } else {
        // No user in storage at all: stop loading so ProtectedRoute can redirect to login
        setAuthState({ isAuthenticated: false, isLoading: false, error: null })
      }
    }

    init()
  }, []) // Run once on mount
}
