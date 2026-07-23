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

import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Globe,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building,
  UserCircle,
  Shield,
  Logs,
  Mails,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atoms/user'
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { APP_VERSION } from '@/constants/constants'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

interface NavItem {
  name: string
  href: string
  icon: any
  permission?: string
  children?: NavItem[]
}

export const Sidebar = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) => {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  // Popover State
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const user = useAtomValue(userAtom)
  const userPermissions = user?.basic_permissions || []

  const hasPermission = (permission?: string) => {
    if (!permission) return true
    return userPermissions.includes(permission)
  }

  const rawNavigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      name: 'Archive List',
      href: '/archive',
      icon: Mails,
      permission: 'archive:view',
    },
    {
      name: 'Domains',
      href: '/domains',
      icon: Globe,
      permission: 'domain:view',
    },
    // { name: 'Permissions', href: '/permissions', icon: ShieldCheck },
    { name: 'Users', href: '/users', icon: Users, permission: 'user:view' },
    {
      name: 'Audit Logs',
      href: '/audit',
      icon: Logs,
      permission: 'audit:view',
    },
    {
      name: 'Settings',
      icon: Settings,
      href: '/settings',
      children: [
        {
          name: 'Organization',
          href: '/settings/organization',
          icon: Building,
          permission: 'organization:edit',
        },
        { name: 'Profile', href: '/settings/profile', icon: UserCircle },
        { name: 'Security', href: '/settings/security', icon: Shield },
      ],
    },
    {
      name: 'Help & Support',
      href: '/help',
      icon: HelpCircle,
    },
  ]

  const filterNavigation = (items: NavItem[]): NavItem[] => {
    return items.reduce((acc, item) => {
      const children = item.children
        ? filterNavigation(item.children)
        : undefined
      let shouldShow = false

      if (children && children.length > 0) {
        shouldShow = true
      } else if (!item.children) {
        shouldShow = hasPermission(item.permission)
      }

      if (shouldShow) {
        acc.push({ ...item, children })
      }
      return acc
    }, [] as NavItem[])
  }

  const navigation = filterNavigation(rawNavigation)

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const toggleMenu = (name: string) => {
    if (isCollapsed) return
    setExpandedMenus(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  // --- Popover Logic ---
  const handleMouseEnter = (name: string, e: React.MouseEvent) => {
    if (!isCollapsed) return

    // Clear any pending close timer
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    const rect = e.currentTarget.getBoundingClientRect()
    // Position slightly to the right of the sidebar
    setPopoverPosition({ top: rect.top, left: rect.right + 8 })
    setHoveredItem(name)
  }

  const handleMouseLeave = () => {
    if (!isCollapsed) return

    // Add a delay before closing to allow moving mouse to the popover
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null)
    }, 300) // 300ms grace period
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden'
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full border-r border-border bg-card transition-all duration-300 ease-in-out md:sticky md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-[80px]' : 'w-[260px]'
        )}
      >
        <div className='flex h-full flex-col relative'>
          {/* Collapse Toggle Button (Desktop) */}
          <button
            onClick={onToggleCollapse}
            className='hidden md:flex absolute -right-3 top-6 z-50 h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-md hover:bg-accent transition-colors'
          >
            {isCollapsed ? (
              <ChevronRight className='h-3.5 w-3.5 text-muted-foreground' />
            ) : (
              <ChevronLeft className='h-3.5 w-3.5 text-muted-foreground' />
            )}
          </button>

          {/* Navigation */}
          <nav className='flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-none'>
            {navigation.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = expandedMenus.includes(item.name)

              // 1. COLLAPSED MODE: Items are just icons (or triggers for popovers)
              if (isCollapsed) {
                return (
                  <div
                    key={item.name}
                    className='relative flex justify-center py-1'
                  >
                    {hasChildren ? (
                      // Parent Item in Collapsed Mode (Triggers Popover)
                      <div
                        onMouseEnter={e => handleMouseEnter(item.name, e)}
                        onMouseLeave={handleMouseLeave}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors cursor-pointer',
                          active || hoveredItem === item.name
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className='h-5 w-5' />
                      </div>
                    ) : (
                      // Normal Link in Collapsed Mode
                      <Link
                        to={item.href}
                        title={item.name}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className='h-5 w-5' />
                      </Link>
                    )}
                  </div>
                )
              }

              // 2. EXPANDED MODE: Full Sidebar
              return (
                <div key={item.name}>
                  {hasChildren ? (
                    // Parent Item (Collapsible)
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1',
                        active && !isExpanded
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <div className='flex items-center gap-3'>
                        <Icon
                          className={cn(
                            'h-4.5 w-4.5',
                            active ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-muted-foreground transition-transform duration-200',
                          isExpanded ? 'rotate-180' : ''
                        )}
                      />
                    </button>
                  ) : (
                    // Normal Link
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className='h-4.5 w-4.5' />
                      <span>{item.name}</span>
                    </Link>
                  )}

                  {/* Submenu Animation */}
                  {hasChildren && (
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-300 ease-in-out',
                        isExpanded
                          ? 'max-h-48 opacity-100'
                          : 'max-h-0 opacity-0'
                      )}
                    >
                      <div className='ml-4 pl-4 border-l border-border/50 space-y-1 py-1'>
                        {item.children?.map(child => (
                          <Link
                            key={child.name}
                            to={child.href}
                            className={cn(
                              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                              isActive(child.href)
                                ? 'text-primary font-medium bg-primary/5'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                          >
                            <span>{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          {!isCollapsed && (
            <div className='p-4 border-t border-border'>
              <p className='text-xs text-center text-muted-foreground'>
                v {APP_VERSION}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* 3. POPOVER PORTAL (Only renders when hoveredItem is set in collapsed mode) */}
      {hoveredItem &&
        isCollapsed &&
        createPortal(
          <div
            className='fixed z-[100] w-48 rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in zoom-in-95 duration-200'
            style={{
              top: popoverPosition.top,
              left: popoverPosition.left,
            }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
            }}
            onMouseLeave={handleMouseLeave}
          >
            {/* Header of Popover */}
            <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-1'>
              {hoveredItem}
            </div>

            {/* Links in Popover */}
            <div className='space-y-0.5'>
              {navigation
                .find(n => n.name === hoveredItem)
                ?.children?.map(child => (
                  <Link
                    key={child.name}
                    to={child.href}
                    onClick={() => setHoveredItem(null)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                      isActive(child.href)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {child.icon && (
                      <child.icon className='h-4 w-4 opacity-70' />
                    )}
                    <span>{child.name}</span>
                  </Link>
                ))}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
