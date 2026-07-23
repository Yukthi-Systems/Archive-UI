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

// Header.tsx
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Logo } from './Logo'
import { OrganizationInfo } from '../common/OrganizationInfo'
import { NotificationButton } from './NotificationButton'
import { UserDropdown } from './UserDropdown'

interface HeaderProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onToggleCollapse: () => void
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  return (
    <header className='z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80'>
      <div className='flex h-16 items-center justify-between px-6'>
        {/* Left Section */}
        <LeftSection onToggleSidebar={onToggleSidebar} />

        {/* Right Section */}
        <RightSection />
      </div>
    </header>
  )
}

const LeftSection = ({ onToggleSidebar }: { onToggleSidebar: () => void }) => (
  <div className='flex items-center gap-4'>
    <MobileMenuButton onToggleSidebar={onToggleSidebar} />
    <div className='md:block hidden'>
      <Logo />
    </div>
    {/* <div className='hidden md:flex ml-4 pl-4 border-l border-border/40'> */}
    <OrganizationInfo />
    {/* </div> */}
  </div>
)

const MobileMenuButton = ({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void
}) => (
  <Button
    variant='ghost'
    size='icon'
    className='md:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50'
    onClick={onToggleSidebar}
  >
    <Menu className='w-5 h-5' />
  </Button>
)

const RightSection = () => (
  <div className='flex items-center gap-3'>
    <NotificationButton />
    <div className='h-4 w-[1px] bg-border/40 mx-1'></div>
    <ThemeToggle />
    <UserDropdown />
  </div>
)
