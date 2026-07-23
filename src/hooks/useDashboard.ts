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

import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/api/dashboard'
import type { DashboardSize, DashboardStats } from '@/api/dashboard'

export const useDashboardSizes = () => {
  return useQuery<DashboardSize[], Error>({
    queryKey: ['dashboard', 'sizes'],
    queryFn: dashboardService.getSizes,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

export const useDashboardStats = () => {
  return useQuery<DashboardStats[], Error>({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}
