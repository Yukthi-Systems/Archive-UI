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
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Key,
  Edit,
  ArrowLeft,
  AlertCircle,
  Copy,
  Calendar,
  Globe,
  Inbox,
} from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ALL_PERMISSIONS_CONFIG } from '@/pages/users/from/PermissionConfig'
import { PermissionsTable } from '@/pages/users/from/PermissionTable'
import { useAtomValue } from 'jotai'
import { selectedAdminOrgAtom } from '@/store/adminStore'

const AdminUserView = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const selectedOrg = useAtomValue(selectedAdminOrgAtom)

  // The Admin API lacks a get-user-by-id endpoint, so we rely on route state
  const user = location.state?.user

  useEffect(() => {
    if (!selectedOrg) {
      toast.error('No organization selected. Please return to the user list.')
      navigate('/1219/admin/users')
    } else if (!user) {
      toast.error(
        'User data not found in session. Please return to the list and click view again.'
      )
      navigate('/1219/admin/users')
    }
  }, [selectedOrg, user, navigate])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  if (!user) {
    return (
      <div className='max-w-4xl mx-auto py-12'>
        <Card className='p-8 text-center flex flex-col items-center gap-4'>
          <div className='p-3 rounded-full bg-red-100 text-red-600'>
            <AlertCircle className='w-8 h-8' />
          </div>
          <div className='space-y-1'>
            <h2 className='text-xl font-bold'>User Not Found</h2>
            <p className='text-muted-foreground'>
              User data must be loaded from the directory list.
            </p>
          </div>
          <Button
            onClick={() => navigate('/1219/admin/users')}
            variant='outline'
            className='mt-2'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Directory
          </Button>
        </Card>
      </div>
    )
  }

  // Construct a flat list of all selected permissions for the table
  const allUserPermissions = [
    ...(user.basic_permissions || []),
    ...(user.domain_permissions || []),
    ...(user.mailbox_permissions || []),
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

  return (
    <div className='w-full mx-auto space-y-4 p-6'>
      {/* Header Section */}
      <div className='flex flex-col gap-2'>
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
          <span className='text-sm text-muted-foreground'>
            Admin / Users / View Profile
          </span>
        </div>

        <div className='flex items-start justify-between'>
          <div className='flex flex-col gap-1 pl-1'>
            <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground'>
              <UserIcon className='h-6 w-6 text-primary' />
              Admin User Details
            </h1>
            <p className='text-sm text-muted-foreground'>
              View admin user profile and permissions scope.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button asChild className='shadow-sm'>
              <Link to={`/1219/admin/users/${userId}/edit`} state={{ user }}>
                <Edit className='w-4 h-4 mr-2' />
                Edit Configuration
              </Link>
            </Button>
          </div>
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
                  {user.created_at && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Calendar className='w-4 h-4 text-muted-foreground/70' />
                      <span title={format(new Date(user.created_at), 'PPPp')}>
                        Created{' '}
                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  {user.updated_at && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Clock className='w-4 h-4 text-muted-foreground/70' />
                      <span title={format(new Date(user.updated_at), 'PPPp')}>
                        Updated{' '}
                        {format(new Date(user.updated_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded w-fit border border-border/50 mt-2'>
                    <span className='font-mono'>{user.user_id}</span>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-4 w-4 hover:bg-transparent hover:text-primary ml-1'
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
              <Button variant='ghost' size='sm' asChild className='text-xs h-6'>
                <Link to={`/1219/admin/users/${userId}/edit`} state={{ user }}>
                  Manage Access
                </Link>
              </Button>
            </div>

            <div className='p-0'>
              <PermissionsTable
                config={ALL_PERMISSIONS_CONFIG}
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
                {user.domain_permissions.map((domain: string) => (
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
                {user.mailbox_permissions.map((mailbox: string) => (
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

            <div className='p-4 space-y-3'>
              {[
                {
                  label: 'Authenticator App (TOTP)',
                  active: user.is_totp_2fa_active,
                },
                { label: 'SMS Verification', active: user.is_sms_2fa_active },
                {
                  label: 'Email Verification',
                  active: user.is_email_2fa_active,
                },
              ].map(({ label, active }) => (
                <div
                  key={label}
                  className='flex items-center justify-between text-sm'
                >
                  <span className='text-muted-foreground'>{label}</span>
                  <Badge
                    variant={active ? 'default' : 'secondary'}
                    className={`gap-1 px-2 py-0.5 text-xs ${
                      active
                        ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {active ? (
                      <>
                        <CheckCircle className='w-3 h-3' /> Enabled
                      </>
                    ) : (
                      <>
                        <XCircle className='w-3 h-3' /> Disabled
                      </>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminUserView
