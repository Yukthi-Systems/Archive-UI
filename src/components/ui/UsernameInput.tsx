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

import React, { useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, User } from 'lucide-react'
import { useValidateUsername } from '../../hooks/useUser'
import { Input } from './input'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

interface UsernameInputProps {
  label?: string
  name?: string
  register: any
  errors?: Record<string, any>
  watch: any
  disabled?: boolean
  placeholder?: string
  originalUsername?: string | null
  isRequired?: boolean
  setError?: any
  clearErrors?: any
  className?: string
  type?: 'user' | 'admin'
}

const UsernameInput = ({
  label = 'Username',
  name = 'user_name',
  register,
  errors,
  watch,
  disabled = false,
  placeholder = 'Enter username (e.g., john_doe)',
  originalUsername = null,
  isRequired = false,
  setError,
  clearErrors,
  className = '',
  type = 'user',
}: UsernameInputProps) => {
  const currentValue = watch(name) || ''

  const shouldValidate = !originalUsername || currentValue !== originalUsername

  // Fix: Hooks must be called unconditionally.
  // We pass an empty string if we shouldn't validate to prevent the hook from firing API calls
  // (assuming the hook ignores empty strings, which is standard behavior).
  const validationQuery = shouldValidate ? currentValue : ''
  const realValidation = useValidateUsername(validationQuery, type)

  const usernameValidation = shouldValidate
    ? realValidation
    : {
        isLoading: false,
        isAvailable: null, // null implies we aren't checking / it's valid contextually
        isDebouncing: false,
        error: null,
        data: null,
      }

  // Set form error based on username availability
  useEffect(() => {
    if (!setError || !clearErrors) return

    if (usernameValidation.isAvailable === false) {
      setError(name, {
        type: 'manual',
        message: `Username "${usernameValidation.data?.user_name}" is already taken`,
      })
    } else if (usernameValidation.isAvailable === true) {
      clearErrors(name)
    }
  }, [
    usernameValidation.isAvailable,
    name,
    setError,
    clearErrors,
    usernameValidation.data?.user_name,
  ])

  const getValidationState = () => {
    if (!currentValue || currentValue.length < 3) {
      return null
    }

    if (originalUsername && currentValue === originalUsername) {
      return null
    }

    // Check username format (letters, numbers, underscores, hyphens)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(currentValue)) {
      return 'invalid'
    }

    if (usernameValidation.isDebouncing || usernameValidation.isLoading) {
      return 'loading'
    }

    if (usernameValidation.error) {
      return 'error'
    }

    return usernameValidation.isAvailable ? 'valid' : 'invalid'
  }

  const validationState = getValidationState()

  const getValidationIcon = () => {
    switch (validationState) {
      case 'loading':
        return (
          <Loader2 className='w-4 h-4 text-muted-foreground animate-spin' />
        )
      case 'valid':
        return <CheckCircle className='w-4 h-4 text-green-500' />
      case 'invalid':
      case 'error':
        return <XCircle className='w-4 h-4 text-red-500' />
      default:
        return <User className='w-4 h-4 text-muted-foreground' />
    }
  }

  const getValidationMessage = () => {
    if (originalUsername && currentValue === originalUsername) {
      return 'Current username'
    }

    if (currentValue && currentValue.length < 3) {
      return 'Username must be at least 3 characters'
    }

    // Check username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (currentValue && !usernameRegex.test(currentValue)) {
      return 'Only letters, numbers, underscores, and hyphens allowed'
    }

    if (validationState === 'valid') {
      return 'Username is available'
    }

    if (validationState === 'invalid') {
      if (usernameValidation.data && !usernameValidation.data.is_available) {
        return `Username "${usernameValidation.data.user_name}" is already taken`
      }
      return 'Username is not available'
    }

    if (usernameValidation.error) {
      return 'Error checking username availability'
    }

    return ''
  }

  const getInfoColor = () => {
    if (validationState === 'valid') return 'text-green-600'
    if (validationState === 'invalid' || validationState === 'error')
      return 'text-red-600'
    return 'text-muted-foreground'
  }

  const validationMessage = getValidationMessage()

  return (
    <>
      {label && (
        <Label htmlFor={name} className='text-sm font-medium'>
          {label} {isRequired && <span className='text-red-500'>*</span>}
        </Label>
      )}

      <div className='relative space-y-1'>
        <Input
          id={name}
          type='text'
          placeholder={placeholder}
          className={cn(
            className,
            validationState === 'valid' &&
              'border-green-500 focus-visible:ring-green-500/20',
            (validationState === 'invalid' || validationState === 'error') &&
              'border-red-500 focus-visible:ring-red-500/20',
            errors?.[name] && 'border-red-500 focus-visible:ring-red-500/20'
          )}
          disabled={disabled}
          autoComplete='new-username'
          {...register(name)}
        />

        <div className='absolute right-3 top-1/2 -translate-y-1/2'>
          {getValidationIcon()}
        </div>
      </div>

      {validationMessage ? (
        <p className={cn('text-xs', getInfoColor())}>{validationMessage}</p>
      ) : errors?.[name] ? (
        <p className='text-xs text-red-500'>{errors[name]?.message}</p>
      ) : (
        <p className='text-xs text-muted-foreground'>
          Used for login. Letters, numbers, underscores, and hyphens only.
        </p>
      )}
    </>
  )
}

export default UsernameInput
