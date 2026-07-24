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

import {
  Building,
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  HardDrive,
  Shield,
  Calendar,
  Clock,
  Copy,
} from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text)
  toast.success(`${label} copied to clipboard`)
}

export default function AdminOrganizationView() {
  const navigate = useNavigate()
  const location = useLocation()

  const orgData = location.state?.org

  if (!orgData) {
    return (
      <div className='p-6 max-w-4xl mx-auto text-center'>
        <p className='text-muted-foreground mb-4'>
          Organization data not found.
        </p>
        <Button onClick={() => navigate('/1219/admin/organizations')}>
          Return to Organizations
        </Button>
      </div>
    )
  }

  return (
    <div className='p-6 w-full mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/1219/admin/organizations'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <Building className='h-8 w-8 text-primary' />
          <div>
            <h1 className='text-2xl font-bold'>Organization Profile</h1>
            <p className='text-sm text-muted-foreground'>
              View organization details and quotas
            </p>
          </div>
        </div>
        <Button
          onClick={() =>
            navigate(
              `/1219/admin/organizations/${orgData.organization_id}/edit`,
              { state: { org: orgData } }
            )
          }
        >
          <Edit className='h-4 w-4 mr-2' /> Edit
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-card rounded-lg border border-border p-6'>
          <h2 className='text-lg font-semibold mb-4 flex items-center'>
            <Building className='h-5 w-5 mr-2 text-primary' />
            General Information
          </h2>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Organization Name</p>
              <p className='font-medium'>{orgData.organization_name}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground flex items-center'>
                <Shield className='h-4 w-4 mr-1' /> Status
              </p>
              <span
                className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${orgData.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
              >
                {orgData.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {orgData.created_at && (
              <div>
                <p className='text-sm text-muted-foreground flex items-center'>
                  <Calendar className='h-4 w-4 mr-1' /> Created
                </p>
                <p
                  className='font-medium'
                  title={format(new Date(orgData.created_at), 'PPPp')}
                >
                  {format(new Date(orgData.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            {orgData.updated_at && (
              <div>
                <p className='text-sm text-muted-foreground flex items-center'>
                  <Clock className='h-4 w-4 mr-1' /> Last Updated
                </p>
                <p
                  className='font-medium'
                  title={format(new Date(orgData.updated_at), 'PPPp')}
                >
                  {format(new Date(orgData.updated_at), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            <div>
              <p className='text-sm text-muted-foreground'>Organization ID</p>
              <div className='flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded w-fit border border-border/50 mt-1'>
                <span className='font-mono'>{orgData.organization_id}</span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-4 w-4 hover:bg-transparent hover:text-primary ml-1'
                  onClick={() =>
                    copyToClipboard(orgData.organization_id, 'Organization ID')
                  }
                >
                  <Copy className='w-3 h-3' />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-card rounded-lg border border-border p-6'>
          <h2 className='text-lg font-semibold mb-4 flex items-center'>
            <Phone className='h-5 w-5 mr-2 text-primary' />
            Contact Details
          </h2>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground flex items-center'>
                <Mail className='h-4 w-4 mr-1' /> Admin Email
              </p>
              <p className='font-medium'>{orgData.admin_email}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground flex items-center'>
                <Phone className='h-4 w-4 mr-1' /> Admin Phone
              </p>
              <p className='font-medium'>{orgData.admin_phone}</p>
            </div>
          </div>
        </div>

        <div className='bg-card rounded-lg border border-border p-6 md:col-span-2'>
          <h2 className='text-lg font-semibold mb-4 flex items-center'>
            <HardDrive className='h-5 w-5 mr-2 text-primary' />
            Storage & Quota
          </h2>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Quota Allocated</p>
              <p className='font-medium text-xl'>
                {orgData.quota_allocated} GB
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Quota Utilized</p>
              <p className='font-medium text-xl'>{orgData.quota_utilized} GB</p>
            </div>
          </div>
          <div className='mt-4 w-full bg-secondary rounded-full h-2.5 dark:bg-gray-700'>
            <div
              className='bg-primary h-2.5 rounded-full'
              style={{
                width: `${Math.min(100, (orgData.quota_utilized / orgData.quota_allocated) * 100 || 0)}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
