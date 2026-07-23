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

import * as React from 'react'
import { format, differenceInDays } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { type DateRange, type Matcher } from 'react-day-picker'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange
  setDate: (date?: DateRange) => void
  disabled?: Matcher | Matcher[]
  maxDays?: number
}

export function DateRangePicker({
  date,
  setDate,
  className,
  disabled,
  maxDays,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  // Handle date selection from calendar
  const handleSelect = (newRange: DateRange | undefined) => {
    if (!newRange) {
      setDate(undefined)
      return
    }

    // Clone dates to avoid mutating react-day-picker's shared references,
    // then always default start to 00:00 and end to 23:59
    if (newRange.from) {
      const from = new Date(newRange.from)
      from.setHours(0, 0, 0, 0)
      newRange.from = from
    }

    if (newRange.to) {
      const to = new Date(newRange.to)
      to.setHours(23, 59, 59, 999)
      newRange.to = to
    }

    if (newRange.from && newRange.to) {
      const max = maxDays || 90
      const days = Math.abs(differenceInDays(newRange.to, newRange.from))
      if (days >= max) {
        toast.error(`Date range cannot exceed ${max} days`)
        // Only set the 'from' date if the range is invalid
        setDate({ from: newRange.from, to: undefined })
        return
      }
    }

    setDate(newRange)
  }

  const handleTimeChange = (type: 'start' | 'end', timeValue: string) => {
    if (!date?.from) return

    const [hours, minutes] = timeValue.split(':').map(Number)
    const newRange = { ...date }

    if (type === 'start') {
      const newFrom = new Date(newRange.from!)
      newFrom.setHours(hours, minutes)
      newRange.from = newFrom
    } else if (type === 'end') {
      // If 'to' is undefined, we probably shouldn't be setting time for it yet,
      // but if user tries, maybe we don't do anything or we assume same day?
      // For now, only if 'to' exists.
      if (newRange.to) {
        const newTo = new Date(newRange.to)
        newTo.setHours(hours, minutes)
        newRange.to = newTo
      }
    }
    setDate(newRange)
  }

  return (
    <div className={cn('grid gap-2 relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild className='px-2'>
          <Button
            id='date'
            variant='outline'
            className={cn(
              'w-full justify-start text-left font-normal h-9 pr-8',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='mr-2 h-3.5 w-3.5' />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y HH:mm')} -{' '}
                  {format(date.to, 'LLL dd, y HH:mm')}
                </>
              ) : (
                format(date.from, 'LLL dd, y HH:mm')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-auto p-0 border-none shadow-2xl rounded-2xl'
          align='start'
        >
          <Calendar
            initialFocus
            mode='range'
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            captionLayout='dropdown'
            fromYear={2000}
            toYear={new Date().getFullYear()}
            disabled={disabled}
          />
          <div className='p-3 border-t border-border'>
            <div className='flex items-end gap-2'>
              <div className='grid gap-1.5'>
                <Label className='text-xs'>Start Time</Label>
                <Input
                  type='time'
                  value={date?.from ? format(date.from, 'HH:mm') : '00:00'}
                  onChange={e => handleTimeChange('start', e.target.value)}
                  disabled={!date?.from}
                  className='h-8 w-[160px]'
                />
              </div>
              <span className='text-muted-foreground mb-2'>-</span>
              <div className='grid gap-1.5'>
                <Label className='text-xs'>End Time</Label>
                <Input
                  type='time'
                  value={date?.to ? format(date.to, 'HH:mm') : '23:59'}
                  onChange={e => handleTimeChange('end', e.target.value)}
                  disabled={!date?.to}
                  className='h-8 w-[160px]'
                />
              </div>
              <div className='ml-auto flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setDate(undefined)}
                >
                  Clear
                </Button>
                <Button size='sm' onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {date && (
        <div
          className='absolute right-2 top-2.5 z-10 cursor-pointer text-muted-foreground hover:text-foreground'
          onClick={e => {
            e.stopPropagation()
            setDate(undefined)
          }}
          title='Clear date range'
        >
          <X className='h-4 w-4' />
        </div>
      )}
    </div>
  )
}
