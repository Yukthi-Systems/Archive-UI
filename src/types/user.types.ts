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

import { User } from 'lucide-react'

export interface User {
  user_id: string
  user_name: string
  user_email: string
  primary_phone: string
  display_name: string
  password_hash?: string
  password?: string
  is_active: boolean
  basic_permissions: string[]
  domain_permissions: string[]
  mailbox_permissions: string[]
  organization_id: string
  is_totp_2fa_active: boolean
  is_sms_2fa_active: boolean
  is_email_2fa_active: boolean
  created_at: string
  updated_at: string
}

export type UsersListResponse = User[]

export interface UsersQueryParams {
  limit?: number
  offset?: number
  search?: string
}

export type CountResponse = number
