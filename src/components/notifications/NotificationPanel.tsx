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

import { Bell, BellOff, Trash2, Eye } from 'lucide-react'
import { useNotificationContext } from '@/context/NotificationContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { notificationTypes } from '@/constants/notification'
import { useState } from 'react'

interface NotificationPanelProps {
  onNotificationClick?: (message: any) => void
}

export const NotificationPanel = ({
  onNotificationClick,
}: NotificationPanelProps) => {
  const {
    messages,
    notificationsEnabled,
    handleNotificationToggle,
    clearMessages,
    removeMessage,
  } = useNotificationContext()

  const [selectedMessageState, setSelectedMessageState] = useState<any>(null)
  const selectedMessage = onNotificationClick ? null : selectedMessageState
  const setSelectedMessage = onNotificationClick
    ? () => {}
    : setSelectedMessageState

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Just now'

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleNotificationClick = (message: any) => {
    setSelectedMessage(message)
    if (message.id) {
      removeMessage(message.id)
    }
  }

  return (
    <div className='max-h-96 overflow-hidden'>
      {/* Header */}
      <div className='p-3 border-b border-border bg-muted/50'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Bell className='w-4 h-4 text-blue-500' />
            <h3 className='font-semibold text-sm'>Notifications</h3>
            {messages.length > 0 && (
              <span className='bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full'>
                {messages.length}
              </span>
            )}
          </div>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => handleNotificationToggle(!notificationsEnabled)}
              title={notificationsEnabled ? 'Disable' : 'Enable'}
            >
              {notificationsEnabled ? (
                <Bell className='w-4 h-4' />
              ) : (
                <BellOff className='w-4 h-4' />
              )}
            </Button>
            {messages.length > 0 && (
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-destructive hover:text-destructive'
                onClick={clearMessages}
                title='Clear all'
              >
                <Trash2 className='w-4 h-4' />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className='overflow-y-auto max-h-72'>
        {!notificationsEnabled ? (
          <div className='p-6 text-center text-muted-foreground'>
            <BellOff className='w-8 h-8 mx-auto mb-2 opacity-50' />
            <p className='text-sm'>Notifications are disabled</p>
            <p className='text-xs mt-1 opacity-70'>
              Enable notifications to see updates
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className='p-6 text-center text-muted-foreground'>
            <Bell className='w-8 h-8 mx-auto mb-2 opacity-50' />
            <p className='text-sm'>No notifications</p>
          </div>
        ) : (
          <div className='divide-y divide-border'>
            {messages.map(message => (
              <div
                key={message.id}
                onClick={() => handleNotificationClick(message)}
                className='p-3 hover:bg-muted/50 transition-colors group relative cursor-pointer'
              >
                <div className='flex items-start gap-3'>
                  <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform'>
                    <Bell className='h-4 w-4 text-primary' />
                  </div>
                  <div className='flex-1 min-w-0 space-y-1'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium leading-none'>
                        {(message?.data?.type &&
                          notificationTypes[
                            message.data.type as keyof typeof notificationTypes
                          ]) ||
                          'Notification'}
                      </p>
                      <Eye className='h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity' />
                    </div>
                    <p className='text-xs text-muted-foreground line-clamp-2'>
                      {message?.data?.message || 'New notification'}
                    </p>
                    <div className='flex items-center justify-between pt-1'>
                      <span className='text-[10px] text-muted-foreground font-medium'>
                        {message?.user_name || 'System'}
                      </span>
                      <span className='text-[10px] text-muted-foreground'>
                        {formatDate(message?.data?.action_timestamp || '')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notificationsEnabled && messages.length > 0 && (
        <div className='p-2 border-t border-border bg-muted/50'>
          <Button
            variant='ghost'
            size='sm'
            className='w-full text-xs text-muted-foreground hover:text-destructive transition-colors'
            onClick={clearMessages}
          >
            Clear all notifications
          </Button>
        </div>
      )}

      {/* Shared Notification Details Dialog */}
      {!onNotificationClick && (
        <NotificationDetailsDialog
          selectedMessage={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  )
}

interface NotificationDetailsDialogProps {
  selectedMessage: any
  onClose: () => void
}

export const NotificationDetailsDialog = ({
  selectedMessage,
  onClose,
}: NotificationDetailsDialogProps) => {
  if (!selectedMessage) return null

  return (
    <Dialog open={!!selectedMessage} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className='p-2 rounded-full bg-primary/10'>
              <Bell className='w-4 h-4 text-primary' />
            </div>
            Notification Details
          </DialogTitle>
          <DialogDescription>
            Received on{' '}
            {selectedMessage?.data?.action_timestamp
              ? new Date(selectedMessage.data.action_timestamp).toLocaleString()
              : 'Unknown time'}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <h4 className='text-sm font-medium text-muted-foreground'>
                Message
              </h4>
              <div className='p-3 rounded-md bg-muted/50 text-sm break-all line-clamp-3'>
                {selectedMessage?.data?.message || 'No content'}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <h4 className='text-sm font-medium text-muted-foreground'>
                  Actor
                </h4>
                <p className='text-sm font-medium'>
                  {selectedMessage?.user_name || 'System'}
                </p>
              </div>
              <div className='space-y-1.5'>
                <h4 className='text-sm font-medium text-muted-foreground'>
                  Action Type
                </h4>
                <Badge variant='outline' className='text-xs'>
                  {(selectedMessage?.data?.type &&
                    notificationTypes[
                      selectedMessage.data
                        .type as keyof typeof notificationTypes
                    ]) ||
                    'General'}
                </Badge>
              </div>
            </div>

            {(selectedMessage?.data?.details ||
              selectedMessage?.data?.metadata) && (
              <div className='space-y-1.5'>
                <h4 className='text-sm font-medium text-muted-foreground'>
                  Technical Details
                </h4>
                <pre className='p-3 rounded-md bg-muted text-foreground border border-border text-xs overflow-x-auto font-mono shadow-sm max-h-[600px] break-all overflow-y-auto'>
                  {typeof (
                    selectedMessage.data?.details ||
                    selectedMessage.data?.metadata
                  ) === 'string'
                    ? selectedMessage.data?.details ||
                      selectedMessage.data?.metadata
                    : JSON.stringify(
                        selectedMessage.data?.details ||
                          selectedMessage.data?.metadata,
                        null,
                        2
                      )}
                </pre>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' size='sm' onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
