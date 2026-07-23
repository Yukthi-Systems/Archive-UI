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

// AdminLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Building, Globe, Users, LogOut, ShieldAlert } from 'lucide-react'
import { MainContent } from './MainContent'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'

export const AdminLayout = () => {
  const location = useLocation()

  const navigation = [
    {
      name: 'Organizations',
      href: '/1219/admin/organizations',
      icon: Building,
    },
    { name: 'Domains', href: '/1219/admin/domains', icon: Globe },
    { name: 'Users', href: '/1219/admin/users', icon: Users },
  ]

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogout = () => {
    sessionStorage.removeItem('X-ADMIN-KEY')
    window.location.href = '/1219/admin/login'
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-background'>
      {/* Header */}
      <header className='z-30 flex-shrink-0 w-full border-b border-border/40 bg-background/95 backdrop-blur-md'>
        <div className='flex h-16 items-center justify-between px-6'>
          <div className='flex items-center gap-4'>
            <div className='md:block hidden'>
              <Logo />
            </div>
            <div className='flex items-center gap-2 text-destructive font-semibold text-sm'>
              <ShieldAlert className='w-4 h-4' />
              Admin Portal
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
            >
              <LogOut className='w-4 h-4' />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className='flex flex-1 overflow-hidden relative z-0'>
        {/* Sidebar */}
        <aside className='w-[260px] flex-shrink-0 border-r border-border bg-card hidden md:flex flex-col'>
          <nav className='flex-1 overflow-y-auto py-4 px-3 space-y-1'>
            {navigation.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
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
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className='w-full overflow-y-auto flex flex-col scrollbar-custom'>
          <MainContent>
            <Outlet />
          </MainContent>
        </div>
      </div>
    </div>
  )
}
