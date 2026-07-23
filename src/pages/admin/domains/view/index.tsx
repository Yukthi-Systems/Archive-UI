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

import { Globe, ArrowLeft, Edit, HardDrive, Shield, Clock } from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function AdminDomainView() {
  const navigate = useNavigate()
  const location = useLocation()

  const domainData = location.state?.domain

  if (!domainData) {
    return (
      <div className='p-6 max-w-4xl mx-auto text-center'>
        <p className='text-muted-foreground mb-4'>Domain data not found.</p>
        <Button onClick={() => navigate('/1219/admin/domains')}>
          Return to Domains
        </Button>
      </div>
    )
  }

  return (
    <div className='p-6 w-full mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/1219/admin/domains'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <Globe className='h-8 w-8 text-primary' />
          <div>
            <h1 className='text-2xl font-bold'>Domain Profile</h1>
            <p className='text-sm text-muted-foreground'>
              View domain configuration and usage
            </p>
          </div>
        </div>
        <Button
          onClick={() =>
            navigate(`/1219/admin/domains/${domainData.domain_id}/edit`, {
              state: { domain: domainData },
            })
          }
        >
          <Edit className='h-4 w-4 mr-2' /> Edit
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-card rounded-lg border border-border p-6'>
          <h2 className='text-lg font-semibold mb-4 flex items-center'>
            <Globe className='h-5 w-5 mr-2 text-primary' />
            General Information
          </h2>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Domain Name</p>
              <p className='font-medium text-lg'>{domainData.domain_name}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground flex items-center'>
                <Shield className='h-4 w-4 mr-1' /> Status
              </p>
              <span
                className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${domainData.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
              >
                {domainData.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className='bg-card rounded-lg border border-border p-6'>
          <h2 className='text-lg font-semibold mb-4 flex items-center'>
            <Clock className='h-5 w-5 mr-2 text-primary' />
            Policies
          </h2>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Retention Period</p>
              <p className='font-medium'>
                {domainData.data_retention_days} Days
              </p>
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
                {domainData.quota_allocated} GB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
