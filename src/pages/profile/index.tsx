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

import { useAtomValue } from 'jotai'
import { userAtom } from '@/atoms/user'
import { Link } from 'react-router-dom'
import {
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Calendar,
  BadgeCheck,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermissionsConfig } from '../users/from/PermissionConfig'
import { PermissionsTable } from '../users/from/PermissionTable'
import { Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

const Profile = () => {
  const user = useAtomValue(userAtom)
  const PERMISSIONS_CONFIG = usePermissionsConfig()

  // Construct a flat list of all selected permissions for the table
  const allUserPermissions = [...(user?.basic_permissions || [])]

  if (!user) return null

  return (
    <div className='w-full mx-auto space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <Breadcrumbs className='mb-0' />
        <Button asChild variant='outline'>
          <Link to='/settings/profile'>
            <Settings className='w-4 h-4 mr-2' />
            Profile Settings
          </Link>
        </Button>
      </div>

      {/* Top Section: General Information (Full Width) */}
      <div className='bg-card rounded-xl border border-border shadow-sm overflow-hidden'>
        <div className='px-6 py-4 border-b border-border'>
          <h3 className='font-semibold flex items-center gap-2'>
            <div className='w-1 h-4 bg-primary rounded-full'></div>
            General Information
          </h3>
        </div>
        <div className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start'>
            {/* User Identity Section */}
            <div className='flex items-center gap-6 min-w-[300px] border-r border-border/50 pr-8'>
              <div className='space-y-1.5'>
                <h2 className='text-xl font-bold capitalize'>
                  {user.display_name}
                </h2>
                <div className='flex flex-col gap-1'>
                  <p className='text-sm text-muted-foreground'>
                    @{user.user_name}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border w-fit ${
                      user.is_active
                        ? 'bg-green-500/10 text-green-600 border-green-200'
                        : 'bg-red-500/10 text-red-600 border-red-200'
                    }`}
                  >
                    {user.is_active ? 'Active Account' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className='col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6 flex-1'>
              <div className='space-y-1.5'>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <Mail className='w-4 h-4' /> Email Address
                </div>
                <p className='font-medium text-sm'>{user.user_email}</p>
              </div>
              <div className='space-y-1.5'>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <Phone className='w-4 h-4' /> Phone Number
                </div>
                <p className='font-medium text-sm'>
                  {user.primary_phone || 'Not provided'}
                </p>
              </div>
              <div className='space-y-1.5'>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <Calendar className='w-4 h-4' /> Member Since
                </div>
                <p className='font-medium text-sm'>
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column: Security & Scopes */}
        <div className='space-y-6'>
          <div className='bg-card rounded-xl border border-border p-6 shadow-sm'>
            <h3 className='font-semibold mb-4 flex items-center gap-2'>
              <ShieldCheck className='w-4 h-4 text-primary' />
              Security Status
            </h3>
            <div className='space-y-3'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>2FA Status</span>
                <span className='font-medium text-amber-600'>
                  {user.is_totp_2fa_active ||
                  user.is_sms_2fa_active ||
                  user.is_email_2fa_active
                    ? 'Enabled'
                    : 'Disabled'}
                </span>
              </div>
              <div className='pt-2 border-t border-border mt-2'>
                <p className='text-[11px] text-muted-foreground italic leading-relaxed'>
                  Last updated: {new Date(user.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-card rounded-xl border border-border p-6 shadow-sm'>
            <h3 className='font-semibold mb-4 flex items-center gap-2'>
              <Building2 className='w-4 h-4 text-primary' />
              Domain Permissions
            </h3>
            <div className='space-y-3'>
              <div className='flex flex-col gap-2 text-sm'>
                <span className='text-muted-foreground'>
                  Associated Domains
                </span>
                <div className='flex gap-2 flex-wrap'>
                  {user.domain_permissions.length > 0 ? (
                    user.domain_permissions.map(domain => (
                      <span
                        key={domain}
                        className='px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium border border-primary/20'
                      >
                        {domain}
                      </span>
                    ))
                  ) : (
                    <span className='text-muted-foreground'>
                      No domains associated
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className='bg-card rounded-xl border border-border p-6 shadow-sm'>
            <h3 className='font-semibold mb-4 flex items-center gap-2'>
              <BadgeCheck className='w-4 h-4 text-primary' />
              Mailbox Permissions
            </h3>
            <div className='space-y-3'>
              <div className='flex flex-col gap-2 text-sm'>
                <span className='text-muted-foreground'>
                  Associated Mailboxes
                </span>
                <div className='flex gap-2 flex-wrap'>
                  {user.mailbox_permissions.length > 0 ? (
                    user.mailbox_permissions.map(mailbox => (
                      <span
                        key={mailbox}
                        className='px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium border border-primary/20'
                      >
                        {mailbox}
                      </span>
                    ))
                  ) : (
                    <span className='text-muted-foreground'>
                      No mailboxes associated
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Access Permissions Table */}
        <div className='lg:col-span-2'>
          <Card className='p-0 overflow-hidden border-border/60 shadow-sm gap-0 h-full'>
            <div className='p-4 border-b bg-muted/5 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Shield className='w-5 h-5 text-primary' />
                <h3 className='font-semibold'>Access Permissions</h3>
              </div>
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
        </div>
      </div>
    </div>
  )
}

export default Profile
