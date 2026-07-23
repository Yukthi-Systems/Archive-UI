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

import ExcelJS from 'exceljs'
import Papa from 'papaparse'
import { IMPORT_FIELD_MAPPINGS } from '@/constants/import'
import { formatErrorMessage } from './errorProcessing'

// ============ Type Definitions ============

export interface FieldMapping {
  csvHeader?: string
  header?: string
  key: string
  type: string
  required?: boolean
  defaultValue?: any
  options?: Array<{ value: any; label?: string }>
  validate?: (value: any, row?: any, index?: number) => any
  transform?: (value: any, item?: any) => any
  sampleValue?: any
  sampleValue2?: any
  width?: number
}

export interface ProgressInfo {
  status:
    | 'reading'
    | 'processing'
    | 'validation'
    | 'creating'
    | 'complete'
    | 'error'
  message: string
  current?: number
  total?: number
  percentage?: number
}

export interface ItemResult<T = any> {
  item: any
  result?: T
  index: number
}

export interface BulkCreateResult<T = any> {
  successful: Array<{ item: any; result: T; index: number }>
  failed: Array<{ item: any; error: string; index: number }>
  total: number
}

export interface RowError {
  row: number
  field: string
  error: string
  value: any
}

export interface ProcessImportOptions {
  onProgress?: (progress: ProgressInfo) => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

export interface ImportConfig<T = any> {
  entityType: string
  createFunction: (item: any) => Promise<T>
  fieldMapping: FieldMapping[]
  sampleFilename?: string
}

export interface DomainProperties {
  organization_id: string
  domain_name: string
  filter_policy_id: string | null
  max_password_age_properties: {
    enable_max_password_age: boolean
    max_password_age?: number
    notify_at?: number[]
  }
  enable_hybrid_mode?: boolean
  hybrid_connector_properties?: HybridConnectorProperties | null
  enable_catch_all?: boolean
  catch_all_forwarding_address?: string | null
  caution_id?: string | null
  disclaimer_id?: string | null
  [key: string]: any
}

export interface HybridConnectorProperties {
  description?: string
  fqdn?: string
  ipv4?: string
  ipv6?: string
  port?: number
  [key: string]: any
}

// ============ File Processing ============

/**
 * Process uploaded file (CSV or Excel) for bulk import
 */
export const processImportFile = async (
  file: File,
  fieldMapping: FieldMapping[],
  onProgress?: (progress: ProgressInfo) => void,
  onError?: (error: Error) => void,
  signal?: AbortSignal
): Promise<any[]> => {
  try {
    onProgress?.({ status: 'reading', message: 'Reading file...' })
    if (signal?.aborted) throw new Error('Operation cancelled')

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    let rawData: any[] = []

    if (fileExtension === 'csv') {
      rawData = await parseCSVFile(file)
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      rawData = await parseExcelFile(file)
    } else {
      throw new Error('Unsupported file format. Please use CSV or Excel files.')
    }

    onProgress?.({ status: 'processing', message: 'Processing data...' })
    if (signal?.aborted) throw new Error('Operation cancelled')

    // Validate and transform data
    const processedData = validateAndTransformData(rawData, fieldMapping)

    onProgress?.({ status: 'validation', message: 'Validating data...' })

    return processedData
  } catch (error) {
    onError?.(error as Error)
    throw error
  }
}

/**
 * Parse CSV file
 */
const parseCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results: Papa.ParseResult<any>) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
        } else {
          resolve(results.data)
        }
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      },
    })
  })
}

/**
 * Parse Excel file using ExcelJS
 */
