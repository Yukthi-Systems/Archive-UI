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

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom'
import { format as formatDate, parseISO, isValid } from 'date-fns'
import { type PaginationState } from '@tanstack/react-table'
import { type ExportFormat } from '@/hooks/useExport'
import { exportDataToCSV } from '@/utils/exportUtils'

import { Loader2, Send, Globe, Mail, Check, ChevronsUpDown } from 'lucide-react'
import { parseEml, type ParsedEmail, processEmailHtml } from '@/utils/emlParser'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import { userAtom } from '@/atoms/user'
import { useArchiveDomains } from '@/hooks/useDomains'
import { useOrganization } from '@/hooks/useOrganization'
import {
  useArchiveSearch,
  useArchiveSearchCount,
  useDomainEmailCount,
  useRequestDownload,
  useForwardEmail,
  emlQueryKeys,
} from '@/hooks/useArchive'
import { archiveService } from '@/api/archive' // Import service directly for iterator
import { useQueryClient } from '@tanstack/react-query'
import type {
  ArchiveSearchParams,
  EmailArchiveItem,
} from '@/types/archive.types'
import ExcelJS from 'exceljs'
import { auditService } from '@/api/audit'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import { SendNotification } from '@/api/notification'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArchiveDataTable } from './components/ArchiveDataTable'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import { type DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { AttachmentViewer } from '@/components/common/AttachmentViewer'
import { base64ToBlob } from '@/utils/attachmentUtils'
import { ArchiveFilters } from './components/ArchiveFilters'
import { AdvancedArchiveFilters } from './components/AdvancedArchiveFilters'
import { getColumns } from './components/columns'
import { EmailPreviewDialog } from './components/EmailPreviewDialog'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ArchiveLoader } from '@/components/common/ArchiveLoader'
import { useAccessPermission } from '@/utils/accessPermission'
import { Switch } from '@/components/ui/switch'

