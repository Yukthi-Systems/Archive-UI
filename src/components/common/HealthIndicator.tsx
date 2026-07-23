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

import { useState } from 'react'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  Server,
  Activity,
  Database,
  HardDrive,
  Globe,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { useHealthMonitor } from '@/hooks/useHealthCheck'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { HealthStatus } from '@/types/health.types'

interface HealthIndicatorProps {
  variant?: 'default' | 'minimal'
}

export const HealthIndicator = ({
  variant = 'default',
}: HealthIndicatorProps) => {
  const [open, setOpen] = useState(false)
  const {
    overallStatus,
    overallColor,
    overallMessage,
    componentDetails,
    getStatusColor,
    uptime,
    isLoading,
    isOffline,
    lastSuccessfulCheck,
    manualHealthCheck,
    version,
    timestamp,
  } = useHealthMonitor({
    interval: 60000, // Check every minute
    retryCount: 2,
    timeout: 3000,
  })

  // Status icons
  const StatusIcon = ({
    status,
    className,
  }: {
    status: HealthStatus
    className?: string
  }) => {
    switch (status) {
      case 'OK':
        return (
          <CheckCircle2
            className={cn('w-3.5 h-3.5 text-green-500', className)}
          />
        )
      case 'WARNING':
        return (
          <AlertTriangle
            className={cn('w-3.5 h-3.5 text-yellow-500', className)}
          />
        )
      case 'ERROR':
        return <XCircle className={cn('w-3.5 h-3.5 text-red-500', className)} />
      case 'UNKNOWN':
        return (
          <Activity className={cn('w-3.5 h-3.5 text-gray-400', className)} />
        )
      default:
        return (
          <Activity className={cn('w-3.5 h-3.5 text-gray-400', className)} />
        )
    }
  }

  // Overall status icon
  const OverallStatusIcon = () => {
    if (isLoading)
      return <Loader2 className='w-3.5 h-3.5 text-yellow-500 animate-spin' />
    if (isOffline) return <WifiOff className='w-3.5 h-3.5 text-gray-500' />
    return <StatusIcon status={overallStatus} />
  }

  // Status badge variant
  const getBadgeVariant = () => {
    if (isOffline) return 'outline'

    switch (overallStatus) {
      case 'OK':
        return 'default'
      case 'WARNING':
        return 'secondary'
      case 'ERROR':
        return 'destructive'
      case 'UNKNOWN':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // Get component icon
  const getComponentIcon = (componentName: string) => {
    switch (componentName) {
      case 'API':
        return <Globe className='w-3.5 h-3.5' />
      case 'Cache':
        return <HardDrive className='w-3.5 h-3.5' />
      case 'Database':
        return <Database className='w-3.5 h-3.5' />
      default:
        return <Server className='w-3.5 h-3.5' />
    }
  }

  // Get component status text
  const getComponentStatusText = (value: string) => {
    if (value === 'OK') return 'Operational'
    if (value.includes('ERROR')) return 'Error'
    if (value.includes('WARN')) return 'Warning'
    if (value.includes('DEGRADED')) return 'Degraded'
    return value
  }

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {variant === 'minimal' ? (
            <div
              className='flex items-center gap-2 cursor-pointer group'
              role='button'
              tabIndex={0}
            >
              <OverallStatusIcon />
              <span
                className={cn(
                  'font-medium',
                  overallColor,
                  'group-hover:opacity-80 transition-opacity'
                )}
              >
                {isOffline
                  ? 'Offline'
                  : isLoading
                    ? 'Checking...'
                    : overallStatus === 'OK'
                      ? 'Healthy'
                      : overallStatus === 'WARNING'
                        ? 'Warning'
                        : overallStatus === 'ERROR'
                          ? 'Error'
                          : 'Unknown'}
              </span>
            </div>
          ) : (
            <Button
              variant='ghost'
              size='sm'
              className={cn(
                'h-8 px-2 gap-1.5 text-xs font-normal',
                'hover:bg-accent/50 transition-all duration-200',
                'border border-transparent hover:border-border/50',
                'rounded-full'
              )}
            >
              <OverallStatusIcon />
              <span className={cn('hidden sm:inline', overallColor)}>
                {isOffline
                  ? 'Offline'
                  : isLoading
                    ? 'Checking...'
                    : overallStatus === 'OK'
                      ? 'Healthy'
                      : overallStatus === 'WARNING'
                        ? 'Warning'
                        : overallStatus === 'ERROR'
                          ? 'Error'
                          : 'Unknown'}
              </span>
              <ChevronDown
                className={cn('w-3 h-3 ml-0.5', open && 'rotate-180')}
              />
            </Button>
          )}
        </PopoverTrigger>

        <PopoverContent
          align='end'
          className='w-80 p-0 border-border/40 shadow-lg'
          sideOffset={5}
        >
          <div className='p-4'>
            {/* Header */}
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-2'>
                <Server className='w-4 h-4 text-muted-foreground' />
                <h3 className='text-sm font-semibold'>System Health</h3>
              </div>
              <Badge variant={getBadgeVariant()} className='gap-1.5 text-xs'>
                <OverallStatusIcon />
                {overallStatus.toUpperCase()}
              </Badge>
            </div>

            {/* Status Message */}
            <p className={cn('text-sm mb-4', overallColor)}>{overallMessage}</p>

            <Separator className='mb-4' />

            {/* Component Status */}
            <div className='space-y-3 mb-4'>
              <h4 className='text-xs font-medium text-muted-foreground'>
                Component Status
              </h4>

              <div className='space-y-2'>
                {componentDetails.map(component => (
                  <div
                    key={component.name}
                    className='flex items-center justify-between text-sm'
                  >
                    <div className='flex items-center gap-2'>
                      {getComponentIcon(component.name)}
                      <span>{component.name}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <StatusIcon status={component.status} />
                      <span
                        className={cn(
                          'text-xs font-medium',
                          getStatusColor(component.status)
                        )}
                      >
                        {getComponentStatusText(component.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className='mb-4' />

            {/* Details */}
            <div className='space-y-3 text-sm'>
              {/* Last Check */}
              {lastSuccessfulCheck && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Last check</span>
                  <span className='font-medium'>
                    {formatDistanceToNow(lastSuccessfulCheck, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}

              {/* Uptime */}
              {uptime && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Uptime</span>
                  <span className='font-medium'>{uptime}</span>
                </div>
              )}

              {/* Version */}
              {version && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Version</span>
                  <span className='font-medium'>v{version}</span>
                </div>
              )}

              {/* Timestamp */}
              {timestamp && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Last update</span>
                  <span className='font-medium text-xs'>
                    {new Date(timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            <Separator className='my-4' />

            {/* Actions */}
            <div className='flex items-center justify-between'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={manualHealthCheck}
                    disabled={isLoading || isOffline}
                    className='gap-1.5 h-8 text-xs'
                  >
                    <RefreshCw
                      className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')}
                    />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom'>
                  <p>Manually check system health</p>
                </TooltipContent>
              </Tooltip>

              {isOffline ? (
                <div className='flex items-center gap-1.5 text-xs text-gray-500'>
                  <WifiOff className='w-3.5 h-3.5' />
                  <span>Offline</span>
                </div>
              ) : (
                <div className='flex items-center gap-1.5 text-xs text-green-500'>
                  <Wifi className='w-3.5 h-3.5' />
                  <span>Online</span>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}

// Simple inline health indicator (for compact spaces)
export const CompactHealthIndicator = () => {
  const { overallStatus, overallColor, isOffline, isLoading } =
    useHealthMonitor({ interval: 60000 })

  const getDotColor = () => {
    if (isOffline) return 'bg-gray-500'
    if (isLoading) return 'bg-yellow-500 animate-pulse'

    switch (overallStatus) {
      case 'OK':
        return 'bg-green-500'
      case 'WARNING':
        return 'bg-yellow-500'
      case 'ERROR':
        return 'bg-red-500'
      case 'UNKNOWN':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    if (isOffline) return 'Offline'
    if (isLoading) return '...'

    switch (overallStatus) {
      case 'OK':
        return 'Healthy'
      case 'WARNING':
        return 'Warning'
      case 'ERROR':
        return 'Error'
      case 'UNKNOWN':
        return 'Unknown'
      default:
        return '?'
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='flex items-center gap-1.5 cursor-help'>
            <div className={cn('w-2 h-2 rounded-full', getDotColor())} />
            <span className={cn('text-xs font-medium', overallColor)}>
              {getStatusText()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side='bottom'>
          <p>System Status: {overallStatus}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
