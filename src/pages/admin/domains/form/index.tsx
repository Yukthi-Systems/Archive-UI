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
import { Globe, ArrowLeft, HardDrive } from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAtom } from 'jotai'
import { selectedAdminOrgAtom } from '@/store/adminStore'
import {
  useAdminOrganizations,
  useCreateDomain,
  useUpdateDomain,
} from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

interface AdminDomainFormProps {
  mode: 'create' | 'edit'
}

interface AdminOrgSummary {
  organization_id: string
  organization_name: string
  quota_allocated: number
  quota_utilized: number
}

// `minQuota`/`maxQuota` depend on org + (in edit mode) the domain's own
// current allocation, so the schema is built per-render instead of static.
const buildDomainFormSchema = (minQuota: number, maxQuota?: number) =>
  yup.object().shape({
    domain_name: yup
      .string()
      .required('Domain name is required')
      .matches(
        /^(?!:\/\/)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*$/,
        'Please enter a valid domain name (e.g., example.com)'
      ),
    data_retention_days: yup
      .number()
      .typeError('Retention days must be a number')
      .integer('Must be a whole number')
      .required('Data retention days are required')
      .min(1, 'Retention must be at least 1 day'),
    quota_allocated: yup
      .number()
      .typeError('Quota allocated must be a number')
      .integer('Must be a whole number')
      .required('Storage quota is required')
      .min(
        minQuota,
        `Quota cannot be less than ${minQuota} GB (already in use by this domain)`
      )
      .max(
        maxQuota ?? Number.MAX_SAFE_INTEGER,
        `Exceeds organization's available quota (${maxQuota} GB left)`
      ),
    is_active: yup.boolean().default(true),
  })

type DomainFormData = yup.InferType<ReturnType<typeof buildDomainFormSchema>>

export default function AdminDomainForm({ mode }: AdminDomainFormProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const domainData = location.state?.domain
  const [selectedOrg] = useAtom(selectedAdminOrgAtom)

  const createMutation = useCreateDomain()
  const updateMutation = useUpdateDomain()

  // Org list is fetched once and cached (see getAdminOrganizations) — reused
  // here to know how much quota is left to allocate to this domain.
  const { data: orgListData } = useAdminOrganizations({})
  const org = orgListData?.data?.find(
    (o: AdminOrgSummary) => o.organization_id === selectedOrg
  )

  // In edit mode, the domain's own current allocation is being freed and
  // reallocated, so it counts back toward what's available (mirrors the
  // backend's quota_difference logic in admin_update_domain).
  const orgAvailableQuota =
    org && typeof org.quota_allocated === 'number'
      ? org.quota_allocated - org.quota_utilized
      : undefined
  const maxQuota =
    mode === 'edit' && domainData && orgAvailableQuota !== undefined
      ? orgAvailableQuota + domainData.quota_allocated
      : orgAvailableQuota
  const minQuota =
    mode === 'edit' && domainData ? Math.max(1, domainData.quota_utilized) : 1

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<DomainFormData>({
    resolver: yupResolver(buildDomainFormSchema(minQuota, maxQuota)) as any,
    defaultValues: {
      domain_name: '',
      data_retention_days: 365,
      quota_allocated: 10,
      is_active: true,
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!selectedOrg) {
      // Must have an organization selected to create/edit domains
      navigate('/1219/admin/domains')
      return
    }

    if (mode === 'edit') {
      if (domainData) {
        reset({
          domain_name: domainData.domain_name || '',
          data_retention_days: domainData.data_retention_days ?? 365,
          quota_allocated: domainData.quota_allocated ?? 10,
          is_active: domainData.is_active !== false,
        })
      } else {
        navigate('/1219/admin/domains')
      }
    }
  }, [mode, domainData, navigate, selectedOrg, reset])

  const onSubmit = (data: DomainFormData) => {
    if (!selectedOrg) return

    if (mode === 'edit' && domainData) {
      updateMutation.mutate(
        { orgId: selectedOrg, domainId: domainData.domain_id, data },
        {
          onSuccess: () => {
            toast.success('Domain updated successfully')
            navigate('/1219/admin/domains')
          },
          onError: (error: any) => {
            const apiError =
              error.response?.data?.error ||
              error.response?.data?.message ||
              (typeof error.response?.data === 'string'
                ? error.response.data
                : '') ||
              error.message ||
              'Failed to update domain'
            toast.error(apiError)
          },
        }
      )
    } else {
      createMutation.mutate(
        { orgId: selectedOrg, data },
        {
          onSuccess: () => {
            toast.success('Domain created successfully')
            navigate('/1219/admin/domains')
          },
          onError: (error: any) => {
            const apiError =
              error.response?.data?.error ||
              error.response?.data?.message ||
              (typeof error.response?.data === 'string'
                ? error.response.data
                : '') ||
              error.message ||
              'Failed to create domain'
            toast.error(apiError)
          },
        }
      )
    }
  }

  return (
    <div className='w-full mx-auto'>
      <div className='flex items-center gap-4 mb-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/1219/admin/domains'>
            <ArrowLeft className='h-5 w-5' />
          </Link>
        </Button>
        <Globe className='h-8 w-8 text-primary' />
        <div>
          <h1 className='text-2xl font-bold'>
            {mode === 'create' ? 'Add Domain' : 'Edit Domain'}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {mode === 'create'
              ? 'Configure a new domain for the selected organization'
              : 'Modify existing domain settings'}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-card rounded-lg border border-border p-6 space-y-6'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='domain_name'>Domain Name</Label>
            <Input
              id='domain_name'
              {...register('domain_name', {
                setValueAs: (v: string) => v?.toLowerCase().trim(),
                onChange: e => {
                  e.target.value = e.target.value.toLowerCase()
                },
              })}
              disabled={mode === 'edit'}
              placeholder='example.com'
            />
            {errors.domain_name && (
              <p className='text-xs text-red-500 font-medium'>
                {errors.domain_name.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='retention_days'>Retention Days</Label>
            <Input
              id='retention_days'
              type='number'
              min={1}
              {...register('data_retention_days')}
            />
            {errors.data_retention_days && (
              <p className='text-xs text-red-500 font-medium'>
                {errors.data_retention_days.message}
              </p>
            )}
            <p className='text-xs text-muted-foreground'>
              Number of days to keep data
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='domain_quota_allocated'>Quota Allocated (GB)</Label>
            <Input
              id='domain_quota_allocated'
              type='number'
              min={minQuota}
              max={maxQuota}
              {...register('quota_allocated')}
            />
            {errors.quota_allocated && (
              <p className='text-xs text-red-500 font-medium'>
                {errors.quota_allocated.message}
              </p>
            )}
            {org && orgAvailableQuota !== undefined && (
              <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                <HardDrive className='w-3 h-3 shrink-0' />
                {org.organization_name} has {orgAvailableQuota} GB available (of{' '}
                {org.quota_allocated} GB)
                {mode === 'edit' && domainData
                  ? ` — up to ${maxQuota} GB can be set for this domain`
                  : ''}
              </p>
            )}
            {mode === 'edit' && domainData?.quota_utilized > 0 && (
              <p className='text-xs text-muted-foreground'>
                This domain is already using {domainData.quota_utilized} GB.
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
          <Label htmlFor='is_active'>Active Domain</Label>
        </div>

        <div className='flex justify-end pt-4 border-t border-border mt-6'>
          <Button
            type='button'
            variant='outline'
            className='mr-3'
            onClick={() => navigate('/1219/admin/domains')}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : 'Save Domain'}
          </Button>
        </div>
      </form>
    </div>
  )
}
