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

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

/**
 * Auth state atom
 * We set isLoading to true by default so ProtectedRoute waits
 * for the session validation check on app start.
 */
export const authStateAtom = atom<{
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}>({
  isAuthenticated: false,
  isLoading: true, // Default to true to prevent premature login redirects
  error: null,
})

export const csrfTokenAtom = atomWithStorage<string | null>(
  'csrfToken',
  null,
  undefined,
  {
    getOnInit: true,
  }
)

export const notificationsTokenAtom = atomWithStorage<string | null>(
  'notificationsToken',
  null,
  undefined,
  {
    getOnInit: true,
  }
)

// Session atoms (In-memory only)
export const sessionIdAtom = atom<string | null>(null)
export const sessionValidAtom = atom<boolean>(false)

// --- Helper Selectors ---

export const isAuthenticatedAtom = atom(
  get => get(authStateAtom).isAuthenticated
)

export const authLoadingAtom = atom(get => get(authStateAtom).isLoading)

export const authErrorAtom = atom(get => get(authStateAtom).error)
