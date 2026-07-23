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

import { userAtom } from '@/atoms/user'
import { useAtomValue } from 'jotai'

export const useAccessPermission = (permission: string) => {
  const user = useAtomValue(userAtom)
  return user?.basic_permissions?.includes(permission) ?? false
}

// Ordered by priority: the first route the user has permission for wins.
const LANDING_ROUTES: { path: string; permission: string }[] = [
  { path: '/dashboard', permission: 'dashboard:view' },
  { path: '/archive', permission: 'archive:view' },
  { path: '/domains', permission: 'domain:view' },
  { path: '/users', permission: 'user:view' },
  { path: '/audit', permission: 'audit:view' },
]

export const getDefaultLandingRoute = (
  user: { basic_permissions?: string[] } | null | undefined
) => {
  const permissions = user?.basic_permissions || []
  const match = LANDING_ROUTES.find(route =>
    permissions.includes(route.permission)
  )
  return match?.path || '/dashboard'
}
