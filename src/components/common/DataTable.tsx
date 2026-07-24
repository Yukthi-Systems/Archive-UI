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

import * as React from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
} from '@tanstack/react-table'
import { Loader2, Inbox } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from './DataTablePagination'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount?: number
  rowCount?: number
  pagination?: PaginationState
  onPaginationChange?: React.Dispatch<React.SetStateAction<PaginationState>>
  isLoading?: boolean
  onRowClick?: (row: TData) => void
  rowClassName?: string | ((row: TData) => string)
  hideRowsPerPage?: boolean
  className?: string
  height?: string
  simplePagination?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  rowCount,
  pagination,
  onPaginationChange,
  height = 'calc(100vh - 180px)',
  isLoading,
  onRowClick,
  rowClassName,
  hideRowsPerPage,
  className,
  simplePagination,
}: DataTableProps<TData, TValue>) {
  const hasPagination =
    pagination !== undefined && onPaginationChange !== undefined

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    state: hasPagination ? { pagination } : {},
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: hasPagination,
  })

  return (
    <div
      style={{ height }}
      className={cn(
        // FIXED HEIGHT: Applied via style prop for reliability
        // LAYOUT: flex-col ensures header, body, and footer stack correctly.
        `flex flex-col w-full rounded-lg border border-border bg-card `,
        className
      )}
    >
      {/* Scrollable Table Area - Flex-1 makes it fill remaining space */}
      {/* We target the table-container (from ui/table) to make IT the scrollable area so sticky headers work */}
      <div className='flex-1 relative rounded-lg scrollbar-custom overflow-auto [&_div[data-slot=table-container]]:h-full [&_div[data-slot=table-container]]:overflow-auto'>
        <Table className='min-w-[800px] rounded-lg md:min-w-full'>
          {/* Sticky Header */}
          <TableHeader className='sticky top-0 z-20 bg-card '>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow
                key={headerGroup.id}
                className='hover:bg-transparent border-b border-border'
              >
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className='h-10 px-4 first:pl-6 last:pr-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none bg-card'
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Loading State - Centered in the available height
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  <div className='flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary/80' />
                    <span className='text-sm font-medium'>Loading data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              // Data Rows
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    // Interactive states
                    'group transition-colors border-b border-border/40 last:border-0 hover:bg-muted/40 data-[state=selected]:bg-muted',
                    onRowClick && 'cursor-pointer',
                    typeof rowClassName === 'function'
                      ? rowClassName(row.original)
                      : rowClassName
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className='px-3 py-2 first:pl-6 last:pr-6 text-sm align-middle'
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Empty State - Centered and Styled
              <TableRow>
                <TableCell colSpan={columns.length} className='h-full'>
                  <div className='flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground/60'>
                    <div className='p-4 rounded-full bg-muted/30 border border-border/50'>
                      <Inbox className='h-8 w-8' />
                    </div>
                    <div className='text-center space-y-1'>
                      <p className='text-sm font-medium text-foreground'>
                        No results found
                      </p>
                      <p className='text-xs'>
                        Try adjusting your filters or search query.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer - Only show if pagination is enabled */}
      {hasPagination && (
        <div className='border-t border-border bg-muted/5 p-2'>
          <DataTablePagination
            table={table}
            totalItems={rowCount}
            hideRowsPerPage={hideRowsPerPage}
            simplePagination={simplePagination}
          />
        </div>
      )}
    </div>
  )
}
