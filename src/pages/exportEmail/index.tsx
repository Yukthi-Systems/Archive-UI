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

import { useParams } from 'react-router-dom'
import useExportEml from '@/hooks/useExportEml'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Database,
  Archive,
  Eye,
  Download,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { EXPORT_API_URL } from '@/constants/constants'
import { auditService } from '@/api/audit'
import { SendNotification } from '@/api/notification'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import {
  getNotificationPayload,
  NOTIFICATION_TYPES,
} from '@/constants/notification'
import { useAtom } from 'jotai'
import { userAtom } from '@/atoms/user'

/**
 * Interface for the export file data returned by the API
 */
interface ExportFile {
  name: string
  size: number
  sizeFormatted: string
  createdAt: string
  expiresIn: string
}

/**
 * ExportEmail Page Component
 * Displays available downloads for a specific export job ID.
 */
function ExportEmail() {
  const { jobId } = useParams()
  const { data: exportData, isPending } = useExportEml(jobId)

  /**
   * Returns a context-appropriate icon based on file extension
   */
  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop()
    switch (ext) {
      case 'db':
      case 'sqlite':
        return <Database className='h-5 w-5 text-purple-600' />
      case 'zip':
      case 'gz':
      case 'tar':
        return <Archive className='h-5 w-5 text-orange-500' />
      default:
        return <FileText className='h-5 w-5 text-blue-500' />
    }
  }

  /**
   * Returns an appropriate badge for the file type
   */
  const getFileBadge = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.db')) {
      return (
        <Badge
          variant='secondary'
          className='ml-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 border-none px-2 py-0 h-5 font-normal text-[10px]'
        >
          Database
        </Badge>
      )
    }
    return null
  }

  const [currentUser] = useAtom(userAtom)
  const actorName =
    currentUser?.user_name || currentUser?.display_name || 'Unknown User'

  const handleDownload = (fileName: string) => {
    try {
      const downloadUrl = `${EXPORT_API_URL}api/download?file=${encodeURIComponent(fileName)}&job=${encodeURIComponent(jobId ?? '')}`
      window.open(downloadUrl, '_blank')

      // Audit Log and Notification: Download Requested
      const notificationPayload = getNotificationPayload(
        NOTIFICATION_TYPES.EML_EXPORT_DOWNLOAD,
        {
          jobId,
          fileName,
        }
      )
      SendNotification(notificationPayload)

      auditService.log(
        AUDIT_LOG_TYPES.EML_EXPORT_DOWNLOAD,
        `User ${actorName} downloaded EML Zip file: ${fileName}`,
        `Action: EML Zip file Download
Initiated By: ${actorName}
Job ID: ${jobId}
File: ${fileName}
Status: Success`,
        undefined,
        jobId
      )
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error'
      // Audit Log and Notification: Download Failed
      const notificationPayload = getNotificationPayload(
        NOTIFICATION_TYPES.EML_EXPORT_DOWNLOAD_FAILED,
        {
          jobId,
          fileName,
          error: errorMessage,
        }
      )
      SendNotification(notificationPayload)

      auditService.log(
        AUDIT_LOG_TYPES.EML_EXPORT_DOWNLOAD_FAILED,
        `User ${actorName} failed to download EML Zip file: ${fileName}`,
        `Action: EML Zip file Download Failed
Initiated By: ${actorName}
Job ID: ${jobId}
File: ${fileName}
Status: Failed
Error Details: ${errorMessage}`,
        undefined,
        jobId
      )
    }
  }

  return (
    <div className='container mx-auto py-4 px-6 space-y-2 w-full'>
      {/* Header Section */}
      <div className='space-y-2'>
        <h1 className='text-xl font-bold tracking-tight text-foreground font-outfit'>
          Email Export
        </h1>
        <p className='text-muted-foreground max-w-2xl'>
          Download your archived emails from the export service.
          {jobId && (
            <span className='block mt-1 font-medium text-muted-foreground/70 text-sm italic'>
              Job ID: {jobId}
            </span>
          )}
        </p>
      </div>

      {/* Available Downloads Section */}
      <Card className='border-border shadow-xl shadow-black/5 dark:shadow-black/20 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <CardHeader className='bg-muted/20 border-b border-border py-6 px-8'>
          <CardTitle className='text-xl font-bold text-foreground flex items-center'>
            Available Downloads
            {(exportData?.count ?? 0) > 0 && (
              <span className='ml-2 text-muted-foreground font-medium text-lg'>
                ({exportData.count} files)
              </span>
            )}
            {exportData?.files?.[0]?.expiresIn === 'Expired' ? (
              <Badge
                variant='destructive'
                className='ml-4 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm animate-in zoom-in-75 duration-300'
              >
                Expired
              </Badge>
            ) : exportData?.files?.[0]?.expiresIn ? (
              <Badge
                variant='default'
                className='ml-4 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm animate-in zoom-in-75 duration-300'
              >
                Expires in {exportData.files[0].expiresIn}
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader className='bg-muted/30 border-b border-border'>
              <TableRow className='hover:bg-transparent border-none'>
                <TableHead className='w-[45%] h-12 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] pl-10'>
                  File Name
                </TableHead>
                <TableHead className='h-12 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em]'>
                  Size
                </TableHead>
                <TableHead className='h-12 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em]'>
                  Created
                </TableHead>
                <TableHead className='h-12 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] pr-10'>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportData?.files && exportData.files.length > 0 ? (
                exportData.files.map((file: ExportFile, index: number) => (
                  <TableRow
                    key={file.name + index}
                    className='group border-b border-border last:border-0 hover:bg-muted/40 transition-colors h-20'
                  >
                    <TableCell className='pl-10'>
                      <div className='flex items-center'>
                        <div className='p-2 bg-muted rounded-lg mr-4 group-hover:scale-110 transition-transform duration-300'>
                          {getFileIcon(file.name)}
                        </div>
                        <div className='flex flex-col'>
                          <div className='flex items-center'>
                            <span className='text-foreground font-bold text-base leading-none'>
                              {file.name}
                            </span>
                            {getFileBadge(file.name)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground font-semibold text-sm'>
                      {file.sizeFormatted ||
                        `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    </TableCell>
                    <TableCell className='text-muted-foreground/80 font-medium text-sm'>
                      {format(new Date(file.createdAt), 'MMM d, yyyy, h:mm a')}
                    </TableCell>
                    <TableCell className='text-right pr-10'>
                      <div className='flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform'>
                        {file.expiresIn !== 'Expired' && (
                          <Button
                            className='h-10 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-none shadow-sm font-semibold rounded-lg transition-all'
                            onClick={() => handleDownload(file.name)}
                          >
                            <Download className='mr-2 h-4 w-4' />
                            Download
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className='border-none'>
                  <TableCell colSpan={4} className='h-64 text-center'>
                    <div className='flex flex-col items-center justify-center space-y-3 opacity-40'>
                      <Archive className='h-12 w-12 text-muted-foreground/30' />
                      <p className='text-muted-foreground font-medium italic text-lg tracking-tight'>
                        {isPending
                          ? 'Requesting data from export service...'
                          : 'No downloads available for this job ID.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expiry Note */}
      <div className='text-center'>
        <p className='text-xs text-muted-foreground/60 font-medium tracking-wide'>
          Files are automatically deleted after 7 days for security and storage
          optimization.
        </p>
      </div>
    </div>
  )
}

export default ExportEmail
