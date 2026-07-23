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
import { Shield, Trash2, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useAtomValue } from 'jotai'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useManage2FA, type TOTPDevice } from '@/hooks/use2FA'
import { userAtom } from '@/atoms/user'
import type { User } from '@/types/user.types'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdate2FAStatus } from '@/hooks/use2FA'

interface TwoFAListModalProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  user?: User
  refreshUser?: () => void
}

export const TwoFAListModal = ({
  children,
  open,
  onOpenChange,
  user: propUser,
  refreshUser,
}: TwoFAListModalProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const atomUser = useAtomValue(userAtom)
  const user = propUser || atomUser
  const { totpList, totpCount, deleteTOTP } = useManage2FA(user?.user_id)
  const queryClient = useQueryClient()

  const { mutate: update2FAStatus, isPending: isUpdatingStatus } =
    useUpdate2FAStatus()

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && user?.user_id) {
      queryClient.invalidateQueries({ queryKey: ['totp-list', user.user_id] })
      queryClient.invalidateQueries({ queryKey: ['totp-count', user.user_id] })
    }

    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setIsOpen(newOpen)
    }
  }

  const handleToggle2FA = (checked: boolean) => {
    if (!user?.user_id) return

    update2FAStatus(
      {
        userId: user.user_id,
        method: 'totp',
        enabled: checked,
        organizationId: user.organization_id,
      },
      {
        onSuccess: () => {
          toast.success(
            `Authenticator App 2FA ${checked ? 'enabled' : 'disabled'} successfully`
          )
          refreshUser?.()
        },
      }
    )
  }

  const isDialogOpen = open !== undefined ? open : isOpen

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className='sm:max-w-[400px] p-0 overflow-hidden gap-0 border-none shadow-2xl'>
        <DialogHeader className='px-6 pt-6 pb-2'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
              <Lock className='h-5 w-5' />
            </div>
            <div className='space-y-1 text-left'>
              <DialogTitle className='text-lg'>
                Manage Authenticator
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Manage your TOTP devices and settings.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='px-6 pb-6 space-y-6'>
          {/* Toggle Section */}
          <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
            <div className='space-y-0.5'>
              <Label className='text-sm font-medium'>
                Enable Authenticator App
              </Label>
              <p className='text-xs text-muted-foreground'>
                Enable or disable TOTP 2FA for this user.
              </p>
            </div>
            <Switch
              checked={user?.is_totp_2fa_active || false}
              onCheckedChange={handleToggle2FA}
              disabled={isUpdatingStatus}
            />
          </div>

          <div className='space-y-3'>
            <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Active Devices ({totpCount}/10)
            </h4>

            {totpList.length === 0 ? (
              <div className='text-center py-4 text-sm text-muted-foreground'>
                No devices found.
              </div>
            ) : (
              <div className='space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin'>
                {(totpList || []).map((device: TOTPDevice) => (
                  <div
                    key={device.totp_id}
                    className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600'>
                        <Shield className='w-3.5 h-3.5' />
                      </div>
                      <div className='flex flex-col'>
                        <span className='font-medium text-xs'>
                          {device.totp_name}
                        </span>
                        <span className='text-[10px] text-muted-foreground'>
                          Added{' '}
                          {device.created_at
                            ? new Date(device.created_at).toLocaleDateString()
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() =>
                        deleteTOTP.mutate(
                          {
                            user_id: user?.user_id || '',
                            totp_id: device.totp_id,
                          },
                          {
                            onSuccess: () => {
                              if (totpList.length === 1) {
                                handleToggle2FA(false)
                              }
                            },
                          }
                        )
                      }
                      disabled={deleteTOTP.isPending}
                      className='text-muted-foreground hover:text-red-600 h-7 w-7'
                    >
                      {deleteTOTP.isPending ? (
                        <Loader2 className='w-3.5 h-3.5 animate-spin' />
                      ) : (
                        <Trash2 className='w-3.5 h-3.5' />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
