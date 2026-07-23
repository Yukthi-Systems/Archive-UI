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

// hooks/useNotification.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAtomValue } from 'jotai'
import { Centrifuge } from 'centrifuge'
import { toast, Bounce } from 'react-toastify'
import { WSS_URL } from '@/constants/constants'
import { getNotificationsToken } from '@/utils/tokenStorage'
import { Bell } from 'lucide-react'
import { userAtom } from '@/atoms/user'
import { organizationAtom } from '@/atoms/organization'

// --- Interfaces ---

interface NotificationMessage {
  id?: string
  data?: {
    message: string
    action_timestamp: string
    type?: string
    action_type?: string
    details?: any
    metadata?: any
  }

  user_name?: string
  type?: string
  body?: any
}

export interface UseNotificationReturn {
  messages: NotificationMessage[]
  notificationsEnabled: boolean
  isNotificationStateLoaded: boolean
  handleNotificationToggle: (enabled: boolean) => void
  clearMessages: () => void
  removeMessage: (id: string) => void
}

// --- Hook Implementation ---

export const useNotification = (): UseNotificationReturn => {
  const userDetails = useAtomValue(userAtom)
  const organizationDetails = useAtomValue(organizationAtom)
  const notiToken = getNotificationsToken()

  const [messages, setMessages] = useState<NotificationMessage[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isNotificationStateLoaded, setIsNotificationStateLoaded] =
    useState(false)

  const centrifugeRef = useRef<Centrifuge | null>(null)
  const notificationQueueRef = useRef<NotificationMessage[]>([])
  const isProcessingQueueRef = useRef(false)
  const activeToastsRef = useRef(0)

  const MAX_ACTIVE_TOASTS = 3
  const TOAST_DELAY = 800
  const MAX_QUEUE_SIZE = 10

  const channel = `notifications:archive:${organizationDetails?.organization_id}`

  const log = useCallback(
    (level: 'log' | 'info' | 'warn' | 'error', message: string, data?: any) => {
      const timestamp = new Date().toLocaleTimeString()
      const prefix = `📱 [${timestamp}] Notification:`
      if (data) {
        console[level](`${prefix} ${message}`, data)
      } else {
        console[level](`${prefix} ${message}`)
      }
    },
    []
  )

  const formatDate = useCallback((dateString: string): string => {
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
  }, [])

  const processNotificationQueue = useCallback(async () => {
    if (
      isProcessingQueueRef.current ||
      notificationQueueRef.current.length === 0
    )
      return
    isProcessingQueueRef.current = true

    while (notificationQueueRef.current.length > 0) {
      if (activeToastsRef.current >= MAX_ACTIVE_TOASTS) {
        await new Promise(resolve => setTimeout(resolve, TOAST_DELAY))
        continue
      }

      const notification = notificationQueueRef.current.shift()!
      activeToastsRef.current++

      toast(<NotificationView item={notification} formatDate={formatDate} />, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
        transition: Bounce,
        onClose: () => {
          activeToastsRef.current = Math.max(0, activeToastsRef.current - 1)
        },
      })

      if (notificationQueueRef.current.length > 0) {
        await new Promise(resolve => setTimeout(resolve, TOAST_DELAY))
      }
    }
    isProcessingQueueRef.current = false
  }, [formatDate])

  const showSummaryNotification = useCallback((count: number) => {
    toast(
      <div className='w-full flex items-center gap-2 mt-2.5'>
        <div className='w-9 h-9 flex justify-center items-center rounded-full bg-blue-500/10 text-blue-500 flex-shrink-0'>
          <BellIcon size={20} />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-[13px] text-left font-medium'>
            You have {count} new notifications
          </p>
          <p className='text-[11px] text-gray-500 mt-1'>
            Click the notification icon to view all
          </p>
        </div>
      </div>,
      {
        position: 'top-center',
        autoClose: 4000,
        theme: 'dark',
        transition: Bounce,
      }
    )
  }, [])

  const queueNotification = useCallback(
    async (message: NotificationMessage) => {
      const messageWithId: NotificationMessage = {
        ...message,
        id:
          message.id ||
          `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      }
      setMessages(prev => [...prev, messageWithId])

      const isPageHidden = document.hidden || !document.hasFocus()

      if (notificationQueueRef.current.length >= MAX_QUEUE_SIZE) {
        log('warn', 'Queue full, showing summary')
        const totalCount = notificationQueueRef.current.length + 1
        notificationQueueRef.current = []
        showSummaryNotification(totalCount)
        return
      }

      notificationQueueRef.current.push(message)
      processNotificationQueue()

      if (isPageHidden && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          new Notification('New Notification', {
            body: message?.data?.message || 'You have a new notification',
            icon: '/favicon.ico',
          })
        }
      }
    },
    [log, processNotificationQueue, showSummaryNotification]
  )

  const handleNotificationToggle = useCallback(
    (enabled: boolean) => {
      log('info', 'Settings changed', { enabled })
      setNotificationsEnabled(enabled)
      setIsNotificationStateLoaded(true)

      if (!enabled && centrifugeRef.current) {
        centrifugeRef.current.disconnect()
        sessionStorage.setItem('centrifugeConnected', 'false')
      }
    },
    [log]
  )

  const clearMessages = useCallback(() => setMessages([]), [])

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  useEffect(() => {
    setNotificationsEnabled(true)
    setIsNotificationStateLoaded(true)
  }, [])

  useEffect(() => {
    if (!isNotificationStateLoaded) return
    if (!notificationsEnabled) return

    if (!notiToken || !organizationDetails?.organization_id) {
      log('warn', '❌ Connection blocked: Missing Token or OrgID', {
        token: !!notiToken,
        org: organizationDetails?.organization_id,
      })
      return
    }

    const centrifugeConnected = sessionStorage.getItem('centrifugeConnected')
    if (centrifugeConnected === 'true' && centrifugeRef.current) {
      log('info', 'Using existing Centrifuge connection')
      return
    }

    log('info', '📡 Connecting to Centrifuge...', {
      channel,
      wsUrl: `${WSS_URL}/connection/websocket`,
    })

    const centrifuge = new Centrifuge(`${WSS_URL}/connection/websocket`, {
      token: notiToken,
    })

    centrifugeRef.current = centrifuge
    const sub: any = centrifuge.newSubscription(channel)

    sub.on('publication', (ctx: any) => {
      const userID = ctx.data?.body?.user_id || ctx.data?.user_id || ''
      const message = ctx.data?.body || ctx.data || {}

      if (userDetails?.user_id !== userID) {
        queueNotification(message)
      }
    })

    sub.on('subscribe', (_ctx: any) => {
      sessionStorage.setItem('centrifugeConnected', 'true')
    })

    sub.on('error', (ctx: any) => {
      console.error('❌ [WS] Subscription Error:', ctx)
    })

    sub.on('disconnect', (_ctx: any) => {
      sessionStorage.setItem('centrifugeConnected', 'false')
    })

    sub.subscribe()
    centrifuge.connect()

    return () => {
      if (centrifuge) centrifuge.disconnect()
      notificationQueueRef.current = []
      sessionStorage.setItem('centrifugeConnected', 'false')
    }
  }, [
    notificationsEnabled,
    isNotificationStateLoaded,
    notiToken,
    organizationDetails?.organization_id,
    channel,
    log,
    queueNotification,
    userDetails?.user_id,
  ])

  return {
    messages,
    notificationsEnabled,
    isNotificationStateLoaded,
    handleNotificationToggle,
    clearMessages,
    removeMessage,
  }
}

// --- Sub-Components ---

const NotificationView = ({
  item,
  formatDate,
}: {
  item: NotificationMessage
  formatDate: (d: string) => string
}) => {
  return (
    <div className='w-full flex items-center gap-2 mt-2.5'>
      <div className='w-9 h-9 flex justify-center items-center rounded-full bg-blue-500/10 text-blue-500 flex-shrink-0'>
        <Bell size={20} />
      </div>
      <div className='flex-1 min-w-0 text-left'>
        <p className='text-[13px] font-medium line-clamp-3 text-white'>
          {item?.data?.message || 'New activity'}
        </p>
        <div className='w-full flex justify-between items-center mt-1.5 gap-2'>
          <p className='text-[11px] font-medium text-gray-400 truncate'>
            by {item?.user_name || 'System'}
          </p>
          <p className='text-[11px] font-medium text-gray-400 flex-shrink-0'>
            {formatDate(item?.data?.action_timestamp || '')}
          </p>
        </div>
      </div>
    </div>
  )
}

const BellIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' />
    <path d='M13.73 21a2 2 0 0 1-3.46 0' />
  </svg>
)
