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

import { ShieldAlert, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface NoAccessProps {
  message?: string
  fullScreen?: boolean
}

const NoAccess = ({
  message = 'You do not have permission to access this resource.',
  fullScreen = false,
}: NoAccessProps) => {
  const navigate = useNavigate()

  return (
    <div
      className={`${fullScreen ? 'min-h-[85vh]' : 'h-full py-20'} relative flex items-center justify-center p-6 overflow-hidden`}
    >
      {/* Dynamic Background Blobs */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl'>
        <div className='absolute top-0 right-0 w-72 h-72 bg-destructive/10 rounded-full blur-[100px] animate-blob'></div>
        <div className='absolute bottom-0 left-0 w-72 h-72 bg-brand-primary/10 rounded-full blur-[100px] animate-blob animation-delay-2000'></div>
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[120px] animate-blob animation-delay-4000'></div>
      </div>

      <div className='relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500'>
        {/* Glass card */}
        <div className='relative bg-glass/60 border border-glass-border rounded-3xl p-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center overflow-hidden'>
          {/* Inner highlight */}
          <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none'></div>

          {/* Icon */}
          <div className='relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-destructive/10 border border-destructive/20 mb-8 group overflow-hidden'>
            <div className='absolute inset-0 bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
            <ShieldAlert className='w-12 h-12 text-destructive group-hover:scale-110 transition-transform duration-500 ease-out' />
          </div>

          {/* Text */}
          <div className='relative z-10 space-y-3 mb-10'>
            <h2 className='text-2xl font-bold tracking-tight text-foreground'>
              Access Denied
            </h2>
            <p className='text-base text-muted-foreground/90 font-medium leading-relaxed max-w-[280px] mx-auto'>
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className='grid grid-cols-2 gap-4 relative z-10'>
            <Button
              onClick={() => navigate(-1)}
              variant='outline'
              className='h-12 text-base font-semibold bg-surface-hover/20 backdrop-blur-md border-glass-border hover:bg-surface-active/30 transition-all duration-300 rounded-xl'
            >
              <ArrowLeft className='w-5 h-5 mr-2 opacity-70' />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant='default'
              className='h-12 text-base font-semibold'
            >
              <Home className='w-5 h-5 mr-2' />
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoAccess
