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

import { Button } from '@/components/ui/button'
import { Moon, Sun, Monitor } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/providers/themeProvider'

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className='h-4 w-4' />
      case 'dark':
        return <Moon className='h-4 w-4' />
      case 'system':
        return <Monitor className='h-4 w-4' />
      default:
        return <Sun className='h-4 w-4' />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-all'
        >
          {getThemeIcon()}
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-[140px]'>
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`cursor-pointer ${
            theme === 'light' ? 'bg-accent/30' : ''
          }`}
        >
          <Sun className='mr-2 h-4 w-4' />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`cursor-pointer ${theme === 'dark' ? 'bg-accent/30' : ''}`}
        >
          <Moon className='mr-2 h-4 w-4' />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`cursor-pointer ${
            theme === 'system' ? 'bg-accent/30' : ''
          }`}
        >
          <Monitor className='mr-2 h-4 w-4' />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const SimpleThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className='h-4 w-4' />
      case 'dark':
        return <Moon className='h-4 w-4' />
      case 'system':
        return <Monitor className='h-4 w-4' />
      default:
        return <Sun className='h-4 w-4' />
    }
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={toggleTheme}
      className='h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-all'
      title={`Current theme: ${theme}`}
    >
      {getThemeIcon()}
      <span className='sr-only'>Toggle theme (current: {theme})</span>
    </Button>
  )
}
