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

import { Card } from '@/components/ui/card'
import { Loader2, Mail, Shield, CheckCircle2, Clock } from 'lucide-react'

// Helper for formatting bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

interface ArchiveStatsProps {
  emailCount: number | undefined
  isLoadingCount: boolean
  orgData: any // Replace with proper type if available
}

export function ArchiveStats({
  emailCount,
  isLoadingCount,
  orgData,
}: ArchiveStatsProps) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
      <Card className='p-4 bg-gradient-to-br from-card to-background border-border/50 transition-all hover:shadow-md cursor-default'>
        <div className=' flex gap-4'>
          <div className='w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0'>
            <Mail className='w-4 h-4 md:w-5 md:h-5 text-primary' />
          </div>
          <div className='flex-1'>
            <p className='text-[8px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-widest'>
              Total Emails
            </p>
            <p className='text-base md:text-lg font-bold'>
              {isLoadingCount ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                (emailCount ?? 0).toLocaleString()
              )}
            </p>
          </div>
        </div>
      </Card>
      <Card className='p-4 bg-gradient-to-br from-card to-background border-border/50  transition-all hover:shadow-md cursor-default'>
        <div className=' flex gap-4'>
          <div className='w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0'>
            <Shield className='w-4 h-4 md:w-5 md:h-5 text-orange-600' />
          </div>
          <div>
            <p className='text-[8px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-widest'>
              Total Quota
            </p>
            <p className='text-base md:text-lg font-bold'>
              {orgData
                ? formatBytes(orgData.quota_allocated * 1073741824)
                : '-'}
            </p>
          </div>
        </div>
      </Card>
      <Card className='p-4 bg-gradient-to-br from-card to-background border-border/50 transition-all hover:shadow-md cursor-default'>
        <div className=' flex gap-4'>
          <div className='w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0'>
            <CheckCircle2 className='w-4 h-4 md:w-5 md:h-5 text-blue-600' />
          </div>
          <div>
            <p className='text-[8px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-widest'>
              Used Quota
            </p>
            <p className='text-base md:text-lg font-bold'>
              {orgData ? formatBytes(orgData.quota_utilized * 1073741824) : '-'}
            </p>
          </div>
        </div>
      </Card>
      <Card className='p-4 bg-gradient-to-br from-card to-background border-border/50  transition-all hover:shadow-md cursor-default'>
        <div className=' flex gap-4'>
          <div className='w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0'>
            <Clock className='w-4 h-4 md:w-5 md:h-5 text-purple-600' />
          </div>
          <div>
            <p className='text-[8px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-widest'>
              Retention
            </p>
            <p className='text-base md:text-lg font-bold'>7 Years</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