const parseExcelFile = async (file: File): Promise<any[]> => {
  try {
    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      throw new Error('Excel file appears to be empty')
    }

    const jsonData: any[] = []
    let headers: string[] = []

    // Iterate over rows
    worksheet.eachRow(
      { includeEmpty: false },
      (row: ExcelJS.Row, rowNumber: number) => {
        // row.values is a 1-based array: [ <empty>, 'Col1', 'Col2', ... ]
        // slice(1) removes the empty 0-index item provided by ExcelJS
        const rowValues = Array.isArray(row.values) ? row.values.slice(1) : []

        if (rowNumber === 1) {
          // Capture headers
          headers = rowValues.map((h: any) => String(h || '').trim())
        } else {
          // Map data to headers
          const rowData: Record<string, any> = {}
          let hasData = false

          headers.forEach((header: string, index: number) => {
            let cellValue = rowValues[index]

            // Handle Rich Text (ExcelJS sometimes returns objects)
            if (cellValue && typeof cellValue === 'object') {
              if ((cellValue as any).text) cellValue = (cellValue as any).text
              else if ((cellValue as any).result)
                cellValue = (cellValue as any).result
            }

            const value =
              cellValue === undefined || cellValue === null ? '' : cellValue
            rowData[header] = value

            if (value !== '') hasData = true
          })

          if (hasData) {
            jsonData.push(rowData)
          }
        }
      }
    )

    if (jsonData.length === 0) {
      throw new Error(
        'Excel file must contain at least a header row and one data row'
      )
    }

    return jsonData
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${(error as Error).message}`)
  }
}

const shouldIncludeField = (value: any, field: FieldMapping): boolean => {
  // Always include required fields
  if (field.required) {
    return true
  }

  // For non-required fields, check if value is meaningful
  if (value === null || value === undefined || value === '') {
    return false
  }

  // Include all other non-empty values
  return true
}

/**
 * Validate and transform data according to field mapping
 */
const validateAndTransformData = (
  rawData: any[],
  fieldMapping: FieldMapping[]
): any[] => {
  const errors: RowError[] = []
  const transformedData: any[] = []

  rawData.forEach((row: any, index: number) => {
    const rowNumber = index + 2 // +2 because index starts at 0 and we skip header
    const transformedRow: Record<string, any> = {}
    const rowErrors: RowError[] = []

    fieldMapping.forEach((field: FieldMapping) => {
      const value = row[field.csvHeader || ''] || row[field.header || '']

      try {
        // Apply transformation first
        let transformedValue = transformFieldValue(value, field, rowNumber)

        // Apply additional field validation if available (for complex validations)
        if (field.validate && typeof field.validate === 'function') {
          transformedValue = field.validate(
            transformedValue,
            transformedRow,
            index
          )
        }

        // Only set the value if it's not empty, or if the field is required
        if (shouldIncludeField(transformedValue, field)) {
          setNestedValue(transformedRow, field.key, transformedValue)
        }
      } catch (error) {
        rowErrors.push({
          row: rowNumber,
          field: field.csvHeader || field.header || field.key,
          error: (error as Error).message,
          value: value,
        })
      }
    })

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
    } else {
      transformedData.push(transformedRow)
    }
  })

  if (errors.length > 0) {
    const errorMessage = `Data validation failed:\n${errors
      .slice(0, 10)
      .map((e: RowError) => `Row ${e.row}, ${e.field}: ${e.error}`)
      .join(
        '\n'
      )}${errors.length > 10 ? `\n... and ${errors.length - 10} more errors` : ''}`

    throw new Error(errorMessage)
  }

  return transformedData
}

/**
 * Transform field value according to field configuration
 */
const transformFieldValue = (
  value: any,
  field: FieldMapping,
  rowNumber: number
): any => {
  // Handle empty values
  if (value === null || value === undefined || value === '') {
    if (field.required) {
      throw new Error(
        `${field.csvHeader || field.header || field.key} is required`
      )
    }
    return field.defaultValue || (field.type === 'array' ? [] : '')
  }

  // Apply type-specific transformations
  switch (field.type) {
    case 'string':
      return String(value).trim()

    case 'number': {
      const num = Number(value)
      if (isNaN(num)) {
        throw new Error(`Invalid number: ${value}`)
      }
      return num
    }

    case 'boolean': {
      if (typeof value === 'boolean') return value
      const str = String(value).toLowerCase().trim()
      if (['true', '1', 'yes', 'active'].includes(str)) return true
      if (['false', '0', 'no', 'inactive'].includes(str)) return false
      throw new Error(`Invalid boolean value: ${value}`)
    }

    case 'date': {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${value}`)
      }
      return date.toISOString()
    }

    case 'select':
      if (field.options && !field.options.some(opt => opt.value === value)) {
        throw new Error(
          `Invalid option: ${value}. Valid options: ${field.options.map(o => o.value).join(', ')}`
        )
      }
      return value

    case 'array': {
      // Handle array transformation
      let arrayValue

      // Use field's transform function if available
      if (field.transform && typeof field.transform === 'function') {
        arrayValue = field.transform(value)
      } else {
        // Default array transformation: split by comma and trim
        if (typeof value === 'string') {
          arrayValue = value
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0)
        } else if (Array.isArray(value)) {
          arrayValue = value
        } else {
          arrayValue = [String(value).trim()].filter(
            (item: string) => item.length > 0
          )
        }
      }

      // Apply field validation if available
      if (field.validate && typeof field.validate === 'function') {
        return field.validate(arrayValue)
      }

      return arrayValue
    }

    default:
      return value
  }
}

