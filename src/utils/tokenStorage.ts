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

// Token storage utilities
export const setCsrfToken = (token: string): void => {
  localStorage.setItem('csrfToken', token)
}

export const getCsrfToken = (): string | null => {
  return localStorage.getItem('csrfToken')
}

export const removeCsrfToken = (): void => {
  localStorage.removeItem('csrfToken')
}

export const setNotificationsToken = (token: string): void => {
  localStorage.setItem('notificationsToken', token)
}

export const getNotificationsToken = (): string | null => {
  return localStorage.getItem('notificationsToken')
}

export const removeNotificationsToken = (): void => {
  localStorage.removeItem('notificationsToken')
}

import { type User } from '@/types/user.types'

export const setUserData = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user))
}

export const getUserData = (): User | null => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export const removeUserData = (): void => {
  localStorage.removeItem('user')
}

// Clear all auth data
export const clearAuthData = (): void => {
  removeCsrfToken()
  removeNotificationsToken()
  removeUserData()
}
