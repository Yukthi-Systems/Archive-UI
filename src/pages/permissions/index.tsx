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
  Shield,
  Key,
  ChevronRight,
  Check,
  ShieldAlert,
  UserCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PermissionRole {
  name: string
  description: string
  users: number
  permissions: string[]
}

const ROLES: PermissionRole[] = [
  {
    name: 'System Admin',
    description: 'Full access to all modules and system-wide configurations.',
    users: 2,
    permissions: [
      'read:all',
      'write:all',
      'delete:all',
      'manage:users',
      'manage:domains',
      'view:audit_logs',
    ],
  },
  {
    name: 'Forensic Auditor',
    description:
      'Authorized to search, view and export archive data for discovery.',
    users: 5,
    permissions: ['read:all', 'export:archives', 'view:audit_logs'],
  },
  {
    name: 'Standard User',
    description: 'Limited read-only access to specific forensic cases only.',
    users: 12,
    permissions: ['read:assigned_cases'],
  },
]

const ALL_PERMISSIONS = [
  { key: 'read:all', label: 'Global Search & View', module: 'Discovery' },
  { key: 'write:all', label: 'Modify Archives', module: 'System' },
  { key: 'delete:all', label: 'Purge Records', module: 'System' },
  { key: 'manage:users', label: 'User Management', module: 'Identity' },
  { key: 'manage:domains', label: 'Domain Configuration', module: 'Network' },
  {
    key: 'view:audit_logs',
    label: 'Forensic Audit Logs',
    module: 'Compliance',
  },
  {
    key: 'export:archives',
    label: 'Bulk Download/Export',
    module: 'Discovery',
  },
]

const Permissions = () => {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold flex items-center gap-2'>
            <Shield className='w-6 h-6 text-primary' />
            Permissions & Roles
          </h1>
          <p className='text-sm text-muted-foreground'>
            Define roles and manage granular access controls across the system.
          </p>
        </div>
        <Button className='gap-2 bg-gradient-primary border-none shadow-lg'>
          <ShieldAlert className='w-4 h-4' /> Create Custom Role
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <h3 className='text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2'>
            <Key className='w-4 h-4' /> System Roles
          </h3>
          {ROLES.map(role => (
            <Card
              key={role.name}
              className='p-5 group cursor-pointer hover:border-primary/40 transition-all hover:shadow-md border-border/40 bg-card/50 backdrop-blur-sm'
            >
              <div className='flex items-start justify-between mb-2'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <h4 className='font-bold text-lg'>{role.name}</h4>
                    <Badge
                      variant='secondary'
                      className='bg-primary/5 text-primary font-mono text-[10px] h-5'
                    >
                      {role.users} Users
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    {role.description}
                  </p>
                </div>
                <ChevronRight className='w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors' />
              </div>
              <div className='flex flex-wrap gap-2 mt-4'>
                {role.permissions.map(p => (
                  <Badge
                    key={p}
                    variant='outline'
                    className='text-[10px] font-mono border-border/60 bg-muted/40 text-muted-foreground'
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className='border-border/40 overflow-hidden shadow-xl bg-card/30'>
          <div className='p-6 border-b border-border/40 flex items-center justify-between bg-primary/5'>
            <div className='flex items-center gap-2'>
              <Shield className='w-5 h-5 text-primary' />
              <h3 className='font-bold'>Permission Matrix</h3>
            </div>
            <Badge className='bg-primary text-primary-foreground'>
              Previewing Admin
            </Badge>
          </div>
          <div className='divide-y divide-border/40'>
            {ALL_PERMISSIONS.map(perm => (
              <div
                key={perm.key}
                className='p-4 flex items-center justify-between hover:bg-muted/30 transition-colors'
              >
                <div className='space-y-0.5'>
                  <p className='text-sm font-medium'>{perm.label}</p>
                  <div className='flex items-center gap-2'>
                    <span className='text-[10px] font-mono text-muted-foreground'>
                      {perm.key}
                    </span>
                    <span className='w-1 h-1 rounded-full bg-muted-foreground/30' />
                    <span className='text-[10px] uppercase tracking-wider font-bold text-primary/70'>
                      {perm.module}
                    </span>
                  </div>
                </div>
                <div className='w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 border border-green-500/20'>
                  <Check className='w-4 h-4' />
                </div>
              </div>
            ))}
          </div>
          <div className='p-6 bg-muted/20 flex items-center justify-center border-t border-border/40'>
            <Button
              variant='outline'
              className='w-full text-xs gap-2 rounded-xl'
            >
              <UserCheck className='w-4 h-4' /> View Associated Users
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Permissions
