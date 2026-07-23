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

export interface ErrorResponseData {
  message?: string
  traceback_id?: string
  error?: string
}

export interface ApiError extends Error {
  response?: {
    data?: ErrorResponseData
  }
  message: string
}

export interface ProcessedError {
  message: string
  tracebackId: string | null
}

export const processError = (error: ApiError | unknown): ProcessedError => {
  let message = 'Unknown error occurred'
  let tracebackId: string | null = null

  // Type guard to check if error has response data
  const hasResponseData = (err: unknown): err is ApiError => {
    return (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      typeof (err as any).response === 'object' &&
      (err as any).response !== null
    )
  }

  if (hasResponseData(error)) {
    const errorData = error.response?.data
    message = errorData?.error || error.message || 'Unknown error occurred'
    tracebackId = errorData?.traceback_id || null
  } else if (error instanceof Error) {
    message = error.message || 'Unknown error occurred'
  } else if (typeof error === 'string') {
    message = error
  }

  return { message, tracebackId }
}

/**
 * Format error for display with traceback ID
 */
export const formatErrorMessage = (error: ApiError | unknown): string => {
  const { message, tracebackId } = processError(error)

  let displayMessage = message
  if (tracebackId) {
    displayMessage += ` (Traceback ID: ${tracebackId})`
  }

  return displayMessage
}
