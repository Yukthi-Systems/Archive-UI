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

import { useForm, Controller, type FieldErrors } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useNavigate, useParams } from 'react-router-dom'
import {
  UserPlus,
  UserCog,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Mail,
  Phone,
  User,
  Lock,
  CheckCircle2,
  XCircle,
  Info,
  Globe,
  Inbox,
  Plus,
  X,
  AlertCircle,
  Save,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useAtom } from 'jotai'
import { userAtom } from '@/atoms/user'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useCreateUser, useUpdateUser, useUser } from '@/hooks/useUsers'
import { useDomains } from '@/hooks/useDomains'
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from '../validations/createUserSchema'
import { usePermissionsConfig } from './PermissionConfig'
import UsernameInput from '@/components/ui/UsernameInput'
import PhoneInput from '@/components/ui/PhoneInput'

import { type User as UserType } from '@/types/user.types'
import { useAccessPermission } from '@/utils/accessPermission'
import NoAccess from '@/components/common/NoAccess'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PermissionsTable } from './PermissionTable'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface UserFormProps {
  mode: 'create' | 'edit'
}

const UserForm = ({ mode = 'create' }: UserFormProps) => {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const hasPermission = useAccessPermission(
    mode === 'create' ? 'user:create' : 'user:edit'
  )

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // REMOVED: isLoadingUser state effect loop
  // const [isLoadingUser, setIsLoadingUser] = useState(false)

  const PERMISSIONS_CONFIG = usePermissionsConfig()

  const schemas: any = mode === 'create' ? createUserSchema : updateUserSchema

  const { mutate: createUser, isPending: isCreating } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()

  const { data: userData, isLoading: isFetching } = useUser(
    userId!,
    mode === 'edit' && !!userId
  )

  // Use derived state instead of syncing useEffect
  const isPending = !!(isCreating || isUpdating || isFetching)

  const [currentUser] = useAtom(userAtom)
  const { data: domainsData, isLoading: isLoadingDomains } = useDomains({
    limit: 100,
  })
  const [mailboxInput, setMailboxInput] = useState('')
  const [openDomainSelect, setOpenDomainSelect] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    control,
    formState: { errors, isValid },
    setError,
    clearErrors,
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: yupResolver(schemas) as any,
    defaultValues:
      mode === 'create'
        ? {
            user_name: '',
            user_email: '',
            primary_phone: '+91',
            display_name: '',
            password: '',
            confirmPassword: '',
            is_active: true,
            basic_permissions: [],
            domain_permissions: [],
            mailbox_permissions: [],
          }
        : {
            user_id: '',
            user_name: '',
            user_email: '',
            primary_phone: '+91',
            display_name: '',
            is_active: true,
            basic_permissions: [],
            domain_permissions: [],
            mailbox_permissions: [],
          },
    mode: 'onChange',
  })

  // Track if we have already reset to avoid infinite loops with unstable userData refs
  const resetRef = useRef<string | null>(null)

  // Load user data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && userData) {
      // Create a stable hash or simply check ID to prevent re-running reset repeatedly
      const dataHash = JSON.stringify({
        id: userData.user_id,
        updated: userData.updated_at, // assuming there's a timestamp, otherwise the ID check is usually enough
      })

      // Only reset if we haven't processed this specific data version yet
      if (resetRef.current !== dataHash) {
        reset({
          user_id: userData.user_id,
          user_name: userData.user_name,
          user_email: userData.user_email,
          primary_phone: userData.primary_phone || '+91',
          display_name: userData.display_name || '',
          is_active: userData.is_active,
          basic_permissions: userData.basic_permissions || [],
          domain_permissions: userData.domain_permissions || [],
          mailbox_permissions: userData.mailbox_permissions || [],
        })
        resetRef.current = dataHash
      }
    }
  }, [userData, mode, reset])

  // REMOVED: useEffect(() => setIsLoadingUser(isFetching), [isFetching])

  const onSubmit = (data: CreateUserFormData | UpdateUserFormData) => {
    if (
      currentUser?.domain_permissions &&
      currentUser.domain_permissions.length > 0 &&
      (data.domain_permissions ?? []).length === 0
    ) {
      toast.error(
        'You must assign at least one domain scope from your allowed domains'
      )
      return
    }
    if (
      currentUser?.mailbox_permissions &&
      currentUser.mailbox_permissions.length > 0 &&
      (data.mailbox_permissions ?? []).length === 0
    ) {
      toast.error(
        'You must assign at least one mailbox scope from your allowed mailboxes'
      )
      return
    }

    const trimValues = (obj: any) => {
      const trimmed: any = {}
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          trimmed[key] = obj[key].trim()
        } else {
          trimmed[key] = obj[key]
        }
      }
      return trimmed
    }

    if (mode === 'edit' && userId && userData) {
      let updateData = data as UpdateUserFormData
      updateData = trimValues(updateData)

      const changes: Partial<UserType> = {}

      // Compare arrays Helper
      const areArraysEqual = (
        arr1: (string | undefined)[] | undefined,
        arr2: (string | undefined)[] | undefined
      ) => {
        if (!arr1 && !arr2) return true
        if (!arr1 || !arr2) return false
        const clean1 = arr1.filter((s): s is string => typeof s === 'string')
        const clean2 = arr2.filter((s): s is string => typeof s === 'string')
        if (clean1.length !== clean2.length) return false
        const sorted1 = [...clean1].sort()
        const sorted2 = [...clean2].sort()
        return sorted1.every((val, index) => val === sorted2[index])
      }

      if (updateData.user_name !== userData.user_name)
        changes.user_name = updateData.user_name
      if (updateData.display_name !== userData.display_name)
        changes.display_name = updateData.display_name
      if (updateData.user_email !== userData.user_email)
        changes.user_email = updateData.user_email
      if (updateData.primary_phone !== userData.primary_phone)
        changes.primary_phone = updateData.primary_phone
      if (updateData.is_active !== userData.is_active)
        changes.is_active = updateData.is_active

      if (
        !areArraysEqual(
          updateData.basic_permissions,
          userData.basic_permissions
        )
      ) {
        changes.basic_permissions = updateData.basic_permissions as string[]
      }
      if (
        !areArraysEqual(
          updateData.domain_permissions,
          userData.domain_permissions
        )
      ) {
        changes.domain_permissions = updateData.domain_permissions as string[]
      }
      if (
        !areArraysEqual(
          updateData.mailbox_permissions,
          userData.mailbox_permissions
        )
      ) {
        changes.mailbox_permissions = updateData.mailbox_permissions as string[]
      }

      if (Object.keys(changes).length === 0) {
        toast.info('No changes detected')
        return
      }

      changes.user_id = userId

      updateUser(
        { userId, userData: changes, username: userData.user_name },
        {
          onSuccess: () => {
            toast.success('User updated successfully!')
            navigate('/users')
          },
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.error || error.message
            toast.error(`Failed to update user: ${errorMessage}`)
          },
        }
      )
    } else if (mode === 'create') {
      const createData = data as CreateUserFormData
      const trimmedData = trimValues(createData)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword: _, ...userDataToSend } = trimmedData

      createUser(userDataToSend as unknown as Partial<UserType>, {
        onSuccess: () => {
          toast.success('User created successfully!')
          navigate('/users')
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.error || error.message
          toast.error(`Failed to create user: ${errorMessage}`)
        },
      })
    }
  }

  const formData = watch()
  const isActive = watch('is_active')
  const currentPermissions = watch('basic_permissions') || []
  const currentDomainPermissions = watch('domain_permissions') || []
  const currentMailboxPermissions = watch('mailbox_permissions') || []

  // Permissions that get disabled when a user is assigned any domain or mailbox scope
  const SCOPE_RESTRICTED_PERMISSIONS = [
    'domain:create',
    'domain:delete',
    'user:delete',
  ]
  const hasDomainPermissions = currentDomainPermissions.length > 0
  const hasScopeRestriction =
    hasDomainPermissions || currentMailboxPermissions.length > 0

  // Calculate which permissions should be disabled
  // Includes scope-restricted permissions and permissions the current user doesn't have
  const disabledBasicPermissions = useMemo(() => {
    const disabled: string[] = []

    if (hasScopeRestriction) {
      disabled.push(...SCOPE_RESTRICTED_PERMISSIONS)
    }

    if (currentUser) {
      const allAvailable = PERMISSIONS_CONFIG.flatMap(cat =>
        cat.permissions.map(p => p.value)
      )
      allAvailable.forEach(p => {
        if (!(currentUser.basic_permissions || []).includes(p)) {
          disabled.push(p)
        }
      })
    }

    return Array.from(new Set(disabled))
  }, [hasScopeRestriction, currentUser, PERMISSIONS_CONFIG])

  // When domain or mailbox scope is assigned, automatically strip restricted basic permissions
  useEffect(() => {
    if (hasScopeRestriction) {
      const filtered = (currentPermissions as string[]).filter(
        p => !SCOPE_RESTRICTED_PERMISSIONS.includes(p)
      )
      if (filtered.length !== (currentPermissions as string[]).length) {
        setValue('basic_permissions', filtered, { shouldValidate: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasScopeRestriction])

  // const prevUserCreateRef = useRef((currentPermissions as string[]).includes('user:create'))
  // const prevUserEditRef = useRef((currentPermissions as string[]).includes('user:edit'))

  // // When user:create or user:edit is selected, auto-select all available permissions
  // useEffect(() => {
  //   const perms = currentPermissions as string[]
  //   const hasUserCreate = perms.includes('user:create')
  //   const hasUserEdit = perms.includes('user:edit')

  //   const userCreateJustSelected = hasUserCreate && !prevUserCreateRef.current
  //   const userEditJustSelected = hasUserEdit && !prevUserEditRef.current

  //   prevUserCreateRef.current = hasUserCreate
  //   prevUserEditRef.current = hasUserEdit

  //   if (userCreateJustSelected || userEditJustSelected) {
  //     const allAvailable = PERMISSIONS_CONFIG.flatMap((cat) =>
  //       cat.permissions.map((p) => p.value)
  //     )
  //     const newSet = Array.from(new Set([...perms, ...allAvailable]))
  //     if (newSet.length !== perms.length) {
  //       setValue('basic_permissions', newSet, { shouldValidate: true })
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  if (!hasPermission) {
    return <NoAccess />
  }

  const availableDomains =
    domainsData?.data?.filter(domain => {
      if (
        !currentUser?.domain_permissions ||
        currentUser.domain_permissions.length === 0
      )
        return true
      return currentUser.domain_permissions.includes(domain.domain_name)
    }) || []

  const addMailboxPermission = () => {
    const trimmedInput = mailboxInput.trim().toLowerCase()
    if (!trimmedInput) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedInput)) {
      toast.error('Please enter a valid email address for mailbox scope')
      return
    }
    toggleScope('mailbox', trimmedInput)
    setMailboxInput('')
  }

  const toggleScope = (type: 'domain' | 'mailbox', value: string) => {
    const fieldName = `${type}_permissions` as keyof (
      | CreateUserFormData
      | UpdateUserFormData
    )
    const currentValues = (getValues(fieldName) as string[]) || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    setValue(fieldName, newValues, { shouldValidate: true })
  }

  // Handler for the PermissionsTable
  const handleBasicPermissionsChange = (newPermissions: string[]) => {
    setValue('basic_permissions', newPermissions, { shouldValidate: true })
  }

  const getPasswordStrength = () => {
    if (mode !== 'create') return 0
    const password = (formData as CreateUserFormData).password
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

  const getPasswordMatchStatus = () => {
    if (mode !== 'create') return { matches: true, show: false }
    const createData = formData as CreateUserFormData
    return {
      matches:
        createData.password &&
        createData.confirmPassword &&
        createData.password === createData.confirmPassword,
      show: !!(createData.password && createData.confirmPassword),
    }
  }

  const passwordMatchStatus = getPasswordMatchStatus()

  // Check if current user has sufficient permissions to edit the target user.
  // Blocks edit if target has any basic_permission, domain_permission, or mailbox_permission
  // outside the current user's own subset.
  const hasHigherPrivileges = !!(
    mode === 'edit' &&
    !isFetching &&
    userData &&
    currentUser &&
    ((userData.basic_permissions || []).some(
      p => !(currentUser.basic_permissions || []).includes(p)
    ) ||
      ((currentUser.domain_permissions || []).length > 0 &&
        (userData.domain_permissions || []).some(
          d => !(currentUser.domain_permissions || []).includes(d)
        )) ||
      ((currentUser.mailbox_permissions || []).length > 0 &&
        (userData.mailbox_permissions || []).some(
          m => !(currentUser.mailbox_permissions || []).includes(m)
        )))
  )

  const isFormDisabled = isPending || hasHigherPrivileges

  return (
    <div className='w-full mx-auto space-y-2'>
      {/* Header Section */}
      <div className='flex flex-col gap-4'>
        {/* Navigation Bar: Back Button & Breadcrumbs */}
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate('/users')}
            className='h-8 w-8 shrink-0 '
            aria-label='Go back'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <Breadcrumbs className='mb-0' />
        </div>

        {/* Title */}
        <div className='flex flex-col gap-1 pl-1'>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground'>
            {mode === 'create' ? (
              <UserPlus className='h-6 w-6 text-primary' />
            ) : (
              <UserCog className='h-6 w-6 text-primary' />
            )}
            {mode === 'create' ? 'Create User' : 'Edit User'}
          </h1>
          <p className='text-sm text-muted-foreground max-w-2xl'>
            {mode === 'create'
              ? 'Provision a new user account with specific role-based permissions and access scopes.'
              : 'Modify user details, update access credentials, or adjust permission scopes.'}
          </p>
        </div>
      </div>

      {/* Privilege Warning Alert */}
      {hasHigherPrivileges && (
        <Alert
          variant='destructive'
          className='border-amber-500/50 bg-amber-500/5'
        >
          <Shield className='h-4 w-4 text-amber-500' />
          <AlertDescription className='text-sm text-amber-600 font-medium'>
            Restricted View: This user has higher administrative privileges than
            your current account. You can view their configuration but cannot
            make any modifications.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      {mode === 'create' && (
        <Alert className='bg-muted/50 border-muted-foreground/20'>
          <Info className='h-4 w-4 text-primary' />
          <AlertDescription className='text-sm text-muted-foreground'>
            Security Requirement: Passwords must be at least 8 characters and
            include uppercase, lowercase, numbers, and special symbols.
          </AlertDescription>
        </Alert>
      )}

      <Card className='border border-border shadow-sm overflow-hidden'>
        <form
          onSubmit={handleSubmit(onSubmit)}
          autoComplete='off'
          className='p-6 space-y-8'
        >
          {/* Section: Basic Info */}
          <div className='space-y-2.5'>
            <div className=' flex justify-between items-center border-b border-border/40 pb-2'>
              <div className='flex items-center gap-2 '>
                <User className='w-4 h-4 text-primary' />
                <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                  Account Information
                </h2>
              </div>
              <div className='flex items-start gap-4'>
                <Switch
                  id='is_active'
                  checked={isActive}
                  onCheckedChange={checked => setValue('is_active', checked)}
                  disabled={isFormDisabled}
                  className='mt-1'
                />
                <div className='space-y-1'>
                  <Label
                    htmlFor='is_active'
                    className='text-sm font-medium cursor-pointer'
                  >
                    {isActive ? 'Active' : 'Inactive'} Account
                  </Label>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <UsernameInput
                  label='Username'
                  name='user_name'
                  register={register}
                  errors={errors}
                  watch={watch}
                  disabled={isFormDisabled}
                  placeholder='jdoe'
                  isRequired={true}
                  originalUsername={userData?.user_name}
                  setError={setError}
                  clearErrors={clearErrors}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='display_name' className='text-sm font-medium'>
                  Display Name
                  <span className='text-red-500'>*</span>
                </Label>
                <div className='space-y-1'>
                  <Input
                    id='display_name'
                    placeholder='e.g., John Doe'
                    {...register('display_name')}
                    className={
                      errors.display_name ? 'border-red-500 bg-red-50/10' : ''
                    }
                    disabled={isFormDisabled}
                  />
                  {errors.display_name && (
                    <p className='text-xs text-red-500 font-medium'>
                      {errors.display_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='user_email'
                  className='flex items-center gap-2 text-sm font-medium'
                >
                  <Mail className='w-3.5 h-3.5 text-muted-foreground' />
                  Email Address
                  <span className='text-red-500'>*</span>
                </Label>
                <div className='space-y-1'>
                  <Input
                    id='user_email'
                    type='email'
                    placeholder='john.doe@company.com'
                    {...register('user_email', {
                      setValueAs: (v: string) => v?.toLowerCase().trim(),
                      onChange: e => {
                        e.target.value = e.target.value.toLowerCase()
                      },
                    })}
                    className={
                      errors.user_email ? 'border-red-500 bg-red-50/10' : ''
                    }
                    disabled={isFormDisabled}
                  />
                  {errors.user_email && (
                    <p className='text-xs text-red-500 font-medium'>
                      {errors.user_email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='primary_phone'
                  className='flex items-center gap-2 text-sm font-medium'
                >
                  <Phone className='w-3.5 h-3.5 text-muted-foreground' />
                  Phone Number
                  <span className='text-red-500'>*</span>
                </Label>
                <div className='space-y-1'>
                  <Controller
                    name='primary_phone'
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        id='primary_phone'
                        value={field.value as string}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isFormDisabled}
                        hasError={!!errors.primary_phone}
                        placeholder='1234567890'
                      />
                    )}
                  />
                  {errors.primary_phone && (
                    <p className='text-xs text-red-500 font-medium'>
                      {errors.primary_phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Password (Create Mode Only) */}
          {mode === 'create' && (
            <div className='space-y-2.5'>
              <div className='flex items-center gap-2 border-b border-border/40 pb-2'>
                <Lock className='w-4 h-4 text-primary' />
                <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                  Security Credentials
                </h2>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='password'>
                    Password
                    <span className='text-red-500'>*</span>
                  </Label>
                  <div className='relative'>
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Set password'
                      {...register('password')}
                      className={
                        (errors as FieldErrors<CreateUserFormData>).password
                          ? 'border-red-500 pr-10'
                          : 'pr-10'
                      }
                      autoComplete='new-password'
                      disabled={isFormDisabled}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                      disabled={isFormDisabled}
                    >
                      {showPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>
                  {(errors as FieldErrors<CreateUserFormData>).password && (
                    <p className='text-xs text-red-500 font-medium'>
                      {
                        (errors as FieldErrors<CreateUserFormData>).password
                          ?.message
                      }
                    </p>
                  )}

                  {(formData as CreateUserFormData).password && (
                    <div className='space-y-1.5 pt-1'>
                      <div className='flex gap-1'>
                        {[1, 2, 3, 4, 5].map(level => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              level <= passwordStrength
                                ? passwordStrength >= 4
                                  ? 'bg-green-500'
                                  : passwordStrength >= 3
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                : 'bg-muted/50'
                            }`}
                          />
                        ))}
                      </div>
                      <p className='text-[10px] text-right font-medium text-muted-foreground'>
                        {passwordStrength >= 4
                          ? 'Strong'
                          : passwordStrength >= 3
                            ? 'Medium'
                            : 'Weak'}
                      </p>
                    </div>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>
                    Confirm Password
                    <span className='text-red-500'>*</span>
                  </Label>
                  <div className='relative'>
                    <Input
                      id='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder='Confirm password'
                      {...register('confirmPassword')}
                      className={
                        (errors as FieldErrors<CreateUserFormData>)
                          .confirmPassword
                          ? 'border-red-500 pr-10'
                          : 'pr-10'
                      }
                      autoComplete='new-password'
                      disabled={isFormDisabled}
                    />
                    <button
                      type='button'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                      disabled={isFormDisabled}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>

                  <div className='min-h-[20px]'>
                    {(errors as FieldErrors<CreateUserFormData>)
                      .confirmPassword ? (
                      <p className='text-xs text-red-500 font-medium'>
                        {
                          (errors as FieldErrors<CreateUserFormData>)
                            .confirmPassword?.message
                        }
                      </p>
                    ) : (
                      passwordMatchStatus.show && (
                        <div className='flex items-center gap-1.5 text-xs animate-in fade-in slide-in-from-top-1'>
                          {passwordMatchStatus.matches ? (
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
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Permissions */}
          <div className='space-y-2.5'>
            <div className='flex items-center gap-2 border-b border-border/40 pb-2'>
              <Shield className='w-4 h-4 text-primary' />
              <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                Access Control
              </h2>
            </div>

            {/* Scopes Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              {/* Domain Scope */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Globe className='w-3.5 h-3.5 text-muted-foreground' />
                  <Label className='text-sm font-medium'>Domain Scope</Label>
                </div>

                <div className='space-y-2'>
                  {isLoadingDomains ? (
                    <div className='flex items-center gap-2 text-muted-foreground text-xs'>
                      <Loader2 className='w-3 h-3 animate-spin' /> Loading
                      domains...
                    </div>
                  ) : (
                    <Popover
                      open={openDomainSelect}
                      onOpenChange={setOpenDomainSelect}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          role='combobox'
                          aria-expanded={openDomainSelect}
                          className='w-full justify-between text-xs font-normal text-muted-foreground'
                          disabled={isFormDisabled}
                        >
                          Select domain to grant access...
                          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-[400px] p-0' align='start'>
                        <Command>
                          <CommandInput placeholder='Search domains...' />
                          <CommandList>
                            <CommandEmpty>No domain found.</CommandEmpty>
                            <CommandGroup>
                              {availableDomains
                                .filter(
                                  d =>
                                    !currentDomainPermissions.includes(
                                      d.domain_name
                                    )
                                )
                                .map(domain => (
                                  <CommandItem
                                    key={domain.domain_name}
                                    value={domain.domain_name}
                                    onSelect={_ => {
                                      // Command might lowercase the value, so we use the original domain name if needed or ensure value matches
                                      toggleScope('domain', domain.domain_name)
                                      setOpenDomainSelect(false)
                                    }}
                                    className='text-xs'
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        currentDomainPermissions.includes(
                                          domain.domain_name
                                        )
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      )}
                                    />
                                    {domain.domain_name}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}

                  <div className='min-h-[60px] p-3 rounded-md border border-border/50 bg-background/50'>
                    <div className='flex flex-wrap gap-2'>
                      {availableDomains
                        .filter(d =>
                          currentDomainPermissions.includes(d.domain_name)
                        )
                        .map(domain => (
                          <Badge
                            key={domain.domain_name}
                            variant='secondary'
                            className='pl-2 pr-1 py-1 text-[11px] flex items-center gap-1 hover:bg-muted/80'
                          >
                            {domain.domain_name}
                            <button
                              type='button'
                              onClick={() =>
                                toggleScope('domain', domain.domain_name)
                              }
                              className='h-4 w-4 inline-flex items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors'
                              disabled={isFormDisabled}
                            >
                              <X className='w-3 h-3' />
                            </button>
                          </Badge>
                        ))}
                      {currentDomainPermissions.length === 0 && (
                        <span className='text-xs text-muted-foreground/50 italic select-none'>
                          No domains assigned (Restricted access)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mailbox Scope */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Inbox className='w-3.5 h-3.5 text-muted-foreground' />
                  <Label className='text-sm font-medium'>Mailbox Scope</Label>
                </div>

                <div className='space-y-2'>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='user@domain.com'
                      value={mailboxInput}
                      onChange={e =>
                        setMailboxInput(e.target.value.toLowerCase())
                      }
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addMailboxPermission()
                        }
                      }}
                      disabled={isFormDisabled}
                      className='text-xs'
                    />
                    <Button
                      type='button'
                      size='icon'
                      variant='outline'
                      onClick={addMailboxPermission}
                      disabled={isFormDisabled}
                      className='shrink-0 h-9 w-9'
                    >
                      <Plus className='w-4 h-4' />
                    </Button>
                  </div>

                  <div className='min-h-[60px] p-3 rounded-md border border-border/50 bg-background/50'>
                    <div className='flex flex-wrap gap-2'>
                      {currentMailboxPermissions?.map(mailbox => (
                        <Badge
                          key={mailbox}
                          variant='secondary'
                          className='pl-2 pr-1 py-1 text-[11px] flex items-center gap-1 hover:bg-muted/80'
                        >
                          {mailbox}
                          <button
                            type='button'
                            onClick={() =>
                              toggleScope('mailbox', mailbox ?? '')
                            }
                            className='h-4 w-4 inline-flex items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors'
                            disabled={isFormDisabled}
                          >
                            <X className='w-3 h-3' />
                          </button>
                        </Badge>
                      ))}
                      {(!currentMailboxPermissions ||
                        currentMailboxPermissions.length === 0) && (
                        <span className='text-xs text-muted-foreground/50 italic select-none'>
                          No specific mailboxes assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <Separator className='bg-border/60' /> */}

            {/* Basic Permissions TABLE */}
            <div className='space-y-2.5'>
              <div className='flex items-center gap-2'>
                <Inbox className='w-4 h-4 text-primary/70' />
                <Label className='text-sm font-medium'>Permissions Scope</Label>
              </div>
              <PermissionsTable
                config={PERMISSIONS_CONFIG}
                selectedPermissions={currentPermissions as string[]}
                onChange={handleBasicPermissionsChange}
                readOnly={isFormDisabled}
                disabledPermissions={disabledBasicPermissions}
              />
            </div>
          </div>

          {/* Section: Status */}
          {/* <div className='space-y-6'>
            <div className='flex items-center gap-2 border-b border-border/40 pb-2'>
              <AlertCircle className='w-4 h-4 text-primary' />
              <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                System Status
              </h2>
            </div>

            <div className='flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-muted/20'>
              <Switch
                id='is_active'
                checked={isActive}
                onCheckedChange={checked => setValue('is_active', checked)}
                disabled={isPending}
                className='mt-1'
              />
              <div className='space-y-1'>
                <Label
                  htmlFor='is_active'
                  className='text-sm font-medium cursor-pointer'
                >
                  {isActive ? 'Active' : 'Inactive'} Account
                </Label>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  {isActive
                    ? 'User account is active. The user can log in and access permitted resources.'
                    : 'User account is inactive. Access to the system is suspended, but data remains preserved.'}
                </p>
              </div>
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className='ml-auto shrink-0'
              >
                {isActive ? 'Active' : 'Inactive'}
              </Badge> 
            </div>
          </div> */}

          <Separator className='bg-border/60' />

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pt-2'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => navigate('/users')}
              disabled={isFormDisabled}
              className='text-muted-foreground hover:text-foreground'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isFormDisabled || !isValid}
              className='min-w-[140px] shadow-sm'
            >
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
                  {mode === 'create' ? 'Create User' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default UserForm
