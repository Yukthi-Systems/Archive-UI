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

import { Toaster } from 'sonner'
import { NotificationProvider } from './context/NotificationContext'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { useInitializeApp } from './hooks/useInitializeApp'

function App() {
  useInitializeApp()

  return (
    <>
      <NotificationProvider>
        <Toaster
          position='bottom-right'
          richColors
          theme='system'
          closeButton
        />
        <RouterProvider router={router} />
      </NotificationProvider>
    </>
  )
}

export default App
