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

import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from '@/components/ui/button'
import { FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useOrganization, useUpdateOrganization } from '@/hooks/useOrganization'
import { useEffect } from 'react'
import { Building, Mail, Phone, Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  useOrganizationSchema,
  type OrganizationFormData,
} from './validations/organizationSchema'
import { Label } from '@/components/ui/label'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import PhoneInput from '@/components/ui/PhoneInput'

const OrganizationSettings = () => {
  const { data: organization, isLoading } = useOrganization()
  const updateOrganizationMutation = useUpdateOrganization()
  const organizationSchema = useOrganizationSchema()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<OrganizationFormData>({
    resolver: yupResolver(organizationSchema),
    defaultValues: {
      admin_email: '',
      admin_phone: '',
    },
  })

  // Update form values when organization data loads
  useEffect(() => {
    if (organization) {
      reset({
        admin_email: organization.admin_email || '',
        admin_phone: organization.admin_phone || '',
      })
    }
  }, [organization, reset])

  const onSubmit = (data: OrganizationFormData) => {
    updateOrganizationMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-12'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    )
  }

  return (
    <div className='space-y-2 w-full mx-auto '>
      <div className='flex items-center gap-4'>
        <Breadcrumbs className='mb-0' />
      </div>

      <Card className='py-4 mt-4'>
        <CardContent className='pt-3'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label
                  htmlFor='admin_email'
                  className='flex items-center gap-1.5'
                >
                  <Mail className='w-4 h-4 text-muted-foreground' />
                  Admin Email
                </Label>
                <Input
                  id='admin_email'
                  placeholder='admin@example.com'
                  {...register('admin_email')}
                  className={errors.admin_email ? 'border-red-500' : ''}
                />
                {errors.admin_email && (
                  <p className='text-xs text-red-500'>
                    {errors.admin_email.message}
                  </p>
                )}
                <p className='text-xs text-muted-foreground'>
                  Add a single email id. Primary contact email for organization
                  updates.
                </p>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='admin_phone'
                  className='flex items-center gap-1.5'
                >
                  <Phone className='w-4 h-4 text-muted-foreground' />
                  Admin Phone
                </Label>
                <Controller
                  name='admin_phone'
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id='admin_phone'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={updateOrganizationMutation.isPending}
                      hasError={!!errors.admin_phone}
                      placeholder='1234567890'
                    />
                  )}
                />
                {errors.admin_phone && (
                  <p className='text-xs text-red-500'>
                    {errors.admin_phone.message}
                  </p>
                )}
                <p className='text-xs text-muted-foreground'>
                  Primary contact phone number.
                </p>
              </div>
            </div>

            <div className='flex justify-between pt-4 border-t'>
              <div className='space-y-2 text-xs text-muted-foreground'>
                {organization?.updated_at && (
                  <div className='flex justify-between gap-4'>
                    <span>Updated:</span>
                    <span>
                      {new Date(organization?.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <Button
                type='submit'
                disabled={updateOrganizationMutation.isPending || !isDirty}
                className='w-full sm:w-auto'
              >
                {updateOrganizationMutation.isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrganizationSettings
