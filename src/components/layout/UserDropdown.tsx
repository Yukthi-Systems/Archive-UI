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

// UserDropdown.tsx
import { Link } from 'react-router-dom'
import { LogOut, UserCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User } from 'lucide-react'
import { useLogout } from '@/hooks/useAuth'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atoms/user'

export const UserDropdown = () => {
  const logout = useLogout()
  const userData = useAtomValue(userAtom)
  const handleLogout = () => {
    logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50'
        >
          <User className='w-4 h-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <UserProfileSection user={userData} />

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            to='/profile'
            className='w-full cursor-pointer flex items-center'
          >
            <UserCircle className='mr-2 h-4 w-4' />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to='/help' className='w-full cursor-pointer flex items-center'>
            <HelpCircle className='mr-2 h-4 w-4' />
            <span>Help & Support</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <LogoutButton onLogout={handleLogout} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface UserProfileProps {
  user: any // Replace with proper User type
}

const UserProfileSection = ({ user }: UserProfileProps) => (
  <DropdownMenuLabel className='font-normal'>
    <div className='flex flex-col space-y-1'>
      <p className='text-sm font-medium leading-none'>
        {user?.display_name || user?.user_name || 'User'}
      </p>
      <p className='text-xs leading-none text-muted-foreground'>
        @{user?.user_name || 'user'}
      </p>
    </div>
  </DropdownMenuLabel>
)

interface LogoutButtonProps {
  onLogout: () => void
}

const LogoutButton = ({ onLogout }: LogoutButtonProps) => (
  <DropdownMenuItem
    onClick={onLogout}
    className='text-destructive focus:text-destructive cursor-pointer flex items-center'
  >
    <LogOut className='mr-2 h-4 w-4' />
    <span>Log out</span>
  </DropdownMenuItem>
)
