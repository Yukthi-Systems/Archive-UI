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

import type { Organization } from '@/types/organization.types'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

/**
 * Organization and Token atoms
 * All storage atoms use getOnInit for immediate hydration.
 */
export const organizationAtom = atomWithStorage<Organization | null>(
  'organization',
  null,
  undefined,
  {
    getOnInit: true,
  }
)

// --- Helper Selectors ---

export const organizationIdAtom = atom(
  get => get(organizationAtom)?.organization_id || null
)

export const organizationNameAtom = atom(
  get => get(organizationAtom)?.organization_name || null
)
