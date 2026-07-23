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

import { useAtomValue } from 'jotai'
import {
  Building2,
  HardDrive,
  Server,
  Database,
  Zap,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Mail,
  Phone,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { organizationAtom } from '@/atoms/organization'
import { useOrganization } from '@/hooks/useOrganization'
import { useHealthMonitor } from '@/hooks/useHealthCheck'

import { useEffect } from 'react'

export const OrganizationDashboard = () => {
  const organization = useAtomValue(organizationAtom)
  const { refetch } = useOrganization()

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const { componentDetails } = useHealthMonitor({ interval: 180000 })

  if (!organization) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <Building2 className='h-12 w-12 mx-auto text-muted-foreground' />
          <p className='mt-2 text-sm text-muted-foreground'>
            Loading organization data...
          </p>
        </div>
      </div>
    )
  }

  const quotaPercentage =
    (organization.quota_utilized / organization.quota_allocated) * 100

  return (
    <div className='space-y-6'>
      {/* Organization Header */}
      <Card className='p-4 border border-border/40'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center'>
              <Building2 className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h2 className='font-semibold'>
                {organization.organization_name}
              </h2>
              <p className='text-xs text-muted-foreground'>
                Member since{' '}
                {format(new Date(organization.created_at), 'MMM yyyy')}
              </p>
            </div>
          </div>
          <div className='flex-1 px-4 lg:px-12'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-xs'>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <HardDrive className='w-4 h-4' />
                  <span className='font-medium'>{`Storage ( Available Space : ${Number(organization.quota_allocated || 0) - Number(organization.quota_utilized || 0)} GB )`}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='font-semibold'>
                    {organization.quota_utilized} GB
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    / {organization.quota_allocated} GB
                  </span>
                </div>
              </div>
              <Progress
                value={quotaPercentage}
                className={cn(
                  'h-2',
                  quotaPercentage > 90
                    ? '[&>div]:bg-red-500'
                    : quotaPercentage > 70
                      ? '[&>div]:bg-yellow-500'
                      : '[&>div]:bg-green-500'
                )}
              />
            </div>
          </div>
          <div className='flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-1.5 text-muted-foreground'>
              <Mail className='w-3.5 h-3.5' />
              <span className='text-xs'>{organization.admin_email}</span>
            </div>
            <div className='flex items-center gap-1.5 text-muted-foreground'>
              <Phone className='w-3.5 h-3.5' />
              <span className='text-xs'>{organization.admin_phone}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className='grid grid-cols-1 gap-6 mb-5'>
        {/* System Health */}
        <Card className='px-6 py-6 border border-border/40'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            {componentDetails.map(comp => {
              const getIcon = (name: string) => {
                switch (name) {
                  case 'API':
                    return <Server className='w-3.5 h-3.5' />
                  case 'Database':
                    return <Database className='w-3.5 h-3.5' />
                  case 'Cache':
                    return <Zap className='w-3.5 h-3.5' />
                  case 'Search DB':
                    return <Search className='w-3.5 h-3.5' />
                  default:
                    return <Activity className='w-3.5 h-3.5' />
                }
              }

              const getStatusIcon = (status: string) => {
                switch (status) {
                  case 'OK':
                    return (
                      <CheckCircle2 className='w-3.5 h-3.5 text-green-500' />
                    )
                  case 'WARNING':
                    return (
                      <AlertTriangle className='w-3.5 h-3.5 text-yellow-500' />
                    )
                  case 'ERROR':
                    return <XCircle className='w-3.5 h-3.5 text-red-500' />
                  default:
                    return <Activity className='w-3.5 h-3.5 text-gray-400' />
                }
              }

              return (
                <div key={comp.name} className='flex items-center gap-3'>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    {getIcon(comp.name)}
                    <span className='text-xs font-medium'>{comp.name}</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    {getStatusIcon(comp.status)}
                    <span
                      className={cn(
                        'text-[10px] font-bold',
                        comp.status === 'OK'
                          ? 'text-green-600'
                          : comp.status === 'WARNING'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      )}
                    >
                      {comp.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
