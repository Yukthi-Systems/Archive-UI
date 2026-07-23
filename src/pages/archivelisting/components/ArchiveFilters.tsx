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

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card } from '@/components/ui/card'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Calendar,
  Check,
  ChevronDown,
  Download,
  Info,
  Loader2,
  Paperclip,
  Search,
  Text,
  User,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  X,
} from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { type ExportFormat } from '@/hooks/useExport'
import { cn } from '@/lib/utils'

interface ArchiveFiltersProps {
  isRequestingDownload: boolean
  handleDownloadRequest: () => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  dateRange: DateRange | undefined
  setDateRange: (range: DateRange | undefined) => void
  filterAttachment: string
  setFilterAttachment: (val: string) => void
  senderEmail: string
  setSenderEmail: (val: string) => void
  recipientEmails: string
  setRecipientEmails: (val: string) => void
  hasMailboxPermissions: boolean | undefined
  mailboxOptions: string[]
  showFromSuggestions: boolean
  setShowFromSuggestions: (val: boolean) => void
  showToSuggestions: boolean
  setShowToSuggestions: (val: boolean) => void
  isSearching: boolean
  handleSearch: () => void
  hasActiveFilters: boolean | string | DateRange | undefined
  resetFilters: () => void
  ascendingOrder: boolean
  setAscendingOrder: (val: boolean) => void
  isExporting: boolean
  handleExport: (format: ExportFormat) => void
  hasData: boolean
  clearFilters: () => void
  hasAdvancedSearch?: boolean
  hasBodySearch?: boolean
  hasExtendedDateRange?: boolean
  bodyQuery?: string
  setBodyQuery?: (val: string) => void
  searchLogic?: 'AND' | 'OR'
  setSearchLogic?: (val: 'AND' | 'OR') => void
  matchType?: 'has' | 'has_not'
  setMatchType?: (val: 'has' | 'has_not') => void
}

