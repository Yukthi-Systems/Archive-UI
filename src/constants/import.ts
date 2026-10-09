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

export const IMPORT_FIELD_MAPPINGS = {
  domain: [
    {
      key: 'domain_name',
      header: 'Domain Name',
      csvHeader: 'Domain Name',
      type: 'string',
      required: true,
      width: 25,
      sampleValue: 'example.com',
      sampleValue2: 'example.com',
      validate: (rawValue: string) => {
        const value = String(rawValue ?? '')
          .trim()
          .toLowerCase()
        const domainRegex =
          /^(?!:\/\/)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*$/
        if (!domainRegex.test(value)) {
          throw new Error(
            'Please enter a valid domain name (e.g., example.com or example.co.in)'
          )
        }
        return value
      },
    },
    {
      key: 'data_retention_days',
      header: 'Data Retention Days',
      csvHeader: 'Data Retention Days',
      type: 'number',
      required: true,
      width: 25,
      sampleValue: '365',
      sampleValue2: '730',
      validate: (value: number) => {
        if (value < 1) {
          throw new Error('Minimum retention is 1 day')
        }
        if (value > 7300) {
          throw new Error('Maximum retention is 7300 days (20 years)')
        }
        return value
      },
    },
    {
      key: 'quota_allocated',
      header: 'Quota Allocated',
      csvHeader: 'Quota Allocated',
      type: 'number',
      required: true,
      width: 25,
      sampleValue: '10',
      sampleValue2: '20',
      validate: (value: number) => {
        if (value < 2) {
          throw new Error('Minimum quota must be at least 2 GB')
        }
        return value
      },
    },
    {
      key: 'is_active',
      header: 'Is Active',
      csvHeader: 'Is Active',
      type: 'boolean',
      required: true,
      width: 25,
      sampleValue: 'true',
      sampleValue2: 'false',
    },
  ],
  user: [
    {
      key: 'user_name',
      header: 'Username',
      csvHeader: 'Username',
      type: 'string',
      required: true,
      width: 25,
      sampleValue: 'jdoe',
      sampleValue2: 'asmith',
      validate: (value: string) => {
        if (value.length < 3)
          throw new Error('Username must be at least 3 characters')
        if (value.length > 50)
          throw new Error('Username must not exceed 50 characters')
        if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
          throw new Error(
            'Username can only contain letters, numbers, dots, hyphens, and underscores'
          )
        }
        return value
      },
    },
    {
      key: 'user_email',
      header: 'Email',
      csvHeader: 'Email',
      type: 'string',
      required: true,
      width: 30,
      sampleValue: 'jdoe@example.com',
      sampleValue2: 'asmith@example.com',
      validate: (value: string) => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Please enter a valid email address')
        }
        return value
      },
    },
    {
      key: 'display_name',
      header: 'Display Name',
      csvHeader: 'Display Name',
      type: 'string',
      required: true,
      width: 25,
      sampleValue: 'John Doe',
      sampleValue2: 'Alice Smith',
      validate: (value: string) => {
        if (value.length < 3)
          throw new Error('Username must be at least 3 characters')
        if (value.length > 100)
          throw new Error('Display name must not exceed 100 characters')
        if (!/^[a-zA-Z\s]*$/.test(value)) {
          throw new Error('Display name can only contain letters and spaces')
        }
        return value
      },
    },
    {
      key: 'primary_phone',
      header: 'Primary Phone',
      csvHeader: 'Primary Phone',
      type: 'string',
      required: true,
      width: 20,
      sampleValue: '+1234567890',
      sampleValue2: '+0987654321',
      validate: (value: string) => {
        if (value.length < 11 || value.length > 15) {
          throw new Error(
            'Please enter a valid phone number with country code (e.g., +919845061219)'
          )
        }
        if (!/^\+[1-9]\d{0,3}\s?\d{4,14}$/.test(value)) {
          throw new Error(
            'Please enter a valid phone number with country code (e.g., +919845061219)'
          )
        }
        return value
      },
    },
    {
      key: 'password',
      header: 'Password',
      csvHeader: 'Password',
      type: 'string',
      required: true,
      width: 20,
      sampleValue: 'Abc@1234',
      sampleValue2: 'Xyz@1234',
      validate: (value: string) => {
        const passwordRegex = new RegExp(
          '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?])[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]{8,}$'
        )
        if (value.length < 8)
          throw new Error('Password must be at least 8 characters')
        if (value.length > 32)
          throw new Error('Password must not exceed 32 characters')
        if (!passwordRegex.test(value)) {
          throw new Error(
            'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
          )
        }
        return value
      },
    },
    {
      key: 'basic_permissions',
      header: 'Basic Permissions',
      csvHeader: 'Basic Permissions',
      type: 'array',
      required: false,
      width: 20,
      sampleValue: 'user:view,user:edit',
      sampleValue2: 'user:view,user:edit',
    },
    {
      key: 'domain_permissions',
      header: 'Domain Permissions',
      csvHeader: 'Domain Permissions',
      type: 'array',
      required: false,
      width: 20,
      sampleValue: 'example.com',
      sampleValue2: 'example.com',
    },
    {
      key: 'mailbox_permissions',
      header: 'Mailbox Permissions',
      csvHeader: 'Mailbox Permissions',
      type: 'array',
      required: false,
      width: 20,
      sampleValue: 'jdoe@example.com',
      sampleValue2: 'asmith@example.com',
    },
    {
      key: 'is_active',
      header: 'Is Active',
      csvHeader: 'Is Active',
      type: 'boolean',
      required: false,
      defaultValue: true,
      width: 15,
      sampleValue: 'true',
      sampleValue2: 'false',
    },
  ],
}
