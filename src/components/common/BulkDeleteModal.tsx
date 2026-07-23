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

import React, { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface BulkDeleteModalProps {
  isOpen: boolean
  items: { id: string | number; label: string }[]
  onDelete: (id: string | number, label: string) => Promise<void>
  onClose: () => void
  onComplete: (results: {
    successful: (string | number)[]
    failed: { id: string | number; error: string }[]
    cancelled: (string | number)[]
    total: number
    wasCancelled: boolean
  }) => void
  title?: string
  description?: string
  itemName?: string
}

interface ProgressItem {
  id: string | number
  label: string
  status: 'pending' | 'deleting' | 'success' | 'error' | 'cancelled'
  error: string | null
}

const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  items,
  onDelete,
  onClose,
  onComplete,
  title = 'Bulk Delete',
  description = 'Are you sure you want to delete the selected items?',
  itemName = 'item',
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [hasStarted, setHasStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const cancelledRef = useRef(false)
  const progressListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false)
      setProgress([])
      setHasStarted(false)
      setIsCompleted(false)
      setIsCancelled(false)
      setConfirmText('')
      cancelledRef.current = false
    }
  }, [isOpen])

  useEffect(() => {
    if (progressListRef.current) {
      progressListRef.current.scrollTop = progressListRef.current.scrollHeight
    }
  }, [progress])

  const handleCancel = () => {
    if (isDeleting) {
      cancelledRef.current = true
      setIsCancelled(true)
      setIsDeleting(false)

      setProgress(prev =>
        prev.map(p =>
          p.status === 'pending' ? { ...p, status: 'cancelled' } : p
        )
      )
    }
  }

  const handleStartDelete = async () => {
    setIsDeleting(true)
    setHasStarted(true)
    setIsCancelled(false)
    cancelledRef.current = false

    const newProgress: ProgressItem[] = items.map(item => ({
      id: item.id,
      label: item.label,
      status: 'pending',
      error: null,
    }))
    setProgress(newProgress)

    const successfulDeletes: (string | number)[] = []
    const failedDeletes: { id: string | number; error: string }[] = []

    for (let i = 0; i < items.length; i++) {
      if (cancelledRef.current) break

      const item = items[i]

      setProgress(prev =>
        prev.map(p => (p.id === item.id ? { ...p, status: 'deleting' } : p))
      )

      try {
        await onDelete(item.id, item.label)

        if (cancelledRef.current) break

        successfulDeletes.push(item.id)
        setProgress(prev =>
          prev.map(p => (p.id === item.id ? { ...p, status: 'success' } : p))
        )
      } catch (error: any) {
        if (cancelledRef.current) break

        const errMsg =
          error?.response?.data?.message || error?.message || 'Unknown error'

        failedDeletes.push({ id: item.id, error: errMsg })

        setProgress(prev =>
          prev.map(p =>
            p.id === item.id
              ? {
                  ...p,
                  status: 'error',
                  error: errMsg,
                }
              : p
          )
        )
      }

      if (i < items.length - 1 && !cancelledRef.current) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    setIsDeleting(false)
    if (!cancelledRef.current) {
      setIsCompleted(true)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      if ((isCompleted || isCancelled) && onComplete) {
        const successful = progress
          .filter(p => p.status === 'success')
          .map(p => p.id)
        const failed = progress
          .filter(p => p.status === 'error')
          .map(p => ({ id: p.id, error: p.error || 'Unknown error' }))
        const cancelled = progress
          .filter(p => p.status === 'cancelled')
          .map(p => p.id)

        onComplete({
          successful,
          failed,
          cancelled,
          total: items.length,
          wasCancelled: isCancelled,
        })
      }
      onClose()
    }
  }

  const getStatusIcon = (status: ProgressItem['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className='w-4 h-4 rounded-full bg-muted border-2 border-border animate-pulse' />
        )
      case 'deleting':
        return <Loader2 size={16} className='animate-spin text-primary' />
      case 'success':
        return <CheckCircle size={16} className='text-green-500' />
      case 'error':
        return <XCircle size={16} className='text-destructive' />
      case 'cancelled':
        return <X size={16} className='text-muted-foreground' />
      default:
        return null
    }
  }

  const getStatusColor = (status: ProgressItem['status']) => {
    switch (status) {
      case 'pending':
        return 'text-muted-foreground bg-muted/30 border-border/50'
      case 'deleting':
        return 'text-primary bg-primary/5 border-primary/20'
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'error':
        return 'text-destructive bg-destructive/5 border-destructive/20'
      case 'cancelled':
        return 'text-muted-foreground bg-muted/20 border-muted/40'
      default:
        return ''
    }
  }

  const successCount = progress.filter(p => p.status === 'success').length
  const errorCount = progress.filter(p => p.status === 'error').length
  const processedCount = progress.filter(
    p => p.status !== 'pending' && p.status !== 'deleting'
  ).length
  const progressPercentage =
    items.length > 0 ? (processedCount / items.length) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[600px] gap-0 p-0 overflow-hidden rounded-2xl'>
        <DialogHeader className='p-6 bg-muted/30 border-b border-border/50'>
          <div className='flex items-center gap-4'>
            <div className='p-2.5 rounded-xl bg-destructive/10 border border-destructive/20'>
              <AlertTriangle className='text-destructive w-5 h-5' />
            </div>
            <div className='space-y-1'>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {!hasStarted
                  ? `${items.length} ${itemName}${items.length !== 1 ? 's' : ''} selected`
                  : isCancelled
                    ? 'Operation cancelled'
                    : isCompleted
                      ? 'Operation completed'
                      : 'Deletion in progress...'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='p-6 space-y-6'>
          {!hasStarted ? (
            <div className='space-y-6'>
              <div className='text-center space-y-2'>
                <p className='text-base font-medium'>{description}</p>
                <p className='text-sm text-muted-foreground'>
                  This will permanently delete{' '}
                  <span className='font-bold text-destructive'>
                    {items.length}
                  </span>{' '}
                  {itemName}
                  {items.length !== 1 ? 's' : ''}. This action cannot be undone.
                </p>
              </div>

              <div className='rounded-xl border border-border bg-muted/10 overflow-hidden'>
                <div className='p-3 border-b border-border bg-muted/20'>
                  <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                    <Trash2 size={14} />
                    Items to delete
                  </h4>
                </div>
                <div className='max-h-[160px] overflow-y-auto p-2 scrollbar-custom'>
                  <div className='grid gap-1'>
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className='flex items-center gap-3 p-2 hover:bg-muted/30 rounded-lg transition-colors'
                      >
                        <span className='text-[10px] font-bold text-muted-foreground/50 w-5'>
                          {index + 1}
                        </span>
                        <span className='text-sm font-medium truncate'>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='space-y-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10'>
                <div className='flex items-center gap-2 text-destructive'>
                  <AlertTriangle size={14} />
                  <span className='text-xs font-semibold uppercase tracking-wider'>
                    Confirmation Required
                  </span>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Please type{' '}
                  <span className='font-bold text-foreground'>Delete</span> to
                  confirm.
                </p>
                <input
                  type='text'
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="Type 'Delete' to confirm"
                  className='w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-destructive/20 focus:border-destructive outline-none transition-all'
                />
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='space-y-3'>
                <div className='flex justify-between items-end'>
                  <h4 className='text-sm font-semibold'>
                    {isCancelled
                      ? 'Deletion Cancelled'
                      : isCompleted
                        ? 'Deletion Complete'
                        : 'Deleting items...'}
                  </h4>
                  <span className='text-xs font-mono text-muted-foreground'>
                    {processedCount} / {items.length}
                  </span>
                </div>
                <Progress value={progressPercentage} className='h-2' />
              </div>

              <div className='rounded-xl border border-border bg-muted/5 overflow-hidden'>
                <div
                  className='max-h-[240px] overflow-y-auto scrollbar-custom divide-y divide-border/50'
                  ref={progressListRef}
                >
                  {progress.map(item => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 p-3 transition-colors',
                        getStatusColor(item.status)
                      )}
                    >
                      {getStatusIcon(item.status)}
                      <span className='flex-1 text-sm font-medium truncate'>
                        {item.label}
                      </span>
                      {item.error && (
                        <span className='text-[10px] bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20 max-w-[200px] truncate'>
                          {item.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(isCompleted || isCancelled) && (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='p-4 rounded-xl bg-green-50 border border-green-100 text-center'>
                    <p className='text-2xl font-bold text-green-600'>
                      {successCount}
                    </p>
                    <p className='text-[10px] font-semibold uppercase tracking-wider text-green-600/70'>
                      Successful
                    </p>
                  </div>
                  <div className='p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-center'>
                    <p className='text-2xl font-bold text-destructive'>
                      {errorCount}
                    </p>
                    <p className='text-[10px] font-semibold uppercase tracking-wider text-destructive/70'>
                      Failed
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className='p-4 bg-muted/30 border-t border-border/50 flex justify-end gap-3'>
          {!hasStarted ? (
            <>
              <Button variant='outline' onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant='destructive'
                disabled={confirmText !== 'Delete'}
                onClick={handleStartDelete}
                className='gap-2 shadow-lg shadow-destructive/20'
              >
                <Trash2 size={16} />
                Delete {items.length} {itemName}
                {items.length !== 1 ? 's' : ''}
              </Button>
            </>
          ) : isDeleting ? (
            <Button variant='outline' onClick={handleCancel} className='gap-2'>
              <X size={16} />
              Stop Operation
            </Button>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BulkDeleteModal
