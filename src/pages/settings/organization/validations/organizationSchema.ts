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

export const organizationSchema = yup.object().shape({
  admin_email: yup
    .string()
    .test('single-email', 'Please enter a single email address', value => {
      if (!value) return true
      return !/[,\s;]/.test(value.trim())
    })
    .email('Invalid email address')
    .required('Admin email is required'),
  admin_phone: yup
    .string()
    .required('Admin phone is required')
    .min(
      11,
      'Please enter a valid phone number with country code (e.g., +919845061219)'
    )
    .matches(
      phoneRegex,
      'Please enter a valid phone number with country code (e.g., +919845061219)'
    ),
})

export type OrganizationFormData = yup.InferType<typeof organizationSchema>

export const useOrganizationSchema = () => {
  return organizationSchema
}
