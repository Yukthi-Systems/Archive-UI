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

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Globe,
  ArrowLeft,
  Loader2,
  Save,
  Calendar,
  HardDrive,
  Activity,
  Info,
  AlertCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useCreateDomain, useUpdateDomain, useDomain } from '@/hooks/useDomains'
import { useLogout } from '@/hooks/useAuth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  useDomainSchema,
  useOrganizationQuota,
  type DomainFormData,
} from '../validations/domainSchema'

import { useAccessPermission } from '@/utils/accessPermission'
import NoAccess from '@/components/common/NoAccess'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atoms/user'
import { useOrganization } from '@/hooks/useOrganization'

interface DomainFormProps {
  mode: 'create' | 'edit'
}

const DomainForm = ({ mode }: DomainFormProps) => {
  const navigate = useNavigate()
  const { domainId } = useParams<{ domainId: string }>()
  const { refetch: refetchOrganization } = useOrganization()
  const userPermission = useAccessPermission(
    mode === 'create' ? 'domain:create' : 'domain:edit'
  )
  const hasDomainRestriction =
    (useAtomValue(userAtom)?.domain_permissions?.length ?? 0) > 0
  const hasPermission =
    mode === 'create' ? userPermission && !hasDomainRestriction : userPermission
  const [isLoadingDomain, setIsLoadingDomain] = useState(false)
  const { orgAvailable } = useOrganizationQuota()
  const { mutate: createDomain, isPending: isCreating } = useCreateDomain()
  const { mutate: updateDomain, isPending: isUpdating } = useUpdateDomain()
  const logout = useLogout()
  const [showReLoginModal, setShowReLoginModal] = useState(false)
  const { data: domainData, isLoading: isFetching } = useDomain(
    domainId!,
    mode === 'edit' && !!domainId
  )

  const minQuota =
    mode === 'edit' && domainData?.quota_utilized
      ? Math.ceil(domainData.quota_utilized) + 1
      : 2

  const currentQuota =
    mode === 'edit' && domainData?.quota_allocated
      ? domainData.quota_allocated
      : 0

  const maxAllowedQuota = orgAvailable + currentQuota

  const domainSchema = useDomainSchema(minQuota, currentQuota)

  const isPending = isCreating || isUpdating || isLoadingDomain

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<DomainFormData>({
    resolver: yupResolver(domainSchema),
    defaultValues: {
      domain_name: '',
      data_retention_days: 30,
      quota_allocated: 10,
      is_active: true,
    },
    mode: 'onChange',
  })

  // Load domain data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && domainData) {
      reset({
        domain_name: domainData.domain_name,
        data_retention_days: domainData.data_retention_days,
        quota_allocated: domainData.quota_allocated,
        is_active: domainData.is_active,
      })
    }
  }, [domainData, mode, reset])

  // Show loading while fetching domain data
  useEffect(() => {
    setIsLoadingDomain(isFetching)
  }, [isFetching])

  const onSubmit = (data: DomainFormData) => {
    if (mode === 'create') {
      createDomain(data, {
        onSuccess: () => {
          toast.success('Domain created successfully!')
          setShowReLoginModal(true)
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.error || error.message
          toast.error(`Failed to create domain: ${errorMessage}`)
        },
      })
    } else if (mode === 'edit' && domainId) {
      updateDomain(
        { domainId, domainData: data, domainName: domainData?.domain_name },
        {
          onSuccess: () => {
            toast.success('Domain updated successfully!')
            refetchOrganization()
            navigate('/domains')
          },
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.error || error.message
            toast.error(`Failed to update domain: ${errorMessage}`)
          },
        }
      )
    }
  }

  const handleSkip = () => {
    refetchOrganization()
    navigate('/domains')
  }

  const retentionDays = watch('data_retention_days')
  const isActive = watch('is_active')

  if (!hasPermission) {
    return <NoAccess />
  }

  return (
    <div className='w-full mx-auto space-y-2 '>
      {/* Header Section */}
      <div className='flex flex-col gap-1'>
        {/* Navigation Bar: Back Button & Breadcrumbs Inline */}
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate('/domains')}
            className='h-8 w-8 shrink-0 '
            aria-label='Go back'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          {/* <div className='h-4 w-px bg-border hidden md:block' /> */}
          <Breadcrumbs className='mb-0' />
        </div>

        {/* Title Block */}
        <div className='flex flex-col gap-1 pl-1'>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground'>
            <Globe className='h-6 w-6 text-primary' />
            {mode === 'create' ? 'Create Domain' : 'Edit Domain'}
          </h1>
          <p className='text-sm text-muted-foreground max-w-2xl'>
            {mode === 'create'
              ? 'Configure retention policies and quota limits for a new email domain.'
              : 'Update configuration settings for this domain.'}
          </p>
        </div>
      </div>

      {/* Info Alert */}
      {mode === 'create' && (
        <Alert className='bg-muted/50 border-muted-foreground/20'>
          <Info className='h-4 w-4 text-primary' />
          <AlertDescription className='text-sm text-muted-foreground'>
            Create the domain, then re‑login to the application to see it added
            to the list.
          </AlertDescription>
        </Alert>
      )}

      <Card className='border border-border shadow-sm overflow-hidden'>
        <form
          onSubmit={handleSubmit(onSubmit)}
          autoComplete='off'
          className='p-6 space-y-8'
        >
          {/* Domain Information Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2 border-b border-border/40 pb-2'>
              <Globe className='w-4 h-4 text-primary' />
              <h2 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                Domain Configuration
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              {/* Domain Name */}
              <div className='space-y-2'>
                <Label htmlFor='domain_name' className='text-sm font-medium'>
                  Domain Name
                </Label>
                <div className='space-y-1'>
                  <Input
                    id='domain_name'
                    placeholder='e.g., example.com'
                    {...register('domain_name', {
                      setValueAs: (v: string) => v?.toLowerCase().trim(),
                      onChange: e => {
                        e.target.value = e.target.value.toLowerCase()
                      },
                    })}
                    className={
                      errors.domain_name ? 'border-red-500 bg-red-50/10' : ''
                    }
                    disabled={isPending || mode === 'edit'}
                  />
                  {errors.domain_name ? (
                    <p className='text-xs text-red-500 font-medium'>
                      {errors.domain_name.message}
                    </p>
                  ) : (
                    <p className='text-[11px] text-muted-foreground/70'>
                      Unique identifier for this email archive.
                    </p>
                  )}
                </div>
              </div>

              {/* Data Retention Days */}
              <div className='space-y-2'>
                <Label
                  htmlFor='data_retention_days'
                  className='flex items-center gap-2 text-sm font-medium'
                >
                  <Calendar className='w-3.5 h-3.5 text-muted-foreground' />
                  Retention Period (Days)
                </Label>
                <div className='space-y-1'>
                  <Input
                    id='data_retention_days'
                    type='number'
                    min='1'
                    max='7300'
                    {...register('data_retention_days', {
                      valueAsNumber: true,
                    })}
                    className={
                      errors.data_retention_days
                        ? 'border-red-500 bg-red-50/10 no-spinner'
                        : 'no-spinner'
                    }
                    disabled={isPending}
                  />
                  {errors.data_retention_days ? (
                    <p className='text-xs text-red-500 font-medium'>
                      {errors.data_retention_days.message}
                    </p>
                  ) : (
                    <div className='space-y-1.5 flex justify-between items-center gap-1.5'>
                      <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground/70'>
                        <AlertCircle className='w-3 h-3' />
                        <span>
                          approx.{' '}
                          {(() => {
                            const years = Math.floor(retentionDays / 365)
                            const months = Math.floor(
                              (retentionDays % 365) / 30
                            )
                            const days = (retentionDays % 365) % 30
                            const parts = []
                            if (years > 0) parts.push(`${years}y`)
                            if (months > 0) parts.push(`${months}m`)
                            if (days > 0) parts.push(`${days}d`)
                            return parts.length > 0 ? parts.join(' ') : '0d'
                          })()}
                        </span>
                      </div>
                      {mode === 'edit' && (
                        <div className='flex items-center gap-1.5 text-[11px] text-amber-500/90'>
                          <Info className='w-3 h-3' />
                          <span>
                            Updates allowed 24 hours after last change.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Storage Quota */}
              <div className='space-y-2'>
                <Label
                  htmlFor='quota_allocated'
                  className='flex items-center gap-2 text-sm font-medium'
                >
                  <HardDrive className='w-3.5 h-3.5 text-muted-foreground' />
                  Storage Quota (GB)
                </Label>
                <div className='space-y-1'>
                  <Input
                    id='quota_allocated'
                    type='number'
                    min={minQuota}
                    max={maxAllowedQuota}
                    {...register('quota_allocated', { valueAsNumber: true })}
                    className={
                      errors.quota_allocated
                        ? 'border-red-500 bg-red-50/10 no-spinner'
                        : 'no-spinner'
                    }
                    disabled={isPending}
                  />
                  {errors.quota_allocated ? (
                    <p className='text-xs text-red-500 font-medium'>
                      {errors.quota_allocated.message}
                    </p>
                  ) : (
                    <div className='flex items-center justify-between text-[11px] text-muted-foreground/70 px-1'>
                      <span>Available: {maxAllowedQuota} GB</span>
                      <span>Min: {minQuota} GB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20'>
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
                    Active Status
                  </Label>
                  <p className='text-xs text-muted-foreground leading-relaxed'>
                    {isActive
                      ? 'Domain is currently active. Inbound emails will be processed and archived according to retention policies.'
                      : 'Domain is inactive. Archiving is paused, but existing data remains accessible.'}
                  </p>
                </div>
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className='ml-auto shrink-0'
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className='bg-border/60' />

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pt-2'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => navigate('/domains')}
              disabled={isPending}
              className='text-muted-foreground hover:text-foreground'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isPending || !isValid}
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
                  {mode === 'create' ? 'Create Domain' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <AlertDialog open={showReLoginModal} onOpenChange={setShowReLoginModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Domain Created Successfully</AlertDialogTitle>
            <AlertDialogDescription>
              The domain has been created. For security reasons and to ensure
              your session reflects updated permissions, please re-login to the
              application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkip}>Skip</AlertDialogCancel>
            <AlertDialogAction onClick={logout}>
              Log Out and Re-login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DomainForm
