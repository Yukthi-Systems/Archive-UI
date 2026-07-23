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
  exportDataToExcel,
  exportDataToCSV,
  type ExportOptions,
} from '@/utils/exportUtils'
import { toast } from 'sonner'
import { auditService } from '@/api/audit'
import { SendNotification } from '@/api/notification'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atoms/user'

export interface AuditInfo {
  context: string // e.g., 'User', 'Domain'
  type: string // e.g., AUDIT_LOG_TYPES.USER_EXPORT
  failType: string // e.g., AUDIT_LOG_TYPES.USER_EXPORT_FAILED
  description?: string // Optional extra details
}

export type ExportFormat = 'excel' | 'csv'

export const useExport = <T = any>() => {
  const [isExporting, setIsExporting] = useState(false)
  const currentUser = useAtomValue(userAtom)
  const actorName =
    currentUser?.display_name || currentUser?.user_name || 'Unknown User'

  const handleExport = async (
    fetchData: () => Promise<T[]>,
    options: ExportOptions<T>,
    auditInfo?: AuditInfo,
    format: ExportFormat = 'excel'
  ) => {
    setIsExporting(true)
    try {
      toast.info(`Starting ${format.toUpperCase()} export...`)
      const data = await fetchData()

      if (!data || data.length === 0) {
        toast.warning('No data to export.')
        return
      }

      if (format === 'csv') {
        await exportDataToCSV(data, options)
      } else {
        await exportDataToExcel(data, options)
      }

      toast.success(
        `Exported ${data.length} records to ${format.toUpperCase()} successfully.`
      )

      // Detailed Audit Log Success
      if (auditInfo) {
        auditService.log(
          auditInfo.type,
          `User ${actorName} exported ${auditInfo.context} as ${format.toUpperCase()}: ${options.filename}`,
          `Action: ${auditInfo.context} Export
Initiated By: ${actorName}
Format: ${format.toUpperCase()}
File Name: ${options.filename}
Record Count: ${data.length}
Status: Success
Description: Successfully exported ${data.length} records to ${options.filename}.${auditInfo.description ? '\n' + auditInfo.description : ''}`
        )
      } else {
        // Fallback for backward compatibility if auditInfo is missing
        auditService.log(
          'EXPORT',
          `Exported ${options.filename} as ${format.toUpperCase()}`,
          `Successfully exported ${data.length} records to ${options.filename} (${format.toUpperCase()})`
        )
      }

      // Notification
      SendNotification({
        message: `Export of ${options.filename} (${format.toUpperCase()}) completed successfully.`,
        type: 'success',
        entity: 'Export',
        description: `${data.length} records exported.`,
      })
    } catch (error: any) {
      console.error('Export error:', error)
      // Error toast is already displayed in exportDataToExcel if it fails there,
      // but if fetchData fails, we might need one.
      if (!error.message?.includes('Failed to export data')) {
        toast.error(`Export failed: ${error.message || 'Unknown error'}`)
      }

      // Detailed Audit Log Failure
      if (auditInfo) {
        auditService.log(
          auditInfo.failType,
          `User ${actorName} failed to export ${auditInfo.context}: ${options.filename}`,
          `Action: ${auditInfo.context} Export Failed
Initiated By: ${actorName}
Format: ${format.toUpperCase()}
File Name: ${options.filename}
Status: Failed
Error: ${error.message || 'Unknown error'}
Description: Failed to export ${options.filename}.${auditInfo.description ? '\n' + auditInfo.description : ''}`
        )
      } else {
        auditService.log(
          'EXPORT_FAILED',
          `Export Failed: ${options.filename}`,
          `Failed to export ${options.filename}. Error: ${error.message || 'Unknown error'}`
        )
      }

      // Notification Failure
      SendNotification({
        message: `Export of ${options.filename} failed.`,
        type: 'error',
        entity: 'Export',
        description: error.message || 'Unknown error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    handleExport,
  }
}
