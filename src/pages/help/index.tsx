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

import { useState, useMemo } from 'react'
import {
  Search,
  Book,
  Shield,
  Users,
  Database,
  Mail,
  HelpCircle,
  Menu,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  Settings,
  FileSpreadsheet,
  Filter,
  Download,
  Upload,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atoms/user'

// --- Data Structure for Documentation ---
type DocSection = {
  id: string
  title: string
  icon?: React.ElementType
  permission?: string
  content: React.ReactNode
}

type DocCategory = {
  title: string
  items: DocSection[]
}

const DocumentationData: DocCategory[] = [
  {
    title: 'Getting Started',
    items: [
      {
        id: 'overview',
        title: 'Overview',
        icon: Book,
        content: (
          <div className='space-y-4'>
            <h1 className='text-3xl font-bold tracking-tight'>
              Email Archive Documentation
            </h1>
            <p className='text-lg text-muted-foreground'>
              Welcome to the official documentation for the Email Archive
              application. This comprehensive guide will help you manage your
              organization's email retention, compliance, and auditing needs
              effectively.
            </p>
            <div className='grid gap-4 md:grid-cols-2 mt-6'>
              <div className='p-4 border rounded-lg bg-card'>
                <h3 className='font-semibold flex items-center gap-2 mb-2'>
                  <Database className='w-4 h-4 text-primary' />
                  Secure Archiving
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Automated journaling and storage of all inbound and outbound
                  emails with tamper-proof retention.
                </p>
              </div>
              <div className='p-4 border rounded-lg bg-card'>
                <h3 className='font-semibold flex items-center gap-2 mb-2'>
                  <Search className='w-4 h-4 text-primary' />
                  Advanced Discovery
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Powerful search tools to instantly retrieve emails for legal
                  discovery, compliance, or internal requests.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: LayoutDashboard,
        content: (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Dashboard</h2>
            <p className='text-muted-foreground'>
              The Dashboard provides a real-time overview of your archiving
              system's health and usage.
            </p>

            <h3 className='text-xl font-semibold mt-6'>Key Metrics</h3>
            <ul className='list-disc pl-6 space-y-2 text-muted-foreground'>
              <li>
                <strong>Total Ingested Volume</strong>: The daily count and size
                of emails being archived.
              </li>
              <li>
                <strong>Storage Trends</strong>: Visual charts showing storage
                consumption over the last 7 days.
              </li>
              <li>
                <strong>Domain Status</strong>: Quick overview of active
                archiving domains.
              </li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    title: 'Core Modules',
    items: [
      {
        id: 'listing',
        title: 'Email Listing & Search',
        icon: Mail,
        content: (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Email Listing</h2>
            <p className='text-muted-foreground'>
              The Email Listing page is the central hub for searching, viewing,
              and exporting archived emails.
            </p>

            <div className='border rounded-md p-4 bg-muted/20'>
              <h3 className='font-semibold flex items-center gap-2 mb-2'>
                <Filter className='w-4 h-4' />
                Search Filters
              </h3>
              <ul className='space-y-2 text-sm text-muted-foreground'>
                <li>
                  <strong className='text-foreground'>Subject:</strong> Search
                  by keywords in the email subject line.
                </li>
                <li>
                  <strong className='text-foreground'>Date Range:</strong>{' '}
                  Filter emails within a specific timeframe (required).
                </li>
                <li>
                  <strong className='text-foreground'>From/To Address:</strong>{' '}
                  Filter by sender or recipient.
                  <p className='text-xs mt-1 pl-2 border-l-2 border-primary/20'>
                    Note: Users with restricted mailbox permissions can only
                    search within their assigned email addresses.
                  </p>
                </li>
                <li>
                  <strong className='text-foreground'>Attachments:</strong>{' '}
                  Filter for emails with, without, or any attachment status.
                </li>
              </ul>
            </div>

            <h3 className='text-xl font-semibold mt-6'>Actions</h3>
            <div className='grid gap-4'>
              <div className='border-l-2 border-primary pl-4'>
                <h4 className='font-medium text-foreground'>View Email</h4>
                <p className='text-sm text-muted-foreground'>
                  Click on any row to open the email preview. You can view the
                  full message body, headers, and download attachments
                  individually.
                </p>
              </div>
              <div className='border-l-2 border-primary pl-4'>
                <h4 className='font-medium text-foreground'>Download EML</h4>
                <p className='text-sm text-muted-foreground'>
                  Download the raw .eml file for legal or forensic use. This
                  action is logged in the Audit Trail.
                </p>
              </div>
              <div className='border-l-2 border-primary pl-4'>
                <h4 className='font-medium text-foreground'>Export Data</h4>
                <p className='text-sm text-muted-foreground'>
                  Export search results to <strong>Excel</strong> or{' '}
                  <strong>CSV</strong> formats. Exports are limited to 25,000
                  records per request to ensure system performance.
                </p>
              </div>
            </div>

            <h3 className='text-xl font-semibold mt-6'>
              API Details & Caching
            </h3>
            <div className='overflow-x-auto mt-4'>
              <table className='w-full text-sm text-left border'>
                <thead className='bg-muted/50 border-b'>
                  <tr>
                    <th className='p-2 border-r'>Operation</th>
                    <th className='p-2 border-r'>Cache Time</th>
                    <th className='p-2'>Response Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Search</td>
                    <td className='p-2 border-r'>No Cache</td>
                    <td className='p-2'>
                      <pre className='text-xs'>
                        Array of EmailArchiveItem objects
                      </pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Stats & Counts</td>
                    <td className='p-2 border-r'>Dynamic (staleTime: 0)</td>
                    <td className='p-2'>
                      <pre className='text-xs'>ArchiveStats object</pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>View EML</td>
                    <td className='p-2 border-r'>10 Minutes</td>
                    <td className='p-2'>
                      <pre className='text-xs'>Raw EML formatted string</pre>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
      {
        id: 'domains',
        title: 'Domain Management',
        icon: Database,
        permission: 'domain:view',
        content: (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Domain Management</h2>
            <p className='text-muted-foreground'>
              Configure the email domains that the system should archive.
            </p>

            <h3 className='text-xl font-semibold mt-6'>Configuration Fields</h3>
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='p-3 border rounded bg-card'>
                  <div className='font-medium mb-1'>Domain Name</div>
                  <div className='text-xs text-muted-foreground'>
                    The exact domain (e.g., example.com). Must be a valid FQDN
                    format without protocol.
                  </div>
                </div>
                <div className='p-3 border rounded bg-card'>
                  <div className='font-medium mb-1'>Retention Period</div>
                  <div className='text-xs text-muted-foreground'>
                    Number of days (1 to 7300) to keep emails before
                    auto-purging.
                  </div>
                </div>
                <div className='p-3 border rounded bg-card'>
                  <div className='font-medium mb-1'>Storage Quota</div>
                  <div className='text-xs text-muted-foreground'>
                    Allocated storage in GB (minimum 2GB). Alerts sent when near
                    limit.
                  </div>
                </div>
              </div>
            </div>

            <h3 className='text-xl font-semibold mt-6'>Bulk Import</h3>
            <p className='text-muted-foreground'>
              You can import multiple domains at once using the{' '}
              <strong>Bulk Import</strong> tool on the Domain Listing page.
            </p>

            <h3 className='text-xl font-semibold mt-6'>Operations (How-To)</h3>
            <ul className='list-disc pl-6 space-y-2 text-muted-foreground text-sm'>
              <li>
                <strong>Create / Update:</strong> Validations required:
                <ul className='list-disc pl-6 mt-1 space-y-1'>
                  <li>
                    <strong>Domain Name</strong> (String, Required): Must be a
                    valid format without protocol (e.g., example.com).
                  </li>
                  <li>
                    <strong>Data Retention Days</strong> (Number, Required):
                    Minimum 1 day, up to 7300 days (20 years).
                  </li>
                  <li>
                    <strong>Storage Quota</strong> (Number, Required): Minimum 2
                    GB, up to the maximum available organization quota.
                  </li>
                  <li>
                    <strong>Status (Active)</strong> (Boolean, Optional):
                    Default is true.
                  </li>
                </ul>
              </li>
              <li className='mt-3'>
                <strong>Delete:</strong> Click the "Delete" action on a domain
                row and confirm to remove it permanently.
              </li>
            </ul>

            <h3 className='text-xl font-semibold mt-6'>
              API Details & Caching
            </h3>
            <div className='overflow-x-auto mt-4'>
              <table className='w-full text-sm text-left border'>
                <thead className='bg-muted/50 border-b'>
                  <tr>
                    <th className='p-2 border-r'>Operation</th>
                    <th className='p-2 border-r'>Cache Time</th>
                    <th className='p-2'>Response Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Get List</td>
                    <td className='p-2 border-r'>3 Minutes</td>
                    <td className='p-2'>
                      <pre className='text-xs'>
                        Array of Domain objects (id, name, quota, etc.)
                      </pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Get Details</td>
                    <td className='p-2 border-r'>3 Minutes</td>
                    <td className='p-2'>
                      <pre className='text-xs'>DomainInfo object</pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Create</td>
                    <td className='p-2 border-r'>No cache</td>
                    <td className='p-2'>
                      <pre className='text-xs'>Created Domain object</pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Update</td>
                    <td className='p-2 border-r'>No cache</td>
                    <td className='p-2'>
                      <pre className='text-xs'>Updated Domain object</pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Delete</td>
                    <td className='p-2 border-r'>No cache</td>
                    <td className='p-2'>
                      <pre className='text-xs'>None (void)</pre>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
      {
        id: 'users',
        title: 'User Management',
        icon: Users,
        permission: 'user:view',
        content: (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>User Management</h2>
            <p className='text-muted-foreground'>
              Manage system access, roles, and permission scopes for
              administrators, compliance officers, and auditors.
            </p>

            <h3 className='text-xl font-semibold mt-6'>Permission Scopes</h3>
            <div className='grid gap-4 mt-2'>
              <div className='border rounded-md p-4'>
                <h4 className='font-medium flex items-center gap-2'>
                  <Shield className='w-4 h-4 text-orange-500' />
                  Basic Permissions
                </h4>
                <p className='text-sm text-muted-foreground mt-1'>
                  Grants high-level access to modules (e.g.,{' '}
                  <code>user:create</code>, <code>audit:view</code>,{' '}
                  <code>domain:edit</code>).
                </p>
              </div>
              <div className='border rounded-md p-4'>
                <h4 className='font-medium flex items-center gap-2'>
                  <Book className='w-4 h-4 text-blue-500' />
                  Domain Permissions
                </h4>
                <p className='text-sm text-muted-foreground mt-1'>
                  Restricts the user to only view/search emails belonging to
                  specific domains (e.g., only <code>marketing.com</code>).
                </p>
              </div>
              <div className='border rounded-md p-4'>
                <h4 className='font-medium flex items-center gap-2'>
                  <Mail className='w-4 h-4 text-green-500' />
                  Mailbox Permissions
                </h4>
                <p className='text-sm text-muted-foreground mt-1'>
                  Further restricts search to specific email addresses (e.g.,{' '}
                  <code>ceo@company.com</code>).
                </p>
              </div>
            </div>

            <h3 className='text-xl font-semibold mt-6'>Bulk Import</h3>
            <p className='text-muted-foreground'>
              Administrators can bulk import users from CSV or Excel files. All
              field validations (username, email, password strength) apply
              during the import process to ensure data integrity.
            </p>

            <h3 className='text-xl font-semibold mt-6'>Operations (How-To)</h3>
            <ul className='list-disc pl-6 space-y-2 text-muted-foreground text-sm'>
              <li>
                <strong>Create / Update:</strong> Validations required:
                <ul className='list-disc pl-6 mt-1 space-y-1'>
                  <li>
                    <strong>Username</strong> (String, Required): 3 to 50
                    characters. Letters, numbers, dots, hyphens, and underscores
                    only.
                  </li>
                  <li>
                    <strong>Display Name</strong> (String, Required): 3 to 100
                    characters. Letters and spaces only.
                  </li>
                  <li>
                    <strong>Email</strong> (String, Required): Standard email
                    format.
                  </li>
                  <li>
                    <strong>Phone Number</strong> (String, Required): E.164
                    format with country code (e.g., +919845061219).
                  </li>
                  <li>
                    <strong>Password</strong> (String, Required on Create only):
                    Minimum 8 characters. Must contain 1 uppercase, 1 lowercase,
                    1 number, and 1 special character.
                  </li>
                  <li>
                    <strong>Permissions</strong> (Array of Strings, Optional):
                    Basic, Domain, and Mailbox permission limits.
                  </li>
                  <li>
                    <strong>Status (Active)</strong> (Boolean, Optional):
                    Default is true.
                  </li>
                </ul>
              </li>
              <li className='mt-3'>
                <strong>Delete:</strong> Click the "Delete" icon on a user row
                and confirm. This permanently revokes their access.
              </li>
            </ul>

            <h3 className='text-xl font-semibold mt-6'>
              API Details & Caching
            </h3>
            <div className='overflow-x-auto mt-4'>
              <table className='w-full text-sm text-left border'>
                <thead className='bg-muted/50 border-b'>
                  <tr>
                    <th className='p-2 border-r'>Operation</th>
                    <th className='p-2 border-r'>Cache Time</th>
                    <th className='p-2'>Response Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Get List</td>
                    <td className='p-2 border-r'>1 Minute</td>
                    <td className='p-2'>
                      <pre className='text-xs'>Array of User objects</pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Get Details</td>
                    <td className='p-2 border-r'>1 Minute</td>
                    <td className='p-2'>
                      <pre className='text-xs'>User object</pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Create</td>
                    <td className='p-2 border-r'>No cache</td>
                    <td className='p-2'>
                      <pre className='text-xs'>Created User object</pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Update</td>
                    <td className='p-2 border-r'>No cache</td>
                    <td className='p-2'>
                      <pre className='text-xs'>Updated User object</pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Delete</td>
                    <td className='p-2 border-r'>No cache</td>
                    <td className='p-2'>
                      <pre className='text-xs'>None (void)</pre>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
      {
        id: 'import',
        title: 'Bulk Import Tool',
        icon: FileSpreadsheet,
        content: (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Bulk Import Tool</h2>
            <p className='text-muted-foreground'>
              The Bulk Import tool allows you to create multiple Domains or
              Users quickly by uploading a structured file.
            </p>

            <div className='grid gap-6 mt-6'>
              <div className='flex gap-4 p-4 border rounded-lg bg-card'>
                <div className='p-2 h-fit bg-primary/10 text-primary rounded-md'>
                  <Download className='w-5 h-5' />
                </div>
                <div>
                  <h4 className='font-semibold'>1. Download Sample</h4>
                  <p className='text-sm text-muted-foreground'>
                    Start by downloading the sample CSV or Excel file to see the
                    required headers and data format.
                  </p>
                </div>
              </div>

              <div className='flex gap-4 p-4 border rounded-lg bg-card'>
                <div className='p-2 h-fit bg-primary/10 text-primary rounded-md'>
                  <Upload className='w-5 h-5' />
                </div>
                <div>
                  <h4 className='font-semibold'>2. Upload & Process</h4>
                  <p className='text-sm text-muted-foreground'>
                    Upload your filled file. The system will automatically
                    validate every row for data integrity and format
                    consistency.
                  </p>
                </div>
              </div>

              <div className='flex gap-4 p-4 border rounded-lg bg-card'>
                <div className='p-2 h-fit bg-primary/10 text-primary rounded-md'>
                  <Eye className='w-5 h-5' />
                </div>
                <div>
                  <h4 className='font-semibold'>3. Data Preview</h4>
                  <p className='text-sm text-muted-foreground'>
                    Before finalizing, use the "Preview Data" feature to see
                    exactly how the items will be created in the system.
                  </p>
                </div>
              </div>
            </div>

            <div className='mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg'>
              <div className='flex items-center gap-2 font-semibold text-yellow-600 mb-2'>
                <Shield className='w-4 h-4' />
                Validation First
              </div>
              <p className='text-sm text-muted-foreground'>
                The system will block the entire import if any row contains
                invalid data (e.g., duplicated usernames, invalid email formats,
                or weak passwords). This prevents corrupted state within your
                organization dashboard.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'audit',
        title: 'Audit Logs',
        icon: Shield,
        permission: 'audit:view',
        content: (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Audit Logs</h2>
            <p className='text-muted-foreground'>
              A tamper-proof ledger of all system activities for compliance and
              security monitoring.
            </p>

            <div className='flex flex-col gap-4 mt-4'>
              <h3 className='text-lg font-semibold'>Tracked Activities</h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                {[
                  'User Logins',
                  'Email Searches',
                  'Exports',
                  'Bulk Imports',
                  'Settings Changes',
                  'User Creation',
                  'Domain Updates',
                ].map(item => (
                  <div
                    key={item}
                    className='bg-muted/30 p-2 text-center rounded text-sm'
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <h3 className='text-xl font-semibold mt-6'>Exporting Logs</h3>
            <p className='text-muted-foreground'>
              Audit logs can be exported to Excel or CSV for external analysis.
              <br />
              <span className='text-xs italic'>
                Tip: Exports are limited to 50,000 records per batch for
                performance.
              </span>
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        id: 'organization',
        title: 'Organization',
        icon: Settings,
        permission: 'organization:edit',
        content: (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Organization Settings</h2>
            <p className='text-muted-foreground'>
              Update high-level contact information for system notifications.
            </p>
            <ul className='list-disc pl-6 space-y-2 text-muted-foreground'>
              <li>
                <strong>Admin Email:</strong> The primary contact for system
                alerts (e.g., quota warnings).
              </li>
              <li>
                <strong>Admin Phone:</strong> Contact number for urgent support
                verification.
              </li>
            </ul>

            <h3 className='text-xl font-semibold mt-6'>Operations (How-To)</h3>
            <ul className='list-disc pl-6 space-y-2 text-muted-foreground text-sm'>
              <li>
                <strong>Update:</strong> Validations required:
                <ul className='list-disc pl-6 mt-1 space-y-1'>
                  <li>
                    <strong>Admin Email</strong> (String, Required): Standard
                    email format.
                  </li>
                  <li>
                    <strong>Admin Phone</strong> (String, Required): Valid phone
                    number with country code in E.164 format (e.g.,
                    +919845061219).
                  </li>
                </ul>
              </li>
            </ul>

            <h3 className='text-xl font-semibold mt-6'>
              API Details & Caching
            </h3>
            <div className='overflow-x-auto mt-4'>
              <table className='w-full text-sm text-left border'>
                <thead className='bg-muted/50 border-b'>
                  <tr>
                    <th className='p-2 border-r'>Operation</th>
                    <th className='p-2 border-r'>Cache Time</th>
                    <th className='p-2'>Response Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Get Info</td>
                    <td className='p-2 border-r'>5 Minutes</td>
                    <td className='p-2'>
                      <pre className='text-xs'>Organization object</pre>
                    </td>
                  </tr>
                  <tr className='border-b'>
                    <td className='p-2 border-r font-medium'>Update</td>
                    <td className='p-2 border-r'>No cache</td>
                    <td className='p-2'>
                      <pre className='text-xs'>Updated Organization</pre>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
      {
        id: 'security',
        title: 'Security & Profile',
        icon: Shield,
        content: (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Security & Profile</h2>

            <h3 className='text-xl font-semibold mt-6'>
              Two-Factor Authentication (2FA)
            </h3>
            <p className='text-muted-foreground'>
              All users are encouraged to enable 2FA. Supported methods include:
            </p>
            <ul className='list-disc pl-6 space-y-1 text-muted-foreground'>
              <li>Authenticator App (TOTP)</li>
              <li>SMS One-Time Passwords</li>
              <li>Email Verification</li>
            </ul>

            <h3 className='text-xl font-semibold mt-6'>Active Sessions</h3>
            <p className='text-muted-foreground'>
              View and manage your active login sessions from the Security
              settings page. You can remotely revoke access to suspicious
              sessions.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        id: 'faq',
        title: 'FAQs',
        icon: HelpCircle,
        content: (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Frequently Asked Questions</h2>
            <div className='space-y-6 mt-6'>
              <div>
                <h4 className='font-semibold text-base mb-1'>
                  Can I recover a deleted user?
                </h4>
                <p className='text-muted-foreground text-sm'>
                  No, once a user is deleted, their access is permanently
                  removed. However, audit logs associated with that user are
                  retained.
                </p>
              </div>
              <div>
                <h4 className='font-semibold text-base mb-1'>
                  What happens if I exceed my storage quota?
                </h4>
                <p className='text-muted-foreground text-sm'>
                  Archiving will continue, but administrators will receive
                  critical alerts. You must upgrade your storage plan or enable
                  older data purging to resolve the overage.
                </p>
              </div>
              <div>
                <h4 className='font-semibold text-base mb-1'>
                  Is the data encrypted?
                </h4>
                <p className='text-muted-foreground text-sm'>
                  Yes, all data is encrypted both in transit (TLS) and at rest
                  (AES-256) to ensure maximum security.
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
]

const HelpPage = () => {
  const [activeId, setActiveId] = useState('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const user = useAtomValue(userAtom)
  const userPermissions = user?.basic_permissions || []

  // Helper to check permissions
  const hasPermission = (permission?: string) => {
    if (!permission) return true
    return userPermissions.includes(permission)
  }

  // Filter Data based on permissions and search
  const filteredData = useMemo(() => {
    return DocumentationData.map(cat => ({
      ...cat,
      items: cat.items.filter(item => {
        // 1. Check Permission Check
        if (!hasPermission(item.permission)) return false

        // 2. Check Search Query
        if (!searchQuery) return true
        return item.title.toLowerCase().includes(searchQuery.toLowerCase())
      }),
    })).filter(cat => cat.items.length > 0)
  }, [searchQuery, userPermissions])

  // Find active item from the filtered list (or full list to allow direct links if needed, but safer to respect permissions)
  const allPermittedItems = DocumentationData.flatMap(cat =>
    cat.items.filter(item => hasPermission(item.permission))
  )
  const activeItem = allPermittedItems.find(item => item.id === activeId)

  return (
    <div className='flex h-[calc(100vh-4rem)] -m-6 bg-background'>
      {/* Sidebar for Desktop */}
      <aside className='hidden md:flex w-64 flex-col border-r bg-muted/10'>
        {/* <div className='p-4 border-b'>
                    <div className='relative'>
                        <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                        <Input
                            type='search'
                            placeholder='Search docs...'
                            className='pl-8 h-9'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div> */}
        <ScrollArea className='flex-1 py-4'>
          <nav className='px-4 space-y-6'>
            {filteredData.map(category => (
              <div key={category.title}>
                <h4 className='mb-2 text-sm font-semibold tracking-tight text-foreground/70 uppercase'>
                  {category.title}
                </h4>
                <div className='space-y-1'>
                  {category.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveId(item.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                        activeId === item.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {item.icon && <item.icon className='h-4 w-4' />}
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
        {/* <div className='p-4 border-t'>
                    <Button
                        variant='outline'
                        className='w-full gap-2'
                        asChild
                    >
                        <a
                            href='mailto:support@yukthi.net'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            Contact Support
                            <ExternalLink className='h-3.5 w-3.5' />
                        </a>
                    </Button>
                </div> */}
      </aside>

      {/* Main Content */}
      <main className='flex-1 overflow-auto w-full'>
        {/* Mobile Header */}
        <div className='md:hidden flex items-center justify-between p-4 border-b'>
          <span className='font-semibold'>Documentation</span>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className='h-5 w-5' />
          </Button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className='md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm'>
            <div className='flex flex-col h-full p-4'>
              <div className='flex justify-end mb-4'>
                <Button variant='ghost' onClick={() => setIsSidebarOpen(false)}>
                  Close
                </Button>
              </div>
              <div className='mb-4'>
                <Input
                  placeholder='Search...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className='flex-1 overflow-auto space-y-6'>
                {filteredData.map(category => (
                  <div key={category.title}>
                    <h4 className='mb-2 text-sm font-semibold'>
                      {category.title}
                    </h4>
                    <div className='space-y-1'>
                      {category.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveId(item.id)
                            setIsSidebarOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                            activeId === item.id
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground'
                          )}
                        >
                          {item.icon && <item.icon className='h-4 w-4' />}
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Render */}
        <div className='max-w-4xl mx-auto p-8 lg:p-12'>
          {activeItem ? (
            <div className='animate-in fade-in duration-300 slide-in-from-bottom-4'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground mb-6'>
                <span>Docs</span>
                <ChevronRight className='h-3.5 w-3.5' />
                <span className='text-foreground font-medium'>
                  {activeItem.title}
                </span>
              </div>

              {activeItem.content}

              <Separator className='my-10' />

              <div className='flex justify-between items-center text-sm text-muted-foreground'>
                <p>Last updated: Mar 20, 2026</p>
                <div className='flex gap-4'>
                  {/* <button className='hover:text-foreground transition-colors'>Was this helpful?</button> */}
                  {/* <button className='hover:text-foreground transition-colors'>Report an issue</button> */}
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center py-20'>
              <h3 className='text-lg font-semibold'>No content found</h3>
              <p className='text-muted-foreground'>
                Select a topic from the sidebar or try a different search.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default HelpPage
