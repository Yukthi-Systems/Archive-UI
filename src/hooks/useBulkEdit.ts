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

import { useState, useCallback, useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { toast } from 'sonner'
import {
  createImportConfig,
  type ImportConfig,
  type FieldMapping,
  type BulkCreateResult,
} from '@/utils/importUtils'
import { userAtom } from '@/atoms/user'
import { auditService } from '@/api/audit'
import { SendNotification } from '@/api/notification'

// ============ Type Definitions ============

interface BulkEditParams<T = any> {
  entityType: string
  updateFunction: (data: any) => Promise<T>
  additionalParams?: Record<string, any>
  customFieldMapping?: FieldMapping[] | null
}

interface UseBulkEditReturn<T = any> {
  isEditModalOpen: boolean
  editConfig: ImportConfig<T> | null
  handleEdit: () => void
  handleEditModalClose: () => void
  handleEditComplete: (results: BulkCreateResult) => void
  isEditAvailable: boolean
}

interface UserInfo {
  organization_id: string
  user_name?: string
  display_name?: string
  [key: string]: any
}

// ============ Main Hook ============

/**
 * Custom hook for handling bulk edit functionality
 */
export const useBulkEdit = <T = any>({
  entityType,
  updateFunction,
  additionalParams = {},
  customFieldMapping = null,
}: BulkEditParams<T>): UseBulkEditReturn<T> => {
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const userInfo = useAtomValue(userAtom) as UserInfo
  const organization_id = userInfo?.organization_id

  // Create edit configuration
  const editConfig = useMemo<ImportConfig<T> | null>(() => {
    if (!organization_id || !updateFunction) return null

    try {
      // Wrap the update function to include additional params
      const wrappedUpdateFunction = async (itemData: any): Promise<T> => {
        const data = {
          ...itemData,
          ...additionalParams,
        }
        return await updateFunction(data)
      }

      return createImportConfig<T>(
        entityType,
        wrappedUpdateFunction,
        customFieldMapping
      )
    } catch (error) {
      console.error('Error creating edit config:', error)
      toast.error('Failed to create edit configuration')
      return null
    }
  }, [
    entityType,
    updateFunction,
    organization_id,
    additionalParams,
    customFieldMapping,
  ])

  // Handle edit button click
  const handleEdit = useCallback(() => {
    if (!editConfig) {
      toast.error('Edit configuration is not available')
      return
    }
    setIsEditModalOpen(true)
  }, [editConfig])

  // Handle edit modal close
  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false)
  }, [])

  // Handle edit completion
  const handleEditComplete = useCallback(
    (results: BulkCreateResult) => {
      const { successful, failed, total } = results

      if (failed.length === 0) {
        toast.success(
          `Successfully updated ${successful.length} ${entityType}${
            successful.length !== 1 ? 's' : ''
          }`
        )
      } else if (successful.length === 0) {
        toast.error(`Failed to update all ${entityType}s`)
      } else {
        toast.warning(
          `Updated ${successful.length} ${entityType}${
            successful.length !== 1 ? 's' : ''
          }. ${failed.length} failed.`
        )
      }

      // Audit Log
      const successCount = successful.length
      const failCount = failed.length

      const getItemLabel = (item: any) => {
        if (!item) return 'Unknown'
        return (
          item.domain_name ||
          item.user_name ||
          item.user_email ||
          item.display_name ||
          item.name ||
          item.title ||
          'Unknown'
        )
      }

      const successLabels =
        successful.length > 0
          ? successful.map(s => getItemLabel(s.item)).join(', ')
          : null

      const failedDetails =
        failed.length > 0
          ? failed.map(f => `${getItemLabel(f.item)} : ${f.error}`).join('; ')
          : null

      const actorName =
        userInfo?.user_name || userInfo?.display_name || 'System'
      const logStatus =
        failCount === 0
          ? 'Success'
          : successCount > 0
            ? 'Partial Success'
            : 'Failed'

      const entityUpper = entityType.toUpperCase().replace(/\s+/g, '_')
      const logType = `BULK_EDIT_${entityUpper}`

      const successSummary =
        successful.length > 0
          ? successful.length <= 3
            ? successLabels
            : `${successful
                .slice(0, 3)
                .map(s => getItemLabel(s.item))
                .join(', ')} +${successful.length - 3} more`
          : ''
      const failedSummary =
        failed.length > 0
          ? failed.length <= 3
            ? failed.map(f => getItemLabel(f.item)).join(', ')
            : `${failed
                .slice(0, 3)
                .map(f => getItemLabel(f.item))
                .join(', ')} +${failed.length - 3} more`
          : ''
      const summaryNames = ` ${successSummary ? `Success: ${successSummary}` : ''} ${failedSummary ? `Failed: ${failedSummary}` : ''}`

      const auditDescription = `Action: Bulk Edit of ${entityType}
Initiated By: ${actorName}
Total Items: ${total}
Success: ${successCount}
Failed: ${failCount}
Status: ${logStatus}
Summary: [${successSummary ? `${successSummary}` : ''} ${failedSummary ? `${failedSummary}` : ''}]
Updated Items: ${`[${successLabels || ''}]`}
Failed Details: ${`[${failedDetails || ''}]`}
`

      auditService.log(
        logType,
        `Bulk edit of ${entityType}: ${summaryNames} (Total: ${total}, Success: ${successCount}, Failed: ${failCount})`,
        auditDescription
      )

      // Notification
      SendNotification({
        message: `Bulk update of ${entityType} completed.`,
        type: failCount === 0 ? 'success' : 'warning',
        entity: 'Bulk Edit',
        description: `Success: ${successCount}, Failed: ${failCount}`,
      })
    },
    [entityType, userInfo]
  )

  return {
    isEditModalOpen,
    editConfig,
    handleEdit,
    handleEditModalClose,
    handleEditComplete,
    isEditAvailable: !!editConfig,
  }
}

export default useBulkEdit