/**
 * Set nested object value using dot notation
 */
const setNestedValue = (
  obj: Record<string, any>,
  path: string,
  value: any
): void => {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }

  current[keys[keys.length - 1]] = value
}

/**
 * Bulk create items using API
 */
export const bulkCreateItems = async <T = any>(
  items: any[],
  createFunction: (item: any) => Promise<T>,
  onProgress?: (progress: ProgressInfo) => void,
  onItemComplete?: (result: {
    success: boolean
    item: any
    result?: T
    error?: string
    index: number
  }) => void,
  signal?: AbortSignal
): Promise<BulkCreateResult<T>> => {
  const results: BulkCreateResult<T> = {
    successful: [],
    failed: [],
    total: items.length,
  }

  for (let i = 0; i < items.length; i++) {
    if (signal?.aborted) throw new Error('Operation cancelled')
    const item = items[i]
    const currentProgress = i + 1

    try {
      onProgress?.({
        status: 'creating',
        message: `Creating item ${currentProgress} of ${items.length}...`,
        current: currentProgress,
        total: items.length,
        percentage: Math.round((currentProgress / items.length) * 100),
      })

      const result = await createFunction(item)
      results.successful.push({ item, result, index: i })

      onItemComplete?.({
        success: true,
        item,
        result,
        index: i,
      })

      // Small delay to prevent overwhelming the server
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    } catch (error) {
      const formattedError = formatErrorMessage(error)

      results.failed.push({
        item,
        error: formattedError,
        index: i,
      })

      onItemComplete?.({
        success: false,
        item,
        error: formattedError,
        index: i,
      })
    }
  }

  return results
}

/**
 * Generate sample file for download using ExcelJS
 */
