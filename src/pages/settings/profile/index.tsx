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

import { useAtomValue, useSetAtom } from 'jotai'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { User, Mail, Loader2, Save } from 'lucide-react'

import { userAtom } from '@/atoms/user'
import { useUpdateUser } from '@/hooks/useUsers'
import { userService } from '@/api/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import PhoneInput from '@/components/ui/PhoneInput'
import {
  useProfileSchema,
  type ProfileFormData,
} from './validations/profileSchema'
import { Label } from '@/components/ui/label'
import UsernameInput from '@/components/ui/UsernameInput'
import { toast } from 'sonner'
import { type User as UserType } from '@/types/user.types'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

const ProfileSettings = () => {
  const user = useAtomValue(userAtom)
  const setUser = useSetAtom(userAtom)
  const profileSchema = useProfileSchema()

  // -- Hooks --
  const updateUserMutation = useUpdateUser()

  // -- Form Setup --
  const {
    register,
    handleSubmit,
    watch,
    control,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema) as any,
    defaultValues: {
      user_id: user?.user_id || '',
      user_name: user?.user_name || '',
      display_name: user?.display_name || '',
      user_email: user?.user_email || '',
      primary_phone: user?.primary_phone || '',
    },
    values: {
      // Update form if user atom updates
      user_id: user?.user_id || '',
      user_name: user?.user_name || '',
      display_name: user?.display_name || '',
      user_email: user?.user_email || '',
      primary_phone: user?.primary_phone || '',
    },
  })

  if (!user) {
    return <ProfileSkeleton />
  }

  // -- Handlers --
  const onProfileSubmit = (data: ProfileFormData) => {
    // Helper to trim string values
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

    const trimmedData = trimValues(data)
    const changes: Partial<UserType> = {}

    // Compare with original data to find changes
    if (trimmedData.user_name !== user.user_name)
      changes.user_name = trimmedData.user_name
    if (trimmedData.display_name !== user.display_name)
      changes.display_name = trimmedData.display_name
    if (trimmedData.user_email !== user.user_email)
      changes.user_email = trimmedData.user_email
    if (trimmedData.primary_phone !== user.primary_phone)
      changes.primary_phone = trimmedData.primary_phone

    if (Object.keys(changes).length === 0) {
      toast.info('No changes detected')
      return
    }

    // Ensure user_id is always included in the update payload
    changes.user_id = user.user_id

    updateUserMutation.mutate(
      { userId: user.user_id, userData: changes },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully')
          // Re-fetch the latest user data and sync it into the atom
          userService
            .getUserById(user.user_id)
            .then(updatedUser => {
              setUser(prev => (prev ? { ...prev, ...updatedUser } : prev))
            })
            .catch(() => {
              // Silently ignore — the toast already confirmed success
            })
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.error || error.message
          toast.error(`Failed to update profile: ${errorMessage}`)
        },
      }
    )
  }

  return (
    <div className='w-full  mx-auto space-y-2'>
      <div className='flex items-center gap-4'>
        <Breadcrumbs className='mb-0' />
      </div>

      {/* Header Section */}
      <section className='space-y-4 mt-4'>
        <Card className='border border-border/60 py-4 shadow-sm'>
          <CardContent className='pt-6'>
            <form
              onSubmit={handleSubmit(onProfileSubmit)}
              className='space-y-8'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2'>
                {/* Username */}
                <div className='space-y-3'>
                  <UsernameInput
                    label='Username'
                    name='user_name'
                    register={register}
                    errors={errors}
                    watch={watch}
                    disabled={updateUserMutation.isPending}
                    placeholder='Enter username'
                    isRequired={true}
                    originalUsername={user.user_name}
                    setError={setError}
                    clearErrors={clearErrors}
                  />
                </div>

                {/* Display Name */}
                <div className='space-y-3'>
                  <Label htmlFor='display_name' className='text-sm font-medium'>
                    Display Name
                    <span className='text-red-500'>*</span>
                  </Label>
                  <div className='relative'>
                    <User className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='display_name'
                      placeholder='John Doe'
                      {...register('display_name')}
                      className={`pl-9 ${errors.display_name ? 'border-red-500 bg-red-50/10' : ''}`}
                    />
                  </div>
                  {errors.display_name && (
                    <p className='text-xs text-red-500 font-medium'>
                      {errors.display_name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className='space-y-3'>
                  <Label htmlFor='user_email' className='text-sm font-medium'>
                    Email Address
                    <span className='text-red-500'>*</span>
                  </Label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='user_email'
                      placeholder='john@example.com'
                      {...register('user_email')}
                      className={`pl-9 ${errors.user_email ? 'border-red-500 bg-red-50/10' : ''}`}
                    />
                  </div>
                  {errors.user_email && (
                    <p className='text-xs text-red-500 font-medium'>
                      {errors.user_email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className='space-y-3'>
                  <Label
                    htmlFor='primary_phone'
                    className='text-sm font-medium'
                  >
                    Phone Number
                    <span className='text-red-500'>*</span>
                  </Label>
                  <Controller
                    name='primary_phone'
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        id='primary_phone'
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={updateUserMutation.isPending}
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

              <div className='flex justify-end pt-4 border-t border-border/60'>
                <Button
                  type='submit'
                  disabled={updateUserMutation.isPending || !isDirty}
                  className='min-w-[140px] shadow-sm'
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

const ProfileSkeleton = () => (
  <div className='w-full max-w-5xl mx-auto space-y-8'>
    <div className='space-y-4'>
      <Skeleton className='h-6 w-48' />
      <Card className='border border-border/60'>
        <CardHeader className='pb-4 border-b border-border/60'>
          <Skeleton className='h-5 w-32 mb-2' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent className='pt-6 space-y-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='space-y-3'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-10 w-full' />
              </div>
            ))}
          </div>
          <div className='flex justify-end pt-4 border-t border-border/60'>
            <Skeleton className='h-10 w-32' />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

export default ProfileSettings
