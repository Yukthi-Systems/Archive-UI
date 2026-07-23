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

import React from 'react'
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
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

interface StatusChangeConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  entityName: string // e.g., "User" or "Domain"
  entityLabel: string // e.g., "John Doe" or "example.com"
  status: 'active' | 'inactive' // The target status we are switching TO
  isLoading?: boolean
}

const StatusChangeConfirmationModal: React.FC<
  StatusChangeConfirmationModalProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  entityName,
  entityLabel,
  status, // This is the status we are switching TO
  isLoading = false,
}) => {
  const isActivating = status === 'active'

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            <div
              className={`rounded-full p-2 ${
                isActivating ? 'bg-green-100' : 'bg-amber-100'
              }`}
            >
              {isActivating ? (
                <CheckCircle2 className='h-5 w-5 text-green-600' />
              ) : (
                <XCircle className='h-5 w-5 text-amber-600' />
              )}
            </div>
            <AlertDialogTitle className='text-lg'>
              {isActivating
                ? `Activate ${entityName}`
                : `Deactivate ${entityName}`}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className='pt-2'>
            <div className='space-y-3'>
              <p>
                Are you sure you want to{' '}
                {isActivating ? 'activate' : 'deactivate'}{' '}
                <span className='font-semibold text-foreground'>
                  "{entityLabel}"
                </span>
                ?
              </p>

              {!isActivating && (
                <div className='rounded-lg bg-amber-50 p-3 text-sm border border-amber-100'>
                  <div className='flex items-start gap-2'>
                    <AlertCircle className='h-4 w-4 text-amber-600 mt-0.5' />
                    <div className='text-amber-800'>
                      <p className='font-medium'>Warning:</p>
                      <p className='mt-1 text-amber-700'>
                        {entityName === 'User'
                          ? 'This user will lose access to the system immediately.'
                          : 'Email archiving and processing will be paused for this domain.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isActivating && (
                <div className='rounded-lg bg-green-50 p-3 text-sm border border-green-100'>
                  <div className='flex items-start gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-600 mt-0.5' />
                    <div className='text-green-800'>
                      <p className='font-medium'>System Access:</p>
                      <p className='mt-1 text-green-700'>
                        {entityName === 'User'
                          ? 'This user will regain access to the system.'
                          : 'Email archiving and processing will resume for this domain.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={`${
              isActivating
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2' />
                {isActivating ? 'Activating...' : 'Deactivating...'}
              </>
            ) : isActivating ? (
              'Activate'
            ) : (
              'Deactivate'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default StatusChangeConfirmationModal
