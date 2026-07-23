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

export const loginSchema = yup.object({
  user_name: yup.string().required('Username is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters') // Security best practice
    .required('Password is required'),
  recaptcha_token: yup.string(),
})

export type LoginFormData = yup.InferType<typeof loginSchema>
