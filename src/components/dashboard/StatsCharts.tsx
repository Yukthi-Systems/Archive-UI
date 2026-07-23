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

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardStats } from '@/hooks/useDashboard'
import { ChartLine, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export const StatsCharts = () => {
  const { data: rawStats = [], isLoading: loading } = useDashboardStats()

  const { chartData: data, domains } = useMemo(() => {
    if (!rawStats.length) return { chartData: [], domains: [] }

    // Process data
    const uniqueDomains = Array.from(new Set(rawStats.map(s => s.domain)))

    // Group by archive_day
    const groupedData: Record<string, any> = {}

    rawStats.forEach(stat => {
      // Convert archive_day (days since epoch) to date string
      // archive_day is number of days since 1970-01-01
      const date = new Date(stat.archive_day * 24 * 60 * 60 * 1000)
      const dateStr = format(date, 'MMM dd')
      const key = stat.archive_day.toString()

      if (!groupedData[key]) {
        groupedData[key] = {
          date: dateStr,
          timestamp: stat.archive_day, // for sorting
        }
      }

      // Add domain specific data
      groupedData[key][`${stat.domain}_emails`] = stat.total_emails
      groupedData[key][`${stat.domain}_size`] = stat.total_size
    })

    // Convert to array and sort by timestamp
    const chartData = Object.values(groupedData).sort(
      (a: any, b: any) => a.timestamp - b.timestamp
    )

    return { chartData, domains: uniqueDomains }
  }, [rawStats])

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  // Dynamic color generation based on index for high contrast when up to 50 domains exist
  const getDomainColor = (index: number) => {
    const baseColors = [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
    ]
    if (index < baseColors.length) return baseColors[index]

    // Golden ratio hue angle spacing for maximum distinctiveness
    const hue = (index * 137.5) % 360
    return `hsl(${hue}, 75%, 50%)`
  }

  // Format bytes for tooltip and axis
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const CustomTooltip = ({ active, payload, label, type = 'email' }: any) => {
    if (active && payload && payload.length) {
      // 1. Filter out entries with 0 value to minimize clutter
      const activeEntries = payload.filter((entry: any) => entry.value > 0)

      // 2. Sort entries in descending order of value
      const sortedEntries = [...activeEntries].sort(
        (a: any, b: any) => b.value - a.value
      )

      // 3. Limit visible list to Top 8 and group the rest
      const maxVisible = 8
      const displayEntries = sortedEntries.slice(0, maxVisible)
      const otherEntries = sortedEntries.slice(maxVisible)

      const othersCount = otherEntries.length
      const othersSum = otherEntries.reduce(
        (sum: number, entry: any) => sum + (entry.value || 0),
        0
      )

      return (
        <div className='bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl p-4 text-sm ring-1 ring-black/5 dark:ring-white/10 max-w-[280px] sm:max-w-[320px] pointer-events-none'>
          <p className='font-semibold mb-2 text-foreground border-b border-border/30 pb-1.5'>
            {label}
          </p>
          <div className='flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent'>
            {displayEntries.map((entry: any, index: number) => (
              <div
                key={index}
                className='flex items-center justify-between gap-3 text-xs sm:text-sm'
              >
                <div className='flex items-center gap-2 min-w-0'>
                  <div
                    className='w-2 h-2 rounded-full shadow-sm shrink-0'
                    style={{ backgroundColor: entry.color }}
                  />
                  <span
                    className='text-muted-foreground font-medium truncate'
                    title={entry.name}
                  >
                    {entry.name}
                  </span>
                </div>
                <span className='font-bold text-foreground font-mono shrink-0 ml-auto pl-2'>
                  {type === 'size'
                    ? formatBytes(entry.value)
                    : entry.value.toLocaleString()}
                </span>
              </div>
            ))}

            {othersCount > 0 && (
              <div className='flex items-center justify-between gap-3 border-t border-border/40 pt-2 mt-1 text-xs sm:text-sm font-medium'>
                <div className='flex items-center gap-2 min-w-0'>
                  <div className='w-2 h-2 rounded-full shadow-sm shrink-0 bg-muted-foreground/40' />
                  <span className='text-muted-foreground truncate'>
                    {othersCount} other{' '}
                    {othersCount === 1 ? 'domain' : 'domains'}
                  </span>
                </div>
                <span className='font-bold text-muted-foreground font-mono shrink-0 ml-auto pl-2'>
                  {type === 'size'
                    ? formatBytes(othersSum)
                    : othersSum.toLocaleString()}
                </span>
              </div>
            )}

            {sortedEntries.length > 1 && (
              <div className='flex items-center justify-between gap-3 border-t border-border/80 pt-2 mt-1 text-xs sm:text-sm font-semibold'>
                <span className='text-foreground pl-4'>Total</span>
                <span className='font-bold text-foreground font-mono'>
                  {type === 'size'
                    ? formatBytes(
                        sortedEntries.reduce(
                          (sum: number, entry: any) => sum + (entry.value || 0),
                          0
                        )
                      )
                    : sortedEntries
                        .reduce(
                          (sum: number, entry: any) => sum + (entry.value || 0),
                          0
                        )
                        .toLocaleString()}
                </span>
              </div>
            )}
          </div>
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
          dy={16} // spacing below axis line
          textAnchor='middle'
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

  return (
    <div
      className={`grid grid-cols-1 ${domains.length > 10 ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6 mt-6`}
    >
      {/* Daily Email Volume */}
      <Card className='col-span-1 border border-border/40 py-4'>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>
            Email Volume (Last 7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-[300px] w-full'>
            {data.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full gap-2'>
                <ChartLine className='w-10 h-10 text-muted-foreground' />
                <p className='text-muted-foreground'>No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 30, bottom: 15 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    stroke='var(--muted-foreground)'
                    strokeOpacity={0.2}
                  />
                  <XAxis
                    dataKey='date'
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomXAxisTick />}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomYAxisTick />}
                    width={55}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={false}
                    wrapperStyle={{ zIndex: 10 }}
                  />
                  <Legend
                    iconType='circle'
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '10px',
                      maxHeight: '60px',
                      overflowY: 'auto',
                    }}
                  />
                  {domains.map((domain, index) => (
                    <Line
                      key={domain}
                      type='monotone'
                      dataKey={`${domain}_emails`}
                      name={domain}
                      stroke={getDomainColor(index)}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Size Volume */}
      <Card className='col-span-1 border border-border/40 py-4'>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>
            Storage Volume (Last 7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-[300px] w-full'>
            {data.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full gap-2'>
                <ChartLine className='w-10 h-10 text-muted-foreground' />
                <p className='text-muted-foreground'>No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 45, bottom: 15 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    stroke='var(--muted-foreground)'
                    strokeOpacity={0.2}
                  />
                  <XAxis
                    dataKey='date'
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomXAxisTick />}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomYAxisTick type='size' />}
                    tickFormatter={value => formatBytes(value)}
                    width={75}
                  />
                  <Tooltip
                    content={<CustomTooltip type='size' />}
                    cursor={false}
                    wrapperStyle={{ zIndex: 10 }}
                  />
                  <Legend
                    iconType='circle'
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '10px',
                      maxHeight: '60px',
                      overflowY: 'auto',
                    }}
                  />
                  {domains.map((domain, index) => (
                    <Line
                      key={domain}
                      type='monotone'
                      dataKey={`${domain}_size`}
                      name={domain}
                      stroke={getDomainColor(index)}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
