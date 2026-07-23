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

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { type Table } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalItems?: number
  hideRowsPerPage?: boolean
  simplePagination?: boolean
}

export function DataTablePagination<TData>({
  table,
  totalItems,
  hideRowsPerPage = false,
  simplePagination = false,
}: DataTablePaginationProps<TData>) {
  const currentPage = table.getState().pagination.pageIndex + 1
  const pageCount = table.getPageCount()
  const pageSize = table.getState().pagination.pageSize

  // Helper to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 1 // Compact range for cleaner look
    const range = []
    const rangeWithDots = []

    for (let i = 1; i <= pageCount; i++) {
      if (
        i === 1 ||
        i === pageCount ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i)
      }
    }

    let l
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }
    return rangeWithDots
  }

  return (
    <div className='flex items-center justify-between px-2 w-full'>
      {/* Left: Metadata */}
      <div className='flex-1 text-xs text-muted-foreground'>
        {totalItems ? (
          <span>
            Showing{' '}
            <span className='font-medium text-foreground'>
              {pageSize * (currentPage - 1) + 1}
            </span>
            -
            <span className='font-medium text-foreground'>
              {Math.min(pageSize * currentPage, totalItems)}
            </span>{' '}
            of <span className='font-medium text-foreground'>{totalItems}</span>
          </span>
        ) : (
          <span className='text-muted-foreground/60'>
            {table.getFilteredSelectedRowModel().rows.length} row(s) selected
          </span>
        )}
      </div>

      {/* Right: Controls */}
      <div className='flex items-center space-x-6 lg:space-x-8'>
        {/* Rows per page */}
        {!hideRowsPerPage && (
          <div className='flex items-center space-x-2'>
            <p className='text-xs font-medium text-muted-foreground whitespace-nowrap hidden sm:block'>
              Rows per page
            </p>
            <Select
              value={`${pageSize}`}
              onValueChange={value => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className='h-7 w-[70px] text-xs'>
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              {simplePagination == true ? (
                <>
                  {' '}
                  <SelectContent side='top'>
                    {[50, 100, 200, 500].map(size => (
                      <SelectItem
                        key={size}
                        value={`${size}`}
                        className='text-xs'
                      >
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>{' '}
                </>
              ) : (
                <>
                  {' '}
                  <SelectContent side='top'>
                    {[10, 20, 30, 40, 50, 100].map(size => (
                      <SelectItem
                        key={size}
                        value={`${size}`}
                        className='text-xs'
                      >
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>{' '}
                </>
              )}
            </Select>
          </div>
        )}

        {/* Page Navigation */}
        <div className='flex items-center space-x-2'>
          <div className='flex items-center justify-center text-xs font-medium w-[80px] sm:w-[100px] text-muted-foreground'>
            Page {currentPage} of {pageCount}
          </div>

          <div className='flex items-center space-x-1'>
            {!simplePagination && (
              <Button
                variant='outline'
                className='hidden h-7 w-7 p-0 lg:flex'
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className='sr-only'>Go to first page</span>
                <ChevronsLeft className='h-3.5 w-3.5' />
              </Button>
            )}
            <Button
              variant='outline'
              className='h-7 w-7 p-0'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>Go to previous page</span>
              <ChevronLeft className='h-3.5 w-3.5' />
            </Button>

            {/* Smart Page Numbers (Desktop Only) */}
            {!simplePagination && (
              <div className='hidden items-center space-x-1 lg:flex'>
                {getPageNumbers().map((page, idx) =>
                  typeof page === 'number' ? (
                    <Button
                      key={idx}
                      variant={currentPage === page ? 'default' : 'ghost'}
                      className={`h-7 w-7 p-0 text-xs ${currentPage === page ? '' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => table.setPageIndex(page - 1)}
                    >
                      {page}
                    </Button>
                  ) : (
                    <span
                      key={idx}
                      className='px-1 text-xs text-muted-foreground/50 select-none'
                    >
                      ...
                    </span>
                  )
                )}
              </div>
            )}

            <Button
              variant='outline'
              className='h-7 w-7 p-0'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>Go to next page</span>
              <ChevronRight className='h-3.5 w-3.5' />
            </Button>
            {!simplePagination && (
              <Button
                variant='outline'
                className='hidden h-7 w-7 p-0 lg:flex'
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className='sr-only'>Go to last page</span>
                <ChevronsRight className='h-3.5 w-3.5' />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
