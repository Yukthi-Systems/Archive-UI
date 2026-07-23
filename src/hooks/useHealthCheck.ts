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

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { healthService } from '@/api/health'
import type {
  ApiHealthResponse,
  HealthCheckConfig,
  HealthStatus,
} from '@/types/health.types'

const HEALTH_QUERY_KEY = 'health'

export const useHealthCheck = (config: HealthCheckConfig = {}) => {
  const { interval = 60000, retryCount = 3, timeout = 5120000 } = config
  const [lastSuccessfulCheck, setLastSuccessfulCheck] = useState<Date | null>(
    null
  )
  const [isOffline, setIsOffline] = useState(false)
  const [manualCheckCount, setManualCheckCount] = useState(0)

  const {
    data: healthData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ApiHealthResponse, Error>({
    queryKey: [HEALTH_QUERY_KEY],
    queryFn: () => healthService.checkApiHealth(timeout),
    retry: retryCount,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: interval,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 1000 * 60 * 3, // Cache for 3 minutes
    gcTime: 1000 * 60 * 3, // Keep in memory for 3 minutes
  })

  // Handle side effects for successful health check
  useEffect(() => {
    if (healthData) {
      setLastSuccessfulCheck(new Date())

      // Check if all components are healthy
      const allHealthy =
        healthData.api === 'OK' &&
        healthData.cache === 'OK' &&
        healthData.database === 'OK' &&
        healthData.search_db === 'OK'

      if (!allHealthy) {
        const unhealthyComponents = []
        if (healthData.api !== 'OK') unhealthyComponents.push('API')
        if (healthData.cache !== 'OK') unhealthyComponents.push('Cache')
        if (healthData.database !== 'OK') unhealthyComponents.push('Database')
        if (healthData.search_db !== 'OK') unhealthyComponents.push('Search DB')

        toast.warning('Service Degradation', {
          description: `Issues detected: ${unhealthyComponents.join(', ')}`,
          duration: 5000,
        })
      }

      // Only show success toast if we were previously offline
      if (isOffline && allHealthy) {
        toast.success('All services restored', {
          description: 'All systems are now operational',
          duration: 3000,
        })
      }

      setIsOffline(false)
    }
  }, [healthData, isOffline])

  // Handle side effects for error health check
  useEffect(() => {
    if (isError) {
      setIsOffline(true)
      // Show error toast only on the first failure
      if (manualCheckCount === 0) {
        toast.error('Connection issue detected', {
          description: 'Unable to reach the API server',
          duration: 5000,
        })
      }
    }
  }, [isError, manualCheckCount])

  const manualHealthCheck = async () => {
    setManualCheckCount(prev => prev + 1)
    return refetch()
  }

  const resetHealthCheck = () => {
    setManualCheckCount(0)
    setIsOffline(false)
  }

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      refetch()
      toast.info('Back online', {
        description: 'Network connection restored',
        duration: 3000,
      })
    }

    const handleOffline = () => {
      setIsOffline(true)
      toast.warning('Connection lost', {
        description: 'No network connection',
        duration: 5000,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refetch])

  return {
    healthData,
    isLoading,
    isError,
    error,
    isOffline: isOffline || navigator.onLine === false,
    lastSuccessfulCheck,
    manualHealthCheck,
    resetHealthCheck,
    refetch,
  }
}

// Hook for real-time health monitoring with status indicator
export const useHealthMonitor = (config: HealthCheckConfig = {}) => {
  const queryClient = useQueryClient()
  const {
    healthData,
    isLoading,
    isError,
    isOffline,
    lastSuccessfulCheck,
    manualHealthCheck,
    resetHealthCheck,
  } = useHealthCheck(config)

  // Get status for a specific component
  const getComponentStatus = (
    component: keyof ApiHealthResponse
  ): HealthStatus => {
    if (!healthData) return 'UNKNOWN'
    const value = healthData[component]
    if (typeof value !== 'string') return 'UNKNOWN'

    if (value === 'OK') return 'OK'
    if (value.includes('ERROR') || value.includes('FAIL')) return 'ERROR'
    if (value.includes('WARN') || value.includes('DEGRADED')) return 'WARNING'
    return 'UNKNOWN'
  }

  // Get overall health status
  const getOverallStatus = (): HealthStatus => {
    if (isOffline) return 'ERROR'
    if (isLoading) return 'UNKNOWN'
    if (isError) return 'ERROR'
    if (!healthData) return 'UNKNOWN'

    const apiStatus = getComponentStatus('api')
    const cacheStatus = getComponentStatus('cache')
    const dbStatus = getComponentStatus('database')
    const searchDbStatus = getComponentStatus('search_db')

    if (
      apiStatus === 'ERROR' ||
      cacheStatus === 'ERROR' ||
      dbStatus === 'ERROR' ||
      searchDbStatus === 'ERROR'
    ) {
      return 'ERROR'
    }
    if (
      apiStatus === 'WARNING' ||
      cacheStatus === 'WARNING' ||
      dbStatus === 'WARNING' ||
      searchDbStatus === 'WARNING'
    ) {
      return 'WARNING'
    }
    if (
      apiStatus === 'OK' &&
      cacheStatus === 'OK' &&
      dbStatus === 'OK' &&
      searchDbStatus === 'OK'
    ) {
      return 'OK'
    }

    return 'UNKNOWN'
  }

  // Get health status color
  const getStatusColor = (status: HealthStatus): string => {
    switch (status) {
      case 'OK':
        return 'text-green-500'
      case 'WARNING':
        return 'text-yellow-500'
      case 'ERROR':
        return 'text-red-500'
      case 'UNKNOWN':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  // Get health status icon
  const getStatusIcon = (status: HealthStatus): string => {
    switch (status) {
      case 'OK':
        return '🟢'
      case 'WARNING':
        return '🟡'
      case 'ERROR':
        return '🔴'
      case 'UNKNOWN':
        return '⚪'
      default:
        return '⚪'
    }
  }

  // Get health status message
  const getStatusMessage = (): string => {
    const overallStatus = getOverallStatus()

    if (isOffline) return 'No network connection'
    if (isLoading) return 'Checking health status...'
    if (isError) return 'Failed to check health status'

    switch (overallStatus) {
      case 'OK':
        return 'All systems operational'
      case 'WARNING':
        return 'Service degradation detected'
      case 'ERROR':
        return 'Service disruption detected'
      case 'UNKNOWN':
        return 'Status unknown'
      default:
        return 'Unknown status'
    }
  }

  // Get detailed component status
  const getComponentDetails = () => {
    if (!healthData) return []

    return [
      { name: 'API', status: getComponentStatus('api'), value: healthData.api },
      {
        name: 'Cache',
        status: getComponentStatus('cache'),
        value: healthData?.cache,
      },
      {
        name: 'Database',
        status: getComponentStatus('database'),
        value: healthData?.database,
      },
      {
        name: 'Search DB',
        status: getComponentStatus('search_db'),
        value: healthData?.search_db,
      },
    ]
  }

  // Get uptime if available
  const getUptime = () => {
    if (!healthData?.uptime) return null

    const seconds = Math.floor(healthData.uptime % 60)
    const minutes = Math.floor((healthData.uptime / 60) % 60)
    const hours = Math.floor((healthData.uptime / (60 * 60)) % 24)
    const days = Math.floor(healthData.uptime / (60 * 60 * 24))

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)

    return parts.join(' ')
  }

  // Force refresh all health data
  const refreshAllHealth = async () => {
    await queryClient.invalidateQueries({ queryKey: [HEALTH_QUERY_KEY] })
    return manualHealthCheck()
  }

  return {
    overallStatus: getOverallStatus(),
    overallColor: getStatusColor(getOverallStatus()),
    overallIcon: getStatusIcon(getOverallStatus()),
    overallMessage: getStatusMessage(),
    componentDetails: getComponentDetails(),
    getComponentStatus,
    getStatusColor,
    getStatusIcon,
    uptime: getUptime(),
    data: healthData,
    isLoading,
    isOffline,
    lastSuccessfulCheck,
    manualHealthCheck,
    resetHealthCheck,
    refreshAllHealth,
    version: healthData?.version,
    timestamp: healthData?.timestamp,
  }
}

export const useMaintenanceCheck = (refetchInterval = 120000) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['maintenance'],
    queryFn: healthService.checkMaintenanceStatus,
    refetchInterval,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep maintenance status longer
    refetchOnWindowFocus: false,
  })

  return {
    data,
    refetch,
    isLoading,
    isError,
  }
}
