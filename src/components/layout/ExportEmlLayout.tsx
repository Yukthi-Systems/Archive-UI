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

import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { SystemStatusBanner } from '../notifications/StatusBanner'

function ExportEmlLayout() {
  return (
    <div className='flex flex-col h-screen overflow-hidden bg-background'>
      <div className='relative z-50 flex-shrink-0'>
        <Header
          isSidebarOpen={false}
          onToggleSidebar={() => {}}
          onToggleCollapse={() => {}}
        />

        {/* The banner lives here, conceptually attached to the header area */}
        <SystemStatusBanner />
      </div>
      <div className='flex flex-1 overflow-hidden relative z-0'>
        <div className='w-full overflow-y-auto flex flex-col scrollbar-custom'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default ExportEmlLayout
