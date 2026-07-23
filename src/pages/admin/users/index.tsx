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
import { Users, Plus, Edit, Trash, Eye, Key } from 'lucide-react'
import { useAtom } from 'jotai'
import { selectedAdminOrgAtom, adminPageSizeAtom } from '@/store/adminStore'
import { type ColumnDef, type PaginationState } from '@tanstack/react-table'
import {
  useAdminUsers,
  useAdminOrganizations,
  useDeleteUser,
  useUpdateUser,
} from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/DataTable'
import { Link } from 'react-router-dom'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'
import { toast } from 'sonner'
import { ResetPasswordModal } from '@/components/common/ResetPasswordModal'

export default function AdminUsers() {
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

  const { data, isLoading, error } = useAdminUsers({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    organizationId: selectedOrg,
  })

  const deleteMutation = useDeleteUser()
  const updateMutation = useUpdateUser()
  const [deleteModal, setDeleteModal] = useState<{
    id: string
    name: string
  } | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null)

  const handleDelete = () => {
    if (!selectedOrg || !deleteModal) return
    deleteMutation.mutate(
      { orgId: selectedOrg, userId: deleteModal.id },
      {
        onSuccess: () => {
          toast.success(`User "${deleteModal.name}" deleted successfully`)
          setDeleteModal(null)
        },
        onError: (error: any) => {
          toast.error(`Failed to delete user: ${error.message}`)
        },
      }
    )
  }

  const handleResetPassword = (password: string) => {
    if (!resetPasswordUser || !selectedOrg) return

    updateMutation.mutate(
      {
        orgId: selectedOrg,
        data: {
          user_id: resetPasswordUser.user_id,
          user_name: resetPasswordUser.user_name,
          password,
        } as any,
      },
      {
        onSuccess: () => {
          toast.success('Password updated successfully')
          setResetPasswordUser(null)
        },
        onError: (error: any) => {
          toast.error(`Failed to update password: ${error.message}`)
        },
      }
    )
  }

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'user_name',
        header: 'Username',
        cell: ({ row }) => (
          <span className='font-medium'>{row.original.user_name}</span>
        ),
      },
      {
        accessorKey: 'user_email',
        header: 'Email',
      },
      {
        accessorKey: 'display_name',
        header: 'Display Name',
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
          const user = row.original
          return (
            <div className='flex justify-end'>
              <Button variant='ghost' size='icon' asChild>
                <Link to={`/1219/admin/users/${user.user_id}`} state={{ user }}>
                  <Eye className='h-4 w-4' />
                </Link>
              </Button>
              <Button variant='ghost' size='icon' asChild>
                <Link
                  to={`/1219/admin/users/${user.user_id}/edit`}
                  state={{ user }}
                >
                  <Edit className='h-4 w-4' />
                </Link>
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={e => {
                  e.stopPropagation()
                  setResetPasswordUser(user)
                }}
                title='Reset Password'
              >
                <Key className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='text-destructive hover:text-destructive'
                onClick={e => {
                  e.stopPropagation()
                  setDeleteModal({
                    id: user.user_id,
                    name: user.user_name || user.display_name,
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
          <Users className='h-8 w-8 text-primary' />
          <h1 className='text-2xl font-bold'>Users</h1>
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
            <Link to='/1219/admin/users/create'>
              <Plus className='h-4 w-4 mr-2' /> Add User
            </Link>
          </Button>
        </div>
      </div>

      <div className='bg-card rounded-lg border border-border overflow-hidden'>
        {!selectedOrg ? (
          <div className='text-center py-10 text-muted-foreground'>
            Please select an organization to view users.
          </div>
        ) : error ? (
          <div className='text-destructive py-4 text-center'>
            Error loading users.
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

      <ResetPasswordModal
        isOpen={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        onConfirm={handleResetPassword}
        userName={
          resetPasswordUser?.display_name || resetPasswordUser?.user_name || ''
        }
        isLoading={updateMutation.isPending}
      />
    </div>
  )
}
