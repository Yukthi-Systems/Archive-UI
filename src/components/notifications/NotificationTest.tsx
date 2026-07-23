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

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Bell, Send, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { SendNotification } from '@/api/notification'

export const NotificationTest = () => {
  const [customMessage, setCustomMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const triggerTest = async (type: string, text: string) => {
    setIsSending(true)
    try {
      const payload = {
        type: type,

        message: text || 'System test notification received!',
        action_timestamp: new Date().toISOString(),

        body: {
          test_id: Math.random().toString(36).substring(7),
        },
      }

      await SendNotification(payload)
      toast.success('Notification request sent to server')
    } catch (error) {
      toast.error('Failed to trigger notification')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className='w-full max-w-md mx-auto mt-10 shadow-lg border-2'>
      <CardHeader className='bg-slate-50 border-b'>
        <CardTitle className='flex items-center gap-2 text-primary'>
          <Bell className='h-5 w-5' />
          Notification System Tester
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 pt-6'>
        <div className='space-y-2'>
          <p className='text-sm font-medium text-muted-foreground'>
            Predefined Tests:
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                triggerTest('info', '👤 User updated their profile')
              }
              disabled={isSending}
            >
              Info Test
            </Button>
            <Button
              variant='secondary'
              size='sm'
              onClick={() =>
                triggerTest('alert', '⚠️ Security threshold reached!')
              }
              disabled={isSending}
            >
              Alert Test
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <p className='text-sm font-medium text-muted-foreground'>
            Custom Message:
          </p>
          <div className='flex gap-2'>
            <Input
              placeholder='Enter test message...'
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
            />
            <Button
              onClick={() => triggerTest('custom', customMessage)}
              disabled={isSending || !customMessage}
            >
              <Send className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <div className='p-3 bg-blue-50 rounded-md border border-blue-200'>
          <div className='flex gap-2 text-blue-700'>
            <AlertTriangle className='h-4 w-4 mt-0.5' />
            <p className='text-xs italic'>
              Note: You won't see your own notification if the hook logic
              filters by user_id. Open this in two different browsers
              (incognito) to test properly.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
