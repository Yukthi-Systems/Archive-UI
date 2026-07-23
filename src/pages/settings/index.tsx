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

import { SettingsIcon } from 'lucide-react'

const Settings = () => {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold flex items-center gap-2'>
            <SettingsIcon className='w-6 h-6 text-primary' />
            Settings
          </h1>
          <p className='text-sm text-muted-foreground'>
            Manage your personal profile and system-wide configurations.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings
