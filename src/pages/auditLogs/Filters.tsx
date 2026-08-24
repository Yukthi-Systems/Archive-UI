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
  Search,
  RotateCcw,
  Calendar,
  User,
  FileText,
  Loader2,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { useState } from 'react'
import { type DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { sanitizeAlphanumericSpaces } from '@/utils/inputValidation'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types' // Ensure you have this
import { UserSelector } from '@/components/common/infiniteDropdowns/UserName'

interface AuditLogFiltersProps {
  searchKeyword: string
  setSearchKeyword: (val: string) => void
  dateRange: DateRange | undefined
  setDateRange: (range: DateRange | undefined) => void
  filterUser: string
  setFilterUser: (val: string) => void
  filterType: string
  setFilterType: (val: string) => void
  isSearching: boolean
  handleSearch: () => void
  resetFilters: () => void
  hasActiveFilters: boolean
}

export function AuditLogFilters({
  searchKeyword,
  setSearchKeyword,
  dateRange,
  setDateRange,
  filterUser,
  setFilterUser,
  filterType,
  setFilterType,
  isSearching,
  handleSearch,
  resetFilters,
  hasActiveFilters,
}: AuditLogFiltersProps) {
  const [openLogTypeSelect, setOpenLogTypeSelect] = useState(false)
  const [searchHasInvalidChars, setSearchHasInvalidChars] = useState(false)

  const logTypeOptions = [
    { value: 'ALL', label: 'All Events' },
    // Auth
    { value: AUDIT_LOG_TYPES.LOGIN, label: 'Login' },
    { value: AUDIT_LOG_TYPES.FAILED_LOGIN, label: 'Login Failed' },
    { value: AUDIT_LOG_TYPES.LOGOUT, label: 'Logout' },
    // Domain
    { value: AUDIT_LOG_TYPES.DOMAIN_CREATE, label: 'Domain Create' },
    {
      value: AUDIT_LOG_TYPES.DOMAIN_CREATE_FAILED,
      label: 'Domain Create Failed',
    },
    { value: AUDIT_LOG_TYPES.DOMAIN_UPDATE, label: 'Domain Update' },
    {
      value: AUDIT_LOG_TYPES.DOMAIN_UPDATE_FAILED,
      label: 'Domain Update Failed',
    },
    { value: AUDIT_LOG_TYPES.DOMAIN_DELETE, label: 'Domain Delete' },
    {
      value: AUDIT_LOG_TYPES.DOMAIN_DELETE_FAILED,
      label: 'Domain Delete Failed',
    },
    { value: AUDIT_LOG_TYPES.DOMAIN_EXPORT, label: 'Domain Export' },
    {
      value: AUDIT_LOG_TYPES.DOMAIN_EXPORT_FAILED,
      label: 'Domain Export Failed',
    },
    // User
    { value: AUDIT_LOG_TYPES.USER_CREATE, label: 'User Create' },
    { value: AUDIT_LOG_TYPES.USER_CREATE_FAILED, label: 'User Create Failed' },
    { value: AUDIT_LOG_TYPES.USER_UPDATE, label: 'User Update' },
    { value: AUDIT_LOG_TYPES.USER_UPDATE_FAILED, label: 'User Update Failed' },
    { value: AUDIT_LOG_TYPES.USER_DELETE, label: 'User Delete' },
    { value: AUDIT_LOG_TYPES.USER_DELETE_FAILED, label: 'User Delete Failed' },
    { value: AUDIT_LOG_TYPES.USER_EXPORT, label: 'User Export' },
    { value: AUDIT_LOG_TYPES.USER_EXPORT_FAILED, label: 'User Export Failed' },
    // Security
    { value: AUDIT_LOG_TYPES.PASSWORD_CHANGE, label: 'Password Change' },
    {
      value: AUDIT_LOG_TYPES.PASSWORD_CHANGE_FAILED,
      label: 'Password Change Failed',
    },
    { value: AUDIT_LOG_TYPES.TWO_FA_ENABLE, label: '2FA Enable' },
    { value: AUDIT_LOG_TYPES.TWO_FA_ENABLE_FAILED, label: '2FA Enable Failed' },
    { value: AUDIT_LOG_TYPES.TWO_FA_DISABLE, label: '2FA Disable' },
    {
      value: AUDIT_LOG_TYPES.TWO_FA_DISABLE_FAILED,
      label: '2FA Disable Failed',
    },
    // Archive
    { value: AUDIT_LOG_TYPES.ARCHIVE_SEARCH, label: 'Archive Search' },
    {
      value: AUDIT_LOG_TYPES.ARCHIVE_SEARCH_FAILED,
      label: 'Archive Search Failed',
    },
    { value: AUDIT_LOG_TYPES.ARCHIVE_VIEW, label: 'Archive View' },
    {
      value: AUDIT_LOG_TYPES.ARCHIVE_VIEW_FAILED,
      label: 'Archive View Failed',
    },
    { value: AUDIT_LOG_TYPES.ARCHIVE_DOWNLOAD, label: 'Archive Download' },
    {
      value: AUDIT_LOG_TYPES.ARCHIVE_DOWNLOAD_FAILED,
      label: 'Archive Download Failed',
    },
    { value: AUDIT_LOG_TYPES.ARCHIVE_FORWARD, label: 'Archive Forward' },
    {
      value: AUDIT_LOG_TYPES.ARCHIVE_FORWARD_FAILED,
      label: 'Archive Forward Failed',
    },
    { value: AUDIT_LOG_TYPES.ARCHIVE_EXPORT, label: 'Archive Export' },
    {
      value: AUDIT_LOG_TYPES.ARCHIVE_EXPORT_FAILED,
      label: 'Archive Export Failed',
    },
    { value: AUDIT_LOG_TYPES.EML_EXPORT_VIEW, label: 'EML Zip files View' },
    {
      value: AUDIT_LOG_TYPES.EML_EXPORT_VIEW_FAILED,
      label: 'EML Zip files View Failed',
    },
    {
      value: AUDIT_LOG_TYPES.EML_EXPORT_DOWNLOAD,
      label: 'EML Zip file Download',
    },
    {
      value: AUDIT_LOG_TYPES.EML_EXPORT_DOWNLOAD_FAILED,
      label: 'EML Zip file Download Failed',
    },
    // System
    { value: AUDIT_LOG_TYPES.SYSTEM_CONFIG, label: 'System Config' },
    {
      value: AUDIT_LOG_TYPES.SYSTEM_CONFIG_FAILED,
      label: 'System Config Failed',
    },
    //Import
    {
      value: AUDIT_LOG_TYPES.IMPORT_DOMAIN_PARTIAL_SUCCESS,
      label: 'Import Domain Partial Success',
    },
    {
      value: AUDIT_LOG_TYPES.IMPORT_DOMAIN_SUCCESS,
      label: 'Import Domain Success',
    },
    {
      value: AUDIT_LOG_TYPES.IMPORT_USER_PARTIAL_SUCCESS,
      label: 'Import User Partial Success',
    },
    {
      value: AUDIT_LOG_TYPES.IMPORT_USER_SUCCESS,
      label: 'Import User Success',
    },
  ]

  return (
    <Card className='border border-border/60 bg-card shadow-sm'>
      <div className='p-4 lg:p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-end'>
          {/* Keyword Search */}
          <div className='xl:col-span-7 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5 text-muted-foreground'>
              <Search className='w-3.5 h-3.5' /> Activity Search
            </Label>
            <Input
              placeholder='Search activity...'
              value={searchKeyword}
              onChange={e => {
                const raw = e.target.value
                const sanitized = sanitizeAlphanumericSpaces(raw)
                setSearchHasInvalidChars(sanitized !== raw)
                setSearchKeyword(sanitized)
              }}
              className='h-9 bg-background/50'
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            {searchHasInvalidChars && (
              <p className='text-[10px] text-destructive'>
                Only letters, numbers, and spaces are allowed.
              </p>
            )}
          </div>

          {/* Date Range (Mandatory) */}
          <div className='xl:col-span-5 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5 text-muted-foreground'>
              <Calendar className='w-3.5 h-3.5' /> Date Range{' '}
              <span className='text-destructive'>*</span>
            </Label>
            <DateRangePicker
              date={dateRange}
              setDate={setDateRange}
              className='w-full h-9'
              disabled={{ after: new Date() }}
            />
          </div>

          {/* User Filter */}
          <div className='xl:col-span-4 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5 text-muted-foreground'>
              <User className='w-3.5 h-3.5' /> User
            </Label>

            <UserSelector
              value={filterUser}
              onChange={setFilterUser}
              placeholder='Filter by user...'
              className='h-9'
            />
          </div>

          {/* Log Type Filter */}
          <div className='xl:col-span-3 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5 text-muted-foreground'>
              <FileText className='w-3.5 h-3.5' /> Log Type
            </Label>
            <Popover
              open={openLogTypeSelect}
              onOpenChange={setOpenLogTypeSelect}
            >
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={openLogTypeSelect}
                  className='w-full justify-between h-9 bg-background/50 text-xs font-normal'
                >
                  {filterType && filterType !== 'ALL'
                    ? logTypeOptions.find(option => option.value === filterType)
                        ?.label
                    : 'All Types'}
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[200px] p-0' align='start'>
                <Command>
                  <CommandInput placeholder='Search log type...' />
                  <CommandList>
                    <CommandEmpty>No log type found.</CommandEmpty>
                    <CommandGroup>
                      {logTypeOptions.map(option => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={currentValue => {
                            setFilterType(option.value)
                            setOpenLogTypeSelect(false)
                          }}
                          className='text-xs'
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              filterType === option.value
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Actions */}
          <div className='xl:col-span-2 flex items-center gap-2'>
            <Button
              variant='default'
              size='sm'
              onClick={handleSearch}
              disabled={isSearching || !dateRange?.from || !dateRange?.to}
              className='h-9 gap-2 flex-1 xl:flex-none px-4  max-w-fit'
            >
              {isSearching ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Search className='w-4 h-4' />
              )}
              Search
            </Button>

            {hasActiveFilters && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  resetFilters()
                  // setTimeout(() => handleSearch(), 0)
                }}
                disabled={isSearching}
                className='h-9 gap-2 flex-1 xl:flex-none'
              >
                <RotateCcw className='w-4 h-4' />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
