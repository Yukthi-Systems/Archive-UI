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

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import type { EmailArchiveItem } from '@/types/archive.types'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  Clock,
  CornerUpRight,
  Download,
  Eye,
  MoreHorizontal,
  Paperclip,
  Printer,
  ArrowDown,
  ArrowUp,
  User,
  Send,
} from 'lucide-react'
import {
  dateFormated,
  formatRetention,
  timeFormated,
} from '@/components/common/RetentionDuration'

// Helper for formatting bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const getColumns = (
  handleViewEmail: (email: EmailArchiveItem) => void,
  setSelectedEmail: (email: EmailArchiveItem) => void,
  handleDownloadEml: (email: EmailArchiveItem, event?: any) => void,
  handlePrintEmail: (event?: any) => void,
  openForwardModal: (email: EmailArchiveItem, event?: any) => void,
  ascendingOrder: boolean,
  setAscendingOrder: (val: boolean) => void
): ColumnDef<EmailArchiveItem>[] => {
  const columns: ColumnDef<EmailArchiveItem>[] = []

  columns.push(
    {
      accessorKey: 'from_address',
      header: 'Correspondence',
      cell: ({ row }) => {
        const recipients = row.original.to_addresses || []

        return (
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div className='flex flex-col gap-1.5 min-w-[200px] max-w-[300px] py-1 cursor-pointer'>
                {/* From Row */}
                <div className='flex items-center gap-2 group/from'>
                  <span className='w-9 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70'>
                    From
                  </span>
                  <div className='flex items-center gap-1.5 min-w-0'>
                    <span className='truncate text-xs font-medium text-foreground/90 transition-colors'>
                      {row.original.from_address}
                    </span>
                  </div>
                </div>

                {/* To Row */}
                <div className='flex items-center gap-2 group/to'>
                  <span className='w-9 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70'>
                    To
                  </span>
                  <div className='flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground transition-colors'>
                    <span className='truncate' title={recipients.join(', ')}>
                      {recipients.slice(0, 2).join(', ')}
                    </span>
                    {recipients.length > 2 && (
                      <Badge
                        variant='secondary'
                        className='px-1 h-4 text-[9px] font-bold text-muted-foreground hover:bg-muted-foreground/20'
                      >
                        +{recipients.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </HoverCardTrigger>

            <HoverCardContent
              className='w-80 p-0 shadow-xl border-border/60 z-50'
              align='start'
            >
              <div className='flex flex-col'>
                {/* Header */}
                <div className='p-3 bg-muted/30 border-b border-border/50'>
                  <h4 className='text-sm font-semibold text-foreground truncate'>
                    {row.original.email_subject}
                  </h4>
                  <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
                    <Clock className='w-3 h-3' />
                    {format(row.original.archive_time, 'MMM d, yyyy h:mm a')}
                  </div>
                </div>

                {/* Body */}
                <div className='p-3 space-y-3'>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide'>
                      <User className='w-3 h-3' /> From
                    </div>
                    <div className='text-xs text-foreground bg-muted/20 p-1.5 rounded border border-border/30 break-all'>
                      {row.original.from_address}
                    </div>
                  </div>

                  <div className='space-y-1'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide'>
                      <Send className='w-3 h-3' /> To ({recipients.length})
                    </div>
                    <div className='text-xs text-foreground bg-muted/20 p-1.5 rounded border border-border/30 max-h-[100px] overflow-y-auto scrollbar-thin'>
                      {recipients.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className='p-2 bg-muted/50 border-t border-border/50 flex justify-between text-[10px] text-muted-foreground font-medium'>
                  <span>Size: {formatBytes(row.original.raw_eml_size)}</span>
                  <span>Retention: {row.original.retention_days} Days</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )
      },
    },
    {
      accessorKey: 'email_subject',
      header: 'Subject',
      cell: ({ row }) => {
        const email = row.original
        const attachments = email.attachments || []
        const displayAttachments = attachments.slice(0, 3)
        const remainingCount = attachments.length - 3

        return (
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div
                className='flex flex-col gap-1.5 max-w-[400px] py-1 cursor-pointer'
                onClick={() => handleViewEmail(email)}
              >
                <div className='flex items-start gap-2'>
                  <span className='text-sm font-medium text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors'>
                    {email.email_subject || '(No Subject)'}
                  </span>
                </div>

                {/* Attachment Pills */}
                {email.has_attachments && attachments.length > 0 && (
                  <div className='flex flex-wrap items-center gap-1.5'>
                    {displayAttachments.map((att, i) => (
                      <div
                        key={i}
                        className='flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/50 bg-muted/20 max-w-[120px]'
                      >
                        <Paperclip className='w-2.5 h-2.5 text-muted-foreground shrink-0' />
                        <span className='text-[10px] text-muted-foreground truncate font-medium'>
                          {att}
                        </span>
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className='flex items-center px-1.5 py-0.5 rounded border border-border/50 bg-muted/40 text-[10px] font-medium text-muted-foreground'>
                        +{remainingCount}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </HoverCardTrigger>

            <HoverCardContent className='w-80 p-0 shadow-xl border-border/60 z-50'>
              <div className='p-3 space-y-3'>
                <div className='space-y-1'>
                  <h4 className='text-sm font-semibold text-foreground'>
                    Attachments ({attachments.length})
                  </h4>
                  <p className='text-xs text-muted-foreground'>
                    Click the row to view or download files.
                  </p>
                </div>

                {attachments.length > 0 ? (
                  <div className='flex flex-col gap-1 max-h-[150px] overflow-y-auto scrollbar-thin'>
                    {attachments.map((att, i) => (
                      <div
                        key={i}
                        className='flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors'
                      >
                        <div className='p-1 rounded bg-background border border-border/50'>
                          {/* Replaced File with Paperclip for consistency if needed, but original used File */}
                          {/* Actually File is fine */}
                          <Paperclip className='w-3 h-3 text-primary' />
                        </div>
                        <span className='text-xs text-foreground truncate'>
                          {att}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className='text-xs text-muted-foreground italic'>
                    No files attached.
                  </span>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        )
      },
    },
    {
      accessorKey: 'archive_time',
      header: () => (
        <Button
          variant='ghost'
          className='h-8 -ml-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-transparent'
          onClick={() => setAscendingOrder(!ascendingOrder)}
        >
          Date
          {ascendingOrder ? (
            <ArrowUp className='ml-1.5 w-3 h-3 text-primary' />
          ) : (
            <ArrowDown className='ml-1.5 w-3 h-3 text-muted-foreground/50' />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const unixtodate = Number(row.original.archive_time) * 1000
        return (
          <div className='flex flex-col gap-0.5'>
            <span className='text-xs font-medium text-foreground/90 tabular-nums'>
              {format(new Date(unixtodate), 'MMM d, yyyy')}
            </span>
            <span className='text-[10px] text-muted-foreground tabular-nums'>
              {format(new Date(unixtodate), 'h:mm a')}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'raw_eml_size',
      header: 'Size',
      cell: ({ row }) => (
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums font-mono'>
          {formatBytes(row.original.raw_eml_size)}
        </div>
      ),
    },
    {
      accessorKey: 'retention_days',
      header: 'Expiry Date',
      cell: ({ row }) => (
        <div
          className='flex flex-col justify-start gap-0.5 min-w-[100px]'
          title={`${formatRetention({ retentionDays: row.original.retention_days || 0 })}`}
        >
          <div className='flex items-start gap-1.5'>
            <span className='text-xs font-medium text-foreground/80'>
              {dateFormated({
                date: row.original.archive_time,
                days: row.original.retention_days || 0,
              })}
            </span>
          </div>
          <span className='text-[10px] text-left text-muted-foreground pl-4.5'>
            {timeFormated({
              date: row.original.archive_time,
              days: row.original.retention_days || 0,
            })}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div
          className='flex justify-end pr-2'
          onClick={e => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md data-[state=open]:bg-muted data-[state=open]:text-foreground'
              >
                <MoreHorizontal className='h-4 w-4' />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48 p-1'>
              <DropdownMenuItem onClick={() => handleViewEmail(row.original)}>
                <Eye className='mr-2 h-4 w-4 text-muted-foreground' />
                <span>View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  setSelectedEmail(row.original)
                  setTimeout(() => handlePrintEmail(e), 0)
                }}
              >
                <Printer className='mr-2 h-4 w-4 text-muted-foreground' />
                <span>Print</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => openForwardModal(row.original, e)}
              >
                <CornerUpRight className='mr-2 h-4 w-4 text-muted-foreground' />
                <span>Forward</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={e => {
                  setSelectedEmail(row.original)
                  handleDownloadEml(row.original, e)
                }}
              >
                <Download className='mr-2 h-4 w-4 text-muted-foreground' />
                <span>Download EML</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }
  )

  return columns
}
