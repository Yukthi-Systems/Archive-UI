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

import { useState, useMemo } from 'react'
import { useAtom } from 'jotai'
import { parseISO, isAfter, format } from 'date-fns'
import {
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Calendar,
  Megaphone,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { dismissedAlertsAtom } from '@/atoms/maintenance'
import { useMaintenanceCheck } from '@/hooks/useHealthCheck'

export const SystemStatusBanner = () => {
  const { data: alerts, isLoading } = useMaintenanceCheck()
  const [dismissedIds, setDismissedIds] = useAtom(dismissedAlertsAtom)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  // Filter Active Alerts
  const activeAlerts = useMemo(() => {
    if (isLoading || !alerts?.length) return []

    const now = new Date()
    return alerts?.filter(alert => {
      const end = parseISO(alert.end_time)
      const isDismissed = dismissedIds.includes(alert.id)
      const isActive = isAfter(end, now)
      return isActive && !isDismissed
    })
  }, [alerts, dismissedIds, isLoading])

  const currentAlert = activeAlerts[currentIndex] || null

  // Status Type Logic
  const statusType = useMemo(() => {
    if (!currentAlert) return 'UPDATE'
    const title = currentAlert.title.toLowerCase()

    if (
      title.includes('outage') ||
      title.includes('critical') ||
      title.includes('down')
    )
      return 'OUTAGE'
    if (title.includes('maintenance') || title.includes('scheduled'))
      return 'MAINTENANCE'
    return 'UPDATE'
  }, [currentAlert])

  const theme = useMemo(() => {
    switch (statusType) {
      case 'OUTAGE':
        return {
          wrapper: 'border-l-red-500 shadow-red-900/5',
          bg: 'bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          iconBg: 'bg-red-100 dark:bg-red-900/60',
          icon: (
            <AlertTriangle className='w-4 h-4 text-red-600 dark:text-red-500' />
          ),
          badge:
            'bg-red-200/50 text-red-800 dark:text-red-200 border-red-300/50',
          text: 'text-red-900 dark:text-red-100',
          subtext: 'text-red-800/80 dark:text-red-200/70',
          divider: 'bg-red-900/10 dark:bg-red-100/10',
          label: 'Outage',
        }
      case 'MAINTENANCE':
        return {
          wrapper: 'border-l-amber-500 shadow-amber-900/5',
          bg: 'bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          iconBg: 'bg-amber-100 dark:bg-amber-900/60',
          icon: (
            <Clock className='w-4 h-4 text-amber-600 dark:text-amber-500' />
          ),
          badge:
            'bg-amber-200/50 text-amber-800 dark:text-amber-200 border-amber-300/50',
          text: 'text-amber-900 dark:text-amber-100',
          subtext: 'text-amber-800/80 dark:text-amber-200/70',
          divider: 'bg-amber-900/10 dark:bg-amber-100/10',
          label: 'Maintenance',
        }
      case 'UPDATE':
      default:
        return {
          wrapper: 'border-l-blue-500 shadow-blue-900/5',
          bg: 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-100 dark:bg-blue-900/60',
          icon: (
            <Megaphone className='w-4 h-4 text-blue-600 dark:text-blue-400' />
          ),
          badge:
            'bg-blue-200/50 text-blue-800 dark:text-blue-200 border-blue-300/50',
          text: 'text-blue-900 dark:text-blue-100',
          subtext: 'text-blue-800/80 dark:text-blue-200/70',
          divider: 'bg-blue-900/10 dark:bg-blue-100/10',
          label: 'Update',
        }
    }
  }, [statusType])

  if (activeAlerts.length === 0 || !currentAlert) return null

  // Handlers
  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeAlerts.length)
  }

  const handlePrev = () => {
    setCurrentIndex(
      prev => (prev - 1 + activeAlerts.length) % activeAlerts.length
    )
  }

  const handleDismiss = () => {
    setDismissedIds(prev => [...prev, currentAlert.id])
    if (activeAlerts.length === 1) {
      setIsExpanded(false)
    } else if (currentIndex === activeAlerts.length - 1) {
      setCurrentIndex(0)
    }
  }

  return (
    <div className='absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 px-4 animate-in slide-in-from-top-4 fade-in duration-500'>
      <div
        className={cn(
          'w-full rounded-lg border border-l-[4px] backdrop-blur-md shadow-lg transition-all duration-300 ease-in-out overflow-hidden ring-1 ring-black/5',
          theme.bg,
          theme.border,
          theme.wrapper
        )}
      >
        <div className='flex flex-col'>
          {/* Main Bar */}
          <div className='flex items-center justify-between px-4 py-3 gap-4'>
            {/* Clickable Header Area */}
            <div
              className='flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer group'
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div
                className={cn(
                  'p-1.5 rounded-full shrink-0 shadow-sm',
                  theme.iconBg
                )}
              >
                {theme.icon}
              </div>

              <div className='flex items-center gap-3 overflow-hidden'>
                <span
                  className={cn(
                    'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border shrink-0',
                    theme.badge
                  )}
                >
                  {theme.label}
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold line-clamp-3 group-hover:underline decoration-current/30 underline-offset-4',
                    theme.text
                  )}
                >
                  {currentAlert.title.replace(/^\S+:\s*/, '')}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className='flex items-center gap-1 shrink-0'>
              {activeAlerts.length > 1 && (
                <div
                  className={cn(
                    'flex items-center mr-2 bg-background/40 rounded-md border shadow-sm',
                    theme.border
                  )}
                >
                  <button
                    onClick={handlePrev}
                    className='p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-l-md transition-colors'
                  >
                    <ChevronLeft
                      className={cn('w-4 h-4 opacity-70', theme.text)}
                    />
                  </button>
                  <span
                    className={cn(
                      'text-[9px] font-mono w-12 text-center select-none',
                      theme.text
                    )}
                  >
                    {currentIndex + 1} / {activeAlerts.length}
                  </span>
                  <button
                    onClick={handleNext}
                    className='p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-r-md transition-colors'
                  >
                    <ChevronRight
                      className={cn('w-4 h-4 opacity-70', theme.text)}
                    />
                  </button>
                </div>
              )}

              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  'h-8 w-8 hover:bg-black/5 dark:hover:bg-white/10',
                  theme.text
                )}
              >
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                />
              </Button>

              <div className={cn('w-px h-4 mx-1', theme.divider)} />

              <Button
                variant='ghost'
                size='icon'
                onClick={handleDismiss}
                className={cn(
                  'h-8 w-8 hover:bg-black/5 dark:hover:bg-white/10',
                  theme.text
                )}
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
          </div>

          {/* Details Section (Pure CSS Transition) */}
          <div
            className={cn(
              'grid transition-all duration-300 ease-in-out',
              isExpanded
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <div className='overflow-hidden'>
              <div
                className={cn(
                  'px-4 py-4 space-y-4 border-t bg-background/30',
                  theme.border
                )}
              >
                <p
                  className={cn(
                    'text-xs leading-relaxed max-w-2xl pl-1',
                    theme.text
                  )}
                >
                  {currentAlert.description}
                </p>

                <div
                  className={cn(
                    'flex flex-wrap text-xs items-center gap-6 text-xs font-medium font-mono select-none pl-1',
                    theme.subtext
                  )}
                >
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-3.5 h-3.5' />
                    <span>
                      Start:{' '}
                      {format(
                        parseISO(currentAlert.start_time),
                        'MMM d, HH:mm'
                      )}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-3.5 h-3.5' />
                    <span>
                      End:{' '}
                      {format(parseISO(currentAlert.end_time), 'MMM d, HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
