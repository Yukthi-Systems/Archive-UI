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

import { DomainCharts } from '@/components/dashboard/DomainCharts'
import { OrganizationDashboard } from './OrganizationDashboard'
import { StatsCharts } from '@/components/dashboard/StatsCharts'
import { useAccessPermission } from '@/utils/accessPermission'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useExport } from '@/hooks/useExport'
import { dashboardService } from '@/api/dashboard'
import { domainService } from '@/api/domain'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// --- 3. Main Component ---

const Dashboard = () => {
  const hasPermission = useAccessPermission('dashboard:view') || false
  const { isExporting, handleExport } = useExport()

  const onExport = (format: 'csv' | 'excel') => {
    handleExport(
      async () => {
        const [sizes, domainsResp] = await Promise.all([
          dashboardService.getSizes(),
          domainService.getDomains({}),
        ])

        const domains = domainsResp.data || []

        return domains.map(domainInfo => {
          const sizeInfo = sizes.find(s => s.domain === domainInfo.domain_name)
          return {
            domain: domainInfo.domain_name,
            total_emails: sizeInfo ? sizeInfo.total_emails : 0,
            quota_allocated: domainInfo.quota_allocated || 0,
            quota_utilized: domainInfo.quota_utilized || 0,
          }
        })
      },
      {
        filename: 'dashboard-export',
        fieldMappings: [
          { header: 'Domain', key: 'domain' },
          { header: 'No. of emails', key: 'total_emails' },
          { header: 'Max Quota (GB)', key: 'quota_allocated' },
          { header: 'Quota utilized (GB)', key: 'quota_utilized' },
        ],
      },
      {
        context: 'Dashboard',
        type: 'DASHBOARD_EXPORT',
        failType: 'DASHBOARD_EXPORT_FAILED',
        description: `Export of dashboard info to ${format.toUpperCase()}`,
      },
      format
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-end'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' disabled={isExporting} className='gap-2'>
              <Download className='w-4 h-4' /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={() => onExport('excel')}
              className='cursor-pointer'
            >
              Export to Excel
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onExport('csv')}
              className='cursor-pointer'
            >
              Export to CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <OrganizationDashboard />
      {hasPermission && <DomainCharts />}
      {hasPermission && <StatsCharts />}
    </div>
  )
}

export default Dashboard
