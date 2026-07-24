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
import { Globe, Plus, Edit, Trash, MoreHorizontal } from 'lucide-react'
import { useAtom } from 'jotai'
import { selectedAdminOrgAtom } from '@/store/adminStore'
import { Link, useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  useAdminDomains,
  useAdminOrganizations,
  useDeleteDomain,
} from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/DataTable'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function AdminDomains() {
  const [selectedOrg, setSelectedOrg] = useAtom(selectedAdminOrgAtom)

  // Backend has no pagination for orgs either, so this always returns the
  // full list to populate the dropdown (see getAdminOrganizations)
  const { data: orgData, isLoading: isLoadingOrgs } = useAdminOrganizations({})

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

  // Backend has no pagination for this endpoint either, so there's no
  // pagination UI here — the table just scrolls if the list is long.
  const { data, isLoading, error } = useAdminDomains({
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
        header: 'Quota',
        cell: ({ row }) =>
          `${row.original.quota_utilized} / ${row.original.quota_allocated} GB`,
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
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) =>
          row.original.created_at ? (
            <span title={format(new Date(row.original.created_at), 'PPPp')}>
              {format(new Date(row.original.created_at), 'MMM dd, yyyy')}
            </span>
          ) : (
            '—'
          ),
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated',
        cell: ({ row }) =>
          row.original.updated_at ? (
            <span title={format(new Date(row.original.updated_at), 'PPPp')}>
              {format(new Date(row.original.updated_at), 'MMM dd, yyyy')}
            </span>
          ) : (
            '—'
          ),
      },
      {
        id: 'actions',
        header: () => <div className='text-right'>Actions</div>,
        cell: ({ row }) => {
          const domain = row.original
          return (
            <div className='flex justify-end'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(`/1219/admin/domains/${domain.domain_id}/edit`, {
                        state: { domain },
                      })
                    }
                  >
                    <Edit className='h-4 w-4' /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() =>
                      setDeleteModal({
                        id: domain.domain_id,
                        name: domain.domain_name,
                      })
                    }
                  >
                    <Trash className='h-4 w-4' /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [navigate]
  )

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <Globe className='h-8 w-8 text-primary' />
          <h1 className='text-2xl font-bold'>Domains</h1>
        </div>
        <div className='flex items-center gap-4'>
          <Select
            value={selectedOrg || undefined}
            onValueChange={setSelectedOrg}
            disabled={isLoadingOrgs}
          >
            <SelectTrigger className='w-[240px] bg-background'>
              <SelectValue placeholder='Select organization...' />
            </SelectTrigger>
            <SelectContent>
              {orgData?.data?.map((org: any) => (
                <SelectItem
                  key={org.organization_id}
                  value={org.organization_id}
                >
                  {org.organization_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            isLoading={isLoading}
            height='calc(100vh - 150px)'
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
