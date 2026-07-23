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
import { QRCodeSVG } from 'qrcode.react'
import {
  Shield,
  Mail,
  Smartphone,
  Copy,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCw,
  Trash2,
  ChevronRight,
  Lock,
  AlertCircle,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { use2FASetup, useManage2FA, type TOTPDevice } from '@/hooks/use2FA'
import { userAtom } from '@/atoms/user'
import { cn } from '@/lib/utils'

import type { User } from '@/types/user.types'

type SetupMethod = 'totp' | 'sms' | 'email'

interface TwoFASetupModalProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  user?: User
  addFunction?: () => void
  currentStep?: number
  showDeviceList?: boolean
}

export const TwoFASetupModal = ({
  children,
  open,
  onOpenChange,
  user: propUser,
  addFunction = () => {},
  currentStep = 1,
  showDeviceList = true,
}: TwoFASetupModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(currentStep || 1)
  const [selectedMethod, setSelectedMethod] = useState<SetupMethod>('totp')
  const [totpName, setTotpName] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [totpData, setTotpData] = useState<{
    name: string
    qr_code_url: string
    secret: string
  } | null>(null)

  const atomUser = useAtomValue(userAtom)
  const user = propUser || atomUser
  const { initiateTOTP, initiateOTP, verifyAndEnable, completeSetup } =
    use2FASetup()
  const { totpList, totpCount, deleteTOTP } = useManage2FA(user?.user_id)

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setIsOpen(newOpen)
    }

    if (!newOpen) {
      setTimeout(() => {
        setStep(1)
        setSelectedMethod('totp')
        setTotpName('')
        setVerificationCode('')
        setTotpData(null)
      }, 300)
    }
  }

  const isDialogOpen = open !== undefined ? open : isOpen

  const handleStep1Next = () => {
    setStep(2)
  }

  const handleStep2Next = async () => {
    if (!user?.user_id) {
      toast.error('User information missing')
      return
    }

    if (selectedMethod === 'totp') {
      if (totpCount >= 10) {
        toast.error(
          'Maximum number of TOTP devices (10) reached. Please delete a device to add a new one.'
        )
        return
      }
      if (!totpName.trim()) {
        toast.error('Please enter a name for your Authenticator app')
        return
      }

      initiateTOTP.mutate(
        {
          user_id: user.user_id,
          totp_name: totpName,
          organization_id: user.organization_id,
        },
        {
          onSuccess: data => {
            setTotpData(data)
            setStep(3)
          },
        }
      )
    } else {
      completeSetup.mutate(
        {
          user_id: user.user_id,
          method: selectedMethod,
          organization_id: user.organization_id,
        },
        {
          onSuccess: () => {
            toast.success(
              `${
                selectedMethod === 'sms' ? 'SMS' : 'Email'
              } 2FA enabled successfully`
            )
            setStep(5)
          },
          onError: error => {
            toast.error(`Failed to enable 2FA: ${error.message}`)
          },
        }
      )
    }
  }

  const handleStep3Next = () => {
    setStep(4)
  }

  const handleStep4Verify = () => {
    if (!user?.user_id) return
    if (!verificationCode || verificationCode.length < 6) {
      toast.error('Please enter a valid code')
      return
    }

    verifyAndEnable.mutate(
      {
        user_id: user.user_id,
        method: selectedMethod,
        code: verificationCode,
        secret: totpData?.secret,
        organization_id: user.organization_id,
      },
      {
        onSuccess: (response: any) => {
          if (
            response.message === 'TOTP code is valid' ||
            response === 'TOTP code is valid'
          ) {
            setStep(5)
          } else {
            toast.error(response.message || 'Verification failed')
          }
        },
      }
    )
  }

  const handleResendCode = () => {
    if (!user?.user_id || selectedMethod === 'totp') return

    initiateOTP.mutate(
      {
        user_id: user.user_id,
        method: selectedMethod,
        organization_id: user.organization_id,
      },
      {
        onSuccess: () => {
          toast.success('Code resent successfully')
        },
      }
    )
  }

  const handleComplete = () => {
    if (!user?.user_id) return

    completeSetup.mutate(
      {
        user_id: user.user_id,
        method: selectedMethod,
        organization_id: user.organization_id,
      },
      {
        onSuccess: () => {
          toast.success('Two-factor authentication enabled successfully')
          addFunction()
          handleOpenChange(false)
        },
        onError: () => {
          handleOpenChange(false)
        },
      }
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <div className='space-y-6 pt-4'>
            <RadioGroup
              value={selectedMethod}
              onValueChange={(val: string) =>
                setSelectedMethod(val as SetupMethod)
              }
              className='grid gap-3'
            >
              <Label
                htmlFor='totp'
                className={cn(
                  'relative flex items-start gap-4 rounded-xl border p-4 shadow-sm transition-all hover:border-primary/50 cursor-pointer',
                  selectedMethod === 'totp'
                    ? 'border-primary ring-1 ring-primary bg-primary/5'
                    : 'border-border bg-card'
                )}
              >
                <RadioGroupItem
                  value='totp'
                  id='totp'
                  className='absolute right-4 top-4'
                />
                <div className='p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30'>
                  <Shield className='h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <div className='font-semibold text-sm'>Authenticator App</div>
                  <div className='text-xs text-muted-foreground leading-relaxed max-w-[240px]'>
                    Use an app like Google Authenticator or Authy to generate
                    verification codes.
                  </div>
                </div>
              </Label>

              {!user?.is_sms_2fa_active && (
                <Label
                  htmlFor='sms'
                  className={cn(
                    'relative flex items-start gap-4 rounded-xl border p-4 shadow-sm transition-all hover:border-primary/50 cursor-pointer',
                    selectedMethod === 'sms'
                      ? 'border-primary ring-1 ring-primary bg-primary/5'
                      : 'border-border bg-card'
                  )}
                >
                  <RadioGroupItem
                    value='sms'
                    id='sms'
                    className='absolute right-4 top-4'
                  />
                  <div className='p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30'>
                    <Smartphone className='h-5 w-5' />
                  </div>
                  <div className='space-y-1'>
                    <div className='font-semibold text-sm'>SMS Message</div>
                    <div className='text-xs text-muted-foreground leading-relaxed max-w-[240px]'>
                      Receive a one-time verification code via text message to
                      your phone.
                    </div>
                  </div>
                </Label>
              )}

              {!user?.is_email_2fa_active && (
                <Label
                  htmlFor='email'
                  className={cn(
                    'relative flex items-start gap-4 rounded-xl border p-4 shadow-sm transition-all hover:border-primary/50 cursor-pointer',
                    selectedMethod === 'email'
                      ? 'border-primary ring-1 ring-primary bg-primary/5'
                      : 'border-border bg-card'
                  )}
                >
                  <RadioGroupItem
                    value='email'
                    id='email'
                    className='absolute right-4 top-4'
                  />
                  <div className='p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30'>
                    <Mail className='h-5 w-5' />
                  </div>
                  <div className='space-y-1'>
                    <div className='font-semibold text-sm'>Email Address</div>
                    <div className='text-xs text-muted-foreground leading-relaxed max-w-[240px]'>
                      Receive a one-time verification code via email to your
                      registered address.
                    </div>
                  </div>
                </Label>
              )}
            </RadioGroup>

            <div className='flex justify-end'>
              <Button onClick={handleStep1Next} className='gap-2 pl-5 pr-4'>
                Next Step <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        )

      case 2: {
        const isMaxDevicesReached = selectedMethod === 'totp' && totpCount >= 10

        return (
          <div className='space-y-6 pt-2'>
            {selectedMethod === 'totp' ? (
              <div className='space-y-6'>
                {/* Existing Devices List */}
                {totpList.length > 0 && showDeviceList && (
                  <div className='space-y-3'>
                    <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      Active Devices ({totpCount}/10)
                    </h4>
                    <div className='space-y-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin'>
                      {totpList.map((device: TOTPDevice) => (
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
                                  ? new Date(
                                      device.created_at
                                    ).toLocaleDateString()
                                  : 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() =>
                              deleteTOTP.mutate({
                                user_id: user?.user_id || '',
                                totp_id: device.totp_id,
                              })
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
                    <div className='h-px bg-border/60 my-2' />
                  </div>
                )}

                {/* Add New Device Section */}
                {!isMaxDevicesReached ? (
                  <div className='space-y-4'>
                    <div className='space-y-3'>
                      <Label
                        htmlFor='totp-name'
                        className='text-sm font-medium'
                      >
                        Device Name
                      </Label>
                      <Input
                        id='totp-name'
                        placeholder='e.g., iPhone 13, Work Laptop'
                        value={totpName}
                        onChange={e => setTotpName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleStep2Next()
                        }}
                        className='h-10'
                      />
                      <p className='text-xs text-muted-foreground'>
                        This name will help you identify this device later.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className='p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400'>
                    <div className='flex items-center gap-2 mb-1 font-medium text-sm'>
                      <AlertCircle className='w-4 h-4' />
                      Limit Reached
                    </div>
                    <p className='text-xs opacity-90 leading-relaxed'>
                      You can have a maximum of 10 authenticator devices. Remove
                      an old device to add a new one.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-6 space-y-4'>
                <div className='w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center'>
                  {selectedMethod === 'sms' ? (
                    <Smartphone className='w-8 h-8 text-muted-foreground' />
                  ) : (
                    <Mail className='w-8 h-8 text-muted-foreground' />
                  )}
                </div>
                <div className='text-center space-y-1'>
                  <h3 className='text-base font-semibold'>
                    Confirm Verification Target
                  </h3>
                  <p className='text-xs text-muted-foreground max-w-[260px] mx-auto'>
                    We will send a one-time code to the following destination:
                  </p>
                </div>
                <div className='px-4 py-2 bg-muted/40 border rounded-full text-sm font-medium font-mono'>
                  {selectedMethod === 'sms'
                    ? user?.primary_phone || 'No phone number'
                    : user?.user_email || 'No email'}
                </div>
                {!user?.primary_phone && selectedMethod === 'sms' && (
                  <p className='text-xs text-red-500 font-medium'>
                    Please add a phone number to your profile first.
                  </p>
                )}
              </div>
            )}

            <div className='flex justify-between items-center pt-2'>
              <Button
                variant='ghost'
                onClick={() => setStep(1)}
                className='text-muted-foreground hover:text-foreground'
              >
                Back
              </Button>
              <Button
                onClick={handleStep2Next}
                disabled={
                  initiateTOTP.isPending ||
                  completeSetup.isPending ||
                  (selectedMethod === 'sms' && !user?.primary_phone) ||
                  (selectedMethod === 'totp' && isMaxDevicesReached)
                }
                className='gap-2 pl-5 pr-4'
              >
                {(initiateTOTP.isPending || completeSetup.isPending) && (
                  <Loader2 className='w-4 h-4 animate-spin' />
                )}
                {selectedMethod === 'totp' ? 'Continue' : 'Enable'}
                {selectedMethod === 'totp' && (
                  <ArrowRight className='w-4 h-4' />
                )}
              </Button>
            </div>
          </div>
        )
      }

      case 3: // QR Code
        return (
          <div className='space-y-6 pt-4'>
            <div className='flex flex-col items-center space-y-6'>
              <div className='p-4 bg-white rounded-xl border shadow-sm'>
                {totpData?.qr_code_url && (
                  <QRCodeSVG value={totpData.qr_code_url} size={160} />
                )}
              </div>

              <div className='space-y-3 w-full text-center'>
                <p className='text-sm font-medium'>Scan this QR Code</p>
                <p className='text-xs text-muted-foreground px-4'>
                  Open your authenticator app and scan the image above. If you
                  can't scan it, enter the code below manually.
                </p>

                <div className='relative flex items-center max-w-xs mx-auto'>
                  <Input
                    value={totpData?.secret || ''}
                    readOnly
                    className='font-mono text-center text-xs h-9 pr-9 bg-muted/30'
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute right-0 h-9 w-9 text-muted-foreground hover:text-primary'
                    onClick={() => copyToClipboard(totpData?.secret || '')}
                  >
                    <Copy className='w-3.5 h-3.5' />
                  </Button>
                </div>
              </div>
            </div>

            <div className='flex justify-between items-center pt-2'>
              <Button variant='ghost' onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleStep3Next} className='gap-2 pl-5 pr-4'>
                Verify Code <ArrowRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        )

      case 4: // Verify
        return (
          <div className='space-y-8 pt-6 pb-2'>
            <div className='text-center space-y-2'>
              <h3 className='text-base font-semibold'>
                Enter Verification Code
              </h3>
              <p className='text-xs text-muted-foreground max-w-[280px] mx-auto'>
                Please enter the 6-digit code generated by your{' '}
                {selectedMethod === 'totp'
                  ? 'authenticator app'
                  : selectedMethod === 'sms'
                    ? 'phone'
                    : 'email'}
                .
              </p>
            </div>

            <div className='flex justify-center'>
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={val => setVerificationCode(val)}
              >
                <InputOTPGroup className='gap-2'>
                  <InputOTPSlot
                    index={0}
                    className='rounded-md border shadow-sm'
                  />
                  <InputOTPSlot
                    index={1}
                    className='rounded-md border shadow-sm'
                  />
                  <InputOTPSlot
                    index={2}
                    className='rounded-md border shadow-sm'
                  />
                  <InputOTPSlot
                    index={3}
                    className='rounded-md border shadow-sm'
                  />
                  <InputOTPSlot
                    index={4}
                    className='rounded-md border shadow-sm'
                  />
                  <InputOTPSlot
                    index={5}
                    className='rounded-md border shadow-sm'
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className='flex justify-between items-center pt-2'>
              <Button
                variant='ghost'
                onClick={() => setStep(selectedMethod === 'totp' ? 3 : 2)}
                className='text-muted-foreground hover:text-foreground'
              >
                Back
              </Button>

              <div className='flex gap-3'>
                {(selectedMethod === 'sms' || selectedMethod === 'email') && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleResendCode}
                    disabled={initiateOTP.isPending}
                    className='h-9'
                  >
                    {initiateOTP.isPending ? (
                      <Loader2 className='w-3 h-3 animate-spin' />
                    ) : (
                      <RefreshCw className='w-3.5 h-3.5 mr-2' />
                    )}
                    Resend
                  </Button>
                )}
                <Button
                  onClick={handleStep4Verify}
                  disabled={verifyAndEnable.isPending}
                  className='min-w-[100px] h-9'
                >
                  {verifyAndEnable.isPending ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    'Confirm'
                  )}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleComplete}
                  className='h-9'
                >
                  Skip & Enable
                </Button>
              </div>
            </div>
          </div>
        )

      case 5: // Success
        return (
          <div className='py-8 flex flex-col items-center text-center space-y-6'>
            <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 dark:bg-green-900/30 animate-in zoom-in duration-300'>
              <CheckCircle2 className='w-10 h-10' />
            </div>

            <div className='space-y-2'>
              <h2 className='text-xl font-bold'>Setup Complete!</h2>
              <p className='text-sm text-muted-foreground max-w-xs mx-auto'>
                Your account is now secured with two-factor authentication.
              </p>
            </div>

            <Button
              onClick={handleComplete}
              size='lg'
              className='px-8 min-w-[140px]'
              disabled={completeSetup.isPending}
            >
              {completeSetup.isPending && (
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
              )}
              Done
            </Button>
          </div>
        )
    }
  }

  const getTitle = () => {
    if (step === 5) return null
    if (step === 1) return 'Enable Two-Factor Authentication'
    if (step === 2)
      return selectedMethod === 'totp'
        ? 'Configure Authenticator'
        : 'Verify Contact'
    if (step === 3) return 'Scan QR Code'
    if (step === 4) return 'Verify Code'
    return '2FA Setup'
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className='sm:max-w-[440px] p-0 overflow-hidden gap-0 border-none shadow-2xl'
        onInteractOutside={e => {
          if (step !== 1 && step !== 5) e.preventDefault()
        }}
        onEscapeKeyDown={e => {
          if (step !== 1 && step !== 5) e.preventDefault()
        }}
      >
        {step !== 5 && (
          <DialogHeader className='px-6 pt-6 pb-2'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                <Lock className='h-5 w-5' />
              </div>
              <div className='space-y-1 text-left'>
                <DialogTitle className='text-lg'>{getTitle()}</DialogTitle>
                <DialogDescription className='text-xs'>
                  {step === 1
                    ? 'Add an extra layer of security to your account.'
                    : `Step ${step} of ${selectedMethod === 'totp' ? 4 : 3}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        )}
        <div className='px-6 pb-6'>{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
