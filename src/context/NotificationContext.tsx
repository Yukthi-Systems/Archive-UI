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

// context/NotificationContext.tsx
import { createContext, useContext, type ReactNode } from 'react'
import {
  useNotification,
  type UseNotificationReturn,
} from '@/hooks/useNotification'

const NotificationContext = createContext<UseNotificationReturn | undefined>(
  undefined
)

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({
  children,
}: NotificationProviderProps) => {
  const notification = useNotification()

  return (
    <NotificationContext.Provider value={notification}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within NotificationProvider'
    )
  }
  return context
}
