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

import { useEffect } from 'react'
import { Building, ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useCreateOrganization, useUpdateOrganization } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

interface AdminOrganizationFormProps {
  mode: 'create' | 'edit'
}

// `minQuota` depends on the org's own current utilization in edit mode, so
// the schema is built per-render instead of static (same approach as the
// domain form's buildDomainFormSchema).
const buildOrgFormSchema = (minQuota: number) =>
  yup.object().shape({
    organization_name: yup.string().required('Organization name is required'),
    admin_email: yup
      .string()
      .email('Must be a valid email')
      .required('Admin email is required'),
    admin_phone: yup.string().required('Admin phone is required'),
    quota_allocated: yup
      .number()
      .typeError('Quota allocated must be a number')
      .integer('Must be a whole number')
      .required('Quota allocated is required')
      .min(
        minQuota,
        `Quota cannot be less than ${minQuota} GB (already utilized by this organization's domains)`
      ),
    is_active: yup.boolean().default(true),
  })

type OrgFormData = yup.InferType<ReturnType<typeof buildOrgFormSchema>>

export default function AdminOrganizationForm({
  mode,
}: AdminOrganizationFormProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const orgData = location.state?.org

  const createMutation = useCreateOrganization()
  const updateMutation = useUpdateOrganization()

  const minQuota =
    mode === 'edit' && orgData ? Math.max(1, orgData.quota_utilized) : 1

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<OrgFormData>({
    resolver: yupResolver(buildOrgFormSchema(minQuota)) as any,
    defaultValues: {
      organization_name: '',
      admin_phone: '',
      admin_email: '',
      quota_allocated: 50,
      is_active: true,
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (mode === 'edit') {
      if (orgData) {
        reset({
          organization_name: orgData.organization_name || '',
          admin_phone: orgData.admin_phone || '',
          admin_email: orgData.admin_email || '',
          quota_allocated: orgData.quota_allocated ?? 50,
          is_active: orgData.is_active !== false,
        })
      } else {
        // If editing but no data passed via state, go back
        navigate('/1219/admin/organizations')
      }
    }
  }, [mode, orgData, navigate, reset])

  const onSubmit = (data: OrgFormData) => {
    if (mode === 'edit' && orgData) {
      updateMutation.mutate(
        { orgId: orgData.organization_id, data },
        {
          onSuccess: () => {
            toast.success('Organization updated successfully')
            navigate('/1219/admin/organizations')
          },
          onError: (error: any) => {
            const apiError =
              error.response?.data?.error ||
              error.response?.data?.message ||
              (typeof error.response?.data === 'string'
                ? error.response.data
                : '') ||
              error.message ||
              'Failed to update organization'
            toast.error(apiError)
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Organization created successfully')
          navigate('/1219/admin/organizations')
        },
        onError: (error: any) => {
          const apiError =
            error.response?.data?.error ||
            error.response?.data?.message ||
            (typeof error.response?.data === 'string'
              ? error.response.data
              : '') ||
            error.message ||
            'Failed to create organization'
          toast.error(apiError)
        },
      })
    }
  }

  return (
    <div className='w-full mx-auto'>
      <div className='flex items-center gap-4 mb-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/1219/admin/organizations'>
            <ArrowLeft className='h-5 w-5' />
          </Link>
        </Button>
        <Building className='h-8 w-8 text-primary' />
        <div>
          <h1 className='text-2xl font-bold'>
            {mode === 'create' ? 'Add Organization' : 'Edit Organization'}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {mode === 'create'
              ? 'Create a new tenant organization'
              : 'Modify existing organization details'}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-card rounded-lg border border-border p-6 space-y-6'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='organization_name'>Organization Name</Label>
            <Input
              id='organization_name'
              {...register('organization_name')}
              placeholder='e.g., Acme Corp'
            />
            {errors.organization_name && (
              <p className='text-xs text-red-500 font-medium'>
                {errors.organization_name.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='admin_email'>Admin Email</Label>
            <Input
              id='admin_email'
              type='email'
              {...register('admin_email')}
              placeholder='admin@acme.com'
            />
            {errors.admin_email && (
              <p className='text-xs text-red-500 font-medium'>
                {errors.admin_email.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='admin_phone'>Admin Phone</Label>
            <Input
              id='admin_phone'
              {...register('admin_phone')}
              placeholder='+1 (555) 000-0000'
            />
            {errors.admin_phone && (
              <p className='text-xs text-red-500 font-medium'>
                {errors.admin_phone.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='quota_allocated'>Quota Allocated (GB)</Label>
            <Input
              id='quota_allocated'
              type='number'
              min={minQuota}
              {...register('quota_allocated')}
            />
            {errors.quota_allocated && (
              <p className='text-xs text-red-500 font-medium'>
                {errors.quota_allocated.message}
              </p>
            )}
            {mode === 'edit' && orgData?.quota_utilized > 0 && (
              <p className='text-xs text-muted-foreground'>
                This organization's domains have already utilized{' '}
                {orgData.quota_utilized} GB.
              </p>
            )}
          </div>
        </div>

        <div className='flex items-center space-x-2 pt-2'>
          <Controller
            name='is_active'
            control={control}
            render={({ field }) => (
              <Switch
                id='is_active'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor='is_active'>Active Organization</Label>
        </div>

        <div className='flex justify-end pt-4 border-t border-border mt-6'>
          <Button
            type='button'
            variant='outline'
            className='mr-3'
            onClick={() => navigate('/1219/admin/organizations')}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : 'Save Organization'}
          </Button>
        </div>
      </form>
    </div>
  )
}
