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
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Trash2,
  Loader2,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useManage2FA, type TOTPDevice } from '@/hooks/use2FA'
import type { User } from '@/types/user.types'

interface Manage2FAModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSetupClick: () => void
  onComplete: () => void
}

export const Manage2FAModal = ({
  open,
  onOpenChange,
  user,
  onSetupClick,
  onComplete,
}: Manage2FAModalProps) => {
  const { totpList, totpCount, toggle2FA, deleteTOTP } = useManage2FA(
    user?.user_id
  )
  const [isDisablingAll, setIsDisablingAll] = useState(false)
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null)

  const isTotpActive = user?.is_totp_2fa_active
  const isSmsActive = user?.is_sms_2fa_active
  const isEmailActive = user?.is_email_2fa_active
  const hasAny2FA = isTotpActive || isSmsActive || isEmailActive

  const handleDisableAll = async (checked: boolean) => {
    if (checked || !user?.user_id) return // Only handle disabling

    setIsDisablingAll(true)
    try {
      const promises = []
      if (isTotpActive) {
        promises.push(
          toggle2FA.mutateAsync({
            userId: user.user_id,
            method: 'totp',
            enabled: false,
            organizationId: user.organization_id,
          })
        )
      }
      if (isSmsActive) {
        promises.push(
          toggle2FA.mutateAsync({
            userId: user.user_id,
            method: 'sms',
            enabled: false,
            organizationId: user.organization_id,
          })
        )
      }
      if (isEmailActive) {
        promises.push(
          toggle2FA.mutateAsync({
            userId: user.user_id,
            method: 'email',
            enabled: false,
            organizationId: user.organization_id,
          })
        )
      }

      await Promise.all(promises)
      toast.success('Successfully disabled all 2FA methods')
      onComplete()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(`Failed to disable 2FA: ${error.message}`)
    } finally {
      setIsDisablingAll(false)
    }
  }

  const handleDisableMethod = async (method: 'totp' | 'sms' | 'email') => {
    if (!user?.user_id) return

    setLoadingMethod(method)
    try {
      await toggle2FA.mutateAsync({
        userId: user.user_id,
        method,
        enabled: false,
        organizationId: user.organization_id,
      })
      toast.success(`Successfully disabled ${method.toUpperCase()} 2FA`)
      onComplete()
    } catch (error: any) {
      toast.error(`Failed to disable 2FA: ${error.message}`)
    } finally {
      setLoadingMethod(null)
    }
  }

  const handleDeleteDevice = (deviceId: string) => {
    if (!user?.user_id) return
    deleteTOTP.mutate(
      {
        user_id: user.user_id,
        totp_id: deviceId,
      },
      {
        onSuccess: () => {
          onComplete()
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <div className='flex items-center justify-between pr-4'>
            <div className='space-y-1'>
              <DialogTitle className='flex items-center gap-2 text-xl'>
                <ShieldCheck className='w-5 h-5 text-primary' />
                Manage Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                Manage 2FA settings and devices for{' '}
                {user?.display_name || user?.user_name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Global Disable Switch */}
          <div className='flex items-center justify-between p-4 rounded-lg bg-muted/50 border'>
            <div className='space-y-0.5'>
              <h4 className='font-semibold text-sm'>
                Two-Factor Authentication
              </h4>
              <p className='text-xs text-muted-foreground block max-w-[280px]'>
                {hasAny2FA
                  ? 'Turn off to instantly disable all configured 2FA methods.'
                  : 'No 2FA methods are currently active.'}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {isDisablingAll && (
                <Loader2 className='w-4 h-4 animate-spin text-muted-foreground' />
              )}
              <Switch
                checked={!!hasAny2FA}
                onCheckedChange={handleDisableAll}
                disabled={!hasAny2FA || isDisablingAll}
              />
            </div>
          </div>

          {/* Active Methods Summary */}
          {hasAny2FA && (
            <div className='space-y-3'>
              <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Active Methods
              </h4>
              <div className='flex flex-col gap-2'>
                {isTotpActive && (
                  <div className='flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/10 transition-colors'>
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md'>
                        <ShieldCheck className='w-4 h-4' />
                      </div>
                      <span className='font-medium text-sm'>
                        Authenticator App
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      {loadingMethod === 'totp' && (
                        <Loader2 className='w-4 h-4 animate-spin text-muted-foreground' />
                      )}
                      <Switch
                        checked={true}
                        onCheckedChange={() => handleDisableMethod('totp')}
                        disabled={isDisablingAll || loadingMethod !== null}
                      />
                    </div>
                  </div>
                )}
                {isSmsActive && (
                  <div className='flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/10 transition-colors'>
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 bg-green-50 text-green-700 border border-green-200 rounded-md'>
                        <Smartphone className='w-4 h-4' />
                      </div>
                      <span className='font-medium text-sm'>
                        SMS Verification
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      {loadingMethod === 'sms' && (
                        <Loader2 className='w-4 h-4 animate-spin text-muted-foreground' />
                      )}
                      <Switch
                        checked={true}
                        onCheckedChange={() => handleDisableMethod('sms')}
                        disabled={isDisablingAll || loadingMethod !== null}
                      />
                    </div>
                  </div>
                )}
                {isEmailActive && (
                  <div className='flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/10 transition-colors'>
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md'>
                        <Mail className='w-4 h-4' />
                      </div>
                      <span className='font-medium text-sm'>
                        Email Verification
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      {loadingMethod === 'email' && (
                        <Loader2 className='w-4 h-4 animate-spin text-muted-foreground' />
                      )}
                      <Switch
                        checked={true}
                        onCheckedChange={() => handleDisableMethod('email')}
                        disabled={isDisablingAll || loadingMethod !== null}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TOTP Devices List */}
          {isTotpActive && totpList && totpList.length > 0 && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Authenticator Devices ({totpCount}/10)
                </h4>
              </div>

              <div className='space-y-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin'>
                {totpList.map((device: TOTPDevice) => (
                  <div
                    key={device.totp_id}
                    className='flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600'>
                        <Smartphone className='w-4 h-4' />
                      </div>
                      <div className='flex flex-col'>
                        <span className='font-medium text-sm'>
                          {device.totp_name}
                        </span>
                        <span className='text-[11px] text-muted-foreground'>
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
                      onClick={() => handleDeleteDevice(device.totp_id)}
                      disabled={deleteTOTP.isPending}
                      className='text-muted-foreground hover:text-red-600 hover:bg-red-50 h-8 w-8'
                      title='Delete Device'
                    >
                      {deleteTOTP.isPending ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Trash2 className='w-4 h-4' />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasAny2FA && (
            <div className='flex flex-col items-center justify-center py-6 text-center space-y-3'>
              <div className='w-12 h-12 rounded-full bg-muted flex items-center justify-center'>
                <ShieldCheck className='w-6 h-6 text-muted-foreground' />
              </div>
              <p className='text-sm text-muted-foreground max-w-[280px]'>
                Two-factor authentication is not currently configured for this
                user.
              </p>
            </div>
          )}
        </div>

        <div className='flex justify-between items-center pt-4 border-t'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              onSetupClick()
            }}
            className='gap-2'
          >
            <Plus className='w-4 h-4' /> Add 2FA Method
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
