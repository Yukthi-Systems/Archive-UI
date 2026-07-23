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

import { useState, useMemo, useEffect, useCallback } from 'react'
import { type PaginationState } from '@tanstack/react-table'
import {
  Loader2,
  Download,
  Shield,
  Info,
  CheckCircle,
  XCircle,
  Database,
  FileUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { type DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/common/DataTable'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useAuditLogSearch,
  useAuditLogCount,
  type AuditLogSearchPayload,
  type AuditLogEntry,
} from '@/hooks/useAuditlogs'
import { useExport, type ExportFormat } from '@/hooks/useExport'
import apiClient from '@/lib/axios'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import { AuditLogFilters } from './Filters'
import { AuditLogDetailDialog } from './AuditDetailsModal'

const AuditLogs = () => {
  // -- State --
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  })

  // Filters State
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [ascendingOrder, setAscendingOrder] = useState(false)

  // Data & Keys
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [pageKeys, setPageKeys] = useState<Record<number, string | undefined>>(
    {}
  )
  const [pageTimes, setPageTimes] = useState<
    Record<number, string | undefined>
  >({})
  const [activeParams, setActiveParams] =
    useState<AuditLogSearchPayload | null>(null)

  // -- Hooks --
  const {
    mutate: searchLogs,
    data: logsData,
    isPending: isSearching,
    reset: resetSearch,
  } = useAuditLogSearch({
    onError: (err: any) => toast.error(`Search failed: ${err.message}`),
  })

  const {
    mutate: countLogs,
    data: totalCount,
    reset: resetCount,
  } = useAuditLogCount()

  const { isExporting, handleExport } = useExport<AuditLogEntry>()

  // -- Effects --

  // 1. Pagination Cursor Logic
  useEffect(() => {
    if (logsData && logsData.length > 0) {
      const lastItem = logsData[logsData.length - 1]
      const nextPageIndex = pagination.pageIndex + 1

      // Store keys for the NEXT page based on the LAST item of CURRENT page
      setPageKeys(prev => ({
        ...prev,
        [nextPageIndex]: lastItem.log_id,
      }))

      // Convert Unix seconds to ISO string for the cursor if needed
      setPageTimes(prev => ({
        ...prev,
        [nextPageIndex]: new Date(lastItem.log_time * 1000).toISOString(),
      }))
    }
  }, [logsData, pagination.pageIndex])

  // 2. Initial Load
  // useEffect(() => {
  //   handleSearch()
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  // -- Logic --

  const executeSearch = (
    params: AuditLogSearchPayload,
    key?: string,
    time?: string
  ) => {
    const payload = { ...params }
    if (key) payload.last_evaluated_key = key
    if (time) payload.last_evaluated_time = time

    // Clean up undefineds
    if (!payload.last_evaluated_key) delete payload.last_evaluated_key
    if (!payload.last_evaluated_time) delete payload.last_evaluated_time

    searchLogs(payload)
  }

  const handleSearch = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Date range is required for audit logs')
      return
    }

    const params: AuditLogSearchPayload = {
      start_date: dateRange.from.toISOString(),
      end_date: dateRange.to.toISOString(),
      ascending_order: ascendingOrder,
      limit: pagination.pageSize,
    }

    if (searchKeyword.trim()) params.log_message_keyword = searchKeyword.trim()
    if (filterUser.trim()) params.from_user = filterUser.trim()
    if (filterType && filterType !== 'ALL') params.log_type = filterType

    // Reset pagination state
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
    setPageKeys({})
    setPageTimes({})
    setActiveParams(params)

    // Fire Requests
    countLogs(params)
    executeSearch(params)
  }

  const resetFilters = () => {
    setSearchKeyword('')
    setFilterUser('')
    setFilterType('ALL')
    setDateRange(undefined)
    resetCount()
    resetSearch()
  }

  const handleExportLogs = (format: ExportFormat) => {
    if (!activeParams && (!dateRange?.from || !dateRange?.to)) {
      toast.error('Please perfrom a search or select a date range first')
      return
    }

    const exportParams: AuditLogSearchPayload = activeParams
      ? { ...activeParams }
      : {
          start_date: dateRange!.from!.toISOString(),
          end_date: dateRange!.to!.toISOString(),
          ascending_order: ascendingOrder,
          limit: 100, // Fetch in larger chunks for export
        }

    // Ensure limit is decent for export
    exportParams.limit = 500

    handleExport(
      async () => {
        let allLogs: AuditLogEntry[] = []
        const currentParams = { ...exportParams }
        let hasMore = true

        try {
          while (hasMore) {
            const response = await apiClient.post<AuditLogEntry[]>(
              '/audit/logs/list',
              currentParams
            )
            const logs = response.data

            if (!logs || logs.length === 0) {
              hasMore = false
            } else {
              allLogs = [...allLogs, ...logs]

              const lastItem = logs[logs.length - 1]
              currentParams.last_evaluated_key = lastItem.log_id
              // FIX: Handle Unix Timestamp (Seconds) -> ISO String if needed by API, or standard string?
              // The API hook seems to just pass it if provided, but the effect in index.tsx converts it.
              // "new Date(lastItem.log_time * 1000).toISOString()"
              currentParams.last_evaluated_time = new Date(
                lastItem.log_time * 1000
              ).toISOString()

              if (logs.length < currentParams.limit) {
                hasMore = false
              }
            }

            // Safety break
            if (allLogs.length > 50000) {
              toast.warning(
                'Export limit reached (50,000 records). Exporting partial data.'
              )
              hasMore = false
            }
          }
          return allLogs
        } catch (error) {
          console.error('Export fetch failed', error)
          throw error
        }
      },
      {
        filename: 'audit-logs-export',
        fieldMappings: [
          {
            header: 'Time',
            key: 'log_time',
            transform: val => new Date(val * 1000).toLocaleString(),
          },
          { header: 'Event Type', key: 'log_type' },
          { header: 'User', key: 'from_user' },
          { header: 'Message', key: 'log_message' },
          { header: 'Description', key: 'log_description' },
        ],
      },
      {
        context: 'Audit Logs',
        type: AUDIT_LOG_TYPES.AUDIT_EXPORT,
        failType: AUDIT_LOG_TYPES.AUDIT_EXPORT_FAILED,
        description: `Export of audit logs to ${format === 'excel' ? 'Excel' : 'CSV'} with filters: ${JSON.stringify(activeParams || 'Default Date Range')}`,
      },
      format
    )
  }

  const handlePaginationChange = useCallback(
    (updater: any) => {
      const nextState =
        typeof updater === 'function' ? updater(pagination) : updater

      // Reset if Page Size Changes
      if (nextState.pageSize !== pagination.pageSize) {
        setPagination({ ...nextState, pageIndex: 0 })
        setPageKeys({})
        setPageTimes({})
        if (activeParams) {
          const newParams = { ...activeParams, limit: nextState.pageSize }
          setActiveParams(newParams)
          executeSearch(newParams)
        }
        return
      }

      // Handle Page Navigation
      const newPageIndex = nextState.pageIndex
      if (newPageIndex === pagination.pageIndex) return

      const keyToUse = newPageIndex === 0 ? undefined : pageKeys[newPageIndex]
      const timeToUse = newPageIndex === 0 ? undefined : pageTimes[newPageIndex]

      // Prevent jumping to pages we haven't loaded keys for
      if (newPageIndex > 0 && keyToUse === undefined) return

      setPagination(nextState)
      if (activeParams) {
        executeSearch(activeParams, keyToUse, timeToUse)
      }
    },
    [pagination, activeParams, pageKeys, pageTimes, searchLogs]
  )

  const handleRowClick = (log: AuditLogEntry) => {
    setSelectedLog(log)
    setIsDetailOpen(true)
  }

  const hasActiveFilters = !!(
    searchKeyword ||
    filterUser ||
    filterType !== 'ALL' ||
    dateRange?.from ||
    dateRange?.to
  )

  // -- Columns Definition --
  const columns = useMemo(
    () => [
      {
        accessorKey: 'log_type',
        header: 'Event Type',
        cell: ({ row }: any) => {
          const type = row.original.log_type
          return (
            <span className='text-[10px] uppercase tracking-wider'>
              {type.replace(/_/g, ' ')}
            </span>
          )
        },
        size: 280,
      },
      {
        accessorKey: 'log_message',
        header: 'Activity Summary',
        cell: ({ row }: any) => (
          <span
            className='truncate block max-w-[450px] lg:max-w-[650px] lg:leading-6 text-sm text-foreground/80'
            title={row.original.log_message}
          >
            {row.original.log_message}
          </span>
        ),
      },
      {
        accessorKey: 'from_user',
        header: 'User',
        cell: ({ row }: any) => (
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>
              {row.original.from_user}
            </span>
          </div>
        ),
        size: 260,
      },
      {
        accessorKey: 'log_time',
        header: 'Time',
        cell: ({ row }: any) => {
          // FIX: Handle Unix Timestamp (Seconds) -> Milliseconds
          const rawTime = row.original.log_time
          const date = new Date(rawTime * 1000)
          const isValidDate = !isNaN(date.getTime())

          return (
            <div className='flex flex-col'>
              <span className='font-medium text-xs'>
                {isValidDate ? format(date, 'MMM dd, yyyy') : 'N/A'}
              </span>
              <span className='font-mono text-[10px] text-muted-foreground'>
                {isValidDate ? format(date, 'HH:mm:ss') : '--:--:--'}
              </span>
            </div>
          )
        },
        size: 140,
      },
    ],
    []
  )

  // const hasNoLogs = Array.isArray(logsData) && logsData.length === 0

  return (
    <div className='space-y-6 w-full mx-auto '>
      {/* 1. Header Section */}

      <div className='flex gap-1 justify-between'>
        <Breadcrumbs className='mb-0' />

        <div className='flex items-center gap-3'>
          {/* Count Capsule */}
          <div className='hidden sm:flex items-center gap-2 px-3 py-1.5 '>
            <Database className='w-3.5 h-3.5 text-muted-foreground/70' />
            <span className='text-xs text-muted-foreground font-medium'>
              Total Records:
            </span>
            <span className='text-xs font-mono font-semibold text-foreground'>
              {totalCount?.toLocaleString() ?? 0}
            </span>
          </div>

          {/* Separator (Optional) */}
          {/* <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" /> */}

          {/* Export Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='h-9 gap-2 shadow-sm border-border/60 hover:bg-muted/50'
                disabled={isExporting}
              >
                <FileUp className='w-4 h-4 text-muted-foreground' />
                <span className='text-sm font-medium'>
                  {isExporting ? 'Exporting...' : 'Export'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => handleExportLogs('excel')}>
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportLogs('csv')}>
                Export to CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. Filters Component */}
      <AuditLogFilters
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        dateRange={dateRange}
        setDateRange={setDateRange}
        filterUser={filterUser}
        setFilterUser={setFilterUser}
        filterType={filterType}
        setFilterType={setFilterType}
        isSearching={isSearching}
        handleSearch={handleSearch}
        resetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 3. Data Table Card */}
      <Card className='border border-border/40 rounded-xl overflow-hidden bg-card min-h-[500px] flex flex-col shadow-sm'>
        {isSearching ? (
          <div className='flex-1 flex flex-col items-center justify-center space-y-4'>
            <div className='p-4 rounded-full bg-primary/5'>
              <Loader2 className='w-8 h-8 animate-spin text-primary' />
            </div>
            <div className='text-center space-y-1'>
              <p className='text-sm font-medium'>Retrieving audit trail...</p>
              <p className='text-xs text-muted-foreground'>
                Fetching records from secure storage
              </p>
            </div>
          </div>
        ) : logsData && logsData.length > 0 ? (
          <DataTable
            columns={columns}
            data={logsData || []}
            pageCount={Math.ceil((totalCount || 0) / pagination.pageSize)}
            rowCount={totalCount}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            onRowClick={handleRowClick}
            // height='68vh'
            rowClassName={() =>
              'cursor-pointer hover:bg-muted/30 transition-colors border-l-2 border-l-transparent hover:border-l-primary data-[state=selected]:bg-muted'
            }
            simplePagination={true}
          />
        ) : (
          <div className='flex-1 flex flex-col items-center justify-center space-y-4'>
            <div className='p-4 rounded-full bg-primary/5'>
              <Database className='w-8 h-8 text-primary' />
            </div>
            <div className='text-center space-y-1'>
              <p className='text-sm font-medium'>No audit trail found</p>
              <p className='text-xs text-muted-foreground'>
                No records found for the selected filters
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* 4. Details Dialog */}
      <AuditLogDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        log={selectedLog}
      />
    </div>
  )
}

export default AuditLogs
