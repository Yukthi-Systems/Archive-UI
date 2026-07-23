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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import {
  Copy,
  User,
  Clock,
  Shield,
  Hash,
  FileText,
  Activity,
  Building,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AuditLogEntry } from '@/hooks/useAuditlogs'

interface AuditLogDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: AuditLogEntry | null
}

export const AuditLogDetailDialog = ({
  open,
  onOpenChange,
  log,
}: AuditLogDetailDialogProps) => {
  if (!log) return null

  // Helper to handle copying to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  // Handle Unix Timestamp conversion safely
  const logDate = new Date(log.log_time * 1000)
  const isValidDate = !isNaN(logDate.getTime())

  // Determine visual style based on log type
  const isError =
    log.log_type.includes('ERROR') || log.log_type.includes('FAILED')
  const statusColor = isError
    ? 'text-red-600 bg-red-50 border-red-200'
    : 'text-blue-600 bg-blue-50 border-blue-200'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl min-w-3xl gap-0 p-0 overflow-hidden border-border/60 shadow-xl'>
        {/* Header */}
        <DialogHeader className='p-6 pb-4 bg-muted/30 border-b border-border/60'>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1.5'>
              <DialogTitle className='text-xl font-semibold flex items-center gap-2'>
                {log.log_type.replace(/_/g, ' ')}
              </DialogTitle>
              <DialogDescription className='flex items-center gap-2 text-xs'>
                <Hash className='w-3 h-3' />
                <span className='font-mono text-foreground/70'>
                  {log.log_id}
                </span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-4 w-4 ml-1 hover:bg-transparent'
                  onClick={() => copyToClipboard(log.log_id, 'Log ID')}
                >
                  <Copy className='w-2.5 h-2.5 text-muted-foreground hover:text-primary transition-colors' />
                </Button>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <ScrollArea className='max-h-[65vh]'>
          <div className='p-6 space-y-6'>
            {/* 1. Metadata Grid */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='p-3 rounded-lg border border-border/50 bg-card space-y-1'>
                <div className='flex items-center gap-2 text-xs text-muted-foreground mb-1'>
                  <Clock className='w-3.5 h-3.5' />
                  <span>Timestamp</span>
                </div>
                <p className='text-sm font-medium font-mono'>
                  {isValidDate ? format(logDate, 'PPP pp') : 'Invalid Date'}
                </p>
              </div>

              <div className='p-3 rounded-lg border border-border/50 bg-card space-y-1'>
                <div className='flex items-center gap-2 text-xs text-muted-foreground mb-1'>
                  <User className='w-3.5 h-3.5' />
                  <span>user</span>
                </div>
                <p className='text-sm font-medium'>{log.from_user}</p>
              </div>
            </div>

            <Separator />

            {/* 2. Message Summary */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium text-foreground flex items-center gap-2'>
                <Activity className='w-4 h-4 text-primary' /> Activity Summary
              </h4>
              <div className='p-3.5 bg-muted/30 rounded-md border border-border/50 text-sm leading-relaxed text-foreground/90'>
                {log.log_message}
              </div>
            </div>

            {/* 3. Full Description / Payload */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-medium text-foreground flex items-center gap-2'>
                  <FileText className='w-4 h-4 text-primary' /> Full Description
                </h4>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 text-xs gap-1.5'
                  onClick={() =>
                    copyToClipboard(log.log_description, 'Description')
                  }
                >
                  <Copy className='w-3 h-3' /> Copy
                </Button>
              </div>

              <div className='relative group'>
                <div className='p-4 bg-muted/50 border border-border rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto custom-scrollbar shadow-inner text-muted-foreground'>
                  {log.log_description || 'No additional details provided.'}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
