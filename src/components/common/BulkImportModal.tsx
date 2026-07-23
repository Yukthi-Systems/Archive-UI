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

import { useState, useRef, useCallback } from 'react'
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Clock,
  FileX,
  FileText,
  Eye,
} from 'lucide-react'
import {
  processImportFile,
  bulkCreateItems,
  generateSampleFile,
  type ImportConfig,
  type BulkCreateResult,
  type ProgressInfo,
} from '@/utils/importUtils'

// ============ Type Definitions ============

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  importConfig: ImportConfig | null
  title?: string
  description?: string
  onComplete?: (results: BulkCreateResult) => void
}

interface ProgressData extends Partial<Omit<ProgressInfo, 'status'>> {
  [key: string]: any
}

type ImportStatus =
  | 'idle'
  | 'processing'
  | 'ready'
  | 'creating'
  | 'success'
  | 'error'
  | 'cancelled'

interface ProcessedDataItem {
  [key: string]: any
}

interface FailedItem {
  item: any
  error: string
  index: number
}

// ============ Main Component ============

const BulkImportModal = ({
  isOpen,
  onClose,
  importConfig,
  title = 'Bulk Import',
  description = 'Upload a CSV or Excel file to create multiple items at once.',
  onComplete,
}: BulkImportModalProps) => {
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [progress, setProgress] = useState<ProgressData>({})
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedData, setProcessedData] = useState<ProcessedDataItem[]>([])
  const [results, setResults] = useState<BulkCreateResult | null>(null)
  const [showPreview, setShowPreview] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const processAbortController = useRef<AbortController | null>(null)
  const createAbortController = useRef<AbortController | null>(null)

  const handleClose = useCallback(() => {
    if (importStatus !== 'processing' && importStatus !== 'creating') {
      // Reset state when closing
      setImportStatus('idle')
      setProgress({})
      setError(null)
      setSelectedFile(null)
      setProcessedData([])
      setResults(null)
      setShowPreview(false)
      onClose()
    }
  }, [importStatus, onClose])

  const handleCancel = useCallback(() => {
    // Cancel ongoing operations
    if (processAbortController.current) {
      processAbortController.current.abort()
      processAbortController.current = null
    }
    if (createAbortController.current) {
      createAbortController.current.abort()
      createAbortController.current = null
    }

    // Reset state
    setImportStatus('cancelled')
    setProgress({})
    setError('Operation cancelled by user')

    // Auto-reset to idle after a short delay
    setTimeout(() => {
      setImportStatus('idle')
      setError(null)
    }, 2000)
  }, [])

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        setSelectedFile(file)
        setError(null)
        setImportStatus('idle')
        setShowPreview(false)
      }
    },
    []
  )

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setImportStatus('idle')
      setShowPreview(false)
    }
  }, [])

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
    },
    []
  )

  const handleProcessFile = async () => {
    if (!selectedFile || !importConfig) return

    setImportStatus('processing')
    setError(null)

    // Create abort controller for this operation
    processAbortController.current = new AbortController()

    try {
      const data = await processImportFile(
        selectedFile,
        importConfig.fieldMapping,
        (progressData: ProgressInfo) => {
          // Check if operation was cancelled
          if (processAbortController.current?.signal.aborted) {
            throw new Error('Operation cancelled')
          }
          setProgress(progressData)
        },
        (error: Error) => setError(error.message),
        processAbortController.current.signal // Pass signal to processing function
      )

      // Check if cancelled before setting results
      if (processAbortController.current?.signal.aborted) {
        return
      }

      setProcessedData(data)
      setImportStatus('ready')
      setProgress({
        status: 'ready',
        message: `Successfully processed ${data.length} items. Ready to import.`,
        totalItems: data.length,
      })
    } catch (err) {
      if (
        (err as Error).name === 'AbortError' ||
        (err as Error).message === 'Operation cancelled'
      ) {
        // Don't set error state if it was intentionally cancelled
        return
      }
      setImportStatus('error')
      setError((err as Error).message)
    } finally {
      processAbortController.current = null
    }
  }

  const handleBulkCreate = async () => {
    if (!processedData.length || !importConfig) return

    setImportStatus('creating')
    setError(null)

    // Create abort controller for this operation
    createAbortController.current = new AbortController()

    try {
      const results = await bulkCreateItems(
        processedData,
        importConfig.createFunction,
        (progressData: ProgressInfo) => {
          // Check if operation was cancelled
          if (createAbortController.current?.signal.aborted) {
            throw new Error('Operation cancelled')
          }
          setProgress(progressData)
        },
        (itemResult: {
          success: boolean
          item: any
          result?: any
          error?: string
          index: number
        }) => {
          // Item completion callback - can be used for real-time updates
          console.warn('Item processed:', itemResult)
        },
        createAbortController.current.signal // Pass signal to bulk create function
      )

      // Check if cancelled before setting results
      if (createAbortController.current?.signal.aborted) {
        return
      }

      setResults(results)
      setImportStatus('success')
      setProgress({
        status: 'complete',
        message: `Import complete! ${results.successful.length} items created successfully.`,
        successful: results.successful.length,
        failed: results.failed.length,
        total: results.total,
      })

      // Notify parent component
      onComplete?.(results)
    } catch (err) {
      if (
        (err as Error).name === 'AbortError' ||
        (err as Error).message === 'Operation cancelled'
      ) {
        // Don't set error state if it was intentionally cancelled
        return
      }
      setImportStatus('error')
      setError((err as Error).message)
    } finally {
      createAbortController.current = null
    }
  }

  const handleDownloadSample = useCallback(
    (format: 'excel' | 'csv' = 'excel') => {
      if (!importConfig) return
      generateSampleFile(
        importConfig.fieldMapping,
        format,
        importConfig.sampleFilename || 'sample_import'
      )
    },
    [importConfig]
  )

  const getStatusIcon = () => {
    switch (importStatus) {
      case 'processing':
      case 'creating':
        return <Clock className='w-5 h-5 text-warning animate-spin' />
      case 'success':
        return <CheckCircle className='w-5 h-5 text-success' />
      case 'error':
      case 'cancelled':
        return <AlertCircle className='w-5 h-5 text-destructive' />
      case 'ready':
        return <FileText className='w-5 h-5 text-primary' />
      default:
        return <Upload className='w-5 h-5 text-primary' />
    }
  }

  const getStatusMessage = () => {
    if (progress.message) return progress.message

    switch (importStatus) {
      case 'processing':
        return 'Processing file...'
      case 'creating':
        return 'Creating items...'
      case 'success':
        return 'Import completed successfully!'
      case 'cancelled':
        return 'Operation cancelled'
      case 'error':
        return error || 'Import failed'
      case 'ready':
        return 'File processed and ready to import'
      default:
        return description
    }
  }

  const isProcessing =
    importStatus === 'processing' || importStatus === 'creating'
  const canClose = !isProcessing

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
        {/* Backdrop */}
        <div
          className='fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity'
          onClick={canClose ? handleClose : undefined}
        />

        {/* Modal */}
        <div className='relative transform overflow-y-auto max-h-[85vh] rounded-lg bg-card text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-border'>
          <div className='bg-card px-4 pb-4 pt-5 sm:p-6 sm:pb-4'>
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-3'>
                {getStatusIcon()}
                <h3 className='text-lg font-semibold text-card-foreground'>
                  {title}
                </h3>
              </div>
              {canClose && (
                <button
                  onClick={handleClose}
                  className='rounded-md p-2 text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors'
                >
                  <X className='w-4 h-4' />
                </button>
              )}
            </div>

            {/* Content */}
            <div className='space-y-6'>
              {/* Status Message */}
              <div className='text-center'>
                <p className='text-sm text-left text-muted-foreground'>
                  {getStatusMessage()}
                </p>
              </div>

              {/* Step 1: Download Sample */}
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <div className='w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold'>
                    1
                  </div>
                  <h4 className='font-medium text-card-foreground'>
                    Download Sample File
                  </h4>
                </div>
                <div className='ml-8'>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Download the sample file to see the required format and
                    columns.
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    <button
                      onClick={() => handleDownloadSample('excel')}
                      disabled={isProcessing}
                      className='flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted text-muted-foreground rounded-md hover:bg-muted/80 hover:text-card-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <FileSpreadsheet className='w-4 h-4' />
                      Download Sample Excel File
                    </button>
                    <button
                      onClick={() => handleDownloadSample('csv')}
                      disabled={isProcessing}
                      className='flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted text-muted-foreground rounded-md hover:bg-muted/80 hover:text-card-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <FileText className='w-4 h-4' />
                      Download Sample CSV File
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Upload File */}
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                      selectedFile
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    2
                  </div>
                  <h4 className='font-medium text-card-foreground'>
                    Upload Your File
                  </h4>
                </div>
                <div className='ml-8'>
                  {!selectedFile ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className={`border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                      onClick={() =>
                        !isProcessing && fileInputRef.current?.click()
                      }
                    >
                      <FileSpreadsheet className='w-8 h-8 text-muted-foreground mx-auto mb-2' />
                      <p className='text-sm text-muted-foreground mb-2'>
                        Click to upload or drag and drop your file here
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Supports CSV and Excel files (.csv, .xlsx, .xls)
                      </p>
                    </div>
                  ) : (
                    <div className='flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg'>
                      <FileText className='w-5 h-5 text-success' />
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-success'>
                          {selectedFile.name}
                        </p>
                        <p className='text-xs text-success/80'>
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      {!isProcessing && (
                        <button
                          onClick={() => setSelectedFile(null)}
                          className='p-1 text-success/60 hover:text-success transition-colors'
                        >
                          <X className='w-4 h-4' />
                        </button>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='.csv,.xlsx,.xls'
                    onChange={handleFileSelect}
                    className='hidden'
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Step 3: Process & Import */}
              {selectedFile && (
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <div
                      className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                        importStatus === 'success'
                          ? 'bg-success text-success-foreground'
                          : importStatus === 'ready'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      3
                    </div>
                    <h4 className='font-medium text-card-foreground'>
                      Process & Import
                    </h4>
                  </div>
                  <div className='ml-8'>
                    {importStatus === 'idle' && (
                      <button
                        onClick={handleProcessFile}
                        className='flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
                      >
                        <FileText className='w-4 h-4' />
                        Process File
                      </button>
                    )}

                    {importStatus === 'ready' && (
                      <div className='space-y-3'>
                        <div className='p-3 bg-primary/10 border border-primary/20 rounded-lg'>
                          <p className='text-sm text-primary font-medium'>
                            Ready to import {processedData.length} items
                          </p>
                        </div>
                        <button
                          onClick={handleBulkCreate}
                          className='flex items-center gap-2 px-4 py-2 text-sm font-medium bg-success text-success-foreground rounded-md hover:bg-success/90 transition-colors'
                        >
                          <Upload className='w-4 h-4' />
                          Start Import
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isProcessing && (
                <div className='space-y-2'>
                  <div className='w-full bg-muted rounded-full h-2'>
                    <div
                      className='bg-primary h-2 rounded-full transition-all duration-300 ease-out'
                      style={{
                        width: progress.percentage
                          ? `${progress.percentage}%`
                          : '20%',
                      }}
                    />
                  </div>
                  {progress.current && progress.total && (
                    <p className='text-xs text-muted-foreground text-center'>
                      {progress.current} of {progress.total} items processed
                    </p>
                  )}
                </div>
              )}

              {/* Results */}
              {importStatus === 'success' && results && (
                <div className='bg-success/10 border border-success/20 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <CheckCircle className='w-5 h-5 text-success' />
                    <h4 className='font-medium text-success'>
                      Import Complete!
                    </h4>
                  </div>
                  <div className='grid grid-cols-3 gap-4 text-sm'>
                    <div className='text-center'>
                      <div className='font-bold text-success'>
                        {results.successful.length}
                      </div>
                      <div className='text-success/80'>Successful</div>
                    </div>
                    <div className='text-center'>
                      <div className='font-bold text-destructive'>
                        {results.failed.length}
                      </div>
                      <div className='text-destructive/80'>Failed</div>
                    </div>
                    <div className='text-center'>
                      <div className='font-bold text-card-foreground'>
                        {results.total}
                      </div>
                      <div className='text-muted-foreground'>Total</div>
                    </div>
                  </div>
                  {results.failed.length > 0 && (
                    <div className='mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded'>
                      <p className='text-xs text-destructive font-medium mb-1'>
                        Failed Items:
                      </p>
                      <div className='max-h-40 overflow-y-auto text-xs text-destructive/80 space-y-1 pr-2'>
                        {results.failed.map(
                          (failed: FailedItem, index: number) => (
                            <div
                              key={index}
                              className='flex gap-2 p-1.5 bg-destructive/5 rounded border-l-2 border-destructive/30'
                            >
                              <span className='font-medium text-destructive min-w-fit'>
                                #{failed.index + 1}:
                              </span>
                              <span className='flex-1 break-words'>
                                {failed.error}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {(importStatus === 'error' || importStatus === 'cancelled') &&
                error && (
                  <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center'>
                    <FileX className='w-8 h-8 text-destructive mx-auto mb-2' />
                    <p className='text-sm font-medium text-destructive mb-1'>
                      {importStatus === 'cancelled'
                        ? 'Import Cancelled'
                        : 'Import Failed'}
                    </p>
                    <p className='text-xs text-destructive/80 whitespace-pre-line'>
                      {error}
                    </p>
                  </div>
                )}

              {/* Field Mapping Info */}
              {importConfig && importStatus === 'idle' && !selectedFile && (
                <div className='bg-muted/30 overflow-y-auto max-h-[20vh] rounded-lg p-4'>
                  <h4 className='text-sm font-medium text-card-foreground mb-2'>
                    Required Columns:
                  </h4>
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    {importConfig.fieldMapping.map((field, index) => (
                      <div key={index} className='flex items-center gap-2'>
                        <span
                          className={`w-2 h-2 rounded-full ${field.required ? 'bg-destructive' : 'bg-muted-foreground'}`}
                        />
                        <span className='text-muted-foreground'>
                          {field.csvHeader || field.header}
                          {field.required && (
                            <span className='text-destructive ml-1'>*</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>
                    <span className='text-destructive'>*</span> Required fields
                  </p>
                </div>
              )}

              {/* Preview Table */}
              {showPreview && processedData.length > 0 && importConfig && (
                <div className='mt-4 border border-border rounded-lg overflow-hidden'>
                  <div className='bg-muted px-4 py-2 border-b border-border flex justify-between items-center'>
                    <h4 className='text-sm font-medium text-card-foreground'>
                      Data Preview
                    </h4>
                    <span className='text-xs text-muted-foreground'>
                      {processedData.length} items
                    </span>
                  </div>
                  <div className='max-h-60 overflow-auto'>
                    <table className='min-w-full divide-y divide-border'>
                      <thead className='bg-muted/50'>
                        <tr>
                          {importConfig.fieldMapping.map((field, idx) => (
                            <th
                              key={idx}
                              className='px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap'
                            >
                              {field.header || field.csvHeader}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className='bg-card divide-y divide-border'>
                        {processedData.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className='hover:bg-muted/30 transition-colors'
                          >
                            {importConfig.fieldMapping.map((field, cellIdx) => {
                              const getValue = (obj: any, path: string) => {
                                if (!path) return ''
                                return path
                                  .split('.')
                                  .reduce((acc, part) => acc && acc[part], obj)
                              }
                              const rawValue = getValue(row, field.key)
                              let displayValue = ''

                              if (field.type === 'boolean') {
                                displayValue = rawValue ? 'Yes' : 'No'
                              } else if (Array.isArray(rawValue)) {
                                displayValue = rawValue.join(', ')
                              } else if (
                                typeof rawValue === 'object' &&
                                rawValue !== null
                              ) {
                                displayValue = JSON.stringify(rawValue)
                              } else {
                                displayValue = String(rawValue ?? '')
                              }

                              return (
                                <td
                                  key={cellIdx}
                                  className='px-3 py-2 whitespace-nowrap text-xs text-card-foreground'
                                >
                                  {displayValue}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className='bg-muted/20 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-border'>
            {importStatus === 'success' ? (
              <button
                type='button'
                onClick={handleClose}
                className='inline-flex w-full justify-center items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-success text-success-foreground hover:bg-success/90 transition-colors sm:w-auto'
              >
                <CheckCircle className='w-4 h-4' />
                Done
              </button>
            ) : importStatus === 'error' ? (
              <div className='flex gap-2 sm:flex-row-reverse'>
                <button
                  type='button'
                  onClick={() => {
                    setImportStatus('idle')
                    setError(null)
                    setSelectedFile(null)
                  }}
                  className='inline-flex w-full justify-center items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors sm:w-auto'
                >
                  Try Again
                </button>
                <button
                  type='button'
                  onClick={handleClose}
                  className='mt-3 inline-flex w-full justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-muted hover:text-card-foreground transition-colors sm:mt-0 sm:w-auto'
                >
                  Cancel
                </button>
              </div>
            ) : isProcessing ? (
              <button
                type='button'
                onClick={handleCancel}
                className='inline-flex w-full justify-center items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors sm:w-auto'
              >
                <X className='w-4 h-4' />
                Cancel Import
              </button>
            ) : (
              <>
                <button
                  type='button'
                  onClick={handleClose}
                  className='mt-3 inline-flex w-full justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-muted hover:text-card-foreground transition-colors sm:mt-0 sm:w-auto'
                >
                  Cancel
                </button>
                {importStatus === 'ready' && (
                  <button
                    type='button'
                    onClick={() => setShowPreview(!showPreview)}
                    className='mt-3 inline-flex w-full justify-center items-center gap-2 rounded-md bg-background px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-muted hover:text-card-foreground transition-colors sm:mt-0 sm:w-auto sm:mr-3'
                  >
                    <Eye className='w-4 h-4' />
                    {showPreview ? 'Hide Preview' : 'Preview Data'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Alternative version with more strict typing for specific entity types
export interface BulkImportModalGenericProps<T = any> extends Omit<
  BulkImportModalProps,
  'importConfig'
> {
  importConfig: ImportConfig<T> | null
}

// Higher-order component for domain-specific imports
export const DomainImportModal = ({
  isOpen,
  onClose,
  importConfig,
  title = 'Bulk Import Domains',
  description = 'Upload a CSV or Excel file to import multiple domains at once.',
  onComplete,
}: BulkImportModalGenericProps) => {
  return (
    <BulkImportModal
      isOpen={isOpen}
      onClose={onClose}
      importConfig={importConfig}
      title={title}
      description={description}
      onComplete={onComplete}
    />
  )
}

// Higher-order component for user imports
export const UserImportModal = ({
  isOpen,
  onClose,
  importConfig,
  title = 'Bulk Import Users',
  description = 'Upload a CSV or Excel file to import multiple users at once.',
  onComplete,
}: BulkImportModalGenericProps) => {
  return (
    <BulkImportModal
      isOpen={isOpen}
      onClose={onClose}
      importConfig={importConfig}
      title={title}
      description={description}
      onComplete={onComplete}
    />
  )
}

export default BulkImportModal
