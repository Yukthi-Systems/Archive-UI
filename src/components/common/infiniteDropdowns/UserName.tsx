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

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, User } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useInfiniteUsers } from '@/hooks/useInfiniteUsers'

interface UserSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function UserSelector({
  value,
  onChange,
  placeholder = 'Select user...',
  className,
}: UserSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const { ref, inView } = useInView()

  const {
    users,
    searchQuery,
    setSearchQuery,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = useInfiniteUsers()

  // Filter users locally based on searchQuery for instant results
  const displayUsers = React.useMemo(() => {
    if (!searchQuery) return users
    const query = searchQuery.toLowerCase()
    return users.filter(
      user =>
        user.user_name.toLowerCase().includes(query) ||
        user.display_name?.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  // Trigger infinite scroll when bottom ref comes into view
  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  const handleSelect = (username: string) => {
    onChange(username === value ? '' : username)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'w-full justify-between h-9 bg-background/50 border-input hover:bg-accent hover:text-accent-foreground px-3 font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {value ? (
            <div className='flex items-center gap-2 truncate'>
              <div className='h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                <User className='h-3 w-3 text-primary' />
              </div>
              <span className='truncate'>{value}</span>
            </div>
          ) : (
            <span className='flex items-center gap-2'>
              <User className='h-3.5 w-3.5 opacity-50' />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-[280px] p-0' align='start'>
        <Command shouldFilter={false}>
          {' '}
          {/* Disable client-side filter to use server-side */}
          <CommandInput
            placeholder='Search users...'
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className='max-h-[240px] custom-scrollbar'>
            {isLoading && (
              <div className='py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' /> Loading users...
              </div>
            )}

            {!isLoading && displayUsers.length === 0 && (
              <CommandEmpty>
                {isFetching ? 'Searching...' : 'No users found.'}
              </CommandEmpty>
            )}

            <CommandGroup>
              {displayUsers.map(user => (
                <CommandItem
                  key={user.user_id}
                  value={user.user_name}
                  onSelect={handleSelect}
                  className='cursor-pointer '
                >
                  <div className='flex items-center gap-3 w-full overflow-hidden'>
                    <div className='flex flex-col flex-1 min-w-0'>
                      <span className='text-sm text-muted-foreground  font-medium truncate'>
                        {user.display_name || user.user_name}
                      </span>
                      <span className='text-[10px] text-muted-foreground truncate'>
                        @{user.user_name}
                      </span>
                    </div>

                    {value === user.user_name && (
                      <Check className='h-4 w-4 text-primary shrink-0 ml-auto' />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Infinite Scroll Loader / Trigger */}
            {hasNextPage && (
              <div ref={ref} className='py-3 flex items-center justify-center'>
                {isFetchingNextPage && (
                  <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                )}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
