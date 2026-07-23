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
import { toast } from 'sonner' // Using sonner instead of useToastify
import {
  createImportConfig,
  type ImportConfig,
  type FieldMapping,
} from '@/utils/importUtils'
import { userAtom } from '@/atoms/user'
import { auditService } from '@/api/audit'
import { SendNotification } from '@/api/notification'

// ============ Type Definitions ============

interface BulkImportParams<T = any> {
  entityType: string
  createFunction: (data: any) => Promise<T>
  additionalParams?: Record<string, any>
  customFieldMapping?: FieldMapping[] | null
}

interface BulkImportResults {
  successful: Array<{ item: any; result: any; index: number }>
  failed: Array<{ item: any; error: string; index: number }>
  total: number
}

interface UseBulkImportReturn<T = any> {
  isImportModalOpen: boolean
  importConfig: ImportConfig<T> | null
  handleImport: () => void
  handleImportModalClose: () => void
  handleImportComplete: (results: BulkImportResults) => void
  isImportAvailable: boolean
}

interface UserInfo {
  organization_id: string
  [key: string]: any
}

// ============ Main Hook ============

/**
 * Custom hook for handling bulk import functionality
 * @param entityType - Type of entity (cautions, departments, etc.)
 * @param createFunction - API function to create single item
 * @param additionalParams - Additional parameters for the create function
 * @param customFieldMapping - Custom field mapping (optional)
 * @returns Import state and handlers
 */
