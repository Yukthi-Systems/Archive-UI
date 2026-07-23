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

import { useState, useEffect, useMemo } from 'react'
import { Globe, Plus, Edit, Trash } from 'lucide-react'
import { useAtom } from 'jotai'
import { selectedAdminOrgAtom, adminPageSizeAtom } from '@/store/adminStore'
import { Link, useNavigate } from 'react-router-dom'
import { type ColumnDef, type PaginationState } from '@tanstack/react-table'
import {
  useAdminDomains,
  useAdminOrganizations,
  useDeleteDomain,
} from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/DataTable'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'
import { toast } from 'sonner'

export default function AdminDomains() {
  const [adminPageSize, setAdminPageSize] = useAtom(adminPageSizeAtom)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: adminPageSize,
  })
  const [selectedOrg, setSelectedOrg] = useAtom(selectedAdminOrgAtom)

  useEffect(() => {
    if (pagination.pageSize !== adminPageSize) {
      setAdminPageSize(pagination.pageSize)
    }
  }, [pagination.pageSize, adminPageSize, setAdminPageSize])

  const { data: orgData, isLoading: isLoadingOrgs } = useAdminOrganizations({
    limit: 100, // fetch enough to populate dropdown
    offset: 0,
  })

  useEffect(() => {
    if (orgData?.data && orgData.data.length > 0) {
      if (
        !selectedOrg ||
        !orgData.data.find((o: any) => o.organization_id === selectedOrg)
      ) {
        setSelectedOrg(orgData.data[0].organization_id)
      }
    }
  }, [orgData, selectedOrg, setSelectedOrg])

  const { data, isLoading, error } = useAdminDomains({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    organizationId: selectedOrg,
  })

  const deleteMutation = useDeleteDomain()
  const navigate = useNavigate()
  const [deleteModal, setDeleteModal] = useState<{
    id: string
    name: string
  } | null>(null)

  const handleDelete = () => {
    if (!selectedOrg || !deleteModal) return
    deleteMutation.mutate(
      { orgId: selectedOrg, domainId: deleteModal.id },
      {
        onSuccess: () => {
          toast.success(`Domain "${deleteModal.name}" deleted successfully`)
          setDeleteModal(null)
        },
        onError: (error: any) => {
          const apiError =
            error.response?.data?.message ||
            error.response?.data ||
            error.message ||
            'Unknown error'
          toast.error(`Failed to delete domain: ${apiError}`)
        },
      }
    )
  }

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'domain_name',
        header: 'Domain Name',
        cell: ({ row }) => (
          <Link
            to={`/1219/admin/domains/${row.original.domain_id}`}
            state={{ domain: row.original }}
            className='font-medium text-primary hover:underline'
          >
            {row.original.domain_name}
          </Link>
        ),
      },
      {
        accessorKey: 'data_retention_days',
        header: 'Retention Days',
      },
      {
        accessorKey: 'quota_allocated',
        header: 'Quota Allocated',
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.original.is_active
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: () => <div className='text-right'>Actions</div>,
        cell: ({ row }) => {
          const domain = row.original
          return (
            <div className='flex justify-end'>
              <Button
                variant='ghost'
                size='icon'
                onClick={e => {
                  e.stopPropagation()
                  navigate(`/1219/admin/domains/${domain.domain_id}/edit`, {
                    state: { domain },
                  })
                }}
              >
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='text-destructive hover:text-destructive'
                onClick={e => {
                  e.stopPropagation()
                  setDeleteModal({
                    id: domain.domain_id,
                    name: domain.domain_name,
                  })
                }}
              >
                <Trash className='h-4 w-4' />
              </Button>
            </div>
          )
        },
      },
    ],
    [selectedOrg]
  )

  const totalCount = data?.total || 0
  const totalPages = Math.ceil(totalCount / pagination.pageSize)

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <Globe className='h-8 w-8 text-primary' />
          <h1 className='text-2xl font-bold'>Domains</h1>
        </div>
        <div className='flex items-center gap-4'>
          <select
            className='p-2 text-sm border rounded-md bg-background'
            value={selectedOrg}
            onChange={e => {
              setSelectedOrg(e.target.value)
              setPagination(prev => ({ ...prev, pageIndex: 0 }))
            }}
            disabled={isLoadingOrgs}
          >
            <option value=''>-- Select Organization --</option>
            {orgData?.data?.map((org: any) => (
              <option key={org.organization_id} value={org.organization_id}>
                {org.organization_name}
              </option>
            ))}
          </select>
          <Button asChild disabled={!selectedOrg}>
            <Link to='/1219/admin/domains/create'>
              <Plus className='h-4 w-4 mr-2' /> Add Domain
            </Link>
          </Button>
        </div>
      </div>

      <div className='bg-card rounded-lg border border-border overflow-hidden'>
        {!selectedOrg ? (
          <div className='text-center py-10 text-muted-foreground'>
            Please select an organization to view domains.
          </div>
        ) : error ? (
          <div className='text-destructive py-4 text-center'>
            Error loading domains.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data?.data || []}
            pageCount={totalPages}
            rowCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
          />
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        value={deleteModal?.name || ''}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
