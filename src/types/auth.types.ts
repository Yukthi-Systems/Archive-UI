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

export interface User {
  user_id: string
  user_name: string
  user_email: string
  primary_phone: string
  display_name: string
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

// Since your API returns the user object directly at the top level
export type AuthResponse = User

export type ValidatedUser = string

export interface LoginPayload {
  user_name: string // Validated by Yup
  password?: string
  recaptcha_token?: string
}

export type TwoFAMethod = 'totp' | 'sms' | 'email'

export interface Verify2FAPayload {
  user_id: string
  method: TwoFAMethod
  code: string
}
