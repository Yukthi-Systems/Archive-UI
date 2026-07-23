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

// components/users/DeleteConfirmationModal.tsx
import React, { useState, useEffect } from 'react'
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
import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  value: string
  isLoading?: boolean
  title?: string
  description?: string
  warningItems?: string[]
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  value,
  isLoading = false,
  title = 'Delete User Account',
  description,
  warningItems = [
    'This action cannot be undone',
    'All data will be permanently deleted',
    'User will lose access to all systems immediately',
  ],
}) => {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      setInputValue('')
    }
  }, [isOpen])

  const isMatch = inputValue === value

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            <div className='rounded-full bg-red-100 p-2'>
              <AlertTriangle className='h-5 w-5 text-red-600' />
            </div>
            <AlertDialogTitle className='text-lg'>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className='pt-2'>
            <div className='space-y-4'>
              <p>
                {description || (
                  <>
                    Are you sure you want to delete{' '}
                    <span
                      className='font-semibold text-foreground select-none'
                      onCopy={e => e.preventDefault()}
                      onDragStart={e => e.preventDefault()}
                    >
                      "{value}"
                    </span>
                    ?
                  </>
                )}
              </p>

              <div className='rounded-lg bg-red-50 p-3 text-sm border border-red-100'>
                <p className='font-medium text-red-800'>Warning:</p>
                <ul className='mt-1 list-disc space-y-1 pl-4 text-red-700'>
                  {warningItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='confirm-delete'
                  className='text-sm font-medium text-foreground'
                >
                  Type{' '}
                  <span
                    className='font-mono font-bold select-none'
                    onCopy={e => e.preventDefault()}
                    onDragStart={e => e.preventDefault()}
                  >
                    {value}
                  </span>{' '}
                  to confirm
                </Label>
                <Input
                  id='confirm-delete'
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={value}
                  className='border-red-200 focus-visible:ring-red-500'
                  autoComplete='off'
                  onPaste={e => e.preventDefault()} // Optional: Prevent pasting if strictly want typing, but usually pasting is fine. GitHub allows pasting. I'll allow pasting.
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className='flex-col sm:flex-row gap-2'>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!isMatch || isLoading}
            className='bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 w-full sm:w-auto'
          >
            {isLoading ? (
              <>
                <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2' />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteConfirmationModal
