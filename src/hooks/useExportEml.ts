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

import { useMutation, useQuery } from '@tanstack/react-query'
import { exportEml } from '@/api/exportEml'
import { toast } from 'sonner'

/**
 * Hook for exporting emails via the EML export service
 * Supports both manual mutation and automatic query if a jobId is provided.
 */
export const useExportEml = (jobId?: string) => {
  // 1. Automatic query if jobId is provided
  const query = useQuery({
    queryKey: ['exportEml', jobId],
    queryFn: () => exportEml(jobId!),
    enabled: !!jobId,
    retry: 1,
  })

  // 2. Manual mutation for starting a new export
  const mutation = useMutation({
    mutationFn: (q: string) => exportEml(q),
    onSuccess: data => {
      if (data?.message) {
        toast.success(data.message)
      } else {
        toast.success('Export request processed successfully')
      }
    },
    onError: (error: Error) => {
      toast.error(`Export failed: ${error.message}`)
    },
  })

  // Return query results info if we have a jobId, otherwise return mutation info
  // This approach is simplified; normally you'd handle the different shapes carefully.
  // Both provide 'data' and 'isPending' (mutation uses 'isPending', query uses 'isLoading')
  // For consistency in our component, we'll map them.
  if (jobId) {
    return {
      data: query.data,
      isPending: query.isLoading,
      error: query.error,
      mutate: (_q: string) => {
        console.warn('Mutation disabled in Job View mode')
      },
    }
  }

  return {
    data: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
    mutate: mutation.mutate,
  }
}

export default useExportEml
