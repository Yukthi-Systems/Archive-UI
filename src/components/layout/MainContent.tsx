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

// MainContent.tsx
import { type ReactNode } from 'react'

interface MainContentProps {
  children: ReactNode
}

export const MainContent = ({ children }: MainContentProps) => {
  return (
    <main className='flex-1 overflow-y-auto h-full px-6 py-4 scrollbar-custom'>
      <div className='max-w-[--breakpoint-2xl] mx-auto w-full relative'>
        {children}
      </div>
    </main>
  )
}
