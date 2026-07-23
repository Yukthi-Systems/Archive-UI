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

// Define consistent Log Types to prevent typos across the app
export const AUDIT_LOG_TYPES = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  FAILED_LOGIN: 'FAILED_LOGIN',

  // Domain
  DOMAIN_CREATE: 'DOMAIN_CREATE',
  DOMAIN_CREATE_FAILED: 'DOMAIN_CREATE_FAILED',
  DOMAIN_UPDATE: 'DOMAIN_UPDATE',
  DOMAIN_UPDATE_FAILED: 'DOMAIN_UPDATE_FAILED',
  DOMAIN_DELETE: 'DOMAIN_DELETE',
  DOMAIN_DELETE_FAILED: 'DOMAIN_DELETE_FAILED',
  DOMAIN_EXPORT: 'DOMAIN_EXPORT',
  DOMAIN_EXPORT_FAILED: 'DOMAIN_EXPORT_FAILED',

  // User
  USER_CREATE: 'USER_CREATE',
  USER_CREATE_FAILED: 'USER_CREATE_FAILED',
  USER_UPDATE: 'USER_UPDATE',
  USER_UPDATE_FAILED: 'USER_UPDATE_FAILED',
  USER_DELETE: 'USER_DELETE',
  USER_DELETE_FAILED: 'USER_DELETE_FAILED',
  USER_EXPORT: 'USER_EXPORT',
  USER_EXPORT_FAILED: 'USER_EXPORT_FAILED',

  // Security
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
  TWO_FA_ENABLE: 'TWO_FA_ENABLE',
  TWO_FA_ENABLE_FAILED: 'TWO_FA_ENABLE_FAILED',
  TWO_FA_DISABLE: 'TWO_FA_DISABLE',
  TWO_FA_DISABLE_FAILED: 'TWO_FA_DISABLE_FAILED',
  TWO_FA_VERIFICATION: 'TWO_FA_VERIFICATION',
  TWO_FA_VERIFICATION_FAILED: 'TWO_FA_VERIFICATION_FAILED',
  TWO_FA_SETUP_INITIATED: 'TWO_FA_SETUP_INITIATED',
  TWO_FA_SETUP_FAILED: 'TWO_FA_SETUP_FAILED',
  TWO_FA_DEVICE_DELETED: 'TWO_FA_DEVICE_DELETED',
  TWO_FA_DEVICE_DELETED_FAILED: 'TWO_FA_DEVICE_DELETED_FAILED',

  // Archive
  ARCHIVE_SEARCH: 'ARCHIVE_SEARCH',
  ARCHIVE_SEARCH_FAILED: 'ARCHIVE_SEARCH_FAILED',
  ARCHIVE_EXPORT: 'ARCHIVE_EXPORT',
  ARCHIVE_EXPORT_FAILED: 'ARCHIVE_EXPORT_FAILED',
  EML_EXPORT_VIEW: 'EML_EXPORT_VIEW',
  EML_EXPORT_VIEW_FAILED: 'EML_EXPORT_VIEW_FAILED',
  EML_EXPORT_DOWNLOAD: 'EML_EXPORT_DOWNLOAD',
  EML_EXPORT_DOWNLOAD_FAILED: 'EML_EXPORT_DOWNLOAD_FAILED',
  ARCHIVE_VIEW: 'ARCHIVE_VIEW',
  ARCHIVE_VIEW_FAILED: 'ARCHIVE_VIEW_FAILED',
  ARCHIVE_DOWNLOAD: 'ARCHIVE_DOWNLOAD',
  ARCHIVE_DOWNLOAD_FAILED: 'ARCHIVE_DOWNLOAD_FAILED',
  ARCHIVE_DOWNLOAD_REQUESTED: 'ARCHIVE_DOWNLOAD_REQUESTED',
  ARCHIVE_DOWNLOAD_REQUEST_FAILED: 'ARCHIVE_DOWNLOAD_REQUEST_FAILED',
  ARCHIVE_FORWARD: 'ARCHIVE_FORWARD',
  ARCHIVE_FORWARD_FAILED: 'ARCHIVE_FORWARD_FAILED',

  // System
  SYSTEM_CONFIG: 'SYSTEM_CONFIG',
  SYSTEM_CONFIG_FAILED: 'SYSTEM_CONFIG_FAILED',
  FAILED: 'FAILED',

  // Audit
  AUDIT_EXPORT: 'AUDIT_EXPORT',
  AUDIT_EXPORT_FAILED: 'AUDIT_EXPORT_FAILED',

  // Import
  IMPORT_DOMAIN_PARTIAL_SUCCESS: 'IMPORT_DOMAIN_PARTIAL_SUCCESS',
  IMPORT_DOMAIN_SUCCESS: 'IMPORT_DOMAIN_SUCCESS',
  IMPORT_USER_PARTIAL_SUCCESS: 'IMPORT_USER_PARTIAL_SUCCESS',
  IMPORT_USER_SUCCESS: 'IMPORT_USER_SUCCESS',
  BULK_EDIT_DOMAIN: 'BULK_EDIT_DOMAIN',
  BULK_EDIT_USER: 'BULK_EDIT_USER',
} as const

export type AuditLogType = keyof typeof AUDIT_LOG_TYPES | string

// Payload structure for adding a log
export interface AddAuditLogPayload {
  log_type: AuditLogType
  log_message: string // Short search string
  log_description: string // Long detailed description
}

// Structure for viewing a log (Response)
export interface AuditLog {
  id: number
  log_type: string
  log_message: string
  log_description: string
  created_at: string
  // Backend likely adds these automatically based on context,
  // but they are usually present in the view response:
  user_id?: string
  ip_address?: string
}

export interface AuditLogsResponse {
  data: AuditLog[]
  total: number
  page: number
  limit: number
}
