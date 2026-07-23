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

import * as yup from 'yup'

// E.164 format: optional space between country code and number
const phoneRegex = /^\+[1-9]\d{0,3}\s?\d{4,14}$/
export const profileSchema = yup.object().shape({
  user_id: yup.string(),
  user_name: yup
    .string()
    .required('Username is required')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Invalid username'),
  display_name: yup
    .string()
    .required('Display name is required')
    .matches(
      /^[a-zA-Z\s]*$/,
      'Display name can only contain letters and spaces'
    ),
  user_email: yup
    .string()
    .email('Invalid email address')
    .required('User email is required'),
  primary_phone: yup
    .string()
    .required('Phone number is required')
    .min(
      11,
      'Please enter a valid phone number with country code (e.g., +919845061219)'
    )
    .max(
      15,
      'Please enter a valid phone number with country code (e.g., +919845061219)'
    )
    .matches(
      phoneRegex,
      'Please enter a valid phone number with country code (e.g., +919845061219)'
    ),
})

export type ProfileFormData = yup.InferType<typeof profileSchema>

export const useProfileSchema = () => {
  return profileSchema
}
