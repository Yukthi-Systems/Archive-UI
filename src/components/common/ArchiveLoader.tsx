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

import { cn } from '@/lib/utils'

export function ArchiveLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-4',
        className
      )}
    >
      {/* The Visual Loader */}
      <div className='relative h-16 w-16'>
        {/* Outer Ring (Spinning) */}
        <div className='absolute inset-0 rounded-full border-4 border-slate-200 border-t-primary animate-spin' />

        {/* Inner Ring (Reverse Spin) */}
        <div
          className='absolute inset-2 rounded-full border-4 border-slate-100 border-b-primary/40 animate-spin duration-1000 direction-reverse'
          style={{ animationDirection: 'reverse' }}
        />

        {/* Center Icon (Pulse) */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='h-4 w-4 rounded-sm bg-primary animate-pulse' />
        </div>
      </div>

      {/* Text with "typing" dots effect */}
      <div className='flex flex-col items-center gap-1'>
        <h3 className='text-sm font-semibold tracking-wide text-foreground uppercase'>
          Searching Archives
        </h3>
        <div className='flex gap-1'>
          <span className='h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]' />
          <span className='h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]' />
          <span className='h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce' />
        </div>
      </div>
    </div>
  )
}
