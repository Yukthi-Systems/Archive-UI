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

// Password validation regex

const passwordRegex =
  // eslint-disable-next-line no-useless-escape
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/
// E.164 format: optional space between country code and number
const phoneRegex = /^\+[1-9]\d{0,3}\s?\d{4,14}$/

// Common validation rules for both create and update
const commonUserSchema = {
  user_name: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .matches(
      /^[a-zA-Z0-9_.-]+$/,
      'Username can only contain letters, numbers, dots, hyphens, and underscores'
    ),
  user_email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),

  primary_phone: yup
    .string()
    .required('Phone Number is required')
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

  display_name: yup
    .string()
    .required('Display name is required')
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Display name must not exceed 100 characters')
    .matches(
      /^[a-zA-Z\s]*$/,
      'Display name can only contain letters and spaces'
    ),

  is_active: yup.boolean().default(true),

  basic_permissions: yup.array().of(yup.string()).default([]),

  domain_permissions: yup.array().of(yup.string()).default([]),

  mailbox_permissions: yup.array().of(yup.string()).default([]),
}

// Create user schema (requires password)
export const createUserSchema = yup.object({
  ...commonUserSchema,
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(32, 'Password must not exceed 32 characters')
    .matches(
      passwordRegex,
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
})

// Update user schema (NO password fields)
export const updateUserSchema = yup.object({
  ...commonUserSchema,
  user_id: yup.string().default(''),
})

export type CreateUserFormData = yup.InferType<typeof createUserSchema>
export type UpdateUserFormData = yup.InferType<typeof updateUserSchema>
