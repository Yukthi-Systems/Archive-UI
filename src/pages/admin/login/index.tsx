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

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Loader2,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const AdminLogin = () => {
  const [adminKey, setAdminKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminKey.trim()) {
      setError('Admin key is required')
      return
    }

    setIsPending(true)
    setError('')

    // Simulate validation and set the key
    setTimeout(() => {
      sessionStorage.setItem('X-ADMIN-KEY', adminKey.trim())
      navigate('/1219/admin/organizations', { replace: true })
      setIsPending(false)
    }, 500)
  }

  return (
    <div className='flex min-h-screen w-full items-center justify-center bg-background relative overflow-hidden'>
      <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]' />
      <div className='absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-destructive/15 blur-3xl' />

      <div className='relative w-full max-w-[420px] px-6 animate-in fade-in-0 zoom-in-95 duration-500'>
        <div className='mb-8 flex justify-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground shadow-xl shadow-destructive/30'>
            <ShieldAlert className='h-8 w-8' />
          </div>
        </div>

        <div className='relative overflow-hidden rounded-2xl border bg-card shadow-xl shadow-black/5 dark:shadow-black/40 sm:p-10 p-8'>
          <Button
            variant='ghost'
            size='sm'
            className='absolute top-4 left-4 text-muted-foreground hover:text-foreground'
            asChild
          >
            <Link to='/'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Home
            </Link>
          </Button>

          <div className='mb-8 space-y-3 text-center pt-8 sm:pt-2'>
            <div className='inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-destructive'>
              <Lock className='h-3 w-3' />
              Restricted Access
            </div>
            <h2 className='text-2xl font-bold tracking-tight text-foreground'>
              Admin Portal
            </h2>
            <p className='text-sm text-muted-foreground'>
              Enter your administrator key to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-1.5'>
              <Label
                htmlFor='adminKey'
                className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'
              >
                Key
              </Label>
              <div className='relative'>
                <KeyRound className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
                <Input
                  id='adminKey'
                  type={showKey ? 'text' : 'password'}
                  autoFocus
                  disabled={isPending}
                  placeholder='Enter admin key'
                  className={cn(
                    'pl-10 pr-10',
                    error &&
                      'border-destructive focus-visible:ring-destructive/30'
                  )}
                  value={adminKey}
                  onChange={e => {
                    setAdminKey(e.target.value)
                    if (error) setError('')
                  }}
                />
                <button
                  type='button'
                  tabIndex={-1}
                  onClick={() => setShowKey(v => !v)}
                  className='absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground'
                >
                  {showKey ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {error && (
                <p className='flex items-center gap-1.5 text-[0.8rem] font-medium text-destructive'>
                  <ShieldAlert className='h-3 w-3' />
                  {error}
                </p>
              )}
            </div>

            <Button
              disabled={isPending}
              type='submit'
              variant='destructive'
              className='w-full'
            >
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isPending ? 'Verifying...' : 'Access Admin Portal'}
            </Button>
          </form>
        </div>

        <div className='mt-8 flex justify-center items-center gap-2 text-muted-foreground opacity-80'>
          <span className='text-xs font-medium'>
            © {new Date().getFullYear()} Archive Mail25 · Admin Console
          </span>
        </div>
      </div>
    </div>
  )
}
