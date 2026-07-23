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

import React from 'react'
import { format } from 'date-fns'

interface RetentionDurationProps {
  retentionDays?: number
}

const RetentionDuration: React.FC<RetentionDurationProps> = ({
  retentionDays = 0,
}) => {
  const years = Math.floor(retentionDays / 365)
  const months = Math.floor((retentionDays % 365) / 30)
  const days = (retentionDays % 365) % 30

  const parts: string[] = []

  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)

  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`)

  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)

  return <span>{parts.length > 0 ? parts.join(' ') : '0 days'}</span>
}

export default RetentionDuration

export const formatRetention = ({
  retentionDays = 0,
}: {
  retentionDays: number
}) => {
  const years = Math.floor(retentionDays / 365)
  const months = Math.floor((retentionDays % 365) / 30)
  const days = (retentionDays % 365) % 30

  const parts: string[] = []

  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)

  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`)

  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)

  return parts.length > 0 ? parts.join(' ') : '0 days'
}

export const dateFormated = ({
  date,
  days,
}: {
  date: string
  days: number
}) => {
  return format(
    new Date(Number(date) * 1000 + days * 24 * 60 * 60 * 1000),
    'MMM dd, yyyy'
  )
}

export const timeFormated = ({
  date,
  days,
}: {
  date: string
  days: number
}) => {
  return format(
    new Date(Number(date) * 1000 + days * 24 * 60 * 60 * 1000),
    'hh:mm aaa'
  )
}
