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
import { useAtomValue } from 'jotai'
import {
  Shield,
  Smartphone,
  Loader2,
  KeyRound,
  Trash2,
  Phone,
  Mail,
  Plus,
  AlertCircle,
  Clock,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { userAtom } from '@/atoms/user'
import { useTOTPList, useUpdate2FAStatus, useDeleteTOTP } from '@/hooks/use2FA'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { TwoFASetupModal } from '@/components/auth/TwoFASetupModal'
import { ResetPasswordModal } from '@/components/common/ResetPasswordModal'
import { userService } from '@/api/user'
import { useUser } from '@/hooks/useUsers'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { auditService } from '@/api/audit'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'

const SecuritySettings = () => {
  const user = useAtomValue(userAtom)

  // -- Local State --
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteTOTPModal, setShowDeleteTOTPModal] = useState(false)
  const [totpToDelete, setTotpToDelete] = useState<{
    id: string
    name: string
  } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [isDevicesExpanded, setIsDevicesExpanded] = useState(false)

  // -- Hooks --
  const {
    data: totpList,
    isLoading: isLoadingTOTP,
    refetch: refetchTOTP,
  } = useTOTPList(user?.user_id || '')
  const {
    data: userDate,
    isLoading: isLoadingUser,
    refetch: refetchUser,
  } = useUser(user?.user_id || '')
  const update2FAStatus = useUpdate2FAStatus()
  const deleteTOTP = useDeleteTOTP(user?.user_id)

  // -- Handlers --
  const handleToggle2FA = async (
    method: 'totp' | 'sms' | 'email',
    checked: boolean
  ) => {
    // Special logic for enabling TOTP
    if (method === 'totp' && checked) {
      // If enabling, check if devices exist
      if (!totpList || totpList.length === 0) {
        // No devices, open Setup Modal
        setShow2FAModal(true)
        return
      }
    }

    // Otherwise, just call the API
    update2FAStatus.mutate(
      {
        userId: user?.user_id ?? '',
        method,
        enabled: checked,
        organizationId: user?.organization_id,
      },
      {
        onSuccess: () => {
          refetchUser()
          toast.success(
            `${method.toUpperCase()} 2FA ${checked ? 'enabled' : 'disabled'} successfully`
          )
          auditService.log(
            checked
              ? AUDIT_LOG_TYPES.TWO_FA_ENABLE
              : AUDIT_LOG_TYPES.TWO_FA_DISABLE,
            `User ${user?.user_name} updated 2FA: ${method} ${checked ? 'enabled' : 'disabled'}`,
            `Action: 2FA Update
             Initiated By: ${user?.user_name}
             User ID: ${user?.user_id}
             Status: Success
             Description: The 2FA method ${method} has been ${checked ? 'enabled' : 'disabled'} successfully.`
          )
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.error || error.message
          auditService.log(
            checked
              ? AUDIT_LOG_TYPES.TWO_FA_ENABLE_FAILED
              : AUDIT_LOG_TYPES.TWO_FA_DISABLE_FAILED,
            `User ${user?.user_name} failed to update 2FA: ${method} ${checked ? 'enabled' : 'disabled'}`,
            `Action: 2FA Update Failed
             Initiated By: ${user?.user_name}
             User ID: ${user?.user_id}
             Status: Failed
             Error Details: ${errorMessage}
             Description: The attempt to update 2FA method ${method} failed. No changes were applied. Check the error details and system logs for troubleshooting.`
          )
          toast.error(`Failed to update 2FA: ${errorMessage}`)
        },
      }
    )
  }

  const handlePasswordReset = async (password: string) => {
    setPasswordLoading(true)
    try {
      if (user?.user_id) {
        await userService.resetPassword(user.user_id, password, user?.user_name)
        auditService.log(
          AUDIT_LOG_TYPES.PASSWORD_CHANGE,
          `User ${user?.user_name} updated password`,
          `Action: Password Update
           Initiated By: ${user?.user_name}
           User ID: ${user?.user_id}
           Status: Success
           Description: The user's password has been updated successfully.`
        )
        toast.success('Password updated successfully')
        setShowPasswordModal(false)
      }
    } catch (error: any) {
      auditService.log(
        AUDIT_LOG_TYPES.PASSWORD_CHANGE_FAILED,
        `User ${user?.user_name} failed to update password`,
        `Action: Password Update Failed
         Initiated By: ${user?.user_name}
         User ID: ${user?.user_id}
         Status: Failed
         Error Details: ${error?.response?.data?.error || error.message}
         Description: The attempt to update the user's password failed. No changes were applied. Check the error details and system logs for troubleshooting.`
      )
      toast.error(error.response?.data?.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteTOTP = (totpId: string, totpName: string) => {
    setTotpToDelete({ id: totpId, name: totpName })
    setShowDeleteTOTPModal(true)
  }

  const confirmDeleteTOTP = async () => {
    if (!totpToDelete || !user?.user_id) return

    deleteTOTP.mutate(
      { user_id: user.user_id, totp_id: totpToDelete.id },
      {
        onSuccess: response => {
          toast.success(response)
          setShowDeleteTOTPModal(false)
          setTotpToDelete(null)
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to delete TOTP')
        },
      }
    )
  }

  if (isLoadingUser) {
    return <SecuritySkeleton />
  }

  return (
    <div className='w-full mx-auto space-y-2'>
      <div className='flex items-center gap-4'>
        <Breadcrumbs className='mb-0' />
      </div>

      {/* 1. Password Section */}
      <section className='space-y-2 mt-4'>
        <div className='flex items-center gap-2 px-1'>
          <KeyRound className='w-5 h-5 text-primary' />
          <h2 className='text-base font-semibold tracking-tight'>
            Credentials
          </h2>
        </div>

        <Card className='border border-border/60 shadow-sm overflow-hidden'>
          <div className='p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
            <div className='space-y-1'>
              <h3 className='text-sm font-medium'>Login Password</h3>
              <p className='text-xs text-muted-foreground max-w-lg'>
                Ensure your account is using a strong, unique password. We
                recommend rotating it periodically.
              </p>
            </div>
            <Button
              variant='outline'
              onClick={() => setShowPasswordModal(true)}
              className='shrink-0'
            >
              Change Password
            </Button>
          </div>
        </Card>
      </section>

      {/* 2. 2FA Section */}
      <section className='space-y-2 mt-4'>
        <div className='flex items-center gap-2 px-1'>
          <Shield className='w-5 h-5 text-primary' />
          <h2 className='text-base font-semibold tracking-tight'>
            Two-Factor Authentication
          </h2>
        </div>

        <Card className='border border-border/60 shadow-sm overflow-hidden'>
          <div className='divide-y divide-border/60'>
            {/* TOTP Method */}
            <div className='p-4 space-y-2'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex items-start gap-4'>
                  <div className='p-2.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 shrink-0 mt-0.5'>
                    <Smartphone className='w-5 h-5' />
                  </div>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-medium text-sm'>Authenticator App</h3>
                      <Badge
                        variant='outline'
                        className='text-[9px] uppercase tracking-wide font-normal'
                      >
                        Recommended
                      </Badge>
                    </div>
                    <p className='text-xs text-muted-foreground max-w-md'>
                      Secure your account using time-based codes generated by
                      apps like Google Authenticator or Authy.
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Switch
                    checked={userDate?.is_totp_2fa_active}
                    onCheckedChange={checked =>
                      handleToggle2FA('totp', checked)
                    }
                    disabled={update2FAStatus.isPending}
                    className='scale-90'
                  />
                </div>
              </div>

              {/* Active Devices List (Conditional) */}
              {userDate?.is_totp_2fa_active && (
                <div className='bg-muted/30 rounded-xl border border-border/50 overflow-hidden mt-4'>
                  <div
                    className='px-4 py-3 border-b border-border/50 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors'
                    onClick={() => setIsDevicesExpanded(!isDevicesExpanded)}
                  >
                    <div className='flex items-center gap-2'>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isDevicesExpanded ? 'rotate-180' : ''}`}
                      />
                      <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        Active Devices
                      </h4>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-7 text-xs gap-1.5 hover:bg-background'
                      onClick={e => {
                        e.stopPropagation()
                        setShow2FAModal(true)
                      }}
                    >
                      <Plus className='w-3 h-3' />
                      Add Device
                    </Button>
                  </div>

                  {isDevicesExpanded && (
                    <div className='p-2 space-y-1 animate-in slide-in-from-top-2 duration-200'>
                      {isLoadingTOTP ? (
                        <div className='py-4 flex justify-center'>
                          <Loader2 className='w-4 h-4 animate-spin text-muted-foreground' />
                        </div>
                      ) : totpList && totpList.length > 0 ? (
                        totpList.map(device => (
                          <div
                            key={device.totp_id}
                            className='group flex items-center justify-between p-3 rounded-lg hover:bg-background transition-colors border border-transparent hover:border-border/50'
                          >
                            <div className='flex items-center gap-3'>
                              <div className='p-1.5 rounded bg-background border shadow-sm text-muted-foreground'>
                                <Smartphone className='w-4 h-4' />
                              </div>
                              <div className='flex flex-col'>
                                <span className='text-sm font-medium'>
                                  {device.totp_name}
                                </span>
                                <span className='text-[11px] text-muted-foreground flex items-center gap-1'>
                                  <Clock className='w-3 h-3' />
                                  Added{' '}
                                  {device.created_at
                                    ? format(
                                        new Date(device.created_at),
                                        'MMM d, yyyy'
                                      )
                                    : 'Unknown'}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity'
                              onClick={e => {
                                e.stopPropagation()
                                handleDeleteTOTP(
                                  device.totp_id,
                                  device.totp_name
                                )
                              }}
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className='py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2'>
                          <AlertCircle className='w-5 h-5 opacity-50' />
                          No devices registered. Add a device to secure your
                          account.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SMS Method */}
            <div className='p-4 flex items-center justify-between gap-4'>
              <div className='flex items-center gap-4'>
                <div className='p-2.5 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 shrink-0'>
                  <Phone className='w-5 h-5' />
                </div>
                <div className='space-y-0.5'>
                  <h3 className='font-medium text-sm'>SMS Verification</h3>
                  <p className='text-xs text-muted-foreground'>
                    Receive a one-time verification code via text message.
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={userDate?.is_sms_2fa_active}
                  onCheckedChange={checked => handleToggle2FA('sms', checked)}
                  disabled={
                    update2FAStatus.isPending || !userDate?.primary_phone
                  }
                  className='scale-90'
                />
              </div>
            </div>

            {/* Email Method */}
            <div className='p-4 flex items-center justify-between gap-4'>
              <div className='flex items-center gap-4'>
                <div className='p-2.5 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 shrink-0'>
                  <Mail className='w-5 h-5' />
                </div>
                <div className='space-y-0.5'>
                  <h3 className='font-medium text-sm'>Email Verification</h3>
                  <p className='text-xs text-muted-foreground'>
                    Receive a one-time verification code via your registered
                    email.
                  </p>
                </div>
              </div>
              <Switch
                checked={userDate?.is_email_2fa_active}
                onCheckedChange={checked => handleToggle2FA('email', checked)}
                disabled={update2FAStatus.isPending || !userDate?.user_email}
                className='scale-90'
              />
            </div>
          </div>
        </Card>
      </section>

      {/* Modals */}
      <TwoFASetupModal
        open={show2FAModal}
        onOpenChange={setShow2FAModal}
        user={userDate}
        currentStep={2}
        addFunction={() => {
          refetchTOTP()
          refetchUser()
        }}
        showDeviceList={false}
      />

      <ResetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handlePasswordReset}
        userName={userDate?.user_name || ''}
        isLoading={passwordLoading}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteTOTPModal}
        onClose={() => setShowDeleteTOTPModal(false)}
        onConfirm={confirmDeleteTOTP}
        value={totpToDelete?.name || ''}
        isLoading={deleteTOTP.isPending}
        title='Delete Authenticator Device'
        description='Are you sure you want to delete this authenticator device? You will no longer be able to use it for two-factor authentication.'
        warningItems={[
          'This action cannot be undone',
          'You will need to set up a new device to use TOTP authentication',
          'If this is your only 2FA method, you may be locked out',
        ]}
      />
    </div>
  )
}

const SecuritySkeleton = () => (
  <div className='w-full mx-auto space-y-8'>
    <div className='space-y-4'>
      <Skeleton className='h-6 w-32' />
      <Skeleton className='h-24 w-full rounded-lg' />
    </div>
    <div className='space-y-4'>
      <Skeleton className='h-6 w-48' />
      <Skeleton className='h-96 w-full rounded-lg' />
    </div>
  </div>
)

export default SecuritySettings
