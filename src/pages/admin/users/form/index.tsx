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
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  UserPlus,
  UserCog,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Lock,
  CheckCircle2,
  XCircle,
  Info,
  Mail,
  Phone,
  Loader2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { selectedAdminOrgAtom } from '@/store/adminStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useCreateUser, useUpdateUser } from '@/hooks/useAdmin'
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from '@/pages/users/validations/createUserSchema'
import UsernameInput from '@/components/ui/UsernameInput'
import PhoneInput from '@/components/ui/PhoneInput'
import { PermissionsTable } from '@/pages/users/from/PermissionTable'
import { ALL_PERMISSIONS_CONFIG } from '@/pages/users/from/PermissionConfig'

interface AdminUserFormProps {
  mode: 'create' | 'edit'
}

const AdminUserForm = ({ mode = 'create' }: AdminUserFormProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId } = useParams<{ userId: string }>()

  // Get org from Jotai state
  const selectedOrg = useAtomValue(selectedAdminOrgAtom)

  // In edit mode, we expect the user object to be passed via route state
  // because the Admin API lacks a get-user-by-id endpoint.
  const userData = location.state?.user

  useEffect(() => {
    if (!selectedOrg) {
      toast.error(
        'No organization selected. Please select one on the Users page.'
      )
      navigate('/1219/admin/users')
    } else if (mode === 'edit' && !userData) {
      toast.error(
        'User data not found in session. Please return to the list and click edit again.'
      )
      navigate('/1219/admin/users')
    }
  }, [selectedOrg, mode, userData, navigate])

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const schemas: any = mode === 'create' ? createUserSchema : updateUserSchema

  const { mutate: createUser, isPending: isCreating } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()

  const isPending = !!(isCreating || isUpdating)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
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
            user_id: userData?.user_id || '',
            user_name: userData?.user_name || '',
            user_email: userData?.user_email || '',
            primary_phone: userData?.primary_phone || '+91',
            display_name: userData?.display_name || '',
            is_active: userData?.is_active ?? true,
            basic_permissions: userData?.basic_permissions || [],
            domain_permissions: userData?.domain_permissions || [],
            mailbox_permissions: userData?.mailbox_permissions || [],
          },
    mode: 'onChange',
  })

  const onSubmit = (data: CreateUserFormData | UpdateUserFormData) => {
    if (!selectedOrg) return

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

    if (mode === 'edit' && userId) {
      const updateData = trimValues(data as UpdateUserFormData)

      // Only send what changed, plus required fields based on API requirements
      const payload: any = {
        user_id: userId,
        user_name: updateData.user_name,
        user_email: updateData.user_email,
        primary_phone: updateData.primary_phone,
        display_name: updateData.display_name,
        is_active: updateData.is_active,
        basic_permissions: updateData.basic_permissions as string[],
        domain_permissions: updateData.domain_permissions as string[],
        mailbox_permissions: updateData.mailbox_permissions as string[],
      }

      updateUser(
        { orgId: selectedOrg, data: payload },
        {
          onSuccess: () => {
            toast.success('Admin User updated successfully!')
            navigate('/1219/admin/users')
          },
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.error || error.message
            toast.error(`Failed to update admin user: ${errorMessage}`)
          },
        }
      )
    } else if (mode === 'create') {
      const createData = trimValues(data as CreateUserFormData)
      const { confirmPassword: _, ...userDataToSend } = createData

      createUser(
        { orgId: selectedOrg, data: userDataToSend as any },
        {
          onSuccess: () => {
            toast.success('Admin User created successfully!')
            navigate('/1219/admin/users')
          },
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.error || error.message
            toast.error(`Failed to create admin user: ${errorMessage}`)
          },
        }
      )
    }
  }

  const formData = watch()
  const isActive = watch('is_active')

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
  const isFormDisabled = isPending || !selectedOrg

  return (
    <div className='w-full mx-auto space-y-2 p-6'>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate('/1219/admin/users')}
            className='h-8 w-8 shrink-0'
            aria-label='Go back'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          {/* We omit breadcrumbs component for now to avoid dependency mismatches or manually handle it */}
          <span className='text-sm text-muted-foreground'>
            Admin / Users / {mode === 'create' ? 'Create' : 'Edit'}
          </span>
        </div>

        <div className='flex flex-col gap-1 pl-1'>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground'>
            {mode === 'create' ? (
              <UserPlus className='h-6 w-6 text-primary' />
            ) : (
              <UserCog className='h-6 w-6 text-primary' />
            )}
            {mode === 'create' ? 'Create Admin User' : 'Edit Admin User'}
          </h1>
          <p className='text-sm text-muted-foreground max-w-2xl'>
            {mode === 'create'
              ? 'Provision a new admin user account with specific role-based permissions.'
              : 'Modify admin user details and access configuration.'}
          </p>
        </div>
      </div>

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
          {/* Account Information */}
          <div className='space-y-2.5'>
            <div className='flex justify-between items-center border-b border-border/40 pb-2'>
              <div className='flex items-center gap-2'>
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
                <Label
                  htmlFor='is_active'
                  className='text-sm font-medium cursor-pointer'
                >
                  {isActive ? 'Active' : 'Inactive'} Account
                </Label>
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
                  disabled={isFormDisabled || mode === 'edit'} // API may prevent username change
                  placeholder='jdoe'
                  isRequired={true}
                  originalUsername={userData?.user_name}
                  setError={setError}
                  clearErrors={clearErrors}
                  type='admin'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='display_name' className='text-sm font-medium'>
                  Display Name <span className='text-red-500'>*</span>
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
                  Email Address <span className='text-red-500'>*</span>
                </Label>
                <div className='space-y-1'>
                  <Input
                    id='user_email'
                    type='email'
                    placeholder='john.doe@company.com'
                    {...register('user_email')}
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
                  Phone Number <span className='text-red-500'>*</span>
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

          {/* Security Credentials */}
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
                    Password <span className='text-red-500'>*</span>
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
                    Confirm Password <span className='text-red-500'>*</span>
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

          {/* Scope Access & Permissions */}
          <div className='space-y-2.5'>
            <div className='flex items-center gap-2 border-b border-border/40 pb-2'>
              <Lock className='w-4 h-4 text-primary' />
              <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                Scope Access & Permissions
              </h2>
            </div>

            <div className='space-y-6 pt-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>
                    Domain Permissions (Comma separated)
                  </Label>
                  <Input
                    placeholder='e.g., example.com, test.com'
                    {...register('domain_permissions', {
                      setValueAs: v => {
                        if (Array.isArray(v)) return v
                        return typeof v === 'string' && v.trim() !== ''
                          ? v
                              .split(',')
                              .map((s: string) => s.trim())
                              .filter(Boolean)
                          : []
                      },
                    })}
                    disabled={isFormDisabled}
                  />
                  <p className='text-xs text-muted-foreground'>
                    Grant access to specific domains only.
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>
                    Mailbox Permissions (Comma separated)
                  </Label>
                  <Input
                    placeholder='e.g., info@example.com'
                    {...register('mailbox_permissions', {
                      setValueAs: v => {
                        if (Array.isArray(v)) return v
                        return typeof v === 'string' && v.trim() !== ''
                          ? v
                              .split(',')
                              .map((s: string) => s.trim())
                              .filter(Boolean)
                          : []
                      },
                    })}
                    disabled={isFormDisabled}
                  />
                  <p className='text-xs text-muted-foreground'>
                    Restrict access to specific mailboxes.
                  </p>
                </div>
              </div>

              <div>
                <Label className='block text-sm font-medium mb-3'>
                  Platform Permissions
                </Label>
                <div className='rounded-lg border border-border/40 overflow-hidden'>
                  <PermissionsTable
                    config={ALL_PERMISSIONS_CONFIG}
                    selectedPermissions={
                      (watch('basic_permissions') || []) as string[]
                    }
                    onChange={handleBasicPermissionsChange}
                    disabledPermissions={[]}
                    readOnly={isFormDisabled}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className='flex items-center justify-end gap-3 pt-6 border-t border-border/40'>
            <Button
              type='button'
              variant='outline'
              onClick={() => navigate('/1219/admin/users')}
              disabled={isFormDisabled}
              className='px-6'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isFormDisabled}
              className='px-8 bg-gradient-primary border-none shadow-md hover:shadow-lg transition-all'
            >
              {isCreating || isUpdating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : mode === 'create' ? (
                'Create User'
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default AdminUserForm
