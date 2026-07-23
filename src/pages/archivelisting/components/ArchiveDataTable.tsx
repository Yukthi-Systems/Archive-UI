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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ArchiveDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  rowCount: number
  pagination: PaginationState
  onPaginationChange: React.Dispatch<React.SetStateAction<PaginationState>>
  isLoading?: boolean
  onRowClick?: (row: TData) => void
  rowClassName?: string | ((row: TData) => string)
}

export function ArchiveDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  rowCount,
  pagination,
  onPaginationChange,
  isLoading,
  onRowClick,
  rowClassName,
}: ArchiveDataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    state: {
      pagination,
    },
    onPaginationChange: onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  const currentPage = table.getState().pagination.pageIndex + 1
  const pageSize = table.getState().pagination.pageSize
  const start = rowCount === 0 ? 0 : pageSize * (currentPage - 1) + 1
  const end = Math.min(pageSize * currentPage, rowCount)

  return (
    <div className='w-full flex flex-col border border-border/40 sm:rounded-xl overflow-hidden shadow-sm bg-background'>
      {/* Table Section */}
      <div className='flex-1 overflow-auto scrollbar-custom min-h-[400px]'>
        <Table className='relative min-w-[800px]'>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow
                key={headerGroup.id}
                className='hover:bg-transparent border-b border-border/60'
              >
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
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
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-96 text-center'
                >
                  {/* Optional: You can put your <ArchiveLoader /> here */}
                  <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                    <span>Loading data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    'border-b border-border/40 last:border-0 transition-all duration-200',
                    onRowClick &&
                      'cursor-pointer hover:bg-muted/40 active:bg-muted/60',
                    typeof rowClassName === 'function'
                      ? rowClassName(row.original)
                      : rowClassName
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-96 text-center text-muted-foreground'
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Toolbar */}
      <div className='flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t bg-muted/20 p-4'>
        {/* Left: Info & Size */}
        <div className='flex items-center gap-4 text-xs text-muted-foreground font-medium'>
          <span>
            Showing{' '}
            <span className='text-foreground'>
              {start}-{end}
            </span>{' '}
            of <span className='text-foreground'>{rowCount}</span>
          </span>
          <div className='flex items-center gap-2'>
            <span className='hidden sm:inline'>Rows:</span>
            <Select
              value={`${pageSize}`}
              onValueChange={value => table.setPageSize(Number(value))}
            >
              <SelectTrigger className='h-8 w-[70px] text-xs bg-background'>
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side='top'>
                {[50, 100, 200, 500].map(size => (
                  <SelectItem key={size} value={`${size}`} className='text-xs'>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right: Navigation Controls */}
        <div className='flex items-center gap-1.5'>
          {/* <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className='h-4 w-4' />
          </Button> */}
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          <div className='flex items-center justify-center min-w-[3rem] text-xs font-medium'>
            Page {currentPage} / {pageCount}
          </div>

          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
          {/* <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className='h-4 w-4' />
          </Button> */}
        </div>
      </div>
    </div>
  )
}
