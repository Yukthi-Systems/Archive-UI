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

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import * as yup from 'yup'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (password: string) => void
  userName: string
  isLoading: boolean
}

const passwordRegex = new RegExp(
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?])[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]{8,}$'
)

const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(32, 'Password must not exceed 32 characters')
    .matches(
      passwordRegex,
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
})

type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isLoading,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const handleFormSubmit = (data: ResetPasswordFormData) => {
    onConfirm(data.password)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset()
      setShowPassword(false)
      setShowConfirmPassword(false)
      onClose()
    }
  }

  const password = watch('password')
  const confirmPassword = watch('confirmPassword')

  const getPasswordStrength = () => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[@$!%*?&]/.test(password)) strength += 1
    return strength
  }

  const passwordStrength = getPasswordStrength()
  const passwordsMatch =
    password && confirmPassword && password === confirmPassword

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-primary/10 rounded-full'>
              <Lock className='w-5 h-5 text-primary' />
            </div>
            <DialogTitle>Reset Password</DialogTitle>
          </div>
          <DialogDescription>
            Enter a new password for{' '}
            <span className='font-medium text-foreground'>{userName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className='space-y-6 py-4'
        >
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='password'>New Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter new password'
                  {...register('password')}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type='button'
                  className='absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='text-xs text-red-500'>
                  {errors.password.message}
                </p>
              )}

              {/* Strength Indicator */}
              {password && (
                <div className='space-y-1'>
                  <div className='flex items-center gap-2 text-xs'>
                    <span className='text-muted-foreground'>Strength:</span>
                    <div className='flex gap-0.5'>
                      {[1, 2, 3, 4, 5].map(level => (
                        <div
                          key={level}
                          className={`h-1 w-8 rounded-full ${
                            level <= passwordStrength
                              ? passwordStrength >= 4
                                ? 'bg-green-500'
                                : passwordStrength >= 3
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-xs font-medium ${passwordStrength >= 4 ? 'text-green-600' : passwordStrength >= 3 ? 'text-yellow-600' : 'text-red-600'}`}
                    >
                      {passwordStrength >= 4
                        ? 'Strong'
                        : passwordStrength >= 3
                          ? 'Medium'
                          : 'Weak'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirm new password'
                  {...register('confirmPassword')}
                  className={
                    errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'
                  }
                />
                <button
                  type='button'
                  className='absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className='text-xs text-red-500'>
                  {errors.confirmPassword.message}
                </p>
              )}

              {/* Match Indicator */}
              {password && confirmPassword && (
                <div className='flex items-center gap-1.5 text-xs'>
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className='w-3.5 h-3.5 text-green-500' />
                      <span className='text-green-600 font-medium'>
                        Passwords match
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className='w-3.5 h-3.5 text-red-500' />
                      <span className='text-red-600 font-medium'>
                        Passwords don't match
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className='gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Updating...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
