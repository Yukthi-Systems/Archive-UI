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

import React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface MultiDeleteProps {
  selectedCount: number
  handleClear: () => void
  handleClick: () => void
  permission?: boolean
}

const MultiDelete: React.FC<MultiDeleteProps> = ({
  selectedCount = 0,
  handleClear,
  handleClick,
  permission = true,
}) => {
  if (selectedCount === 0) return null

  return (
    <div className='flex items-center gap-3 px-4 py-2 bg-background border border-border shadow-2xl rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 rounded-full bg-primary animate-pulse' />
          <span className='text-sm font-semibold'>
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        <Separator orientation='vertical' className='h-4' />

        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleClear}
            className='h-8 text-xs font-medium hover:bg-muted rounded-lg'
          >
            Clear Selection
          </Button>

          {permission && (
            <Button
              variant='destructive'
              size='sm'
              onClick={handleClick}
              className='h-8 px-4 text-xs font-semibold rounded-lg shadow-lg shadow-destructive/20 hover:shadow-xl shadow-destructive/30 transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2'
            >
              <Trash2 size={14} />
              Delete Selected
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MultiDelete