const Listing = () => {
  const { domainName, archiveId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const isInitialMount = useRef(true)
  const [selectedEmail, setSelectedEmail] = useState<EmailArchiveItem | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  })

  // View/Action State
  const [parsedEmail, setParsedEmail] = useState<ParsedEmail | null>(null)
  const [rawEmlContent, setRawEmlContent] = useState<string | null>(null)
  const [isForwardOpen, setIsForwardOpen] = useState(false)
  const [forwardList, setForwardList] = useState('')
  const [isExporting, setIsExporting] = useState(false) // New state for export

  const [isLoadingEmail, setIsLoadingEmail] = useState(false)

  // Attachment Preview State
  const [previewAttachment, setPreviewAttachment] = useState<{
    filename: string
    contentType: string
    content: string
    size: number
  } | null>(null)
  const [previewAllAttachments, setPreviewAllAttachments] = useState<any[]>([])
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false)

  // User and Domain Logic
  const [currentUser] = useAtom(userAtom)
  const { data: domainsData, isLoading: isLoadingDomains } = useArchiveDomains()
  const isDomainsReady = !isLoadingDomains && !!domainsData
  useOrganization()
  const queryClient = useQueryClient()

  // Archive Search Hook
  const {
    mutate: searchArchives,
    data: searchResults,
    isPending: isSearching,
    reset: resetSearchResults,
  } = useArchiveSearch({
    onError: error => {
      toast.error(`Search failed: ${error.message}`)
    },
  })

  const data = useMemo(() => {
    if (!searchResults) return []
    return searchResults.map((item: any) => ({
      ...item,
      archive_time: new Date(item.archive_time),
    }))
  }, [searchResults])

  // Archive Search Count Hook
  const {
    mutate: searchCount,
    data: searchCountResult,
    reset: resetSearchCount,
  } = useArchiveSearchCount()

  // Build the list of available domains based on permissions
  const availableDomains = useMemo(() => {
    return (
      domainsData?.filter(domain => {
        if (
          !currentUser?.domain_permissions ||
          currentUser.domain_permissions.length === 0
        )
          return true
        return currentUser.domain_permissions.includes(domain)
      }) || []
    )
  }, [domainsData, currentUser])

  // Mailbox Permissions Check
  const hasMailboxPermissions = useMemo(() => {
    return (
      currentUser?.mailbox_permissions &&
      currentUser.mailbox_permissions.length > 0
    )
  }, [currentUser])

  const mailboxOptions = currentUser?.mailbox_permissions || []

  // Filter State
  const [searchQuery, setSearchQuery] = useState('')
  // Default date range: last one month
  const defaultDateRange: DateRange = {
    from: (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 1)
      return d
    })(),
    to: new Date(),
  }
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    defaultDateRange
  )

  // Simplifed From/To State
  const [senderEmail, setSenderEmail] = useState('')
  const [recipientEmails, setRecipientEmails] = useState('')

  const [filterDomain, setFilterDomain] = useState<string | null>(null)
  const [domainPopoverOpen, setDomainPopoverOpen] = useState(false)
  const [filterAttachment, setFilterAttachment] = useState('none')
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [ascendingOrder, setAscendingOrder] = useState(false)

  const [bodyQuery, setBodyQuery] = useState('')
  const [searchLogic, setSearchLogic] = useState<'AND' | 'OR'>('AND')
  const [matchType, setMatchType] = useState<'has' | 'has_not'>('has')

  const hasAdvancedSearch = useAccessPermission('archive:adanced:view')
  const hasBodySearch = useAccessPermission('archive:body:view')
  const hasExtendedDateRange = useAccessPermission('archive:extended:view')

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  // Domain Email Count Hook
  const {
    data: emailCount,
    refetch: refetchEmailCount,
    isLoading: isLoadingCount,
  } = useDomainEmailCount(filterDomain)

  // Pagination Keys State
  const [pageKeys, setPageKeys] = useState<Record<number, string | undefined>>(
    {}
  )
  const [pageTimes, setPageTimes] = useState<
    Record<number, string | undefined>
  >({})

  // Store active search params
  const [activeSearchParams, setActiveSearchParams] =
    useState<ArchiveSearchParams | null>(null)

  // Effect to update keys when data arrives
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      const lastItem = searchResults[searchResults.length - 1]
      const nextPageIndex = pagination.pageIndex + 1

      setPageKeys(prev => ({
        ...prev,
        [nextPageIndex]: lastItem.archive_id,
      }))

      setPageTimes(prev => ({
        ...prev,
        [nextPageIndex]: new Date(
          Number(lastItem.archive_time) * 1000
        ).toISOString(),
      }))
    }
  }, [searchResults, pagination.pageIndex])

  // Re-trigger search when sorting order changes
  useEffect(() => {
    if (
      activeSearchParams &&
      activeSearchParams.ascending_order !== ascendingOrder
    ) {
      const newParams = {
        ...activeSearchParams,
        ascending_order: ascendingOrder,
      }

      setActiveSearchParams(newParams)
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
      setPageKeys({})
      setPageTimes({})

      executeSearch(newParams, undefined, undefined)
    }
  }, [ascendingOrder, activeSearchParams])

  // Set default domain when availableDomains loads, or redirect if current domain
  // is not accessible by the logged-in user (e.g. after switching accounts)
  useEffect(() => {
    if (!isDomainsReady || availableDomains.length === 0) return

    const domainIsInvalid =
      !domainName || !availableDomains.includes(domainName)

    if (domainIsInvalid) {
      navigate(`/archive/${availableDomains[0]}${location.search}`, {
        replace: true,
      })
    }
  }, [availableDomains, isDomainsReady, domainName, navigate, location.search])

  // Sync local filterDomain with path param
  useEffect(() => {
    if (domainName) {
      setFilterDomain(domainName)
    }
  }, [domainName])

  // 1. Sync local state from URL search params (on mount and when URL changes)
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())

    if (params.subject) setSearchQuery(params.subject)
    if (params.from) setSenderEmail(params.from)
    if (params.to) setRecipientEmails(params.to)
    if (params.attachments) setFilterAttachment(params.attachments)
    if (params.ascending) setAscendingOrder(params.ascending === 'true')
    if (params.advanced) setShowAdvancedSearch(params.advanced === 'true')
    if (params.body) setBodyQuery(params.body)
    if (params.logic) setSearchLogic(params.logic as 'AND' | 'OR')
    if (params.match) setMatchType(params.match as 'has' | 'has_not')

    if (params.start || params.end) {
      const from = params.start ? parseISO(params.start) : undefined
      const to = params.end ? parseISO(params.end) : undefined
      setDateRange({
        from: from && isValid(from) ? from : undefined,
        to: to && isValid(to) ? to : undefined,
      })
    }

    if (params.pageSize) {
      setPagination(prev => ({ ...prev, pageSize: Number(params.pageSize) }))
    }

    if (params.page) {
      const pageIdx = Number(params.page)
      setPagination(prev => ({ ...prev, pageIndex: pageIdx }))
      if (params.key && params.time) {
        setPageKeys(prev => ({ ...prev, [pageIdx]: params.key }))
        setPageTimes(prev => ({ ...prev, [pageIdx]: params.time }))
      }
    }

    // Automatically trigger search if enough params are present
    if (
      (params.start && params.end) ||
      params.subject ||
      params.from ||
      params.to ||
      params.body
    ) {
      // Small delay to ensure all states are set if needed, or just call handleSearch logic
      // But we need to avoid infinite loops, so we check if this was an external change
      if (isInitialMount.current) {
        // Handle initial search
        const initialParams: ArchiveSearchParams = {
          limit: Number(params.pageSize) || 50,
          ascending_order: params.ascending === 'true',
          domain_name: domainName || availableDomains[0],
        }

        if (params.start) initialParams.start_date = params.start
        if (params.end) initialParams.end_date = params.end
        if (params.subject) initialParams.subject_keyword = params.subject
        if (params.from) initialParams.sender_email = params.from
        if (params.to)
          initialParams.recipient_emails = params.to
            .split(',')
            .map(s => s.trim())
        if (params.attachments === 'true') initialParams.has_attachments = true
        if (params.attachments === 'false')
          initialParams.has_attachments = false
        if (params.advanced === 'true') {
          if (params.body) initialParams.body_keyword = params.body
          if (params.logic) initialParams.search_logic = params.logic as any
          if (params.match) initialParams.match_type = params.match as any
        }
        if (hasExtendedDateRange) initialParams.extended_data = true

        setActiveSearchParams(initialParams)
        searchCount(initialParams)
        executeSearch(
          initialParams,
          params.key || undefined,
          params.time || undefined
        )
      }
    }

    isInitialMount.current = false
  }, [searchParams, domainName, availableDomains, hasExtendedDateRange])

  // Reset parsed email content whenever a different email is opened
  useEffect(() => {
    setParsedEmail(null)
    setRawEmlContent(null)
  }, [archiveId])

  // 2. Sync selected email from URL path param
  useEffect(() => {
    if (archiveId && domainName) {
      const emailFromData = data.find(item => item.archive_id === archiveId)
      if (emailFromData) {
        setSelectedEmail(emailFromData)
        setIsModalOpen(true)
      } else if (!isModalOpen || selectedEmail?.archive_id !== archiveId) {
        setSelectedEmail({
          archive_id: archiveId,
          domain: domainName,
          email_subject: 'Loading...',
          from_address: '',
          to_addresses: [],
          archive_time: '0',
          raw_eml_size: 0,
          has_attachments: false,
          retention_days: 0,
        } as any)
        setIsModalOpen(true)
      }
    } else if (!archiveId && isModalOpen) {
      setIsModalOpen(false)
      setSelectedEmail(null)
    }
  }, [archiveId, domainName, data])

  // Calculate Page Count
  const totalEmails = searchCountResult ?? 0
  const pageCount = Math.ceil(totalEmails / pagination.pageSize)

  // Core Fetch Function
  const executeSearch = (
    params: ArchiveSearchParams,
    key?: string,
    time?: string
  ) => {
    const payload = {
      ...params,
      last_evaluated_key: key,
      last_evaluated_time: time,
    }
    if (!payload.last_evaluated_key) delete payload.last_evaluated_key
    if (!payload.last_evaluated_time) delete payload.last_evaluated_time

    searchArchives(payload)
  }

  const handleSearch = () => {
    refetchEmailCount()
    if (!dateRange?.from && !dateRange?.to) {
      toast.error('Please select a date range')
      return
    }

    const params: ArchiveSearchParams = {
      limit: pagination.pageSize,
      ascending_order: ascendingOrder,
    }

    if (filterDomain) {
      params.domain_name = filterDomain
    }

    if (dateRange?.from) {
      params.start_date = new Date(dateRange.from).toISOString()
    }
    if (dateRange?.to) {
      params.end_date = new Date(dateRange.to).toISOString()
    }
    if (searchQuery?.trim()) {
      params.subject_keyword = searchQuery.trim()
    }

    if (showAdvancedSearch && hasBodySearch && bodyQuery?.trim()) {
      params.body_keyword = bodyQuery.trim()
    }
    if (showAdvancedSearch && hasAdvancedSearch) {
      params.search_logic = searchLogic
      params.match_type = matchType
    }

    if (hasExtendedDateRange) {
      params.extended_data = true
    }

    // Validate 'From' Address
    let inputFromEmail: string | undefined
    if (senderEmail && senderEmail !== 'all_senders') {
      const candidates = senderEmail
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
      if (candidates.length > 1) {
        toast.error('Sender email field should take only one email id')
        return
      }
      if (candidates.length === 1) {
        const email = candidates[0]
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          toast.error(`Invalid 'From' email address: ${email}`)
          return
        }
        inputFromEmail = email
      }
    }

    // Validate 'To' Address
    let inputToEmails: string[] = []
    if (recipientEmails && recipientEmails !== 'all_recipients') {
      inputToEmails = recipientEmails
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = inputToEmails.filter(
        email => !emailRegex.test(email)
      )
      if (invalidEmails.length > 0) {
        toast.error(
          `Invalid 'To' email address(es): ${invalidEmails.join(', ')}`
        )
        return
      }
    }

    // Check Permissions
    if (hasMailboxPermissions) {
      const allowedEmails = mailboxOptions
      const hasFilters = !!inputFromEmail || inputToEmails.length > 0

      if (!hasFilters) {
        toast.error('Please specify either a "From" or "To" email address.')
        return
      }

      if (hasFilters) {
        const hasFromMatch =
          inputFromEmail && allowedEmails.includes(inputFromEmail)
        const hasToMatch = inputToEmails.some(email =>
          allowedEmails.includes(email)
        )

        if (!hasFromMatch && !hasToMatch) {
          toast.error(
            'You must include at least one permitted email in the From or To fields.'
          )
          return
        }
      }
    }

    // Update URL Search Params
    const newSearchParams = new URLSearchParams()
    if (searchQuery.trim()) newSearchParams.set('subject', searchQuery.trim())
    if (dateRange?.from)
      newSearchParams.set('start', dateRange.from.toISOString())
    if (dateRange?.to) newSearchParams.set('end', dateRange.to.toISOString())
    if (senderEmail && senderEmail !== 'all_senders')
      newSearchParams.set('from', senderEmail)
    if (recipientEmails && recipientEmails !== 'all_recipients')
      newSearchParams.set('to', recipientEmails)
    if (filterAttachment !== 'none')
      newSearchParams.set('attachments', filterAttachment)
    if (ascendingOrder) newSearchParams.set('ascending', 'true')
    if (showAdvancedSearch) {
      newSearchParams.set('advanced', 'true')
      if (bodyQuery.trim()) newSearchParams.set('body', bodyQuery.trim())
      if (searchLogic !== 'AND') newSearchParams.set('logic', searchLogic)
      if (matchType !== 'has') newSearchParams.set('match', matchType)
    }
    newSearchParams.set('pageSize', pagination.pageSize.toString())
    newSearchParams.set('page', '0')

    setSearchParams(newSearchParams)

    // Assign Parameters
    if (inputFromEmail) params.sender_email = inputFromEmail
    if (inputToEmails.length > 0) params.recipient_emails = inputToEmails
    if (filterAttachment === 'true') {
      params.has_attachments = true
    } else if (filterAttachment === 'false') {
      params.has_attachments = false
    }

    // Reset everything for new search
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
    setPageKeys({})
    setPageTimes({})
    setActiveSearchParams(params)

    searchCount(params)
    executeSearch(params, undefined, undefined)
  }

  const handlePaginationChange = useCallback(
    (updater: any) => {
      const nextState =
        typeof updater === 'function' ? updater(pagination) : updater

      // Handle Page Size Change
      if (nextState.pageSize !== pagination.pageSize) {
        setPagination({ ...nextState, pageIndex: 0 })
        setPageKeys({})
        setPageTimes({})

        if (activeSearchParams) {
          const newParams = { ...activeSearchParams, limit: nextState.pageSize }
          setActiveSearchParams(newParams)

          // Update URL
          const currentParams = new URLSearchParams(searchParams)
          currentParams.set('pageSize', nextState.pageSize.toString())
          currentParams.set('page', '0')
          currentParams.delete('key')
          currentParams.delete('time')
          setSearchParams(currentParams)

          executeSearch(newParams, undefined, undefined)
        }
        return
      }

      const newPageIndex = nextState.pageIndex

      if (newPageIndex === pagination.pageIndex) return

      const keyToUse = newPageIndex === 0 ? undefined : pageKeys[newPageIndex]
      const timeToUse = newPageIndex === 0 ? undefined : pageTimes[newPageIndex]

      if (newPageIndex > 0 && keyToUse === undefined) {
        toast.error('Cannot jump to this page directly.')
        return
      }

      setPagination(nextState)

      if (activeSearchParams) {
        const currentParams = {
          ...activeSearchParams,
          limit: nextState.pageSize,
        }

        // Update URL for pagination
        const currentSearchParams = new URLSearchParams(searchParams)
        currentSearchParams.set('page', newPageIndex.toString())
        if (keyToUse) currentSearchParams.set('key', keyToUse)
        else currentSearchParams.delete('key')
        if (timeToUse) currentSearchParams.set('time', timeToUse)
        else currentSearchParams.delete('time')

        if (searchCountResult) {
          currentSearchParams.set('total', searchCountResult.toString())
        }

        setSearchParams(currentSearchParams)

        executeSearch(currentParams, keyToUse, timeToUse)
      }
    },
    [
      pagination,
      activeSearchParams,
      pageKeys,
      pageTimes,
      searchArchives,
      searchParams,
      setSearchParams,
    ]
  )

  // Request Download Hook
  const { mutateAsync: requestDownload, isPending: isRequestingDownload } =
    useRequestDownload()

  // Forward Email Hook
  const { mutateAsync: forwardEmail, isPending: isForwarding } =
    useForwardEmail()

  const handleDownloadRequest = async () => {
    if (!dateRange?.from && !dateRange?.to) {
      toast.error('Please select a date range')
      return
    }

    const params: ArchiveSearchParams = {
      limit: pagination.pageSize,
      ascending_order: ascendingOrder,
    }

    if (filterDomain) {
      params.domain_name = filterDomain
    }

    if (dateRange?.from) {
      params.start_date = new Date(dateRange.from).toISOString()
    }
    if (dateRange?.to) {
      params.end_date = new Date(dateRange.to).toISOString()
    }
    if (searchQuery?.trim()) {
      params.subject_keyword = searchQuery.trim()
    }

    if (showAdvancedSearch && hasBodySearch && bodyQuery?.trim()) {
      params.body_keyword = bodyQuery.trim()
    }
    if (showAdvancedSearch && hasAdvancedSearch) {
      params.search_logic = searchLogic
      params.match_type = matchType
    }

    if (hasExtendedDateRange) {
      params.extended_data = true
    }
    // Validate 'From' Address
    let inputFromEmail: string | undefined
    if (senderEmail && senderEmail !== 'all_senders') {
      const candidates = senderEmail
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
      if (candidates.length > 1) {
        toast.error('Sender email field should take only one email id')
        return
      }
      if (candidates.length === 1) {
        const email = candidates[0]
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          toast.error(`Invalid 'From' email address: ${email}`)
          return
        }
        inputFromEmail = email
      }
    }

    // Validate 'To' Address
    let inputToEmails: string[] = []
    if (recipientEmails && recipientEmails !== 'all_recipients') {
      inputToEmails = recipientEmails
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = inputToEmails.filter(
        email => !emailRegex.test(email)
      )
      if (invalidEmails.length > 0) {
        toast.error(
          `Invalid 'To' email address(es): ${invalidEmails.join(', ')}`
        )
        return
      }
    }

    // Check Permissions
    if (hasMailboxPermissions) {
      const allowedEmails = mailboxOptions
      const hasFilters = !!inputFromEmail || inputToEmails.length > 0

      if (!hasFilters) {
        toast.error('Please specify either a "From" or "To" email address.')
        return
      }

      if (hasFilters) {
        const hasFromMatch =
          inputFromEmail && allowedEmails.includes(inputFromEmail)
        const hasToMatch = inputToEmails.some(email =>
          allowedEmails.includes(email)
        )

        if (!hasFromMatch && !hasToMatch) {
          toast.error(
            'You must include at least one permitted email in the From or To fields.'
          )
          return
        }
      }
    }

    if (inputFromEmail) params.sender_email = inputFromEmail
    if (inputToEmails.length > 0) params.recipient_emails = inputToEmails
    if (filterAttachment === 'true') {
      params.has_attachments = true
    } else if (filterAttachment === 'false') {
      params.has_attachments = false
    }

    try {
      const response: any = await requestDownload(params)
      toast.success(response || 'Download request submitted successfully')
      // handleViewDownloadRequest(params)
    } catch (error: any) {
      toast.error(error.message || 'Failed to request download')
    }
  }

  // const handleViewDownloadRequest = (params: ArchiveSearchParams) => {
  //   handleSearch()
  // }

  const handleExport = async (format: ExportFormat) => {
    if (!activeSearchParams) {
      toast.error('Please perform a search first before exporting.')
      return
    }

    const totalToExport = searchCountResult ?? 0
    if (totalToExport > 25000) {
      toast.error('Export is limited to 25,000 emails. Please Contact Admin.')
      return
    }

    if (totalToExport === 0) {
      toast.error('No emails to export.')
      return
    }

    setIsExporting(true)
    toast.info(
      `Starting ${format.toUpperCase()} export... This may take a while.`,
      { duration: 3000 }
    )

    const actorName =
      currentUser?.display_name || currentUser?.user_name || 'Unknown User'

    try {
      const allData: EmailArchiveItem[] = []
      let lastKey: string | undefined = undefined
      let lastTime: string | undefined = undefined
      let totalFetched = 0

      // Initial params from active search
      const baseParams = { ...activeSearchParams }
      delete baseParams.limit // Ensure we control the limit
      delete baseParams.last_evaluated_key
      delete baseParams.last_evaluated_time

      // Loop to fetch all pages
      while (true) {
        // Break if we exceed safety limit or user limit
        // (though > 25000 check above handles typical case, strict safety break here)
        if (totalFetched >= 25000) break

        const currentParams: ArchiveSearchParams = {
          ...baseParams,
          limit: 500,
          last_evaluated_key: lastKey,
          last_evaluated_time: lastTime,
        }

        // Remove undefined keys/times to match API expectations
        if (!lastKey) delete currentParams.last_evaluated_key
        if (!lastTime) delete currentParams.last_evaluated_time

        const response: any = await archiveService.searchArchives(currentParams)

        // Handle possible response structures just in case, but assuming Array based on types
        const batch = Array.isArray(response)
          ? response
          : (response as any).items || []

        if (batch.length === 0) break

        allData.push(...batch)
        totalFetched += batch.length

        // Progress toast update could go here

        if (batch.length < 500) {
          // End of data
          break
        }

        const lastItem = batch[batch.length - 1]
        lastKey = lastItem.archive_id
        // Format time as ISO string for next request
        lastTime = new Date(Number(lastItem.archive_time) * 1000).toISOString()
      }

      const filename = `email_archive_export_${formatDate(new Date(), 'yyyyMMdd_HHmmss')}`

      if (format === 'csv') {
        await exportDataToCSV(allData, {
          filename,
          fieldMappings: [
            { header: 'Archive ID', key: 'archive_id' },
            { header: 'Subject', key: 'email_subject' },
            { header: 'From', key: 'from_address' },
            {
              header: 'To',
              key: 'to_addresses',
              transform: (val: string[]) => val.join(', '),
            },
            { header: 'Domain', key: 'domain' },
            {
              header: 'Archive Time',
              key: 'archive_time',
              transform: val =>
                formatDate(new Date(Number(val) * 1000), 'yyyy-MM-dd HH:mm:ss'),
            },
            { header: 'Size (Bytes)', key: 'raw_eml_size' },
            {
              header: 'Has Attachments',
              key: 'has_attachments',
              transform: val => (val ? 'Yes' : 'No'),
            },
            { header: 'Retention Days', key: 'retention_days' },
          ],
        })
      } else {
        // Generate Excel
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Email Archive')

        worksheet.columns = [
          { header: 'Archive ID', key: 'archive_id', width: 36 },
          { header: 'Subject', key: 'email_subject', width: 40 },
          { header: 'From', key: 'from_address', width: 30 },
          { header: 'To', key: 'to_addresses', width: 30 },
          { header: 'Domain', key: 'domain', width: 20 },
          { header: 'Archive Time', key: 'archive_time', width: 25 },
          { header: 'Size (Bytes)', key: 'raw_eml_size', width: 15 },
          { header: 'Has Attachments', key: 'has_attachments', width: 15 },
          { header: 'Retention Days', key: 'retention_days', width: 15 },
        ]

        // Header style
        worksheet.getRow(1).font = { bold: true }

        allData.forEach(item => {
          worksheet.addRow({
            archive_id: item.archive_id,
            email_subject: item.email_subject,
            from_address: item.from_address,
            to_addresses: item.to_addresses.join(', '),
            domain: item.domain,
            archive_time: formatDate(
              new Date(Number(item.archive_time) * 1000),
              'yyyy-MM-dd HH:mm:ss'
            ),
            raw_eml_size: item.raw_eml_size,
            has_attachments: item.has_attachments ? 'Yes' : 'No',
            retention_days: item.retention_days,
          })
        })

        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      toast.success(
        `Successfully exported ${allData.length} records to ${format.toUpperCase()}.`
      )

      // Audit Log
      auditService.log(
        AUDIT_LOG_TYPES.ARCHIVE_EXPORT,
        `User ${actorName} exported Email Archive as ${format.toUpperCase()}`,
        `Action: Email Archive Export
Initiated By: ${actorName}
Format: ${format.toUpperCase()}
Record Count: ${allData.length}
Status: Success
Description: Successfully exported ${allData.length} emails.
Filters: ${activeSearchParams ? JSON.stringify(activeSearchParams) : 'None'}`
      )

      // Notification
      SendNotification({
        message: `Email archive export to ${format.toUpperCase()} completed successfully.`,
        type: 'success',
        entity: 'Archive',
        description: `${allData.length} records exported.`,
      })
    } catch (error: any) {
      console.error('Export failed:', error)
      toast.error(`Export failed: ${error.message}`)

      // Audit Log Failure
      auditService.log(
        AUDIT_LOG_TYPES.ARCHIVE_EXPORT_FAILED,
        `User ${actorName} failed to export Email Archive`,
        `Action: Email Archive Export Failed
Initiated By: ${actorName}
Format: ${format.toUpperCase()}
Status: Failed
Error: ${error.message || 'Unknown error'}
Description: Failed to export email archive.`
      )

      // Notification Failure
      SendNotification({
        message: 'Email archive export failed.',
        type: 'error',
        entity: 'Archive',
        description: error.message || 'Unknown error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDateRange(undefined)
    setSenderEmail('')
    setRecipientEmails('')
    setFilterAttachment('none')
    setBodyQuery('')
    setSearchLogic('AND')
    setMatchType('has')
    setShowAdvancedSearch(false)
  }

  const resetFilters = () => {
    clearFilters()
    resetSearchResults()
    resetSearchCount()
    setActiveSearchParams(null)
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
    setPageKeys({})
    setPageTimes({})
    setSearchParams({})
    navigate(`/archive/${domainName}`)
  }

  const hasActiveFilters =
    searchQuery ||
    dateRange ||
    (senderEmail && senderEmail !== 'all_senders') ||
    (recipientEmails && recipientEmails !== 'all_recipients') ||
    filterAttachment !== 'none' ||
    (showAdvancedSearch &&
      (bodyQuery || searchLogic !== 'AND' || matchType !== 'has'))

  const handleViewEmail = useCallback(
    (email: EmailArchiveItem) => {
      navigate(`/archive/${email.domain}/${email.archive_id}${location.search}`)
    },
    [navigate, location.search]
  )

  const handleCloseModal = useCallback(
    (open: boolean) => {
      if (!open) {
        navigate(`/archive/${domainName}${location.search}`)
      }
    },
    [navigate, domainName, location.search]
  )

  // NEW: Separate function to load full email content
  const handleLoadFullEmail = useCallback(
    async (email: EmailArchiveItem) => {
      setIsLoadingEmail(true)
      setParsedEmail(null)
      setRawEmlContent(null)

      try {
        const emlContent = await queryClient.ensureQueryData({
          queryKey: emlQueryKeys.detail(email.domain, email.archive_id),
          queryFn: () =>
            import('@/api/archive').then(m =>
              m.archiveService.fetchEml(
                email.domain,
                email.archive_id,
                true,
                'view',
                email.email_subject
              )
            ),
          staleTime: 1000 * 60 * 10,
        })

        setRawEmlContent(emlContent as string)
        const parsed = parseEml(emlContent as string)
        setParsedEmail(parsed)
      } catch (error) {
        console.error('Error fetching/parsing email:', error)
        toast.error('Failed to load email content')
      } finally {
        setIsLoadingEmail(false)
      }
    },
    [queryClient]
  )

  const handleCloseAttachmentViewer = useCallback(() => {
    setIsAttachmentViewerOpen(false)
    setPreviewAttachment(null)
    setPreviewAllAttachments([])
  }, [])

  const handleDownloadAttachment = (file: {
    filename: string
    contentType: string
    content: string
  }) => {
    const actorName = currentUser?.user_name || 'Unknown User'

    try {
      const blob = base64ToBlob(file.content, file.contentType)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      auditService.log(
        AUDIT_LOG_TYPES.ARCHIVE_DOWNLOAD,
        'EML Downloaded',
        `User ${actorName} downloaded EML for archive ID: ${selectedEmail?.archive_id} in domain: ${selectedEmail?.domain}.`
      )

      toast.success(`Downloaded ${file.filename}`)
    } catch (error) {
      console.error('Download failed', error)
      toast.error('Failed to download attachment')
    }
  }

  const handleViewAttachment = (
    file: {
      filename: string
      contentType: string
      content: string
      size: number
    },
    allFiles?: any[]
  ) => {
    setPreviewAttachment(file)
    setPreviewAllAttachments(allFiles || [file])
    setIsAttachmentViewerOpen(true)
  }

  const handleDownloadEml = useCallback(
    async (email: EmailArchiveItem | null, e?: React.MouseEvent) => {
      e?.stopPropagation()

      const targetEmail = email || selectedEmail

      if (!targetEmail) return

      try {
        let emlContent: string | null = null

        // If the requested email is the currently viewed one, reuse its content if available
        if (
          selectedEmail?.archive_id === targetEmail.archive_id &&
          rawEmlContent
        ) {
          emlContent = rawEmlContent
        }

        if (!emlContent) {
          emlContent = (await queryClient.ensureQueryData({
            queryKey: emlQueryKeys.detail(
              targetEmail.domain,
              targetEmail.archive_id
            ),
            queryFn: () =>
              import('@/api/archive').then(m =>
                m.archiveService.fetchEml(
                  targetEmail.domain,
                  targetEmail.archive_id,
                  true,
                  'download',
                  targetEmail.email_subject
                )
              ),
            staleTime: 1000 * 60 * 10,
          })) as string

          if (selectedEmail?.archive_id === targetEmail.archive_id) {
            setRawEmlContent(emlContent)
          }
        }

        const blob = new Blob([emlContent], { type: 'message/rfc822' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${targetEmail.archive_id}.eml`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Download started')
      } catch (error) {
        console.error('Download failed', error)
        toast.error('Failed to download email')
      }
    },
    [selectedEmail, rawEmlContent, queryClient]
  )

  const handlePrintEmail = useCallback(
    async (e?: React.MouseEvent) => {
      e?.stopPropagation()

      let contentToPrint = parsedEmail

      if (!contentToPrint) {
        try {
          const emlContent = (await queryClient.ensureQueryData({
            queryKey: emlQueryKeys.detail(
              selectedEmail!.domain,
              selectedEmail!.archive_id
            ),
            queryFn: () =>
              import('@/api/archive').then(m =>
                m.archiveService.fetchEml(
                  selectedEmail!.domain,
                  selectedEmail!.archive_id,
                  false
                )
              ),
          })) as string
          contentToPrint = parseEml(emlContent)
        } catch (error) {
          toast.error('Failed to prepare email for printing')
          return
        }
      }

      const processedHtmlBody = processEmailHtml(
        contentToPrint.htmlBody || null,
        contentToPrint.attachments || []
      )
      const finalBody =
        processedHtmlBody ||
        contentToPrint.textBody ||
        '<p>No content available</p>'

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Email - ${selectedEmail?.email_subject || 'Archive'}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        .header { border-bottom: 1px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
                        .label { font-weight: bold; color: #555; }
                        .content { line-height: 1.6; }
                        img { max-width: 100%; height: auto; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <p><span class="label">From:</span> ${contentToPrint.headers['from'] || selectedEmail?.from_address || ''}</p>
                        <p><span class="label">To:</span> ${contentToPrint.headers['to'] || selectedEmail?.to_addresses || ''}</p>
                        <p><span class="label">Subject:</span> ${contentToPrint.headers['subject'] || selectedEmail?.email_subject || ''}</p>
                         <p><span class="label">Date:</span> ${contentToPrint.headers['date'] || formatDate(new Date(), 'PPP')}</p>
                    </div>
                    <div class="content">${finalBody}</div>
                </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    },
    [selectedEmail, parsedEmail, queryClient]
  )

  const openForwardModal = useCallback(
    (email: EmailArchiveItem, e?: React.MouseEvent) => {
      e?.stopPropagation()
      setSelectedEmail(email)
      setForwardList('')
      setIsForwardOpen(true)
    },
    []
  )

  const handleForwardSubmit = async () => {
    if (!forwardList.trim()) {
      toast.error('Please enter at least one email address')
      return
    }

    const emails = forwardList
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter(e => !emailRegex.test(e))
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email address(es): ${invalidEmails.join(', ')}`)
      return
    }

    if (!selectedEmail) return

    await forwardEmail(
      {
        domain_name: selectedEmail.domain,
        archive_id: selectedEmail.archive_id,
        forward_emails: emails,
        subject: selectedEmail.email_subject,
      },
      {
        onSuccess: (res: any) => {
          toast.success(res)
          setIsForwardOpen(false)
          setForwardList('')
        },
        onError: (error: any) => {
          const errorMsg = error.response.data.error
          toast.error(errorMsg)
        },
      }
    )
  }

  // Columns Definition
  const columns = useMemo(
    () =>
      getColumns(
        handleViewEmail,
        setSelectedEmail,
        handleDownloadEml,
        handlePrintEmail,
        openForwardModal,
        ascendingOrder,
        setAscendingOrder
      ),
    [
      handleViewEmail,
      setSelectedEmail,
      handleDownloadEml,
      handlePrintEmail,
      openForwardModal,
      ascendingOrder,
      setAscendingOrder,
    ]
  )

  const rowClassName = useCallback(
    () =>
      cn(
        'group transition-all duration-200 border-l-[3px] border-l-transparent hover:border-l-primary'
      ),
    []
  )

  return (
    <div className='space-y-2 p-4 md:p-0 h-[calc(100vh-100px)] w-full '>
      {/* Page Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        {/* LEFT SIDE: Breadcrumbs */}
        <div className='flex flex-col md:flex-row gap-4 md:justify-between md:items-center'>
          <Breadcrumbs className='mb-0 md:static' />
        </div>

        {/* RIGHT SIDE: Stats & Domain Selector */}
        <div className='flex items-center gap-2'>
          {hasAdvancedSearch && (
            <div className='flex items-center gap-2 px-2'>
              <Label
                htmlFor='advanced-search-mode'
                className='text-sm cursor-pointer whitespace-nowrap'
              >
                Advanced Search
              </Label>
              <Switch
                id='advanced-search-mode'
                checked={showAdvancedSearch}
                onCheckedChange={setShowAdvancedSearch}
              />
            </div>
          )}

          <div className='flex items-center gap-2 p-2 rounded-lg'>
            <Mail className='w-3 h-3 md:w-4 md:h-4 text-primary' />
            <p className='text-sm'>
              {isLoadingCount ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                `Total Emails :  ${(emailCount ?? 0).toLocaleString()}`
              )}
            </p>
          </div>

          {isLoadingDomains ? (
            <div className='flex items-center gap-2 text-muted-foreground text-xs'>
              <Loader2 className='w-3 h-3 animate-spin' /> Loading...
            </div>
          ) : (
            <Popover
              open={domainPopoverOpen}
              onOpenChange={setDomainPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={domainPopoverOpen}
                  className='w-[200px] h-9 justify-between bg-background/50 font-normal'
                >
                  <span className='truncate'>
                    {filterDomain ?? 'Select domain'}
                  </span>
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[220px] p-0' align='end'>
                <Command>
                  <CommandInput placeholder='Search domain...' />
                  <CommandList>
                    <CommandEmpty>No domain found.</CommandEmpty>
                    <CommandGroup>
                      {availableDomains.map((domain, index) => (
                        <CommandItem
                          key={index}
                          value={domain}
                          onSelect={val => {
                            setFilterDomain(val)
                            navigate(`/archive/${val}${location.search}`)
                            setDomainPopoverOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              filterDomain === domain
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {domain}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Filters */}
      {showAdvancedSearch && emailCount && emailCount > 0 ? (
        <AdvancedArchiveFilters
          isRequestingDownload={isRequestingDownload}
          handleDownloadRequest={handleDownloadRequest}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
          filterAttachment={filterAttachment}
          setFilterAttachment={setFilterAttachment}
          senderEmail={senderEmail}
          setSenderEmail={setSenderEmail}
          recipientEmails={recipientEmails}
          setRecipientEmails={setRecipientEmails}
          hasMailboxPermissions={hasMailboxPermissions}
          mailboxOptions={mailboxOptions}
          showFromSuggestions={showFromSuggestions}
          setShowFromSuggestions={setShowFromSuggestions}
          showToSuggestions={showToSuggestions}
          setShowToSuggestions={setShowToSuggestions}
          isSearching={isSearching}
          handleSearch={handleSearch}
          hasActiveFilters={hasActiveFilters}
          hasData={data && data.length > 0}
          resetFilters={resetFilters}
          ascendingOrder={ascendingOrder}
          setAscendingOrder={setAscendingOrder}
          isExporting={isExporting}
          handleExport={handleExport}
          clearFilters={clearFilters}
          hasAdvancedSearch={hasAdvancedSearch}
          hasBodySearch={hasBodySearch}
          hasExtendedDateRange={hasExtendedDateRange}
          bodyQuery={bodyQuery}
          setBodyQuery={setBodyQuery}
          searchLogic={searchLogic}
          setSearchLogic={setSearchLogic}
          matchType={matchType}
          setMatchType={setMatchType}
        />
      ) : emailCount && emailCount > 0 ? (
        <ArchiveFilters
          isRequestingDownload={isRequestingDownload}
          handleDownloadRequest={handleDownloadRequest}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
          filterAttachment={filterAttachment}
          setFilterAttachment={setFilterAttachment}
          senderEmail={senderEmail}
          setSenderEmail={setSenderEmail}
          recipientEmails={recipientEmails}
          setRecipientEmails={setRecipientEmails}
          hasMailboxPermissions={hasMailboxPermissions}
          mailboxOptions={mailboxOptions}
          showFromSuggestions={showFromSuggestions}
          setShowFromSuggestions={setShowFromSuggestions}
          showToSuggestions={showToSuggestions}
          setShowToSuggestions={setShowToSuggestions}
          isSearching={isSearching}
          handleSearch={handleSearch}
          hasActiveFilters={hasActiveFilters}
          hasData={data && data.length > 0}
          resetFilters={resetFilters}
          ascendingOrder={ascendingOrder}
          setAscendingOrder={setAscendingOrder}
          isExporting={isExporting}
          handleExport={handleExport}
          clearFilters={clearFilters}
          hasAdvancedSearch={hasAdvancedSearch}
          hasBodySearch={hasBodySearch}
          hasExtendedDateRange={hasExtendedDateRange}
          bodyQuery={bodyQuery}
          setBodyQuery={setBodyQuery}
          searchLogic={searchLogic}
          setSearchLogic={setSearchLogic}
          matchType={matchType}
          setMatchType={setMatchType}
        />
      ) : (
        <Card className='border rounded-lg'>
          <div className='p-4 lg:p-6 space-y-4 h-[calc(100vh-180px)] scrollbar-custom overflow-auto [&_div[data-slot=table-container]]:h-full [&_div[data-slot=table-container]]:overflow-auto flex flex-col items-center justify-center'>
            <div className='text-muted-foreground/50'>
              <Mail className='w-10 h-10' />
            </div>
            <p className='text-center text-muted-foreground text-sm font-medium'>
              {availableDomains.length === 0
                ? 'No Domain Selected'
                : 'No Emails Found'}
            </p>
            <p className='text-center text-muted-foreground text-xs'>
              Please select a domain to view emails or contact your
              administrator
            </p>
          </div>
        </Card>
      )}

      {/* Main Table Section */}
      {emailCount && emailCount > 0 ? (
        <Card className='border border-border/40  rounded-2xl overflow-hidden mt-4 bg-card'>
          <div className='p-0 overflow-x-auto relative min-h-[calc(100vh-350px)] flex flex-col'>
            {/* 1. LOADING STATE */}
            {isSearching && <ArchiveLoader className='min-h-[60vh]' />}
            {/* 2. DATA STATE */}
            {data && data.length > 0 ? (
              <ArchiveDataTable
                columns={columns}
                data={data}
                pageCount={pageCount}
                rowCount={totalEmails}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                onRowClick={handleViewEmail}
                rowClassName={rowClassName}
              />
            ) : (
              /* 3. EMPTY / INITIAL STATE (The Fix) */
              !isSearching && (
                <div className='flex-1 flex flex-col items-center justify-center py-20 text-center space-y-6'>
                  <div className='w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center'>
                    {activeSearchParams ? (
                      <div className='text-muted-foreground/50'>
                        <Mail className='w-10 h-10' />
                      </div>
                    ) : (
                      <div className='text-muted-foreground/50'>
                        <Globe className='w-10 h-10' />
                      </div>
                    )}
                  </div>

                  <div className='max-w-md space-y-2 px-4'>
                    <h3 className='text-xl font-semibold text-foreground'>
                      {activeSearchParams
                        ? 'No emails found'
                        : 'Ready to Search'}
                    </h3>
                    <p className='text-sm text-muted-foreground leading-relaxed'>
                      {activeSearchParams
                        ? "We couldn't find any emails matching your search criteria. Try adjusting your filters or date range."
                        : 'Select a date range and apply filters above to begin searching through the archives.'}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </Card>
      ) : null}
      {/* Email Preview Modal */}
      <EmailPreviewDialog
        isModalOpen={isModalOpen}
        setIsModalOpen={handleCloseModal}
        selectedEmail={selectedEmail}
        isLoadingEmail={isLoadingEmail}
        parsedEmail={parsedEmail}
        handleLoadFullEmail={handleLoadFullEmail}
        handleDownloadEml={handleDownloadEml}
        handlePrintEmail={handlePrintEmail}
        openForwardModal={openForwardModal}
        handleViewAttachment={handleViewAttachment}
        handleDownloadAttachment={handleDownloadAttachment}
      />

      {/* Forward Modal */}
      <Dialog open={isForwardOpen} onOpenChange={setIsForwardOpen}>
        <DialogContent className='max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle>Forward Email</DialogTitle>
            <DialogDescription>
              Enter the email addresses to forward this message to.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Recipients</Label>
              <Input
                placeholder='email@example.com, another@example.com'
                value={forwardList}
                onChange={e => setForwardList(e.target.value)}
              />
              <p className='text-xs text-muted-foreground'>
                Separate multiple emails with commas.
              </p>
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setIsForwardOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleForwardSubmit}
              disabled={isForwarding}
              className='gap-2'
            >
              {isForwarding ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Send className='w-4 h-4' />
              )}
              {isForwarding ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AttachmentViewer
        isOpen={isAttachmentViewerOpen}
        onClose={handleCloseAttachmentViewer}
        file={previewAttachment}
        allFiles={previewAllAttachments}
      />
    </div>
  )
}

export default Listing
