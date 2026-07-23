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

import { useParams, useNavigate } from 'react-router-dom'
import {
  Globe,
  ArrowLeft,
  Calendar,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  Database,
  Edit2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Copy,
  Info,
  EyeOff,
  Eye,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDomain, useUpdateDomain, useDeleteDomain } from '@/hooks/useDomains'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import StatusChangeConfirmationModal from '@/components/common/StatusChangeConfirmationModal'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'
import { useState } from 'react'
import { useAccessPermission } from '@/utils/accessPermission'
import NoAccess from '@/components/common/NoAccess'
import RetentionDuration from '@/components/common/RetentionDuration'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ARCHIVE_DOMAIN } from '@/constants/constants'

const DomainDetailPage = () => {
  const { domainId } = useParams<{ domainId: string }>()
  const navigate = useNavigate()
  const hasPermission = useAccessPermission('domain:view')
  const canDelete = useAccessPermission('domain:delete')

  const { data: domain, isLoading, isError, error } = useDomain(domainId!)
  const { mutate: updateDomain, isPending: isUpdating } = useUpdateDomain()
  const { mutate: deleteDomain, isPending: isDeleting } = useDeleteDomain()

  const [showId, setShowId] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  const handleToggleStatus = () => {
    setStatusModal(true)
  }

  const confirmStatusChange = () => {
    if (!domain) return
    updateDomain(
      {
        domainId: domain.domain_id,
        domainData: {
          domain_name: domain.domain_name,
          data_retention_days: domain.data_retention_days,
          quota_allocated: domain.quota_allocated,
          is_active: !domain.is_active,
        },
      },
      {
        onSuccess: () => {
          setStatusModal(false)
          toast.success(
            `Domain "${domain.domain_name}" ${
              !domain.is_active ? 'activated' : 'deactivated'
            } successfully`
          )
        },
      }
    )
  }

  const handleDelete = () => {
    if (!domain) return
    deleteDomain(
      { domainId: domain.domain_id, domainName: domain.domain_name },
      {
        onSuccess: () => {
          setDeleteModal(false)
          toast.success(`Domain "${domain.domain_name}" deleted successfully`)
          navigate('/domains')
        },
        onError: error => {
          toast.error(`Failed to delete domain: ${error.message}`)
        },
      }
    )
  }

  const [copied, setCopied] = useState(false)

  const archivingEmail = domain ? `${domain.domain_id}@${ARCHIVE_DOMAIN}` : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(archivingEmail)
    setCopied(true)
    toast.success('Archiving email copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!hasPermission) {
    return <NoAccess />
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  if (isError || !domain) {
    toast.error(`Failed to load domain: ${error?.message}`)
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Failed to load domain details. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // const utilizedPercentage =
  //   (domain.quota_utilized / domain.quota_allocated) * 100

  return (
    <div className='w-full mx-auto space-y-4'>
      {domain && (
        <StatusChangeConfirmationModal
          isOpen={statusModal}
          onClose={() => setStatusModal(false)}
          onConfirm={confirmStatusChange}
          entityName='Domain'
          entityLabel={domain.domain_name}
          status={domain.is_active ? 'inactive' : 'active'}
          isLoading={isUpdating}
        />
      )}

      {domain && (
        <DeleteConfirmationModal
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          onConfirm={handleDelete}
          value={domain.domain_name}
          isLoading={isDeleting}
        />
      )}

      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate('/domains')}
            className='h-9 w-9'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <Breadcrumbs className='mb-0' />
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            className='gap-2'
            onClick={handleToggleStatus}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <RefreshCw className='w-4 h-4' />
            )}
            {domain.is_active ? 'Deactivate' : 'Activate'}
          </Button>

          {canDelete && (
            <Button
              variant='ghost'
              onClick={() => setDeleteModal(true)}
              className='text-muted-foreground hover:text-red-600 hover:bg-red-50'
              disabled={isDeleting}
            >
              <Trash2 className='w-4 h-4 mr-2' />
              Delete
            </Button>
          )}
          <Button
            onClick={() => navigate(`/domains/${domainId}/edit`)}
            className='gap-2'
          >
            <Edit2 className='w-4 h-4' />
            Edit Domain
          </Button>
        </div>
      </div>

      <div>
        <h1 className='text-2xl font-bold flex items-center gap-2'>
          <Globe className='w-6 h-6 text-primary' />
          {domain.domain_name}
        </h1>
        <div className=' flex gap-2'>
          <div>
            <p className='text-xs text-muted-foreground'>
              Created Date :{' '}
              <span className='font-medium'>
                {format(new Date(domain.created_at), 'MMM dd, yyyy HH:mm:ss')}
              </span>
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>
              Last Updated :{' '}
              <span className='font-medium'>
                {format(new Date(domain.updated_at), 'MMM dd, yyyy HH:mm:ss')}
              </span>
            </p>
          </div>
        </div>
        {/* <p className='text-sm text-muted-foreground'>
              Domain ID: {domain.domain_id}
            </p> */}
      </div>

      {/* Status Alert */}
      {!domain.is_active && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            This domain is currently inactive. Email archiving is paused.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='p-4 border border-border/40'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center'>
              <Activity className='w-4 h-4 text-blue-600' />
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Status</p>
              <div className='flex items-center gap-2'>
                <Badge
                  variant={domain.is_active ? 'default' : 'secondary'}
                  className='gap-1.5'
                >
                  {domain.is_active ? (
                    <>
                      <CheckCircle2 className='w-3 h-3' />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className='w-3 h-3' />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className='p-4 border border-border/40'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center'>
              <Calendar className='w-4 h-4 text-green-600' />
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Retention Period</p>
              <p className='text-base font-semibold'>
                <RetentionDuration
                  retentionDays={Number(domain.data_retention_days || 0)}
                />
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4 border border-border/40'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center'>
              <HardDrive className='w-4 h-4 text-purple-600' />
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Storage Used</p>
              <p className='text-base font-semibold'>
                {domain.quota_utilized} GB
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4 border border-border/40'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center'>
              <Database className='w-4 h-4 text-orange-600' />
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Total Quota</p>
              <p className='text-base font-semibold'>
                {domain.quota_allocated} GB
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className='grid grid-cols-1 gap-6'>
        {/* <Card className='p-6 border border-border/40'>
          <h2 className='text-lg font-semibold mb-4'>Domain Information</h2>

          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Domain Name</p>
                <p className='font-medium'>{domain.domain_name}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Created Date</p>
                <p className='font-medium'>
                  {format(
                    new Date(domain.created_at),
                    'MMM dd, yyyy HH:mm:ss'
                  )}
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Last Updated</p>
                <p className='font-medium'>
                  {format(
                    new Date(domain.updated_at),
                    'MMM dd, yyyy HH:mm:ss'
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card> */}

        <Card className='p-6 border border-primary/20 bg-primary/5 relative overflow-hidden'>
          <div className='absolute top-0 right-0 p-4 opacity-10'>
            <Globe className='w-24 h-24 text-primary' />
          </div>

          <div className='relative z-10'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <Info className='w-5 h-5 text-primary' />
                <h2 className='text-lg font-semibold'>Archiving Setup</h2>
              </div>
              {/* Toggle to show/hide the restricted UUID-based email */}
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowId(!showId)}
                className='h-8 gap-2 text-xs hover:bg-primary/10'
              >
                {showId ? (
                  <EyeOff className='w-3.5 h-3.5' />
                ) : (
                  <Eye className='w-3.5 h-3.5' />
                )}
                {showId ? 'Hide Address' : 'Show Address'}
              </Button>
            </div>

            <p className='text-sm text-muted-foreground mb-4 leading-relaxed'>
              To archive emails for this domain, configure your mail server
              (Exchange, Google Workspace, etc.) to journal/forward all traffic
              to the following unique archiving address:
            </p>

            <div className='flex items-center gap-2 bg-background border rounded-lg p-3 group shadow-sm transition-all'>
              <code className='flex-1 font-mono text-sm text-primary break-all'>
                {/* Masks the UUID string unless showId is true */}
                {showId
                  ? archivingEmail
                  : `••••••••-••••-••••-••••-••••••••••••@${ARCHIVE_DOMAIN}`}
              </code>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleCopy}
                className='shrink-0 hover:bg-primary/10'
                title='Copy Address'
              >
                <Copy
                  className={cn(
                    'w-4 h-4 transition-all',
                    copied
                      ? 'text-green-500 scale-110'
                      : 'text-muted-foreground'
                  )}
                />
              </Button>
            </div>
          </div>
        </Card>
        {/* Storage Usage Card */}
        {/* <Card className='p-6 border border-border/40'>
          <h2 className='text-lg font-semibold mb-4'>Storage Usage</h2>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Storage Utilization
                </p>
                <p className='text-2xl font-bold'>
                  {utilizedPercentage.toFixed(1)}%
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm text-muted-foreground'>Usage</p>
                <p className='text-lg font-semibold'>
                  {domain.quota_utilized} GB / {domain.quota_allocated} GB
                </p>
              </div>
            </div>

            <Progress
              value={utilizedPercentage}
              className={cn(
                'h-2',
                utilizedPercentage > 90
                  ? 'bg-red-500'
                  : utilizedPercentage > 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              )}
            />

            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>
                Available: {domain.quota_allocated - domain.quota_utilized} GB
              </span>
              <span
                className={cn(
                  'font-medium',
                  utilizedPercentage > 90
                    ? 'text-red-600'
                    : utilizedPercentage > 70
                      ? 'text-yellow-600'
                      : 'text-green-600'
                )}
              >
                {utilizedPercentage > 90
                  ? 'Critical'
                  : utilizedPercentage > 70
                    ? 'Warning'
                    : 'Good'}
              </span>
            </div>
          </div>
        </Card> */}
      </div>
    </div>
  )
}

export default DomainDetailPage
