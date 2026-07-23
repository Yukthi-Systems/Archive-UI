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

import { useEffect } from 'react'
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ArrowLeft,
  Frown,
  ServerCrash,
} from 'lucide-react'

export const ErrorBoundary = () => {
  const error = useRouteError()
  const navigate = useNavigate()

  // Friendly defaults
  let errorMessage = 'Something went wrong. Please try again.'
  let errorStatus: string | number = 'Error'
  let errorTitle = 'Unexpected error'

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status
    if (error.status === 404) {
      errorTitle = 'Page not found'
      errorMessage =
        "The page you're looking for doesn't exist or has been moved."
    } else if (error.status >= 500) {
      errorTitle = 'Server error'
      errorMessage = 'Our servers are having trouble. We’re working on it!'
    } else {
      errorTitle = 'Request failed'
      errorMessage =
        error.statusText || 'An error occurred while loading the page.'
    }
  } else if (error instanceof Error) {
    errorTitle = 'Application error'
    errorMessage = error.message
  }

  // Choose icon and theme‑aware color based on error type
  const isNotFound = errorStatus === 404
  const isServerError = typeof errorStatus === 'number' && errorStatus >= 500

  const Icon = isNotFound ? Frown : isServerError ? ServerCrash : AlertTriangle

  // Soft, semantic status colors that work in both light & dark mode
  const statusColor = isNotFound
    ? 'text-amber-600 dark:text-amber-400'
    : isServerError
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-sky-600 dark:text-sky-400'

  const bgColor = isNotFound
    ? 'bg-amber-100 dark:bg-amber-950/30'
    : isServerError
      ? 'bg-rose-100 dark:bg-rose-950/30'
      : 'bg-sky-100 dark:bg-sky-950/30'

  // Focus the main container for screen readers
  useEffect(() => {
    const container = document.getElementById('error-boundary-container')
    if (container) container.focus()
  }, [])

  return (
    <main
      id='error-boundary-container'
      className='min-h-screen flex items-center justify-center p-4 bg-background'
      tabIndex={-1} // programmatically focusable without showing outline
    >
      {/* Gentle animated background – subtle grid with radial fade */}
      <div className='fixed inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/10 bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_90%)] pointer-events-none animate-in fade-in duration-700' />

      {/* Floating, blurred orbs – depth without distraction */}
      <div className='fixed top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-in fade-in slide-in-from-top-10 duration-1000' />
      <div className='fixed bottom-20 right-10 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300' />

      {/* Main error card – elegant glass with subtle border */}
      <div className='relative w-full max-w-md animate-in zoom-in-95 fade-in duration-500'>
        <div className='relative bg-card/80 backdrop-blur-xl backdrop-saturate-150 border border-border/50 rounded-2xl p-8 shadow-2xl shadow-black/5 dark:shadow-black/20'>
          {/* Decorative corner glow – matches status color */}
          <div
            className={`absolute -top-3 -right-3 w-20 h-20 rounded-full blur-2xl ${bgColor} opacity-70`}
          />

          <div className='relative text-center space-y-6'>
            {/* Icon with gentle bounce & glow */}
            <div className='flex justify-center'>
              <div
                className={`relative inline-flex items-center justify-center w-20 h-20 rounded-full border ${bgColor} border-border/50`}
              >
                <Icon
                  className={`w-10 h-10 ${statusColor}`}
                  strokeWidth={1.5}
                />
                <div
                  className={`absolute inset-0 rounded-full animate-pulse ${bgColor} opacity-20`}
                />
              </div>
            </div>

            {/* Error code badge – subtle & informative */}
            <Badge
              variant='outline'
              className='border-border/40 bg-muted/50 px-3 py-1 text-sm font-mono text-muted-foreground'
            >
              {errorStatus}
            </Badge>

            {/* Title & message */}
            <div className='space-y-2'>
              <h1 className='text-3xl font-semibold tracking-tight text-foreground'>
                {errorTitle}
              </h1>
              <p className='text-muted-foreground text-balance leading-relaxed'>
                {errorMessage}
              </p>
            </div>

            {/* Action buttons – primary + secondary */}
            <div className='space-y-3 pt-4'>
              <Button
                onClick={() => window.location.reload()}
                size='lg'
                className='w-full gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]'
              >
                <RefreshCw className='w-4 h-4' />
                Try again
              </Button>

              <div className='grid grid-cols-2 gap-3'>
                <Button
                  onClick={() => navigate(-1)}
                  variant='outline'
                  className='gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98]'
                >
                  <ArrowLeft className='w-4 h-4' />
                  Go back
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant='outline'
                  className='gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98]'
                >
                  <Home className='w-4 h-4' />
                  Home
                </Button>
              </div>
            </div>

            {/* Extra help – subtle link */}
            <div className='text-xs text-muted-foreground/60 pt-4 border-t border-border/30'>
              Still having trouble?{' '}
              <button
                onClick={() => window.location.reload()}
                className='text-primary hover:text-primary/80 underline underline-offset-2 transition-colors'
              >
                Refresh the page
              </button>
            </div>
          </div>
        </div>

        {/* Tiny floating particle – adds whimsy */}
        <div className='absolute -bottom-2 -left-2 w-3 h-3 bg-primary/20 rounded-full blur-sm animate-pulse' />
        <div className='absolute -top-1 -right-1 w-2 h-2 bg-secondary/30 rounded-full blur-sm animate-pulse delay-700' />
      </div>
    </main>
  )
}
