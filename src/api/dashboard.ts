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

export interface DashboardSize {
  domain: string
  total_size: number
  total_emails: number
}

export interface DashboardStats {
  domain: string
  archive_day: number
  total_size: number
  total_emails: number
}

export const dashboardService = {
  getSizes: async (): Promise<DashboardSize[]> => {
    const response = await apiClient.get<DashboardSize[]>('/dashboard/sizes')
    return response.data
  },

  getStats: async (): Promise<DashboardStats[]> => {
    const response = await apiClient.get<DashboardStats[]>('/dashboard/stats')
    return response.data
  },
}
