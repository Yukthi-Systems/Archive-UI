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

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useNavigate } from 'react-router-dom'
import { Loader2, Archive, Eye, EyeOff, Shield, Lock } from 'lucide-react'
import Reaptcha, { ReCAPTCHA } from 'react-google-recaptcha'
import { useAtomValue } from 'jotai'
import Cookies from 'js-cookie'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/hooks/useAuth'
import { isAuthenticatedAtom } from '@/atoms/auth'
import { userAtom } from '@/atoms/user'
import { getDefaultLandingRoute } from '@/utils/accessPermission'
import { loginSchema, type LoginFormData } from './validations'
import { RECAPTCHA_SITE_KEY } from '@/constants/constants'

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const isAuthenticated = useAtomValue(isAuthenticatedAtom)
  const user = useAtomValue(userAtom)
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema) as any,
    defaultValues: {
      user_name: '',
      password: '',
      recaptcha_token: '',
    },
  })

  useEffect(() => {
    const sessionID = Cookies.get('Session-ID')
    if ((isAuthenticated && user) || sessionID) {
      navigate(getDefaultLandingRoute(user), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  // -----------------------------
  // reCAPTCHA logic (same as first)
  // -----------------------------
  const onRecaptchaVerify = (token: string | null) => {
    setRecaptchaToken(token)
    if (errors?.recaptcha_token) {
      setError('recaptcha_token', { type: 'manual', message: '' })
    }
  }

  const onRecaptchaExpire = () => {
    setRecaptchaToken(null)
  }

  const onRecaptchaError = () => {
    setRecaptchaToken(null)
    setError('recaptcha_token', {
      type: 'manual',
      message: 'Security verification failed. Please try again.',
    })
  }

  const onSubmit = (data: LoginFormData) => {
    if (!recaptchaToken) {
      setError('recaptcha_token', {
        type: 'manual',
        message: 'Please complete the security verification',
      })
      return
    }

    login(
      {
        ...data,
        recaptcha_token: recaptchaToken,
      },
      {
        onError: () => {
          recaptchaRef.current?.reset()
        },
      }
    )
  }

  return (
    <div className='flex min-h-screen w-full font-sans lg:grid lg:grid-cols-2 bg-gradient-to-br from-gray-50 to-blue-50'>
      {/* LEFT SIDE */}
      <div className='relative hidden lg:flex flex-col bg-gradient-to-br from-indigo-200 to-indigo-400 text-white overflow-hidden'>
        <div className='absolute inset-0'>
          <img
            src='/login.png'
            alt='Archive Office'
            className='h-full w-full object-cover opacity-20'
          />
          <div className='absolute inset-0 bg-gradient-to-br from-blue-600/50 via-blue-600/60 to-indigo-700/70' />
          <div className='absolute inset-0 bg-gradient-to-t from-blue-700/50 via-transparent to-transparent' />
        </div>

        <div className='relative z-10 flex flex-col h-full p-12'>
          <div className='flex items-center gap-2'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm border border-white/30'>
              <Archive className='h-5 w-5 text-white' />
            </div>
            <span className='text-xl font-semibold text-white'>Archive</span>
          </div>

          <div className='flex-1 flex items-center justify-center'>
            <div className='max-w-md space-y-6'>
              <div className='space-y-2'>
                <h2 className='text-4xl font-bold text-white leading-tight'>
                  Secure Digital
                  <br />
                  Archive Management
                </h2>
                <p className='text-lg text-blue-100'>
                  Enterprise-grade email archiving solution trusted by
                  organizations worldwide.
                </p>
              </div>

              <div className='flex flex-wrap gap-2'>
                <div className='px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30'>
                  <span className='text-sm text-white font-medium'>
                    ⚡ Lightning Fast
                  </span>
                </div>
                <div className='px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30'>
                  <span className='text-sm text-white font-medium'>
                    🔒 Secure Session
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className='flex flex-1 flex-col items-center justify-center bg-slate-50 relative'>
        <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]' />

        <div className='relative w-full max-w-[420px] px-6'>
          <div className='mb-8 flex justify-center lg:hidden'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200'>
              <Archive className='h-6 w-6' />
            </div>
          </div>

          <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 sm:p-10 p-8'>
            <div className='mb-8 space-y-2 text-center'>
              <h2 className='text-2xl font-bold tracking-tight text-slate-900'>
                Welcome back
              </h2>
              <p className='text-sm text-slate-500'>
                Please enter your credentials to access the workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='user_name'
                  className='text-xs font-semibold text-slate-700 uppercase tracking-wide'
                >
                  Username
                </Label>
                <Input
                  id='user_name'
                  placeholder='user name'
                  autoComplete='username'
                  disabled={isPending}
                  className={`${errors.user_name ? 'border-red-500 bg-red-50/50' : ''} !bg-white text-black`}
                  {...register('user_name')}
                />
                {errors.user_name && (
                  <p className='flex items-center gap-1.5 text-[0.8rem] font-medium text-red-600'>
                    <Shield className='h-3 w-3' />
                    {errors.user_name.message}
                  </p>
                )}
              </div>

              <div className='space-y-1.5'>
                <Label
                  htmlFor='password'
                  className='text-xs font-semibold text-slate-700 uppercase tracking-wide'
                >
                  Password
                </Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='current-password'
                    disabled={isPending}
                    placeholder='••••••••'
                    className={`${errors.password ? 'border-red-500 bg-red-50/50' : ''} !bg-white text-black `}
                    {...register('password')}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-600'
                    disabled={isPending}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className='flex items-center gap-1.5 text-[0.8rem] font-medium text-red-600'>
                    <Lock className='h-3 w-3' />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className='pt-2 flex flex-col items-center'>
                <Reaptcha
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  size='normal'
                  onChange={onRecaptchaVerify}
                  onExpired={onRecaptchaExpire}
                  onError={onRecaptchaError}
                  theme='light'
                />
                {errors?.recaptcha_token && (
                  <p className='mt-2 text-[0.8rem] font-medium text-red-600'>
                    {errors.recaptcha_token.message}
                  </p>
                )}
              </div>

              <Button
                disabled={isPending}
                type='submit'
                className='w-full  transition-all active:scale-[0.98]'
              >
                {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isPending ? 'Verifying Credentials...' : 'Sign In'}
              </Button>
            </form>
          </div>

          <div className='mt-8 flex justify-center items-center gap-2 text-slate-400 opacity-80'>
            <span className='text-xs font-medium'>
              © {new Date().getFullYear()} Archive Mail25
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
