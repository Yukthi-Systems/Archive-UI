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
import { toast } from 'sonner'

export interface ExportFieldMapping<T = any> {
  header: string
  key: keyof T | string // key of T or dot notation string
  width?: number // width in chars approx
  transform?: (value: any, item: T) => string | number | boolean // custom transform
}

export interface ExportOptions<T> {
  filename: string
  sheetName?: string
  fieldMappings: ExportFieldMapping<T>[]
}

/**
 * Downloads data as an Excel file.
 */
export const exportDataToExcel = async <T = any>(
  data: T[],
  options: ExportOptions<T>
): Promise<void> => {
  try {
    const { filename, sheetName = 'Sheet1', fieldMappings } = options

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    // 1. Setup Headers
    const headers = fieldMappings.map(m => m.header)
    const headerRow = worksheet.addRow(headers)

    // Style Header Row
    headerRow.font = { bold: true }
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' }

    // Set Column Widths
    worksheet.columns = fieldMappings.map(m => ({
      width: m.width || 20, // default width
    }))

    // 2. Add Data Rows
    data.forEach(item => {
      const rowValues = fieldMappings.map(mapping => {
        const rawValue = getNestedValue(item, mapping.key as string)

        if (mapping.transform) {
          return mapping.transform(rawValue, item)
        }

        return rawValue
      })

      const row = worksheet.addRow(rowValues)
      row.alignment = { vertical: 'middle', horizontal: 'left' }
    })

    // 3. Generate Buffer and Download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Export failed:', error)
    toast.error('Failed to export data.')
    throw error
  }
}

/**
 * Downloads data as a CSV file.
 */
export const exportDataToCSV = async <T = any>(
  data: T[],
  options: ExportOptions<T>
): Promise<void> => {
  try {
    const { filename, fieldMappings } = options

    // 1. Headers
    const headers = fieldMappings.map(m => m.header)
    const csvRows = [headers.join(',')]

    // 2. Data Rows
    data.forEach(item => {
      const rowValues = fieldMappings.map(mapping => {
        let rawValue = getNestedValue(item, mapping.key as string)

        if (mapping.transform) {
          rawValue = mapping.transform(rawValue, item)
        }

        // Handle string escaping for CSV
        let stringValue = String(
          rawValue === null || rawValue === undefined ? '' : rawValue
        )
        if (
          stringValue.includes(',') ||
          stringValue.includes('"') ||
          stringValue.includes('\n')
        ) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`
        }

        return stringValue
      })
      csvRows.push(rowValues.join(','))
    })

    // 3. Generate Blob and Download
    const csvString = csvRows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
    link.setAttribute('visibility', 'hidden')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('CSV Export failed:', error)
    toast.error('Failed to export CSV data.')
    throw error
  }
}

/**
 * Helper to safely get nested object values
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj) return null
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}
