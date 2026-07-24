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

import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import {
  getCsrfToken,
  setCsrfToken,
  setNotificationsToken,
} from '@/utils/tokenStorage'
import { API_URL } from '@/constants/constants'
import Cookies from 'js-cookie'

// Create login client (without CSRF token)
export const apiLoginClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Response interceptor to capture tokens
apiLoginClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extract tokens from response headers
    const csrfToken = response.headers['x-csrf-token']
    const notificationsToken = response.headers['x-notifications-token']

    if (csrfToken) {
      setCsrfToken(csrfToken)
    }

    if (notificationsToken) {
      setNotificationsToken(notificationsToken)
    }

    return response
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// Create authenticated client (with CSRF token)
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
})

// Request interceptor for authenticated client
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add CSRF token to headers
    const csrfToken = getCsrfToken()
    if (csrfToken && config.headers) {
      config.headers['X-CSRF-Token'] = csrfToken
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor for authenticated client
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  error => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      try {
        // Clear auth data and redirect to login
        // localStorage.clear()
        // sessionStorage.removeItem('2fa_methods')
        // sessionStorage.removeItem('user_id')
        // const allCookies = Cookies.get()
        // Object.keys(allCookies).forEach(cookieName => {
        //   Cookies.remove(cookieName)
        // })
        // window.location.href = '/login'
      } catch (e) {
        console.error('Error handling 401 cleanup', e)
      }
    }
    return Promise.reject(error)
  }
)

// Create admin client
export const apiAdminClient: AxiosInstance = axios.create({
  baseURL: API_URL + 'admin',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for admin client
apiAdminClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const adminKey = sessionStorage.getItem('X-ADMIN-KEY')
    if (adminKey && config.headers) {
      config.headers['X-ADMIN-KEY'] = adminKey
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor for admin client
apiAdminClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  error => {
    if (error.response?.status === 401) {
      // sessionStorage.removeItem('X-ADMIN-KEY')
      // window.location.href = '/1219/admin/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient

// --- Admin API Functions ---

export interface AdminQueryParams {
  limit?: number
  offset?: number
  search?: string
  organizationId?: string
}

// The `/organization/list` endpoint has no pagination support server-side —
// it always returns every organization. We fetch it once per (search) key and
// let the table paginate the full array client-side (see DataTable's
// `manualPagination={false}` mode) instead of re-fetching the whole list on
// every page turn.
export const getAdminOrganizations = async (params: AdminQueryParams) => {
  const { search } = params
  const response = await apiAdminClient.get('/organization/list')
  let data = response.data

  if (search) {
    data = data.filter(
      (org: any) =>
        org.organization_name?.toLowerCase().includes(search.toLowerCase()) ||
        org.admin_email?.toLowerCase().includes(search.toLowerCase())
    )
  }

  return { data, total: data.length }
}

// `/domain/list/{organization_id}` is likewise unpaginated server-side —
// same client-side pagination approach as getAdminOrganizations above.
export const getAdminDomains = async (params: AdminQueryParams) => {
  const { search, organizationId } = params
  if (!organizationId) {
    return { data: [], total: 0 }
  }

  const response = await apiAdminClient.get(`/domain/list/${organizationId}`)
  let data = response.data

  if (search) {
    data = data.filter((domain: any) =>
      domain.domain_name?.toLowerCase().includes(search.toLowerCase())
    )
  }

  return { data, total: data.length }
}

export const getAdminUsers = async (params: AdminQueryParams) => {
  const { limit = 10, offset = 0, organizationId } = params
  if (!organizationId) {
    return { data: [], total: 0, page: 1, limit }
  }

  // Get total count first
  const countResponse = await apiAdminClient.get(
    `/user/count/${organizationId}`
  )
  const total = countResponse.data.user_count || 0

  // Fetch paginated data from backend
  const response = await apiAdminClient.get(
    `/user/list/${organizationId}/${limit}/${offset}`
  )

  return {
    data: response.data,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
  }
}

// --- Admin CRUD Interfaces ---

export interface CreateOrgRequest {
  organization_name: string
  admin_phone: string
  admin_email: string
  quota_allocated: number
  is_active: boolean
}

export interface DomainApiRequest {
  domain_name: string
  data_retention_days: number
  quota_allocated: number
  is_active: boolean
}

export interface NewUserRequest {
  user_name: string
  user_email: string
  primary_phone: string
  display_name: string
  password?: string
  is_active: boolean
  basic_permissions: string[]
  domain_permissions: string[]
  mailbox_permissions: string[]
}

export interface UpdateUserRequest extends Partial<NewUserRequest> {
  user_id: string
}

// --- Admin Organizations CRUD ---
export const createAdminOrganization = async (data: CreateOrgRequest) => {
  return await apiAdminClient.post('/organization/create', data)
}

export const updateAdminOrganization = async (
  orgId: string,
  data: CreateOrgRequest
) => {
  return await apiAdminClient.put(`/organization/update/${orgId}`, data)
}

export const deleteAdminOrganization = async (orgId: string) => {
  return await apiAdminClient.delete(`/organization/delete/${orgId}`)
}

// --- Admin Domains CRUD ---
export const createAdminDomain = async (
  orgId: string,
  data: DomainApiRequest
) => {
  return await apiAdminClient.post(`/domain/create/${orgId}`, data)
}

export const updateAdminDomain = async (
  orgId: string,
  domainId: string,
  data: DomainApiRequest
) => {
  return await apiAdminClient.put(`/domain/update/${orgId}/${domainId}`, data)
}

export const deleteAdminDomain = async (orgId: string, domainId: string) => {
  return await apiAdminClient.delete(`/domain/delete/${orgId}/${domainId}`)
}

// --- Admin Users CRUD ---
export const createAdminUser = async (orgId: string, data: NewUserRequest) => {
  return await apiAdminClient.post(`/user/create/${orgId}`, data)
}

export const updateAdminUser = async (
  orgId: string,
  data: UpdateUserRequest
) => {
  return await apiAdminClient.put(`/user/update/${orgId}`, data)
}

export const deleteAdminUser = async (orgId: string, userId: string) => {
  return await apiAdminClient.delete(`/user/delete/${orgId}/${userId}`)
}
