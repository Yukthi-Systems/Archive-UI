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

export interface Domain {
  domain_id: string
  domain_name: string
  organization_id: string
  data_retention_days: number
  is_active: boolean
  quota_allocated: number
  quota_utilized: number
  created_at: string
  updated_at: string
}

export type DomainInfo = Domain

export interface DomainsListResponse {
  data: Domain[]
  total: number
  page: number
  limit: number
}

export interface DomainsQueryParams {
  limit?: number
  offset?: number
  search?: string
}

export interface CreateDomainPayload {
  domain_name: string
  organization_id?: string
  data_retention_days?: number
  is_active?: boolean
  quota_allocated?: number
}

export interface UpdateDomainPayload {
  domain_name?: string
  data_retention_days?: number
  is_active?: boolean
  quota_allocated?: number
}

export interface DomainCountResponse {
  count: number
}
