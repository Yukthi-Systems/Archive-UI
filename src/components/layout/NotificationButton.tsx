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

// NotificationButton.tsx
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  NotificationPanel,
  NotificationDetailsDialog,
} from '../notifications/NotificationPanel'
import { useNotificationContext } from '@/context/NotificationContext'
import { useState } from 'react'

export const NotificationButton = () => {
  const { messages } = useNotificationContext()
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50'
          >
            <Bell className='w-4 h-4' />
            {messages.length > 0 && (
              <span className='absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium'>
                {messages.length > 99 ? '99+' : messages.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-80 p-0' align='end'>
          <NotificationPanel onNotificationClick={setSelectedMessage} />
        </PopoverContent>
      </Popover>

      <NotificationDetailsDialog
        selectedMessage={selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    </>
  )
}
