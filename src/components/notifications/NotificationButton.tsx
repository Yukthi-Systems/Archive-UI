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

// components/notifications/NotificationButton.tsx
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { NotificationPanel } from './NotificationPanel'

export const NotificationButton = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  return (
    <div className='relative'>
      <button
        type='button'
        className='relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors'
        onClick={() => setIsPanelOpen(!isPanelOpen)}
      >
        <Bell className='w-5 h-5' />
        <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white'></span>
      </button>

      <NotificationPanel
      // isOpen={isPanelOpen}
      // onClose={() => setIsPanelOpen(false)}
      />
    </div>
  )
}
