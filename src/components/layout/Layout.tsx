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

// Layout.tsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MainContent } from './MainContent'
import { SystemStatusBanner } from '../notifications/StatusBanner'

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-background'>
      {/* Header Wrapper:
        We wrap the Header and Banner in a relative container with high z-index.
        This allows the absolute positioned Banner to float 'out' of this container
        over the main content below.
      */}
      <div className='relative z-50 flex-shrink-0'>
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* The banner lives here, conceptually attached to the header area */}
        <SystemStatusBanner />
      </div>

      {/* Main Layout Body */}
      <div className='flex flex-1 overflow-hidden relative z-0'>
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <div className='w-full overflow-y-auto flex flex-col scrollbar-custom'>
          <MainContent>
            <Outlet />
            {/* <Footer /> */}
          </MainContent>
        </div>
      </div>
    </div>
  )
}
