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

import apiClient from '@/lib/axios'

export async function SendNotification(data: any) {
  const userDetails = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : null

  try {
    const payload = {
      organization_id: userDetails?.organization_id || '',
      user_id: userDetails?.user_id || '',
      user_name: userDetails?.user_name || '',
      data: {
        ...data,
        action_timestamp: new Date().toISOString(),
      },
    }

    const response = await apiClient.post(`/organization/notify`, payload)
    return response.data
  } catch (error) {
    console.error('Notification API error:', error)
    throw error
  }
}
