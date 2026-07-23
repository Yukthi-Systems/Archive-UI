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

import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

const routeMap: Record<string, string> = {
  dashboard: 'Dashboard',
  listing: 'Email List',
  archive: 'Archive',
  users: 'Users',
  domains: 'Domains',
  permissions: 'Permissions',
  settings: 'Settings',
}

// Helper to check if a string is a valid UUID
function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Helper to check if a string is a domain name
function isDomain(str: string): boolean {
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  return domainRegex.test(str)
}

// 1. Define the shape of a breadcrumb item
export interface BreadcrumbSegment {
  label: string
  to?: string // Optional: if missing, it renders as a non-clickable page
}

interface BreadcrumbsProps {
  items?: BreadcrumbSegment[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation()

  // 2. Logic for Automatic Generation (Fallback)
  const pathnames = location.pathname.split('/').filter(x => x)

  // If custom items are passed, use them. Otherwise, generate from URL.
  const breadcrumbsToRender = items
    ? items
    : pathnames
        .filter(value => value !== 'dashboard') // Filter out dashboard from array if auto-generating
        .map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`

          let label = value
          // If mapped, use map
          if (routeMap[value]) {
            label = routeMap[value]
          }
          // If UUID, keep as is
          else if (isUUID(value)) {
            label = value
          }
          // If domain, keep as is
          else if (isDomain(value)) {
            label = value
          }
          // Otherwise capitalize first letter
          else {
            label = value.charAt(0).toUpperCase() + value.slice(1)
          }

          return {
            label,
            to,
          }
        })

  return (
    <Breadcrumb className={cn('mb-6', className)}>
      <BreadcrumbList>
        {/* Always show Home Icon */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to='/dashboard' className='flex items-center gap-1'>
              <Home className='h-3.5 w-3.5' />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Render the calculated breadcrumbs */}
        {breadcrumbsToRender.map((item, index) => {
          const isLast = index === breadcrumbsToRender.length - 1
          const isItemUUID = isUUID(item.label)
          const isItemDomain = isDomain(item.label)

          return (
            <React.Fragment key={item.to || item.label}>
              <BreadcrumbSeparator>
                <ChevronRight className='h-3.5 w-3.5' />
              </BreadcrumbSeparator>

              <BreadcrumbItem>
                {isLast || !item.to ? (
                  <BreadcrumbPage
                    className={cn(
                      'font-medium text-foreground',
                      !isItemUUID && !isItemDomain && 'capitalize'
                    )}
                  >
                    {item.label}
                  </BreadcrumbPage>
                ) : item.label.toLocaleLowerCase() == 'view' ||
                  item.label.toLocaleLowerCase() == 'edit' ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.to}
                      className={cn(
                        !isItemUUID && !isItemDomain && 'capitalize'
                      )}
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
