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

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmailContent } from '@/components/common/EmailContent'
import type { EmailArchiveItem } from '@/types/archive.types'
import {
  type ParsedEmail,
  parseEmails,
  parseMultipleEmails,
  processEmailHtml,
} from '@/utils/emlParser'
import {
  Clock,
  Download,
  Eye,
  Loader2,
  Paperclip,
  Printer,
  Info,
  Mail,
  ArrowDownToLine,
  CornerUpRight,
} from 'lucide-react'
import { format } from 'date-fns'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMemo } from 'react'
import { getFileType } from '@/utils/attachmentUtils'

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

interface EmailPreviewDialogProps {
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  selectedEmail: EmailArchiveItem | null
  isLoadingEmail: boolean
  parsedEmail: ParsedEmail | null
  handleLoadFullEmail: (email: EmailArchiveItem) => void
  handleDownloadEml: (email: EmailArchiveItem | null, event?: any) => void
  handlePrintEmail: (event?: any) => void
  openForwardModal: (email: EmailArchiveItem, event?: any) => void
  handleViewAttachment: (file: any, allFiles?: any[]) => void
  handleDownloadAttachment: (file: any) => void
}

export function EmailPreviewDialog({
  isModalOpen,
  setIsModalOpen,
  selectedEmail,
  isLoadingEmail,
  parsedEmail,
  handleLoadFullEmail,
  handleDownloadEml,
  handlePrintEmail,
  handleViewAttachment,
  handleDownloadAttachment,
  openForwardModal,
}: EmailPreviewDialogProps) {
  // Fix unix timestamp conversion - multiply by 1000
  const emailDate = selectedEmail?.archive_time
    ? new Date(Number(selectedEmail.archive_time) * 1000)
    : new Date()

  // Process HTML content to replace inline attachments
  // Process HTML content to replace inline attachments
  const processedHtmlContent = useMemo(() => {
    return processEmailHtml(
      parsedEmail?.htmlBody || null,
      parsedEmail?.attachments || []
    )
  }, [parsedEmail])

  // Separate inline and regular attachments
  const regularAttachments = useMemo(() => {
    if (!parsedEmail?.attachments) return []
    return parsedEmail.attachments.filter((att: any) => !att.contentId)
  }, [parsedEmail])

  const inlineAttachments = useMemo(() => {
    if (!parsedEmail?.attachments) return []
    return parsedEmail.attachments.filter((att: any) => att.contentId)
  }, [parsedEmail])

  const from = useMemo(() => {
    if (parsedEmail) {
      return parseEmails(parsedEmail?.headers?.from || '')
    }
    return null
  }, [parsedEmail])

  const to = useMemo(() => {
    if (parsedEmail) {
      return parseMultipleEmails(
        parsedEmail?.headers?.to || parsedEmail?.headers?.To || ''
      )
    }
    return null
  }, [parsedEmail])

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className='max-w-[95vw] z-50 md:max-w-[1100px] h-[90vh] rounded-xl gap-0 p-0 overflow-hidden border-2 shadow-2xl flex flex-col bg-background'>
        {/* Header Section */}
        <div className='p-6 pb-4 border-b bg-muted/30'>
          <div className='flex justify-between items-start gap-4'>
            <div className='space-y-4 flex-1 min-w-0'>
              {/* Subject */}
              {parsedEmail?.headers?.subject ? (
                <DialogTitle className='text-xl md:text-2xl font-bold text-foreground line-clamp-2'>
                  {parsedEmail?.headers?.subject || 'No Subject'}
                </DialogTitle>
              ) : (
                <DialogTitle className='text-xl md:text-2xl font-bold text-foreground line-clamp-2'>
                  Email Information
                </DialogTitle>
              )}

              <>
                {parsedEmail?.headers ? (
                  <>
                    {/* Sender Info */}
                    <div className='flex items-start gap-3'>
                      <div className='w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-base shadow-md shrink-0'>
                        {from?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className='text-sm space-y-1 min-w-0 flex-1'>
                        <div className='font-semibold text-foreground flex items-center gap-2 flex-wrap'>
                          <span className='truncate'>{from?.name}</span>
                          <span className='text-muted-foreground font-normal text-xs truncate'>
                            &lt;{from?.email}&gt;
                          </span>
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          <span className='font-medium'>To:</span>{' '}
                          <span className='break-all'>
                            {to ? (
                              <>
                                {to?.map((item: any) => item?.email).join(', ')}
                              </>
                            ) : (
                              selectedEmail?.to_addresses?.join(', ')
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className='flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground'>
                      <div className='flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-md'>
                        <Clock className='w-3.5 h-3.5' />
                        <span>{format(emailDate, 'MMM d, yyyy')}</span>
                        <span className='text-muted-foreground/70'>at</span>
                        <span>{format(emailDate, 'h:mm a')}</span>
                      </div>

                      {selectedEmail?.has_attachments && (
                        <Badge
                          variant='secondary'
                          className='gap-1 text-xs py-0.5'
                        >
                          <Paperclip className='w-3 h-3' />
                          {selectedEmail.attachments?.length || 0} attachment(s)
                        </Badge>
                      )}

                      {parsedEmail && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 px-2 text-primary hover:text-primary hover:bg-primary/10 font-medium'
                            >
                              <Info className='w-3.5 h-3.5 mr-1' />
                              View Headers
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent
                            className='w-[650px] p-0'
                            align='start'
                            onWheel={e => e.stopPropagation()}
                          >
                            <div className='flex items-center justify-between px-4 py-3 border-b bg-muted/50'>
                              <h4 className='font-semibold text-sm flex items-center gap-2'>
                                <Mail className='w-4 h-4' />
                                Email Headers
                              </h4>
                            </div>
                            <ScrollArea className='h-[450px]' type='always'>
                              <div className='p-4'>
                                <table className='w-full text-xs'>
                                  <tbody>
                                    {parsedEmail?.headers &&
                                      Object.entries(parsedEmail.headers).map(
                                        ([key, value]) => (
                                          <tr
                                            key={key}
                                            className='border-b border-border/30 last:border-0'
                                          >
                                            <td className='py-2 pr-4 font-semibold text-muted-foreground whitespace-nowrap align-top'>
                                              {key}:
                                            </td>
                                            <td className='py-2 align-top break-all font-mono'>
                                              {value}
                                            </td>
                                          </tr>
                                        )
                                      )}
                                  </tbody>
                                </table>
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Compact Email Info */}
                    <div className='w-full  space-y-2'>
                      <div className='rounded-lg p-3'>
                        <div className='space-y-2 text-xs'>
                          <div className='grid grid-cols-[80px_1fr] gap-2'>
                            <span className='font-medium text-muted-foreground'>
                              Subject:
                            </span>
                            <p className='break-all'>
                              {selectedEmail?.email_subject || 'No Subject'}
                            </p>
                          </div>
                          <div className='grid grid-cols-[80px_1fr] gap-2'>
                            <span className='font-medium text-muted-foreground'>
                              From:
                            </span>
                            <p className='break-all'>
                              {selectedEmail?.from_address}
                            </p>
                          </div>
                          <div className='grid grid-cols-[80px_1fr] gap-2'>
                            <span className='font-medium text-muted-foreground'>
                              To:
                            </span>
                            <p className='break-all'>
                              {selectedEmail?.to_addresses?.join(', ')}
                            </p>
                          </div>
                          <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
                            <div className='grid grid-cols-[80px_1fr] gap-2'>
                              <span className='font-medium text-muted-foreground'>
                                Domain:
                              </span>
                              <p className='truncate'>
                                {selectedEmail?.domain}
                              </p>
                            </div>
                            <div className='grid grid-cols-[80px_1fr] gap-2'>
                              <span className='font-medium text-muted-foreground'>
                                Size:
                              </span>
                              <p>
                                {formatBytes(selectedEmail?.raw_eml_size || 0)}
                              </p>
                            </div>
                            <div className='grid grid-cols-[80px_1fr] gap-2'>
                              <span className='font-medium text-muted-foreground'>
                                Archived:
                              </span>
                              <p>{format(emailDate, 'MMM d, yyyy h:mm a')}</p>
                            </div>
                            <div className='grid grid-cols-[80px_1fr] gap-2'>
                              <span className='font-medium text-muted-foreground'>
                                Files:
                              </span>
                              <p>{selectedEmail?.attachments?.length || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedEmail?.has_attachments &&
                        selectedEmail.attachments && (
                          <div className='border rounded-lg p-3 bg-muted/20'>
                            <h4 className='font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2'>
                              Attachments ({selectedEmail.attachments.length})
                            </h4>
                            <div className='flex flex-wrap gap-1.5'>
                              {selectedEmail.attachments.map((filename, i) => (
                                <div
                                  key={i}
                                  className='flex items-center gap-1.5 px-2 py-1 bg-background/50 rounded text-[11px] border max-w-full'
                                >
                                  <Paperclip className='w-3 h-3 text-muted-foreground shrink-0' />
                                  <span className='font-medium truncate'>
                                    {filename}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </>
                )}
              </>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 flex flex-col min-h-0 bg-background'>
          {!parsedEmail && !isLoadingEmail ? (
            // Show basic info and load button
            <ScrollArea className='flex-1'>
              <div className='flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 gap-4'>
                <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center'>
                  <Mail className='w-8 h-8 text-primary' />
                </div>
                <div className='text-center space-y-1 max-w-md'>
                  <h3 className='text-base font-semibold'>Email Details</h3>
                  <p className='text-xs text-muted-foreground'>
                    Load full content including body, attachments, and headers
                  </p>
                </div>
                <Button
                  onClick={() =>
                    selectedEmail && handleLoadFullEmail(selectedEmail)
                  }
                  size='default'
                  className='gap-2'
                >
                  <ArrowDownToLine className='w-4 h-4' />
                  Load Full Email
                </Button>
              </div>
            </ScrollArea>
          ) : isLoadingEmail ? (
            // Loading state
            <div className='flex flex-col items-center justify-center h-full text-muted-foreground space-y-4'>
              <Loader2 className='w-12 h-12 animate-spin text-primary' />
              <p className='text-sm font-medium'>Loading email content...</p>
            </div>
          ) : parsedEmail ? (
            // Full email content with tabs
            <Tabs
              defaultValue={
                parsedEmail.htmlBody
                  ? 'html'
                  : parsedEmail.textBody
                    ? 'plain'
                    : 'attachments'
              }
              className='flex flex-col h-full'
            >
              <div className='px-6 border-b border-border/40 bg-muted/10'>
                <TabsList className='h-11 bg-transparent p-0 gap-8'>
                  {parsedEmail.htmlBody && (
                    <TabsTrigger value='html'>HTML View</TabsTrigger>
                  )}
                  {parsedEmail.textBody && (
                    <TabsTrigger value='plain'>Plain Text</TabsTrigger>
                  )}
                  {parsedEmail.attachments.length > 0 && (
                    <TabsTrigger value='attachments'>
                      <span className='flex items-center gap-2'>
                        Attachments
                        <Badge
                          variant='secondary'
                          className='ml-1 h-5 min-w-5 px-1.5'
                        >
                          {(regularAttachments?.length || 0) +
                            (inlineAttachments?.length || 0)}
                        </Badge>
                      </span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <ScrollArea className='flex-1'>
                {parsedEmail.htmlBody && (
                  <TabsContent
                    value='html'
                    className='m-0 h-full animate-in fade-in-50 duration-300'
                  >
                    <div className='p-6 pt-0'>
                      {processedHtmlContent ? (
                        <EmailContent
                          content={processedHtmlContent}
                          className='min-h-[200px] prose prose-sm max-w-none'
                        />
                      ) : (
                        <div className='flex items-center justify-center h-40 text-muted-foreground italic text-sm bg-muted/20 rounded-lg border border-dashed'>
                          No HTML content available
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}

                {parsedEmail.textBody && (
                  <TabsContent
                    value='plain'
                    className='m-0 h-full animate-in fade-in-50 duration-300'
                  >
                    <div className='p-6'>
                      <pre className='whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground bg-muted/30 p-4 rounded-lg border'>
                        {parsedEmail.textBody ||
                          parsedEmail.htmlBody?.replace(/<[^>]*>/g, '') ||
                          'No text content available'}
                      </pre>
                    </div>
                  </TabsContent>
                )}

                {parsedEmail.attachments.length > 0 && (
                  <TabsContent
                    value='attachments'
                    className='m-0 h-full animate-in fade-in-50 duration-300'
                  >
                    <div className='p-6 space-y-6'>
                      {/* Regular Attachments */}
                      {regularAttachments.length > 0 && (
                        <div>
                          <h3 className='text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide'>
                            Attachments ({regularAttachments.length})
                          </h3>
                          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                            {regularAttachments.map((file: any, i: number) => (
                              <div
                                key={i}
                                className='group flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200'
                              >
                                <div className='flex items-center gap-3 overflow-hidden flex-1'>
                                  <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 text-primary group-hover:scale-110 transition-transform'>
                                    <Paperclip className='w-5 h-5' />
                                  </div>
                                  <div className='flex flex-col overflow-hidden'>
                                    <span
                                      className='text-sm font-medium truncate'
                                      title={file.filename}
                                    >
                                      {file.filename}
                                    </span>
                                    <span className='text-[10px] text-muted-foreground'>
                                      {formatBytes(file.size)}
                                    </span>
                                  </div>
                                </div>
                                <div className='flex items-center gap-1 ml-2'>
                                  {getFileType(
                                    file?.contentType || '',
                                    file?.filename || ''
                                  ) !== 'other' && (
                                    <Button
                                      size='icon'
                                      variant='ghost'
                                      className='h-8 w-8 hover:text-primary hover:bg-primary/10'
                                      onClick={e => {
                                        e.stopPropagation()
                                        handleViewAttachment(
                                          file,
                                          parsedEmail?.attachments
                                        )
                                      }}
                                      title='View'
                                    >
                                      <Eye className='w-4 h-4' />
                                    </Button>
                                  )}
                                  <Button
                                    size='icon'
                                    variant='ghost'
                                    className='h-8 w-8 hover:text-primary hover:bg-primary/10'
                                    onClick={e => {
                                      e.stopPropagation()
                                      handleDownloadAttachment(file)
                                    }}
                                    title='Download'
                                  >
                                    <Download className='w-4 h-4' />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inline Attachments */}
                      {inlineAttachments.length > 0 && (
                        <div>
                          <h3 className='text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide'>
                            Inline Images ({inlineAttachments.length})
                          </h3>
                          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                            {inlineAttachments.map((file: any, i: number) => (
                              <div
                                key={i}
                                className='group flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200'
                              >
                                <div className='flex items-center gap-3 overflow-hidden flex-1'>
                                  <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center shrink-0 text-blue-600 group-hover:scale-110 transition-transform'>
                                    <Paperclip className='w-5 h-5' />
                                  </div>
                                  <div className='flex flex-col overflow-hidden'>
                                    <span
                                      className='text-sm font-medium truncate'
                                      title={file.filename}
                                    >
                                      {file.filename}
                                    </span>
                                    <span className='text-[10px] text-muted-foreground'>
                                      {formatBytes(file.size)} • Inline
                                    </span>
                                  </div>
                                </div>
                                <div className='flex items-center gap-1 ml-2'>
                                  {getFileType(
                                    file?.contentType || '',
                                    file?.filename || ''
                                  ) !== 'other' && (
                                    <Button
                                      size='icon'
                                      variant='ghost'
                                      className='h-8 w-8 hover:text-primary hover:bg-primary/10'
                                      onClick={e => {
                                        e.stopPropagation()
                                        handleViewAttachment(
                                          file,
                                          parsedEmail?.attachments
                                        )
                                      }}
                                      title='View'
                                    >
                                      <Eye className='w-4 h-4' />
                                    </Button>
                                  )}
                                  <Button
                                    size='icon'
                                    variant='ghost'
                                    className='h-8 w-8 hover:text-primary hover:bg-primary/10'
                                    onClick={e => {
                                      e.stopPropagation()
                                      handleDownloadAttachment(file)
                                    }}
                                    title='Download'
                                  >
                                    <Download className='w-4 h-4' />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {regularAttachments.length === 0 &&
                        inlineAttachments.length === 0 && (
                          <div className='flex items-center justify-center h-40 text-muted-foreground italic text-sm bg-muted/20 rounded-lg border border-dashed'>
                            No attachments found
                          </div>
                        )}
                    </div>
                  </TabsContent>
                )}
              </ScrollArea>
            </Tabs>
          ) : (
            <div className='p-12 text-center text-red-500'>
              Failed to load content
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className='p-4 bg-muted/20 border-t flex items-center justify-between gap-3 flex-wrap'>
          <div className='flex items-center gap-2'>
            {parsedEmail && (
              <>
                <Button
                  variant='outline'
                  onClick={handlePrintEmail}
                  size='sm'
                  className='gap-2 hover:bg-accent'
                >
                  <Printer className='w-4 h-4' /> Print
                </Button>
                <Button
                  variant='outline'
                  onClick={e => handleDownloadEml(selectedEmail, e)}
                  size='sm'
                  className='gap-2 hover:bg-accent'
                >
                  <Download className='w-4 h-4' /> Download EML
                </Button>
                <Button
                  variant='outline'
                  onClick={e => openForwardModal(selectedEmail as any, e)}
                  size='sm'
                  className='gap-2 hover:bg-accent'
                >
                  <CornerUpRight className='w-4 h-4' /> Forward
                </Button>
              </>
            )}
          </div>
          <Button
            variant='default'
            onClick={() => setIsModalOpen(false)}
            size='sm'
            className='shadow-md'
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
