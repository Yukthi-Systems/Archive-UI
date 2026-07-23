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

export interface ApiHealthResponse {
  api: string
  cache: string
  database: string
  search_db: string
  timestamp?: string
  uptime?: number
  version?: string
}

export interface HealthCheckConfig {
  interval?: number // milliseconds
  retryCount?: number
  timeout?: number
}

export type HealthStatus = 'OK' | 'ERROR' | 'WARNING' | 'UNKNOWN'

export interface SystemAlert {
  id: number
  title: string
  description: string
  start_time: string
  end_time: string
  created_at: string
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' // Optional, can be inferred
  affected_services?: string[]
}

export type MaintenanceResponse = SystemAlert[]
