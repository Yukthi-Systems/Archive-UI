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

import { organizationAtom } from '@/atoms/organization'
import { useAtom } from 'jotai'
import * as yup from 'yup'

// Move the hook-based logic to a custom hook
export const useOrganizationQuota = () => {
  const [orgDetails] = useAtom(organizationAtom)
  const orgUtilized = orgDetails?.quota_utilized || 0
  const orgAllocated = orgDetails?.quota_allocated || 0
  const orgAvailable = Math.max(0, Number(orgAllocated) - Number(orgUtilized))

  return {
    orgDetails,
    orgUtilized,
    orgAllocated,
    orgAvailable,
  }
}

// Schema factory function that takes maxQuota and minQuota as parameters
export const createDomainSchema = (maxQuota: number, minQuota: number = 2) => {
  return yup.object({
    domain_name: yup
      .string()
      .required('Domain name is required')
      .matches(
        /^(?!:\/\/)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*$/,
        'Please enter a valid domain name (e.g., example.com or example.co.in)'
      ),

    data_retention_days: yup
      .number()
      .transform(v => (isNaN(v) ? undefined : v))
      .required('Data retention days are required')
      .min(1, 'Minimum retention is 1 day')
      .max(7300, 'Maximum retention is 7300 days (20 years)')
      .integer('Must be a whole number'),

    quota_allocated: yup
      .number()
      .transform(v => (isNaN(v) ? undefined : v))
      .required('Storage quota is required')
      .min(minQuota, `Minimum quota must be at least ${minQuota} GB`)
      .max(
        maxQuota,
        maxQuota > 0
          ? `Maximum quota is ${maxQuota} GB (available organization quota)`
          : 'No quota available in organization'
      )
      .integer('Must be a whole number'),

    is_active: yup.boolean().default(true),
  })
}

// For components that need to use the schema
export const useDomainSchema = (
  minQuota: number = 2,
  currentDomainQuota: number = 0
) => {
  const { orgAvailable } = useOrganizationQuota()
  const maxQuota = orgAvailable + currentDomainQuota
  return createDomainSchema(maxQuota, minQuota)
}

// Type definition (using a base schema for inference)
export type DomainFormData = yup.InferType<
  ReturnType<typeof createDomainSchema>
>
