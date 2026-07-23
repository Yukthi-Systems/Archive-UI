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

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardSizes } from '@/hooks/useDashboard'
import { Loader2, ChartColumnDecreasing } from 'lucide-react'

export const DomainCharts = () => {
  const { data = [], isLoading: loading } = useDashboardSizes()

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  // Format bytes for tooltip and axis
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl p-4 text-sm ring-1 ring-black/5 dark:ring-white/10'>
          <p className='font-semibold mb-3 text-foreground'>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className='flex items-center gap-3 mb-2 last:mb-0'>
              <div
                className='w-2.5 h-2.5 rounded-full shadow-sm'
                style={{ backgroundColor: entry.color }}
              />
              <span className='text-muted-foreground font-medium'>
                {entry.name}:
              </span>
              <span className='font-bold text-foreground font-mono'>
                {entry.name === 'Total Size'
                  ? formatBytes(entry.value)
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom X‑axis tick with proper light/dark text color
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor='end'
          transform='rotate(-45)'
          className='fill-gray-900 dark:fill-gray-100 text-[10px] font-medium'
        >
          {payload.value}
        </text>
      </g>
    )
  }

  // Format large numbers
  const formatCount = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
    }
    return value.toString()
  }

  // Custom Y‑axis tick – also respects tickFormatter
  const CustomYAxisTick = (props: any) => {
    const { x, y, payload, type } = props
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dx={-8} // spacing from axis line
          dy={4} // vertical alignment
          textAnchor='end'
          className='fill-gray-900 dark:fill-gray-100 text-[10px] font-medium'
        >
          {type === 'size'
            ? formatBytes(payload.value)
            : formatCount(payload.value)}
        </text>
      </g>
    )
  }

  const sortedByEmails = [...data].sort(
    (a, b) => b.total_emails - a.total_emails
  )
  const sortedBySize = [...data].sort((a, b) => b.total_size - a.total_size)

  return (
    <div
      className={`grid grid-cols-1 ${data.length > 10 ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}
    >
      <Card className='col-span-1 border border-border/40 py-4'>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>
            Total Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-[300px] w-full'>
            {data.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full gap-2'>
                <ChartColumnDecreasing className='w-10 h-10 text-muted-foreground' />
                <p className='text-muted-foreground'>No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={sortedByEmails}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <defs>
                    <linearGradient
                      id='colorTotalEmails'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='0%' stopColor='#3b82f6' stopOpacity={1} />
                      <stop
                        offset='95%'
                        stopColor='#3b82f6'
                        stopOpacity={0.4}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    stroke='var(--muted-foreground)'
                    strokeOpacity={0.2}
                  />
                  <XAxis
                    dataKey='domain'
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomXAxisTick />}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomYAxisTick />}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar
                    dataKey='total_emails'
                    name='Total Emails'
                    fill='url(#colorTotalEmails)'
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className='col-span-1 border border-border/40 py-4'>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Total Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-[300px] w-full'>
            {data.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full gap-2'>
                <ChartColumnDecreasing className='w-10 h-10 text-muted-foreground' />
                <p className='text-muted-foreground'>No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={sortedBySize}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <defs>
                    <linearGradient
                      id='colorTotalSize'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='0%' stopColor='#10b981' stopOpacity={1} />
                      <stop
                        offset='95%'
                        stopColor='#10b981'
                        stopOpacity={0.4}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    stroke='var(--muted-foreground)'
                    strokeOpacity={0.2}
                  />
                  <XAxis
                    dataKey='domain'
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomXAxisTick />}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomYAxisTick type='size' />}
                    tickFormatter={value => formatBytes(value)}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  {/* <Legend iconType='circle' wrapperStyle={{ paddingTop: '20px' }} /> */}
                  <Bar
                    dataKey='total_size'
                    name='Total Size'
                    fill='url(#colorTotalSize)'
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
