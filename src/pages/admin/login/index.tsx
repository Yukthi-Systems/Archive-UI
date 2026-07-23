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
import { Loader2, KeyRound, ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const AdminLogin = () => {
  const [adminKey, setAdminKey] = useState('')
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
    <div className='flex min-h-screen w-full items-center justify-center bg-slate-50 relative'>
      <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]' />

      <div className='relative w-full max-w-[420px] px-6'>
        <div className='mb-8 flex justify-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xl shadow-red-200'>
            <ShieldAlert className='h-8 w-8' />
          </div>
        </div>

        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 sm:p-10 p-8'>
          <Button
            variant='ghost'
            className='absolute top-4 left-4 text-slate-500'
            asChild
          >
            <Link to='/'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Home
            </Link>
          </Button>

          <div className='mb-8 space-y-2 text-center'>
            <h2 className='text-2xl font-bold tracking-tight text-slate-900'>
              Admin Portal
            </h2>
            <p className='text-sm text-slate-500'>
              Restricted access. Enter the administrator key.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-1.5'>
              <Label
                htmlFor='adminKey'
                className='text-xs font-semibold text-slate-700 uppercase tracking-wide'
              >
                KEY
              </Label>
              <div className='relative'>
                <Input
                  id='adminKey'
                  type='password'
                  // autoComplete='off'
                  disabled={isPending}
                  placeholder='Enter admin key'
                  className={`${error ? 'border-red-500 bg-red-50/50' : ''} !bg-white text-black pl-10`}
                  value={adminKey}
                  onChange={e => setAdminKey(e.target.value)}
                />
                <KeyRound className='absolute left-3 top-2.5 h-5 w-5 text-slate-400' />
              </div>
              {error && (
                <p className='mt-2 text-[0.8rem] font-medium text-red-600'>
                  {error}
                </p>
              )}
            </div>

            <Button
              disabled={isPending}
              type='submit'
              className='w-full bg-red-600 hover:bg-red-700 text-white transition-all active:scale-[0.98]'
            >
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isPending ? 'Verifying...' : 'Access Admin Portal'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
