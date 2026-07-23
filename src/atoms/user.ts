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

import type { AuthResponse } from '@/types/auth.types'
import { atomWithStorage } from 'jotai/utils'

/**
 * User data atom
 * getOnInit: true ensures the value is read from localStorage
 * synchronously on the very first render.
 */
export const userAtom = atomWithStorage<AuthResponse | null>(
  'user',
  null,
  undefined,
  {
    getOnInit: true,
  }
)
