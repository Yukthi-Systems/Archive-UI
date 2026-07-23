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
import { useAtom } from 'jotai'

// PermissionConfig.js
export const ALL_PERMISSIONS_CONFIG = [
  {
    category: 'User',
    stateKey: 'user',
    label: 'User',
    permissions: [
      { value: 'user:view', label: 'View' },
      { value: 'user:create', label: 'Create' },
      { value: 'user:edit', label: 'Update' },
      { value: 'user:delete', label: 'Delete' },
    ],
  },
  {
    category: 'Domain',
    stateKey: 'domain',
    label: 'Domain',
    permissions: [
      { value: 'domain:view', label: 'View' },
      { value: 'domain:create', label: 'Create' },
      { value: 'domain:edit', label: 'Update' },
      { value: 'domain:delete', label: 'Delete' },
    ],
  },
  {
    category: 'Archive List',
    stateKey: 'archive',
    label: 'Archive List',
    permissions: [
      { value: 'archive:view', label: 'View' },
      { value: 'archive:adanced:view', label: 'Advanced View' },
      { value: 'archive:body:view', label: 'Body View' },
      { value: 'archive:extended:view', label: 'Extended View' },
    ],
  },
  {
    category: 'Dashboard',
    stateKey: 'dashboard',
    label: 'Dashboard',
    permissions: [{ value: 'dashboard:view', label: 'View' }],
  },
  {
    category: 'Audit Logs',
    stateKey: 'audit',
    label: 'Audit Logs',
    permissions: [{ value: 'audit:view', label: 'View' }],
  },
  {
    category: 'Organization',
    stateKey: 'organization',
    label: 'Organization',
    permissions: [
      // { value: 'organization:create', label: 'Create' },
      { value: 'organization:edit', label: 'Update' },
    ],
  },
  {
    category: '2FA TOTP',
    stateKey: '2fa_totp',
    label: '2FA TOTP',
    permissions: [
      { value: '2fa:totp:view', label: '2FA TOTP View' },
      { value: '2fa:totp:edit', label: '2FA TOTP Edit' },
      { value: '2fa:totp:delete', label: '2FA TOTP Delete' },
    ],
  },
  {
    category: '2FA SMS',
    stateKey: '2fa_sms',
    label: '2FA SMS',
    permissions: [{ value: '2fa:sms:edit', label: '2FA SMS Edit' }],
  },
  {
    category: '2FA Email',
    stateKey: '2fa_email',
    label: '2FA Email',
    permissions: [{ value: '2fa:email:edit', label: '2FA Email Edit' }],
  },
]

// Hook to get filtered permissions config
export const usePermissionsConfig = () => {
  const [userData] = useAtom(userAtom)
  const userPermissions = userData?.basic_permissions || []

  // Filter the config based on user's permissions
  const filteredConfig = ALL_PERMISSIONS_CONFIG.map(category => ({
    ...category,
    permissions: category.permissions.filter(permission =>
      userPermissions.includes(permission.value)
    ),
  })).filter(category => category.permissions.length > 0) // Remove empty categories

  return filteredConfig
}

// Helper function to get filtered config (without hook)
export const getFilteredPermissionsConfig = (permissionsArray: string[]) => {
  return ALL_PERMISSIONS_CONFIG.map(category => ({
    ...category,
    permissions: category.permissions.filter(permission =>
      permissionsArray.includes(permission.value)
    ),
  })).filter(category => category.permissions.length > 0)
}
