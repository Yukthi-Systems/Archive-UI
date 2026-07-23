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

import { Inbox } from 'lucide-react'

function NoDataFound({
  message = 'Create new item or contact admin',
}: {
  message?: string
}) {
  return (
    <div className='flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground/60 h-[calc(100vh-200px)] mt-6'>
      <div className='p-4 rounded-full bg-muted/30 border border-border/50'>
        <Inbox className='h-8 w-8' />
      </div>
      <div className='text-center space-y-1'>
        <p className='text-sm font-medium text-foreground'>No results found</p>
        <p className='text-xs'>{message}</p>
      </div>
    </div>
  )
}

export default NoDataFound
