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

export interface ArchiveSearchParams {
  domain_name?: string
  start_date?: string
  end_date?: string
  subject_keyword?: string
  body_keyword?: string
  search_logic?: 'AND' | 'OR'
  match_type?: 'has' | 'has_not'
  sender_email?: string
  recipient_emails?: string[]
  has_attachments?: boolean // "true", "false", or ""
  limit?: number
  last_evaluated_key?: string
  ascending_order?: boolean
  last_evaluated_time?: string
  extended_data?: boolean
}

export interface EmailArchiveItem {
  archive_id: string
  archive_time: string // ISO string from API
  from_address: string
  to_addresses: string[]
  email_subject: string
  has_attachments: boolean
  attachments: string[]
  raw_eml_size: number
  retention_days: number
  domain: string
}

export type ArchiveSearchResponse = EmailArchiveItem[]

export interface ArchiveStats {
  total_emails: number
  total_size_bytes: number
  start_date: string
  end_date: string
  [key: string]: any
}
