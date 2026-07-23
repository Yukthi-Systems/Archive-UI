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

// Logo.tsx
import { Link } from 'react-router-dom'
import { Archive } from 'lucide-react'

export const Logo = () => {
  return (
    <Link
      to='/'
      className='flex items-center gap-2.5 hover:opacity-90 transition-opacity'
    >
      <div className='w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm'>
        <Archive className='w-5 w-5 text-primary-foreground' />
      </div>
      {/* <span className='font-bold text-xl text-foreground'>Archive Inc.</span> */}
    </Link>
  )
}