export const useBulkImport = <T = any>({
  entityType,
  createFunction,
  additionalParams = {},
  customFieldMapping = null,
}: BulkImportParams<T>): UseBulkImportReturn<T> => {
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)
  const userInfo = useAtomValue(userAtom) as UserInfo
  const organization_id = userInfo?.organization_id

  // Create import configuration
  const importConfig = useMemo<ImportConfig<T> | null>(() => {
    if (!organization_id || !createFunction) return null

    try {
      // Wrap the create function to include organization_id and additional params
      const wrappedCreateFunction = async (itemData: any): Promise<T> => {
        const data = {
          ...itemData,
          // organization_id: organization_id,
          ...additionalParams,
        }
        return await createFunction(data)
      }

      return createImportConfig<T>(
        entityType,
        wrappedCreateFunction,
        customFieldMapping
      )
    } catch (error) {
      console.error('Error creating import config:', error)
      toast.error('Failed to create import configuration')
      return null
    }
  }, [
    entityType,
    createFunction,
    organization_id,
    additionalParams,
    customFieldMapping,
  ])

  // Handle import button click
  const handleImport = useCallback(() => {
    if (!importConfig) {
      toast.error('Import configuration is not available')
      return
    }
    setIsImportModalOpen(true)
  }, [importConfig])

  // Handle import modal close
  const handleImportModalClose = useCallback(() => {
    setIsImportModalOpen(false)
  }, [])

  // Handle import completion
  const handleImportComplete = useCallback(
    (results: BulkImportResults) => {
      const { successful, failed, total } = results

      if (failed.length === 0) {
        toast.success(
          `Successfully imported ${successful.length} ${entityType}${
            successful.length !== 1 ? 's' : ''
          }`
        )
      } else if (successful.length === 0) {
        toast.error(`Failed to import all ${entityType}s`)
      } else {
        toast.warning(
          `Imported ${successful.length} ${entityType}${
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
          item.user_name ||
          item.user_email ||
          item.display_name ||
          item.domain_name ||
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
      const logType =
        failCount > 0
          ? `IMPORT_${entityUpper}_PARTIAL_SUCCESS`
          : `IMPORT_${entityUpper}_SUCCESS`

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

      const description = `Action: Bulk Import of ${entityType}
Initiated By: ${actorName}
Total Items: ${total}
Success: ${successCount}
Failed: ${failCount}
Status: ${logStatus}
Summary: [${successSummary ? `${successSummary}` : ''} ${failedSummary ? `${failedSummary}` : ''}]
Created Items: ${`[${successLabels || ''}]`}
Failed Details: ${`[${failedDetails || ''}]`}
`

      auditService.log(
        logType,
        `Bulk import of ${entityType}: ${summaryNames} (Total: ${total}, Success: ${successCount}, Failed: ${failCount})`,
        description
      )

      // Notification
      SendNotification({
        message: `Import of ${entityType} completed.`,
        type: failCount === 0 ? 'success' : 'warning',
        entity: 'Import',
        description: `Success: ${successCount}, Failed: ${failCount}`,
      })

      // Keep modal open so user can see results
      // They can close it manually after reviewing
    },
    [entityType]
  )

  return {
    isImportModalOpen,
    importConfig,
    handleImport,
    handleImportModalClose,
    handleImportComplete,
    isImportAvailable: !!importConfig,
  }
}

// Alternative version with the original parameter order (for backward compatibility)
export const useBulkImportLegacy = <T = any>(
  entityType: string,
  createFunction: (data: any) => Promise<T>,
  additionalParams: Record<string, any> = {},
  customFieldMapping: FieldMapping[] | null = null
): UseBulkImportReturn<T> => {
  return useBulkImport<T>({
    entityType,
    createFunction,
    additionalParams,
    customFieldMapping,
  })
}

// If you need more specific toast customization, you can create a wrapper
export const useBulkImportWithCustomToast = <T = any>({
  entityType,
  createFunction,
  additionalParams = {},
  customFieldMapping = null,
  onSuccess,
  onError,
  onPartialSuccess,
}: BulkImportParams<T> & {
  onSuccess?: (successful: number) => void
  onError?: (message: string) => void
  onPartialSuccess?: (successful: number, failed: number) => void
}): UseBulkImportReturn<T> => {
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)
  const userInfo = useAtomValue(userAtom) as UserInfo
  const organization_id = userInfo?.organization_id

  const importConfig = useMemo<ImportConfig<T> | null>(() => {
    if (!organization_id || !createFunction) return null

    try {
      const wrappedCreateFunction = async (itemData: any): Promise<T> => {
        const data = {
          ...itemData,
          ...additionalParams,
        }
        return await createFunction(data)
      }

      return createImportConfig<T>(
        entityType,
        wrappedCreateFunction,
        customFieldMapping
      )
    } catch (error) {
      console.error('Error creating import config:', error)
      onError?.(
        `Failed to create import configuration: ${(error as Error).message}`
      )
      return null
    }
  }, [
    entityType,
    createFunction,
    organization_id,
    additionalParams,
    customFieldMapping,
    onError,
  ])

  const handleImport = useCallback(() => {
    if (!importConfig) {
      const errorMsg = 'Import configuration is not available'
      onError?.(errorMsg)
      toast.error(errorMsg)
      return
    }
    setIsImportModalOpen(true)
  }, [importConfig, onError])

  const handleImportModalClose = useCallback(() => {
    setIsImportModalOpen(false)
  }, [])

  const handleImportComplete = useCallback(
    (results: BulkImportResults) => {
      const { successful, failed } = results
      const total = successful.length + failed.length

      if (failed.length === 0) {
        const message = `Successfully imported ${successful.length} ${entityType}${
          successful.length !== 1 ? 's' : ''
        }`
        toast.success(message)
        onSuccess?.(successful.length)
      } else if (successful.length === 0) {
        const message = `Failed to import all ${entityType}s`
        toast.error(message)
        onError?.(message)
      } else {
        const message = `Imported ${successful.length} ${entityType}${
          successful.length !== 1 ? 's' : ''
        }. ${failed.length} failed.`
        toast.warning(message)
        onPartialSuccess?.(successful.length, failed.length)
      }

      // Audit Log
      const successCount = successful.length
      const failCount = failed.length

      const getItemLabel = (item: any) => {
        if (!item) return 'Unknown'
        return (
          item.user_name ||
          item.user_email ||
          item.display_name ||
          item.domain_name ||
          item.name ||
          item.title ||
          'Unknown'
        )
      }

      const successLabels =
        successful.length > 0
          ? successful.map(s => getItemLabel(s.item)).join(', ')
          : null

      const apiResponses =
        successful.length > 0
          ? successful
              .map(s => `${getItemLabel(s.item)}: ${JSON.stringify(s.result)}`)
              .join('\n')
          : null

      const failedDetails =
        failed.length > 0
          ? failed
              .map(
                f => `${getItemLabel(f.item)} (Index ${f.index}): ${f.error}`
              )
              .join('; ')
          : null

      const actorName =
        userInfo?.display_name || userInfo?.user_name || 'System'
      const logStatus =
        failCount === 0
          ? 'Success'
          : successCount > 0
            ? 'Partial Success'
            : 'Failed'

      const description = `Action: Bulk Import of ${entityType}
Initiated By: ${actorName}
Total Items: ${total}
Success: ${successCount}
Failed: ${failCount}
Status: ${logStatus}

Summary: A bulk import of ${total} ${entityType}${total !== 1 ? 's' : ''} was processed.
Created Items: [${successLabels || 'None'}]
Failed Details: [${failedDetails || 'None'}]

Full API Responses:
${apiResponses || 'None'}`

      const entityUpper = entityType.toUpperCase().replace(/\s+/g, '_')
      const logType =
        failCount > 0
          ? `IMPORT_${entityUpper}_PARTIAL_SUCCESS`
          : `IMPORT_${entityUpper}_SUCCESS`

      const successSummary =
        successful.length > 0
          ? successful.length <= 3
            ? successLabels
            : `${successful
                .slice(0, 3)
                .map(s => getItemLabel(s.item))
                .join(', ')} +${successful.length - 3} more`
          : 'None'
      const failedSummary =
        failed.length > 0
          ? failed.length <= 3
            ? failed.map(f => getItemLabel(f.item)).join(', ')
            : `${failed
                .slice(0, 3)
                .map(f => getItemLabel(f.item))
                .join(', ')} +${failed.length - 3} more`
          : 'None'
      const summaryNames = `Success: [${successSummary}], Failed: [${failedSummary}]`

      auditService.log(
        logType,
        `Bulk import of ${entityType}: [${summaryNames}] (Total: ${total}, Success: ${successCount}, Failed: ${failCount})`,
        description
      )

      // Notification
      SendNotification({
        message: `Import of ${entityType} completed.`,
        type: failCount === 0 ? 'success' : 'warning',
        entity: 'Import',
        description: `Success: ${successCount}, Failed: ${failCount}`,
      })
    },
    [entityType, onSuccess, onError, onPartialSuccess]
  )

  return {
    isImportModalOpen,
    importConfig,
    handleImport,
    handleImportModalClose,
    handleImportComplete,
    isImportAvailable: !!importConfig,
  }
}

export default useBulkImport
