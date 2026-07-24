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

import { useState, useMemo } from 'react'
import { Building, Plus, Edit, Trash, MoreHorizontal } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { useAdminOrganizations, useDeleteOrganization } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/DataTable'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function AdminOrganizations() {
  // The backend has no pagination for this endpoint — it always returns the
  // full list, so there's no pagination UI here either; the table just
  // scrolls if the list is long.
  const { data, isLoading } = useAdminOrganizations({})

  const deleteMutation = useDeleteOrganization()
  const navigate = useNavigate()
  const [deleteModal, setDeleteModal] = useState<{
    id: string
    name: string
  } | null>(null)

  const handleDelete = () => {
    if (!deleteModal) return
    deleteMutation.mutate(deleteModal.id, {
      onSuccess: () => {
        toast.success(`Organization "${deleteModal.name}" deleted successfully`)
        setDeleteModal(null)
      },
      onError: (error: any) => {
        toast.error(`Failed to delete organization: ${error.message}`)
      },
    })
  }

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'organization_name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            to={`/1219/admin/organizations/${row.original.organization_id}`}
            state={{ org: row.original }}
            className='font-medium text-primary hover:underline'
          >
            {row.original.organization_name}
          </Link>
        ),
      },
      {
        accessorKey: 'admin_email',
        header: 'Email',
      },
      {
        accessorKey: 'admin_phone',
        header: 'Phone',
      },
      {
        accessorKey: 'quota_utilized',
        header: 'Quota',
        cell: ({ row }) =>
          `${row.original.quota_utilized} / ${row.original.quota_allocated}`,
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
          const org = row.original
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
                      navigate(
                        `/1219/admin/organizations/${org.organization_id}/edit`,
                        { state: { org } }
                      )
                    }
                  >
                    <Edit className='h-4 w-4' /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() =>
                      setDeleteModal({
                        id: org.organization_id,
                        name: org.organization_name,
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
          <Building className='h-8 w-8 text-primary' />
          <h1 className='text-2xl font-bold'>Organizations</h1>
        </div>
        <Button asChild>
          <Link to='/1219/admin/organizations/create'>
            <Plus className='h-4 w-4 mr-2' /> Add Organization
          </Link>
        </Button>
      </div>

      <div className='bg-card rounded-lg border border-border overflow-hidden'>
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          height='calc(100vh - 150px)'
        />
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
