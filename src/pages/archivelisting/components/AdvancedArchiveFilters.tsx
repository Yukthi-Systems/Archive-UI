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

import { useRef, useState } from 'react'
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
  Plus,
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
import {
  sanitizeAlphanumericSpaces,
  sanitizeEmailListInput,
} from '@/utils/inputValidation'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AdvancedArchiveFiltersProps {
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

export function AdvancedArchiveFilters({
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
}: AdvancedArchiveFiltersProps) {
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const [toInputValue, setToInputValue] = useState('')
  const toInputRef = useRef<HTMLInputElement>(null)
  const [subjectHasInvalidChars, setSubjectHasInvalidChars] = useState(false)
  const [bodyHasInvalidChars, setBodyHasInvalidChars] = useState(false)
  const [senderHasInvalidChars, setSenderHasInvalidChars] = useState(false)
  const [recipientHasInvalidChars, setRecipientHasInvalidChars] =
    useState(false)
  const [toHasInvalidChars, setToHasInvalidChars] = useState(false)

  const ALPHANUMERIC_HINT = 'Only letters, numbers, and spaces are allowed.'
  const EMAIL_CHARS_HINT =
    'Only letters, numbers, and email symbols (@ . - _ + ,) are allowed.'

  const currentRecipients = recipientEmails
    .split(',')
    .map(email => email.trim())
    .filter(Boolean)

  const addRecipients = (emails: string[]) => {
    const merged = [...currentRecipients]
    emails
      .map(email => email.trim())
      .filter(email => EMAIL_REGEX.test(email))
      .forEach(email => {
        if (!merged.includes(email)) merged.push(email)
      })
    setRecipientEmails(merged.join(', '))
  }
  const addRecipient = (email: string) => addRecipients([email])

  const toQuery = toInputValue.trim().toLowerCase()
  const toMatches = mailboxOptions
    .filter(email => email !== senderEmail.trim())
    .filter(email => !toQuery || email.toLowerCase().includes(toQuery))
  const toIsValidEmail = EMAIL_REGEX.test(toInputValue.trim())
  const toShowInvalidHint = toInputValue.trim() !== '' && !toIsValidEmail
  const canAddCustomTo =
    toIsValidEmail &&
    !mailboxOptions.some(email => email.toLowerCase() === toQuery) &&
    !currentRecipients.includes(toInputValue.trim())

  const fromQuery = senderEmail.trim().toLowerCase()
  const fromMatches = mailboxOptions
    .filter(email => email !== senderEmail.trim())
    .filter(email => !fromQuery || email.toLowerCase().includes(fromQuery))

  return (
    <Card className='border rounded-lg bg-slate-50 dark:bg-slate-900/50'>
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
              onChange={e => {
                const raw = e.target.value
                const sanitized = sanitizeAlphanumericSpaces(raw)
                setSubjectHasInvalidChars(sanitized !== raw)
                setSearchQuery(sanitized)
              }}
              className='h-9 bg-background'
            />
            {subjectHasInvalidChars && (
              <p className='text-[10px] text-destructive'>
                {ALPHANUMERIC_HINT}
              </p>
            )}
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
              className='w-full h-9 bg-background'
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
              <SelectTrigger className='h-9 w-full bg-background'>
                <SelectValue placeholder='Any' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>Any</SelectItem>
                <SelectItem value='true'>With</SelectItem>
                <SelectItem value='false'>Without</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Body Search */}
          <div className='xl:col-span-5 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5'>
              <Text className='w-3.5 h-3.5' /> Body Search
            </Label>
            <Input
              placeholder='Search body...'
              value={bodyQuery}
              onChange={e => {
                const raw = e.target.value
                const sanitized = sanitizeAlphanumericSpaces(raw)
                setBodyHasInvalidChars(sanitized !== raw)
                if (setBodyQuery) setBodyQuery(sanitized)
              }}
              className='h-9 bg-background'
            />
            {bodyHasInvalidChars && (
              <p className='text-[10px] text-destructive'>
                {ALPHANUMERIC_HINT}
              </p>
            )}
          </div>

          {/* To Address */}
          <div className='xl:col-span-4 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5'>
              <User className='w-3.5 h-3.5' /> To Address
              {!senderEmail.trim() && !recipientEmails.trim() && (
                <span className='text-destructive'>*</span>
              )}
            </Label>
            {hasMailboxPermissions ? (
              <div className='space-y-1'>
                <div className='relative'>
                  <div
                    onClick={() => toInputRef.current?.focus()}
                    className='min-h-9 h-auto w-full flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm cursor-text focus-within:ring-1 focus-within:ring-ring'
                  >
                    {currentRecipients.map(email => (
                      <span
                        key={email}
                        className='inline-flex items-center gap-1 bg-accent text-accent-foreground rounded px-1.5 py-0.5 text-xs'
                      >
                        {email}
                        <X
                          className='w-3 h-3 cursor-pointer hover:text-destructive'
                          onMouseDown={e => {
                            e.preventDefault()
                            setRecipientEmails(
                              currentRecipients
                                .filter(x => x !== email)
                                .join(', ')
                            )
                          }}
                        />
                      </span>
                    ))}
                    <input
                      ref={toInputRef}
                      value={toInputValue}
                      placeholder={
                        currentRecipients.length === 0
                          ? 'Add recipient(s)...'
                          : ''
                      }
                      onChange={e => {
                        const rawInput = e.target.value
                        const raw = sanitizeEmailListInput(rawInput)
                        setToHasInvalidChars(raw !== rawInput)
                        if (raw.includes(',')) {
                          const parts = raw.split(',')
                          addRecipients(parts.slice(0, -1))
                          setToInputValue(parts[parts.length - 1])
                        } else {
                          setToInputValue(raw)
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (EMAIL_REGEX.test(toInputValue.trim())) {
                            addRecipient(toInputValue)
                            setToInputValue('')
                          }
                        } else if (
                          e.key === 'Backspace' &&
                          !toInputValue &&
                          currentRecipients.length > 0
                        ) {
                          setRecipientEmails(
                            currentRecipients.slice(0, -1).join(', ')
                          )
                        }
                      }}
                      onFocus={() => setShowToSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowToSuggestions(false), 150)
                        if (EMAIL_REGEX.test(toInputValue.trim())) {
                          addRecipient(toInputValue)
                          setToInputValue('')
                        }
                      }}
                      className='flex-1 min-w-[10ch] bg-transparent outline-none text-sm placeholder:text-muted-foreground'
                    />
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0 transition-transform cursor-pointer',
                        showToSuggestions && 'rotate-180'
                      )}
                      onMouseDown={e => {
                        e.preventDefault()
                        setShowToSuggestions(!showToSuggestions)
                      }}
                    />
                  </div>
                  {showToSuggestions && (
                    <div className='absolute top-full left-0 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto z-50'>
                      <div className='p-1'>
                        {toMatches.length > 0 && (
                          <p className='px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
                            Permitted mailboxes
                          </p>
                        )}
                        {toMatches.map(email => {
                          const selected = currentRecipients.includes(email)
                          return (
                            <div
                              key={email}
                              className={cn(
                                'px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer flex items-center justify-between',
                                selected && 'bg-accent/50'
                              )}
                              onMouseDown={e => {
                                e.preventDefault()
                                if (selected) {
                                  setRecipientEmails(
                                    currentRecipients
                                      .filter(x => x !== email)
                                      .join(', ')
                                  )
                                } else {
                                  addRecipient(email)
                                }
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
                        {canAddCustomTo && (
                          <div
                            className={cn(
                              'px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer flex items-center gap-2 text-primary',
                              toMatches.length > 0 && 'border-t mt-1 pt-2'
                            )}
                            onMouseDown={e => {
                              e.preventDefault()
                              addRecipient(toInputValue)
                              setToInputValue('')
                            }}
                          >
                            <Plus className='w-3.5 h-3.5 shrink-0' />
                            Add &ldquo;{toInputValue.trim()}&rdquo;
                          </div>
                        )}
                        {toMatches.length === 0 && !canAddCustomTo && (
                          <div className='px-2 py-2 text-xs text-muted-foreground text-center'>
                            {toShowInvalidHint
                              ? 'Enter a valid email address to add it.'
                              : 'No matches'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    'flex items-center gap-1 text-[10px]',
                    toShowInvalidHint || toHasInvalidChars
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  <Info className='w-3 h-3 shrink-0' />
                  {toHasInvalidChars
                    ? EMAIL_CHARS_HINT
                    : toShowInvalidHint
                      ? 'Enter a valid email address to add it.'
                      : 'Type any email and press Enter to add it.'}
                </p>
              </div>
            ) : (
              <div className='space-y-1'>
                <Input
                  placeholder='Recipient email(s), comma separated'
                  value={recipientEmails}
                  onChange={e => {
                    const raw = e.target.value
                    const sanitized = sanitizeEmailListInput(raw)
                    setRecipientHasInvalidChars(sanitized !== raw)
                    setRecipientEmails(sanitized)
                  }}
                  className='h-9 bg-background'
                />
                {recipientHasInvalidChars && (
                  <p className='text-[10px] text-destructive'>
                    {EMAIL_CHARS_HINT}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* From Address */}
          <div className='xl:col-span-2 space-y-1.5'>
            <Label className='text-xs font-medium flex items-center gap-1.5'>
              <User className='w-3.5 h-3.5' /> From Address
              {!senderEmail.trim() && !recipientEmails.trim() && (
                <span className='text-destructive'>*</span>
              )}
            </Label>
            {hasMailboxPermissions ? (
              <div className='space-y-1'>
                <div className='relative'>
                  <Input
                    placeholder='Select sender...'
                    value={senderEmail}
                    onChange={e => {
                      const rawInput = e.target.value
                      const raw = sanitizeEmailListInput(rawInput)
                      setSenderHasInvalidChars(raw !== rawInput)
                      if (raw.includes(',')) {
                        const parts = raw.split(',')
                        setSenderEmail(parts[parts.length - 1].trim())
                      } else {
                        setSenderEmail(raw)
                      }
                    }}
                    onFocus={() => setShowFromSuggestions(true)}
                    onClick={() => setShowFromSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowFromSuggestions(false), 200)
                    }
                    className='h-9 pr-14 bg-background'
                  />
                  {senderEmail && (
                    <X
                      className='absolute right-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-destructive'
                      onMouseDown={e => {
                        e.preventDefault()
                        setSenderEmail('')
                      }}
                    />
                  )}
                  <ChevronDown className='absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none' />
                  {showFromSuggestions && (
                    <div className='absolute top-full left-0 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto z-50'>
                      <div className='p-1'>
                        {fromMatches.map(email => (
                          <div
                            key={email}
                            className='px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer flex items-center'
                            onMouseDown={e => {
                              e.preventDefault()
                              setSenderEmail(email)
                              setShowFromSuggestions(false)
                            }}
                          >
                            <User className='w-3.5 h-3.5 mr-2 text-muted-foreground' />
                            {email}
                          </div>
                        ))}
                        {fromMatches.length === 0 && (
                          <div className='px-2 py-2 text-xs text-muted-foreground text-center'>
                            No matches
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    'flex items-center gap-1 text-[10px]',
                    senderHasInvalidChars
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  <Info className='w-3 h-3 shrink-0' />
                  {senderHasInvalidChars
                    ? EMAIL_CHARS_HINT
                    : 'At least one of From/To Address is required.'}
                </p>
              </div>
            ) : (
              <div className='space-y-1'>
                <div className='relative'>
                  <Input
                    placeholder='Single sender email'
                    value={senderEmail}
                    onChange={e => {
                      const rawInput = e.target.value
                      const raw = sanitizeEmailListInput(rawInput)
                      setSenderHasInvalidChars(raw !== rawInput)
                      if (raw.includes(',')) {
                        const parts = raw.split(',')
                        setSenderEmail(parts[parts.length - 1].trim())
                      } else {
                        setSenderEmail(raw)
                      }
                    }}
                    className='h-9 pr-8 bg-background'
                  />
                  {senderEmail && (
                    <X
                      className='absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-destructive'
                      onMouseDown={e => {
                        e.preventDefault()
                        setSenderEmail('')
                      }}
                    />
                  )}
                </div>
                {senderHasInvalidChars && (
                  <p className='text-[10px] text-destructive'>
                    {EMAIL_CHARS_HINT}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-11 gap-4 pt-1'>
          {/* Actions */}
          <div className='xl:col-span-11 flex justify-end items-center gap-2 mt-2'>
            {/* Always visible clear/reset */}
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

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowDownloadConfirm(true)}
                    disabled={isRequestingDownload}
                    className='h-9 gap-2'
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
                          Are you sure you want to request a download for the
                          filtered emails? This will submit a download request
                          based on your current filter criteria.
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
                        className='h-9 gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40'
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
                      <DropdownMenuItem onClick={() => handleExport('excel')}>
                        <FileSpreadsheet className='w-4 h-4 mr-2' />
                        Export to Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('csv')}>
                        <FileText className='w-4 h-4 mr-2' />
                        Export to CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}

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
              className='h-9 gap-2 ml-2'
            >
              {isSearching ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Search className='w-4 h-4' />
              )}
              Search
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