export function ArchiveFilters({
  isRequestingDownload,
  handleDownloadRequest,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  filterAttachment,
  setFilterAttachment,
  senderEmail,
  setSenderEmail,
  recipientEmails,
  setRecipientEmails,
  hasMailboxPermissions,
  mailboxOptions,
  showFromSuggestions,
  setShowFromSuggestions,
  showToSuggestions,
  setShowToSuggestions,
  isSearching,
  handleSearch,
  hasActiveFilters,
  resetFilters,
  isExporting,
  handleExport,
  hasData,
  clearFilters,
  hasAdvancedSearch,
  hasBodySearch,
  hasExtendedDateRange,
  bodyQuery,
  setBodyQuery,
  searchLogic,
  setSearchLogic,
  matchType,
  setMatchType,
}: ArchiveFiltersProps) {
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)

  return (
    <Card className='border rounded-lg'>
      <div className='p-4 lg:p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-11 gap-4'>
          {/* Subject */}
          <div className='xl:col-span-5 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5'>
              <Text className='w-3.5 h-3.5' /> Subject
            </Label>
            <Input
              placeholder='Search subject...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='h-9'
            />
          </div>

          {/* Date Range */}
          <div className='xl:col-span-4 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5'>
              <Calendar className='w-3.5 h-3.5' /> Date Range{' '}
              <span className='text-destructive'>*</span>
            </Label>
            <DateRangePicker
              date={dateRange}
              setDate={setDateRange}
              className='w-full h-9'
              disabled={
                hasExtendedDateRange ? undefined : { after: new Date() }
              }
              maxDays={hasExtendedDateRange ? 3650 : 90}
            />
          </div>

          {/* Attachments */}
          <div className='xl:col-span-2 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5'>
              <Paperclip className='w-3.5 h-3.5' /> Attachments
            </Label>
            <Select
              value={filterAttachment}
              onValueChange={setFilterAttachment}
            >
              <SelectTrigger className='h-9 w-full'>
                <SelectValue placeholder='Any' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>Any</SelectItem>
                <SelectItem value='true'>With</SelectItem>
                <SelectItem value='false'>Without</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* From Address */}
          <div className='xl:col-span-3 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5'>
              <User className='w-3.5 h-3.5' /> From Address
            </Label>
            {hasMailboxPermissions ? (
              <div className='space-y-1'>
                <div className='relative'>
                  <Input
                    placeholder='Select sender...'
                    value={senderEmail}
                    onChange={e => setSenderEmail(e.target.value)}
                    onFocus={() => setShowFromSuggestions(true)}
                    // Delayed blur to allow click on suggestion
                    onBlur={() =>
                      setTimeout(() => setShowFromSuggestions(false), 200)
                    }
                    className='h-9 pr-8'
                  />
                  <ChevronDown className='absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none' />
                  {showFromSuggestions && (
                    <div className='absolute top-full left-0 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto z-50'>
                      <div className='p-1'>
                        {mailboxOptions
                          .filter(email => !senderEmail.includes(email))
                          .map(email => (
                            <div
                              key={email}
                              className='px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer flex items-center'
                              onMouseDown={e => {
                                e.preventDefault() // Prevent blur
                                const current = senderEmail
                                  .trim()
                                  .replace(/,$/, '')
                                setSenderEmail(
                                  current ? `${current}, ${email}` : email
                                )
                                setShowFromSuggestions(false)
                              }}
                            >
                              <User className='w-3.5 h-3.5 mr-2 text-muted-foreground' />
                              {email}
                            </div>
                          ))}
                        {mailboxOptions.filter(
                          email => !senderEmail.includes(email)
                        ).length === 0 && (
                          <div className='px-2 py-2 text-xs text-muted-foreground text-center'>
                            No more suggestions
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className='flex items-center gap-1 text-[10px] text-muted-foreground'>
                  <Info className='w-3 h-3 shrink-0' />
                  At least one of From/To Address is required.
                </p>
              </div>
            ) : (
              <div className='space-y-1'>
                <Input
                  placeholder='Type sender email...'
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                  className='h-9'
                />
                <p className='flex items-center gap-1 text-[10px] text-muted-foreground'>
                  <Info className='w-3 h-3 shrink-0' />
                  Enter a single sender email address to filter.
                </p>
              </div>
            )}
          </div>

          {/* To Address */}
          <div className='xl:col-span-3 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5'>
              <User className='w-3.5 h-3.5' /> To Address
            </Label>
            {hasMailboxPermissions ? (
              <div className='space-y-1'>
                <div className='relative'>
                  <div
                    role='button'
                    tabIndex={0}
                    onClick={() => setShowToSuggestions(!showToSuggestions)}
                    onBlur={() =>
                      setTimeout(() => setShowToSuggestions(false), 150)
                    }
                    className='min-h-9 h-auto w-full flex flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring'
                  >
                    {recipientEmails
                      .split(',')
                      .map(email => email.trim())
                      .filter(Boolean).length > 0 ? (
                      recipientEmails
                        .split(',')
                        .map(email => email.trim())
                        .filter(Boolean)
                        .map(email => (
                          <span
                            key={email}
                            className='inline-flex items-center gap-1 bg-accent text-accent-foreground rounded px-1.5 py-0.5 text-xs'
                          >
                            {email}
                            <X
                              className='w-3 h-3 cursor-pointer hover:text-destructive'
                              onMouseDown={e => {
                                e.preventDefault()
                                const remaining = recipientEmails
                                  .split(',')
                                  .map(x => x.trim())
                                  .filter(x => x && x !== email)
                                setRecipientEmails(remaining.join(', '))
                              }}
                            />
                          </span>
                        ))
                    ) : (
                      <span className='text-muted-foreground'>
                        Select recipient(s)...
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0 transition-transform',
                        showToSuggestions && 'rotate-180'
                      )}
                    />
                  </div>
                  {showToSuggestions && (
                    <div className='absolute top-full left-0 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto z-50'>
                      <div className='p-1'>
                        {mailboxOptions.map(email => {
                          const selected = recipientEmails
                            .split(',')
                            .map(x => x.trim())
                            .includes(email)
                          return (
                            <div
                              key={email}
                              className={cn(
                                'px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer flex items-center justify-between',
                                selected && 'bg-accent/50'
                              )}
                              onMouseDown={e => {
                                e.preventDefault() // Prevent blur
                                const current = recipientEmails
                                  .split(',')
                                  .map(x => x.trim())
                                  .filter(Boolean)
                                const next = selected
                                  ? current.filter(x => x !== email)
                                  : [...current, email]
                                setRecipientEmails(next.join(', '))
                              }}
                            >
                              <span className='flex items-center'>
                                <User className='w-3.5 h-3.5 mr-2 text-muted-foreground' />
                                {email}
                              </span>
                              {selected && (
                                <Check className='w-3.5 h-3.5 text-primary' />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='space-y-1'>
                <Input
                  placeholder='Type recipient email(s)...'
                  value={recipientEmails}
                  onChange={e => setRecipientEmails(e.target.value)}
                  className='h-9'
                />
                <p className='flex items-center gap-1 text-[10px] text-muted-foreground'>
                  <Info className='w-3 h-3 shrink-0' />
                  Separate multiple recipient emails with commas.
                </p>
              </div>
            )}
          </div>

          {/* Advanced Search Options */}
          {/* {hasBodySearch && ( */}
          {/* <div className='xl:col-span-5 space-y-1.5'>
                        <Label className='text-xs font-medium flex items-center gap-1.5'>
                            <Text className='w-3.5 h-3.5' /> Body Search
                        </Label>
                        <Input
                            placeholder='Search body...'
                            value={bodyQuery}
                            onChange={e => setBodyQuery && setBodyQuery(e.target.value)}
                            className='h-9'
                        />
                    </div> */}
          {/* )} */}

          {/* {hasAdvancedSearch && ( */}
          {/* <>
                        <div className='xl:col-span-3 space-y-1.5'>
                            <Label className='text-xs font-medium flex items-center gap-1.5'>
                                Search Logic
                            </Label>
                            <Select value={searchLogic} onValueChange={(v) => setSearchLogic && setSearchLogic(v as 'AND' | 'OR')}>
                                <SelectTrigger className='h-9 w-full'>
                                    <SelectValue placeholder='AND / OR' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='AND'>Match All (AND)</SelectItem>
                                    <SelectItem value='OR'>Match Any (OR)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='xl:col-span-3 space-y-1.5'>
                            <Label className='text-xs font-medium flex items-center gap-1.5'>
                                Match Type
                            </Label>
                            <Select value={matchType} onValueChange={(v) => setMatchType && setMatchType(v as 'has' | 'has_not')}>
                                <SelectTrigger className='h-9 w-full'>
                                    <SelectValue placeholder='Has / Has Not' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='has'>Must Have</SelectItem>
                                    <SelectItem value='has_not'>Must Not Have</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </> */}
          {/* )} */}
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-11 gap-4 pt-1'>
            {/* Actions */}
            <div className='xl:col-span-3 flex items-center gap-2'>
              <Button
                variant='default'
                size='sm'
                onClick={handleSearch}
                disabled={
                  isSearching ||
                  !dateRange?.from ||
                  !dateRange?.to ||
                  (hasMailboxPermissions && !senderEmail && !recipientEmails)
                }
                className='h-9 gap-2'
              >
                {isSearching ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Search className='w-4 h-4' />
                )}
                Search
              </Button>

              {hasActiveFilters && (
                <>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={resetFilters}
                    disabled={isSearching}
                    className='h-9 gap-2'
                    title='Reset all data, including filter values and the email list.'
                  >
                    <RotateCcw className='w-4 h-4' />
                    <span className='hidden lg:inline'>Reset</span>
                  </Button>

                  {/* {
                            hasActiveFilters && (
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={clearFilters}
                                    disabled={isSearching}
                                    className='h-9 gap-2'
                                    title='Clear all filters.'
                                >
                                    <RotateCcw className='w-4 h-4' />
                                    <span className='hidden lg:inline'>Clear Filters</span>
                                </Button>
                            )
                        } */}
                  <div className='xl:col-span-2 flex items-center gap-2'>
                    {hasData && (
                      <>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setShowDownloadConfirm(true)}
                          disabled={isRequestingDownload}
                          className='h-9 gap-2 flex-1'
                        >
                          {isRequestingDownload ? (
                            <Loader2 className='w-4 h-4 animate-spin' />
                          ) : (
                            <Download className='w-4 h-4' />
                          )}
                          <span className='hidden lg:inline'>Download</span>
                        </Button>

                        <AlertDialog
                          open={showDownloadConfirm}
                          onOpenChange={setShowDownloadConfirm}
                        >
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Confirm Download Request
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to request a download for
                                the filtered emails? This will submit a download
                                request based on your current filter criteria.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  handleDownloadRequest()
                                  setShowDownloadConfirm(false)
                                }}
                              >
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='outline'
                              size='sm'
                              disabled={isExporting || !hasActiveFilters}
                              className='h-9 gap-2 flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40'
                            >
                              {isExporting ? (
                                <Loader2 className='w-4 h-4 animate-spin' />
                              ) : (
                                <FileSpreadsheet className='w-4 h-4' />
                              )}
                              <span className='hidden lg:inline'>Export</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => handleExport('excel')}
                            >
                              <FileSpreadsheet className='w-4 h-4 mr-2' />
                              Export to Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExport('csv')}
                            >
                              <FileText className='w-4 h-4 mr-2' />
                              Export to CSV
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