export const generateSampleFile = async (
  fieldMapping: FieldMapping[],
  format: 'excel' | 'csv' = 'excel',
  filename: string = 'sample'
): Promise<void> => {
  // Create headers
  const headers = fieldMapping.map(
    field => field.csvHeader || field.header || ''
  )

  // Create sample data rows
  const row1 = fieldMapping.map(
    field => field.sampleValue || getDefaultSampleValue(field)
  )
  const row2 = fieldMapping.map(
    field => field.sampleValue2 || getDefaultSampleValue(field, true)
  )

  if (format === 'csv') {
    const sampleData = [headers, row1, row2]
    const csvContent = Papa.unparse(sampleData)
    downloadFile(csvContent, `${filename}.csv`, 'text/csv')
  } else {
    // Excel format
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sample Data')

    // Add Headers
    const headerRow = worksheet.addRow(headers)
    headerRow.font = { bold: true }

    // Add Data
    worksheet.addRow(row1)
    worksheet.addRow(row2)

    // Set column widths (ExcelJS width is approx chars)
    worksheet.columns = fieldMapping.map(field => ({
      width: field.width ? field.width / 7 : 20,
    }))

    // Write Buffer
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    // Download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Get default sample value for a field
 */
const getDefaultSampleValue = (
  field: FieldMapping,
  isSecond: boolean = false
): any => {
  if (field.sampleValue && !isSecond) return field.sampleValue
  if (field.sampleValue2 && isSecond) return field.sampleValue2

  const fieldName = field.csvHeader || field.header || field.key

  switch (field.type) {
    case 'string':
      return isSecond ? `Sample ${fieldName} 2` : `Sample ${fieldName}`
    case 'number':
      return isSecond ? 200 : 100
    case 'boolean':
      return isSecond ? 'No' : 'Yes'
    case 'date': {
      const date = new Date()
      date.setDate(date.getDate() + (isSecond ? 1 : 0))
      return date.toISOString().split('T')[0]
    }
    case 'select':
      if (field.options && field.options.length > 0) {
        return field.options[isSecond && field.options.length > 1 ? 1 : 0].value
      }
      return isSecond ? 'Option 2' : 'Option 1'
    default:
      return isSecond ? `Sample ${fieldName} 2` : `Sample ${fieldName}`
  }
}

/**
 * Download file utility
 */
const downloadFile = (
  content: string | Blob,
  filename: string,
  mimeType: string
): void => {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Helper function to create import configuration
 */
export const createImportConfig = <T = any>(
  entityType: string,
  createFunction: (item: any) => Promise<T>,
  customFieldMapping: FieldMapping[] | null = null
): ImportConfig<T> => {
  const fieldMapping =
    customFieldMapping ||
    (IMPORT_FIELD_MAPPINGS as Record<string, FieldMapping[]>)[entityType]

  if (!fieldMapping) {
    throw new Error(`No field mapping found for entity type: ${entityType}`)
  }

  return {
    entityType,
    createFunction,
    fieldMapping,
    sampleFilename: `${entityType}_import_sample`,
  }
}

// ============ Domain-Specific Functions ============

const transformDomainForAPI = (
  transformedRow: Record<string, any>,
  organizationId: string
): DomainProperties => {
  const apiData: DomainProperties = {
    ...transformedRow,
    organization_id: organizationId,
    filter_policy_id: null,
    max_password_age_properties: {
      enable_max_password_age: false,
    },
  }

  // Ensure domain_name is lowercase
  if (apiData.domain_name) {
    apiData.domain_name = apiData.domain_name.toLowerCase()
  }

  // Handle max password age properties
  apiData.max_password_age_properties.enable_max_password_age =
    apiData.enable_max_password_age || false

  if (apiData.enable_max_password_age) {
    apiData.max_password_age_properties.max_password_age =
      apiData.max_password_age
    apiData.max_password_age_properties.notify_at = [
      apiData.notify_1,
      apiData.notify_2,
      apiData.notify_3,
    ]
      .filter((val: any) => val !== undefined && val !== null && !isNaN(val))
      .sort((a: number, b: number) => a - b)
  } else {
    apiData.max_password_age = 0
    apiData.max_password_age_properties.max_password_age = 0
    apiData.max_password_age_properties.notify_at = []
  }

  // Clean up temporary fields
  delete apiData.enable_max_password_age
  delete apiData.notify_1
  delete apiData.notify_2
  delete apiData.notify_3

  // Handle hybrid mode
  if (!apiData.enable_hybrid_mode) {
    apiData.hybrid_connector_properties = null
  } else {
    if (
      !apiData.hybrid_connector_properties ||
      typeof apiData.hybrid_connector_properties !== 'object'
    ) {
      throw new Error(
        'Hybrid connector properties are required when hybrid mode is enabled'
      )
    }
  }

  // Handle catch all
  if (!apiData.enable_catch_all) {
    apiData.catch_all_forwarding_address = null
  }

  // Handle optional IDs
  if (!apiData.caution_id || apiData.caution_id === '') {
    apiData.caution_id = null
  }
  if (!apiData.disclaimer_id || apiData.disclaimer_id === '') {
    apiData.disclaimer_id = null
  }

  return apiData
}

/**
 * Validate and transform data for domain imports
 */
const validateAndTransformDataForDomains = (
  rawData: any[],
  fieldMapping: FieldMapping[],
  organizationId: string
): DomainProperties[] => {
  const errors: RowError[] = []
  const transformedData: DomainProperties[] = []

  rawData.forEach((row: any, index: number) => {
    const rowNumber = index + 2 // +2 because index starts at 0 and we skip header
    const transformedRow: Record<string, any> = {}
    const rowErrors: RowError[] = []

    fieldMapping.forEach((field: FieldMapping) => {
      const value = row[field.csvHeader || ''] || row[field.header || '']

      try {
        // Apply transformation first
        let transformedValue = transformFieldValue(value, field, rowNumber)

        // Apply additional field validation if available (for complex validations)
        if (field.validate && typeof field.validate === 'function') {
          transformedValue = field.validate(
            transformedValue,
            transformedRow,
            index
          )
        }

        // Only set the value if it's not empty, or if the field is required
        if (shouldIncludeField(transformedValue, field)) {
          setNestedValue(transformedRow, field.key, transformedValue)
        }
      } catch (error) {
        rowErrors.push({
          row: rowNumber,
          field: field.csvHeader || field.header || field.key,
          error: (error as Error).message,
          value: value,
        })
      }
    })

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
    } else {
      // Apply domain-specific transformation before adding to results
      try {
        const apiReadyData = transformDomainForAPI(
          transformedRow,
          organizationId
        )
        transformedData.push(apiReadyData)
      } catch (transformError) {
        errors.push({
          row: rowNumber,
          field: 'Data Transformation',
          error: (transformError as Error).message,
          value: 'N/A',
        })
      }
    }
  })

  if (errors.length > 0) {
    const errorMessage = `Data validation failed:\n${errors
      .slice(0, 10)
      .map((e: RowError) => `Row ${e.row}, ${e.field}: ${e.error}`)
      .join(
        '\n'
      )}${errors.length > 10 ? `\n... and ${errors.length - 10} more errors` : ''}`

    throw new Error(errorMessage)
  }

  return transformedData
}

export const processImportFileForDomains = async (
  file: File,
  fieldMapping: FieldMapping[],
  organizationId: string,
  onProgress?: (progress: ProgressInfo) => void,
  onError?: (error: Error) => void,
  signal?: AbortSignal
): Promise<DomainProperties[]> => {
  try {
    onProgress?.({ status: 'reading', message: 'Reading file...' })
    if (signal?.aborted) throw new Error('Operation cancelled')

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    let rawData: any[] = []

    if (fileExtension === 'csv') {
      rawData = await parseCSVFile(file)
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      rawData = await parseExcelFile(file)
    } else {
      throw new Error('Unsupported file format. Please use CSV or Excel files.')
    }

    onProgress?.({ status: 'processing', message: 'Processing data...' })
    if (signal?.aborted) throw new Error('Operation cancelled')

    // Use domain-specific validation and transformation
    const processedData = validateAndTransformDataForDomains(
      rawData,
      fieldMapping,
      organizationId
    )

    onProgress?.({ status: 'validation', message: 'Validating data...' })

    return processedData
  } catch (error) {
    onError?.(error as Error)
    throw error
  }
}

/**
 * Helper function to clean up hybrid connector properties that might have empty values
 */
export const cleanupHybridConnectorProperties = (
  item: DomainProperties
): HybridConnectorProperties | null => {
  if (!item.enable_hybrid_mode) {
    return null
  }

  const hybrid = item.hybrid_connector_properties || {}

  // Check if all required fields are present when hybrid mode is enabled
  const requiredFields = ['description', 'fqdn', 'ipv4', 'port']
  const missingFields = requiredFields.filter(
    field => !hybrid[field] || hybrid[field] === ''
  )

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required hybrid fields: ${missingFields.join(', ')}`
    )
  }

  // Clean up empty optional fields
  Object.keys(hybrid).forEach(key => {
    if (hybrid[key] === '' || hybrid[key] === undefined) {
      if (key === 'ipv6') {
        ;(hybrid as any)[key] = '' // IPv6 can be empty
      } else {
        delete hybrid[key]
      }
    }
  })

  return hybrid
}

// Export the domain-specific functions
export { transformDomainForAPI, validateAndTransformDataForDomains }
