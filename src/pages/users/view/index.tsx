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

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  User,
  Mail,
  Phone,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Key,
  Edit,
  ArrowLeft,
  Trash2,
  Smartphone,
  Mail as MailIcon,
  AlertCircle,
  Copy,
  Calendar,
  Globe,
  Inbox,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { useDeleteUser, useUser, useUpdateUserStatus } from '@/hooks/useUsers'
import { useTOTPList, useUpdate2FAStatus } from '@/hooks/use2FA'
import { usePermissionsConfig } from '../from/PermissionConfig' // Import the hook/config
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'
import { Skeleton } from '@/components/ui/skeleton'
import { TwoFASetupModal } from '@/components/auth/TwoFASetupModal'
import { TwoFAListModal } from '@/components/auth/TwoFAListModal'
import { useAccessPermission } from '@/utils/accessPermission'
import NoAccess from '@/components/common/NoAccess'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PermissionsTable } from '../from/PermissionTable'
import StatusChangeConfirmationModal from '@/components/common/StatusChangeConfirmationModal'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atoms/user'

const UserView = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const hasPermission = useAccessPermission('user:view')
  const canEdit = useAccessPermission('user:edit')
  const canDelete = useAccessPermission('user:delete')

  const canViewTOTP = useAccessPermission('2fa:totp:view')
  // const canCreateTOTP = useAccessPermission('2fa:totp:create')
  // const canEditTOTP = useAccessPermission('2fa:totp:edit')
  // const canDeleteTOTP = useAccessPermission('2fa:totp:delete')

  const [deleteModal, setDeleteModal] = useState(false)
  // const [show2FAModal, setShow2FAModal] = useState(false)
  const [show2FAListModal, setShow2FAListModal] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  // const queryClient = useQueryClient()
  const currentUser = useAtomValue(userAtom)

  const PERMISSIONS_CONFIG = usePermissionsConfig()

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useUser(userId || '')

  // Fetch TOTP List to decide logic
  // const { data: totpList } = useTOTPList(user?.user_id || '')

  const deleteUserMutation = useDeleteUser()
  const updateUserStatus = useUpdateUserStatus()
  // const update2FAStatus = useUpdate2FAStatus()

  // Handler for Toggling 2FA Methods
  // const handleToggle2FA = async (
  //   method: 'totp' | 'sms' | 'email',
  //   checked: boolean
  // ) => {
  //   if (!user) return

  //   if (method === 'totp' && checked) {
  //     if (!totpList || totpList.length === 0) {
  //       setShow2FAModal(true)
  //       return
  //     }
  //   }

  //   update2FAStatus.mutate(
  //     {
  //       userId: user.user_id,
  //       method,
  //       enabled: checked,
  //       organizationId: user.organization_id,
  //     },
  //     {
  //       onSuccess: () => {
  //         toast.success(
  //           `${method.toUpperCase()} 2FA ${checked ? 'enabled' : 'disabled'} successfully`
  //         )
  //         queryClient.invalidateQueries({ queryKey: ['user', userId] })
  //       },
  //     }
  //   )
  // }

  useEffect(() => {
    if (isError) {
      toast.error(`Failed to load user: ${error?.message}`)
    }
  }, [isError, error])

  if (!hasPermission) {
    return <NoAccess />
  }

  const handleDelete = () => {
    if (!userId) return

    deleteUserMutation.mutate(
      { userId, userName: user?.user_name },
      {
        onSuccess: () => {
          toast.success('User deleted successfully')
          navigate('/users')
        },
        onError: error => {
          toast.error(`Failed to delete user: ${error.message}`)
        },
      }
    )
  }

  const confirmStatusChange = () => {
    if (!user) return

    const payload = {
      user_id: user.user_id,
      is_active: !user.is_active,
    }

    updateUserStatus.mutate(
      { userData: payload, username: user?.user_name },
      {
        onSuccess: () => {
          setStatusModal(false)
          refetch()
          toast.success(
            `User "${user.display_name || user.user_name}" ${
              !user.is_active ? 'activated' : 'deactivated'
            } successfully`
          )
        },
        onError: error => {
          toast.error(`Failed to update user status: ${error.message}`)
        },
      }
    )
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  // Construct a flat list of all selected permissions for the table
  const allUserPermissions = [
    ...(user?.basic_permissions || []),
    ...(user?.domain_permissions || []),
    ...(user?.mailbox_permissions || []),
  ]

  const renderStatusBadge = (isActive: boolean) => (
    <Badge
      variant={isActive ? 'default' : 'secondary'}
      className={`gap-1.5 px-2.5 py-0.5 ${
        isActive
          ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200'
          : 'bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200'
      }`}
    >
      {isActive ? (
        <>
          <CheckCircle className='w-3.5 h-3.5' />
          Active Account
        </>
      ) : (
        <>
          <XCircle className='w-3.5 h-3.5' />
          Inactive Account
        </>
      )}
    </Badge>
  )

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (isError || !user) {
    return (
      <div className='max-w-4xl mx-auto py-12'>
        <Card className='p-8 text-center flex flex-col items-center gap-4'>
          <div className='p-3 rounded-full bg-red-100 text-red-600'>
            <AlertCircle className='w-8 h-8' />
          </div>
          <div className='space-y-1'>
            <h2 className='text-xl font-bold'>User Not Found</h2>
            <p className='text-muted-foreground'>
              {error?.message || 'The requested user could not be found.'}
            </p>
          </div>
          <Button
            onClick={() => navigate('/users')}
            variant='outline'
            className='mt-2'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to User Directory
          </Button>
        </Card>
      </div>
    )
  }

  const hasHigherPrivileges = !(
    user &&
    currentUser &&
    (user.basic_permissions || []).some(
      p => !(currentUser.basic_permissions || []).includes(p)
    )
  )

  return (
    <div className='w-full mx-auto space-y-4 '>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        value={user.user_name}
        isLoading={deleteUserMutation.isPending}
      />

      {/* Status Change Confirmation Modal */}
      {user && (
        <StatusChangeConfirmationModal
          isOpen={statusModal}
          onClose={() => setStatusModal(false)}
          onConfirm={confirmStatusChange}
          entityName='User'
          entityLabel={user.display_name || user.user_name}
          status={user.is_active ? 'inactive' : 'active'}
          isLoading={updateUserStatus.isPending}
        />
      )}

      {/* Header Section */}
      <div className='flex flex-col gap-2'>
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

        <div className='flex items-start justify-between'>
          <div className='flex flex-col gap-1 pl-1'>
            <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground'>
              <User className='h-6 w-6 text-primary' />
              User Details
            </h1>
            <p className='text-sm text-muted-foreground'>
              Manage user profile, permissions, and security settings.
            </p>
          </div>

          {hasHigherPrivileges && (
            <div className='flex items-center gap-2'>
              {canEdit && (
                <Button
                  variant='outline'
                  className='gap-2'
                  onClick={() => setStatusModal(true)}
                  disabled={updateUserStatus.isPending}
                >
                  {updateUserStatus.isPending ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <RefreshCw className='w-4 h-4' />
                  )}
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              {canDelete && (
                <Button
                  variant='ghost'
                  onClick={() => setDeleteModal(true)}
                  className='text-muted-foreground hover:text-red-600 hover:bg-red-50'
                  disabled={deleteUserMutation.isPending}
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete
                </Button>
              )}
              {canEdit && (
                <Button asChild className='shadow-sm'>
                  <Link to={`/users/${userId}/edit`}>
                    <Edit className='w-4 h-4 mr-2' />
                    Edit Configuration
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Summary Card */}
      <Card className='overflow-hidden border border-border/60 shadow-sm'>
        <div className='p-4'>
          <div className='flex flex-col md:flex-row gap-4'>
            {/* Info Grid */}
            <div className='flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {/* Identity */}
              <div className='space-y-4'>
                <div>
                  <h2 className='text-xl font-bold text-foreground'>
                    {user.display_name || user.user_name}
                  </h2>
                  <p className='text-sm text-muted-foreground font-medium'>
                    @{user.user_name}
                  </p>
                  <div className='flex mt-2'>
                    {renderStatusBadge(user.is_active)}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className='space-y-3'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Mail className='w-4 h-4 text-muted-foreground/70' />
                    <span className='truncate'>{user.user_email}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <Phone className='w-4 h-4 text-muted-foreground/70' />
                    <span>{user.primary_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className='space-y-3'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Calendar className='w-4 h-4 text-muted-foreground/70' />
                    <span>
                      Created{' '}
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <Clock className='w-4 h-4 text-muted-foreground/70' />
                    <span>
                      Updated{' '}
                      {format(new Date(user.updated_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded w-fit border border-border/50'>
                    <span className='font-mono'>{user.user_id}</span>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-4 w-4 hover:bg-transparent hover:text-primary'
                      onClick={() => copyToClipboard(user.user_id, 'User ID')}
                    >
                      <Copy className='w-3 h-3' />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
        {/* Left Column: Permissions (2/3 width) */}
        <div className='xl:col-span-2 space-y-4'>
          <Card className='p-0 overflow-hidden border-border/60 shadow-sm gap-0'>
            <div className='p-4 border-b bg-muted/5 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Shield className='w-5 h-5 text-primary' />
                <h3 className='font-semibold'>Access Control List</h3>
              </div>
              {canEdit && (
                <Button
                  variant='ghost'
                  size='sm'
                  asChild
                  className='text-xs h-6'
                >
                  <Link to={`/users/${userId}/edit`}>Manage Access</Link>
                </Button>
              )}
            </div>

            <div className='p-0'>
              <PermissionsTable
                config={PERMISSIONS_CONFIG}
                selectedPermissions={allUserPermissions}
                readOnly={true}
                className='border-0 shadow-none rounded-none'
              />
            </div>
          </Card>

          {/* Domain Access Scope */}
          {user.domain_permissions && user.domain_permissions.length > 0 && (
            <Card className='p-0 overflow-hidden border-border/60 shadow-sm gap-0'>
              <div className='p-4 border-b bg-muted/5 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Globe className='w-5 h-5 text-primary' />
                  <h3 className='font-semibold'>Domain Scope</h3>
                </div>
              </div>
              <div className='p-4 flex flex-wrap gap-2'>
                {user.domain_permissions.map(domain => (
                  <Badge key={domain} variant='secondary' className='px-3 py-1'>
                    {domain}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Mailbox Access Scope */}
          {user.mailbox_permissions && user.mailbox_permissions.length > 0 && (
            <Card className='p-0 overflow-hidden border-border/60 shadow-sm gap-0'>
              <div className='p-4 border-b bg-muted/5 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Inbox className='w-5 h-5 text-primary' />
                  <h3 className='font-semibold'>Mailbox Scope</h3>
                </div>
              </div>
              <div className='p-4 flex flex-wrap gap-2'>
                {user.mailbox_permissions.map(mailbox => (
                  <Badge
                    key={mailbox}
                    variant='secondary'
                    className='px-3 py-1'
                  >
                    {mailbox}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Security (1/3 width) */}
        <div className='xl:col-span-1 space-y-4'>
          <Card className='p-0 overflow-hidden border-border/60 shadow-sm gap-0'>
            <div className='p-4 border-b bg-muted/5 flex items-center gap-2'>
              <Key className='w-5 h-5 text-primary' />
              <h3 className='font-semibold'>Security & Authentication</h3>
            </div>

            <div className='p-4 space-y-4'>
              {/* Header Actions */}
              <div className='flex items-center justify-between pb-2'>
                <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  2FA Methods
                </span>
                {/* {canCreateTOTP && ( */}
                <Button
                  variant='outline'
                  size='sm'
                  // onClick={() => setShow2FAModal(true)}
                  className='h-7 text-xs'
                  disabled={hasHigherPrivileges}
                >
                  Configure 2FA
                </Button>
                {/* )} */}
              </div>

              {/* TOTP */}
              {canViewTOTP && (
                <div className='flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-md bg-blue-50 text-blue-600'>
                      <Smartphone className='w-4 h-4' />
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>
                        Authenticator App
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        TOTP Verification
                      </span>
                    </div>
                  </div>
                  <div
                    className={` px-2.5 py-0.5 text-[13px] rounded-md flex items-center  gap-2 font-medium  ${
                      user.is_totp_2fa_active
                        ? 'bg-green-500/10 text-green-700  border-green-200'
                        : 'bg-red-500/10 text-red-700  border-red-200'
                    }`}
                  >
                    {user.is_totp_2fa_active ? (
                      <>
                        <CheckCircle className='w-3.5 h-3.5' />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className='w-3.5 h-3.5' />
                        Inactive
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* SMS */}
              <div className='flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-md bg-green-50 text-green-600'>
                    <Phone className='w-4 h-4' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>SMS</span>
                    <span className='text-xs text-muted-foreground'>
                      Text Message
                    </span>
                  </div>
                </div>
                <div
                  className={` px-2.5 py-0.5 text-[13px] rounded-md flex items-center  gap-2 font-medium  ${
                    user.is_sms_2fa_active
                      ? 'bg-green-500/10 text-green-700  border-green-200'
                      : 'bg-red-500/10 text-red-700  border-red-200'
                  }`}
                >
                  {user.is_sms_2fa_active ? (
                    <>
                      <CheckCircle className='w-3.5 h-3.5' />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className='w-3.5 h-3.5' />
                      Inactive
                    </>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className='flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-md bg-purple-50 text-purple-600'>
                    <MailIcon className='w-4 h-4' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>Email</span>
                    <span className='text-xs text-muted-foreground'>
                      Code via Email
                    </span>
                  </div>
                </div>
                <div
                  className={` px-2.5 py-0.5 text-[13px] rounded-md flex items-center  gap-2 font-medium  ${
                    user.is_email_2fa_active
                      ? 'bg-green-500/10 text-green-700  border-green-200'
                      : 'bg-red-500/10 text-red-700  border-red-200'
                  }`}
                >
                  {user.is_email_2fa_active ? (
                    <>
                      <CheckCircle className='w-3.5 h-3.5' />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className='w-3.5 h-3.5' />
                      Inactive
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {/* {user && (
        <TwoFASetupModal
          open={show2FAModal}
          onOpenChange={setShow2FAModal}
          user={user}
          addFunction={() => refetch()}
          currentStep={2}
          showDeviceList={false}
        />
      )} */}

      {/* 2FA List Modal */}
      {/* {user && (
        <TwoFAListModal
          open={show2FAListModal}
          onOpenChange={setShow2FAListModal}
          user={user}
          refreshUser={() => refetch()}
        />
      )} */}
    </div>
  )
}

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className='w-full mx-auto space-y-6'>
    {/* Header Skeleton */}
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <Skeleton className='h-9 w-9 rounded-md' />
        <div>
          <Skeleton className='h-7 w-48' />
          <Skeleton className='h-4 w-64 mt-1' />
        </div>
      </div>
      <div className='flex gap-2'>
        <Skeleton className='h-9 w-24' />
        <Skeleton className='h-9 w-24' />
      </div>
    </div>

    {/* Profile Card Skeleton */}
    <Skeleton className='h-48 w-full rounded-lg' />

    {/* Grid Skeleton */}
    <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
      <Skeleton className='h-96 w-full rounded-lg xl:col-span-2' />
      <Skeleton className='h-80 w-full rounded-lg xl:col-span-1' />
    </div>
  </div>
)

export default UserView
