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

import { useMemo, useState, useCallback, useEffect } from 'react'
import { type ColumnDef, type PaginationState } from '@tanstack/react-table'
import { useSearchParams, Link } from 'react-router-dom'
import {
  UserPlus,
  XCircle,
  Phone,
  Mail,
  Loader2,
  Smartphone,
  FileUp,
  FileDown,
  MoreHorizontal,
  Eye,
  Edit,
  Key,
  ShieldCheck,
  CheckCircle,
  Trash2,
  Search,
  X,
  ChevronDown,
  RotateCcw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/common/DataTable'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  useUsers,
  useUpdateUserStatus,
  useDeleteUser,
  useUserCount,
  useUpdateUser,
} from '@/hooks/useUsers'
import { type User as UserType } from '@/types/user.types'
import { useExport, type ExportFormat } from '@/hooks/useExport'
import { toast } from 'sonner'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'
import { ResetPasswordModal } from '@/components/common/ResetPasswordModal'
import { TwoFASetupModal } from '@/components/auth/TwoFASetupModal'
import { Manage2FAModal } from '@/components/auth/Manage2FAModal'
import { userAtom } from '@/atoms/user'
import { useAtomValue } from 'jotai'

import { useAccessPermission } from '@/utils/accessPermission'
import NoAccess from '@/components/common/NoAccess'
import StatusViewer from '@/components/common/StatusViewer'
import DateFormatView from '@/components/common/DateFormatView'
import useBulkImport from '@/hooks/useImport'
import BulkImportModal from '@/components/common/BulkImportModal'
import { IMPORT_FIELD_MAPPINGS } from '@/constants/import'
import { getFilteredPermissionsConfig } from '@/pages/users/from/PermissionConfig'
import { userService } from '@/api/user'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import { useQueryClient } from '@tanstack/react-query'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import StatusChangeConfirmationModal from '@/components/common/StatusChangeConfirmationModal'
import { useDebounce } from '@/hooks/useDebounce'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import BulkDeleteModal from '@/components/common/BulkDeleteModal'

// Define the type for UserItem
type UserItem = UserType

interface DeleteUserState {
  userId: string
  userName: string
}

const Users = () => {
  const canView = useAccessPermission('user:view')
  const canCreate = useAccessPermission('user:create')
  const canEdit = useAccessPermission('user:edit')
  const canDelete = useAccessPermission('user:delete')
  const canCreateTOTP = useAccessPermission('2fa:totp:create')
  const queryClient = useQueryClient()

  const [searchParams, setSearchParams] = useSearchParams()

  // Derive pagination from search params
  const pageIndex = Number(searchParams.get('page')) || 0
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const searchQueryParam = searchParams.get('search') || ''

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  )

  const [searchInput, setSearchInput] = useState(searchQueryParam)

  // Update search input when URL changes (e.g. on back button)
  useEffect(() => {
    setSearchInput(searchQueryParam)
  }, [searchQueryParam])

  const debouncedSearch = useDebounce(searchInput, 400)
  const activeSearch = debouncedSearch.length >= 3 ? debouncedSearch : undefined

  // Sync debounced search with URL
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams)
    if (debouncedSearch && debouncedSearch.length >= 3) {
      if (newParams.get('search') !== debouncedSearch) {
        newParams.set('search', debouncedSearch)
        newParams.delete('page') // Reset to first page on new search
        setSearchParams(newParams)
      }
    } else if (newParams.has('search')) {
      newParams.delete('search')
      newParams.delete('page')
      setSearchParams(newParams)
    }
  }, [debouncedSearch, setSearchParams, searchParams])

  const setPagination = useCallback(
    (updater: any) => {
      const nextState =
        typeof updater === 'function' ? updater(pagination) : updater
      const newParams = new URLSearchParams(searchParams)

      if (nextState.pageIndex > 0) {
        newParams.set('page', nextState.pageIndex.toString())
      } else {
        newParams.delete('page')
      }

      if (nextState.pageSize !== 10) {
        newParams.set('pageSize', nextState.pageSize.toString())
      } else {
        newParams.delete('pageSize')
      }

      setSearchParams(newParams)
    },
    [pagination, searchParams, setSearchParams]
  )

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
  }, [])
  const [deleteModal, setDeleteModal] = useState<DeleteUserState | null>(null)
  const [setup2FAUser, setSetup2FAUser] = useState<UserType | null>(null)
  const [manage2FAUser, setManage2FAUser] = useState<UserType | null>(null)
  const [statusModal, setStatusModal] = useState<{
    userId: string
    userName: string
    currentStatus: boolean
  } | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<UserType | null>(
    null
  )
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const currentUser = useAtomValue(userAtom)
  const hasScopeRestriction =
    (currentUser?.domain_permissions?.length ?? 0) > 0 ||
    (currentUser?.mailbox_permissions?.length ?? 0) > 0

  // Calculate offset based on pagination
  const offset = pagination.pageIndex * pagination.pageSize

  // Fetch users with React Query
  const {
    data: usersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useUsers(
    {
      limit: pagination.pageSize,
      offset,
      search: activeSearch,
    },
    { enabled: canView }
  )

  // Fetch total user count
  const { data: totalCount, refetch: refetchCount } = useUserCount(
    { search: activeSearch },
    { enabled: canView }
  )

  const totalPages = Math.ceil(
    ((totalCount as number) || 0) / pagination.pageSize
  )

  const filteredUsers = useMemo(() => {
    if (!usersData) return []
    return usersData.filter(u => u.user_id !== currentUser?.user_id)
  }, [usersData, currentUser?.user_id])

  // Bulk Selection Hook
  const {
    selectedCount,
    selectedItemsWithLabels,
    isAllCurrentPageSelected,
    isSomeCurrentPageSelected,
    toggleItem,
    toggleAllCurrentPage,
    clearSelection,
    isItemSelected,
    removeFromSelection,
  } = useBulkSelection(filteredUsers, 'user_id', 'user_name')

  // Mutation hooks
  const updateUserStatus = useUpdateUserStatus()
  const deleteUser = useDeleteUser()
  const updateUser = useUpdateUser()

  const userPermissionsMap = useMemo(() => {
    const allowedConfig = getFilteredPermissionsConfig(
      currentUser?.basic_permissions || []
    )
    return allowedConfig.flatMap((cat: any) =>
      cat.permissions.map((p: any) => p.value)
    )
  }, [currentUser?.basic_permissions])

  const customFieldMapping = useMemo(() => {
    return IMPORT_FIELD_MAPPINGS.user.map(field => {
      if (field.key === 'basic_permissions') {
        return {
          ...field,
          validate: (values: any) => {
            if (!Array.isArray(values)) return values
            const invalidPerms = values.filter(
              (v: string) => !userPermissionsMap.includes(v)
            )
            if (invalidPerms.length > 0) {
              throw new Error(
                `Invalid basic permissions: ${invalidPerms.join(', ')}`
              )
            }
            return values
          },
        }
      }
      return field
    })
  }, [userPermissionsMap])

  const {
    isImportModalOpen,
    importConfig,
    handleImport,
    handleImportModalClose,
    handleImportComplete,
    isImportAvailable,
  } = useBulkImport({
    entityType: 'user',
    customFieldMapping,
    createFunction: async (userData: any) => {
      // Use service directly to avoid invalidating queries on every single item
      return await userService.createUser({
        userData: userData,
        notify: false,
      })
    },
  })

  const { handleExport } = useExport<UserType>()

  const handleExportUsers = (format: ExportFormat) => {
    handleExport(
      async () => {
        try {
          const totalCountVal = await userService.getUserCount()
          const limit = 100
          const totalPagesCount = Math.ceil(totalCountVal / limit)

          if (totalPagesCount === 0) return []

          const promises = Array.from({ length: totalPagesCount }, (_, i) =>
            userService.getUsers({
              limit,
              offset: i * limit,
            })
          )

          const results = await Promise.all(promises)
          return results.flat()
        } catch (error) {
          console.error('Failed to fetch all users for export', error)
          throw error
        }
      },
      {
        filename: 'users-export',
        fieldMappings: [
          {
            header: 'Status',
            key: 'is_active',
            transform: val => (val ? 'Active' : 'Inactive'),
          },
          { header: 'Display Name', key: 'display_name' },
          { header: 'Username', key: 'user_name' },
          { header: 'Email', key: 'user_email' },
          { header: 'Phone', key: 'primary_phone' },
          {
            header: '2FA Enabled',
            key: 'is_totp_2fa_active',
            transform: (_, item) =>
              item.is_totp_2fa_active ||
              item.is_sms_2fa_active ||
              item.is_email_2fa_active
                ? 'Yes'
                : 'No',
          },
          {
            header: 'Created At',
            key: 'created_at',
            transform: val => new Date(val).toLocaleString(),
          },
          {
            header: 'Updated At',
            key: 'updated_at',
            transform: val => new Date(val).toLocaleString(),
          },
        ],
      },
      {
        context: 'User',
        type: AUDIT_LOG_TYPES.USER_EXPORT,
        failType: AUDIT_LOG_TYPES.USER_EXPORT_FAILED,
        description: `Export of user list to ${format === 'excel' ? 'Excel' : 'CSV'}.`,
      },
      format
    )
  }

  // Check permission after all hooks are called
  if (!canView) {
    return <NoAccess />
  }

  const onBulkImportComplete = (results: any) => {
    handleImportComplete(results)
    // Invalidate queries once after all imports are done
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['userCount'] })
  }

  // Handle user status toggle - Open Modal
  const handleToggleStatus = (
    userId: string,
    userName: string,
    currentStatus: boolean
  ) => {
    setStatusModal({
      userId,
      userName,
      currentStatus,
    })
  }

  // Confirm Status Change
  const confirmUserStatusChange = () => {
    if (!statusModal) return

    const payload = {
      user_id: statusModal.userId,
      is_active: !statusModal.currentStatus,
    }

    updateUserStatus.mutate(
      { userData: payload, username: statusModal.userName },
      {
        onSuccess: () => {
          setStatusModal(null)
          refetch()
          refetchCount()
          toast.success(
            `User "${statusModal.userName}" ${
              !statusModal.currentStatus ? 'activated' : 'deactivated'
            } successfully`
          )
        },
        onError: error => {
          toast.error(`Failed to update user status: ${error.message}`)
        },
      }
    )
  }

  // Handle user deletion
  const handleDeleteUser = () => {
    if (!deleteModal) return

    deleteUser.mutate(
      { userId: deleteModal.userId, userName: deleteModal.userName },
      {
        onSuccess: () => {
          toast.success(`User "${deleteModal.userName}" deleted successfully`)
          setDeleteModal(null)
          refetch()
          refetchCount()
        },
        onError: error => {
          toast.error(`Failed to delete user: ${error.message}`)
        },
      }
    )
  }

  // Handle password reset
  const handleResetPassword = (password: string) => {
    if (!resetPasswordUser) return

    updateUser.mutate(
      {
        userId: resetPasswordUser.user_id,
        userData: {
          user_id: resetPasswordUser.user_id,
          password,
          user_name: resetPasswordUser.user_name,
        } as any,
        username: resetPasswordUser.user_name,
      },
      {
        onSuccess: () => {
          toast.success('Password updated successfully')
          setResetPasswordUser(null)
        },
        onError: error => {
          toast.error(`Failed to update password: ${error.message}`)
        },
      }
    )
  }

  const handleBulkDelete = async (userId: string | number) => {
    return new Promise<void>((resolve, reject) => {
      const user = filteredUsers.find(u => u.user_id === userId)
      if (!user) {
        reject(new Error('User not found'))
        return
      }
      deleteUser.mutate(
        { userId: user.user_id, userName: user.user_name },
        {
          onSuccess: () => resolve(),
          onError: error => reject(error),
        }
      )
    })
  }

  const onBulkDeleteComplete = (results: any) => {
    refetch()
    refetchCount()
    if (results.successful.length > 0) {
      removeFromSelection(results.successful)
    }
    if (results.failed.length === 0) {
      toast.success(
        `Successfully deleted ${results.successful.length} user${results.successful.length !== 1 ? 's' : ''}`
      )
    } else if (results.successful.length === 0) {
      toast.error('Failed to delete all selected users')
    } else {
      toast.warning(
        `Deleted ${results.successful.length} users. ${results.failed.length} failed.`
      )
    }
  }

  // Define table columns
  const columns: ColumnDef<UserItem>[] = [
    {
      id: 'select',
      header: () => (
        <div className='flex items-center justify-center px-1'>
          <Checkbox
            checked={
              isAllCurrentPageSelected
                ? true
                : isSomeCurrentPageSelected
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={toggleAllCurrentPage}
            aria-label='Select all'
          />
        </div>
      ),
      cell: ({ row }) => (
        <div
          className='flex items-center justify-center px-1'
          onClick={e => e.stopPropagation()}
        >
          <Checkbox
            checked={isItemSelected(row.original.user_id)}
            onCheckedChange={() => toggleItem(row.original.user_id)}
            aria-label='Select row'
          />
        </div>
      ),
      size: 40,
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.is_active
        return <StatusViewer isActive={isActive} />
      },
    },
    {
      accessorKey: 'display_name',
      header: 'User',
      cell: ({ row }) => (
        <div className='flex items-center gap-3'>
          <Link to={`/users/${row.original.user_id}`}>
            <div className='flex flex-col'>
              <span className='font-medium text-sm'>
                {row.original.display_name || row.original.user_name}
              </span>
              <span className='text-xs text-muted-foreground'>
                @{row.original.user_name}
              </span>
            </div>
          </Link>
        </div>
      ),
    },
    {
      accessorKey: 'user_email',
      header: 'Contact',
      cell: ({ row }) => (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-1.5'>
            <span className='text-xs truncate max-w-[200px]'>
              {row.original?.user_email || ''}
            </span>
          </div>
          {row.original.primary_phone && (
            <div className='flex items-center gap-1.5'>
              <span className='text-xs'>{row.original.primary_phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: '2fa_status',
      header: '2FA',
      cell: ({ row }) => {
        const isTotp = row.original.is_totp_2fa_active
        const isSms = row.original.is_sms_2fa_active
        const isEmail = row.original.is_email_2fa_active
        const has2FA = isTotp || isSms || isEmail

        if (!has2FA) {
          return (
            <Badge
              variant='outline'
              className='text-xs bg-gray-500/10 text-gray-600 border-gray-500/20'
            >
              Disabled
            </Badge>
          )
        }

        return (
          <div className='flex items-center gap-1.5'>
            {isTotp && (
              <div
                className='p-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100'
                title='Authenticator App'
              >
                <Smartphone className='w-3.5 h-3.5' />
              </div>
            )}
            {isSms && (
              <div
                className='p-1.5 rounded-md bg-green-50 text-green-600 border border-green-100'
                title='SMS Verification'
              >
                <Phone className='w-3.5 h-3.5' />
              </div>
            )}
            {isEmail && (
              <div
                className='p-1.5 rounded-md bg-purple-50 text-purple-600 border border-purple-100'
                title='Email Verification'
              >
                <Mail className='w-3.5 h-3.5' />
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'updated_at',
      header: 'Updated',
      cell: ({ row }) => <DateFormatView date={row.original.updated_at} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => <DateFormatView date={row.original.created_at} />,
    },
    {
      id: 'actions',
      header: () => <div className='text-right'> </div>,
      cell: ({ row }) => {
        const user = row.original
        if (!canEdit && !canDelete && !canCreateTOTP && !canView) return null

        const isTotp = user.is_totp_2fa_active
        const isSms = user.is_sms_2fa_active
        const isEmail = user.is_email_2fa_active
        const has2FA = isTotp || isSms || isEmail

        // Block manage if target has any basic/domain/mailbox permission outside current user's subset
        const hasHigherPrivileges =
          (user.basic_permissions || []).some(
            p => !(currentUser?.basic_permissions || []).includes(p)
          ) ||
          ((currentUser?.domain_permissions || []).length > 0 &&
            (user.domain_permissions || []).some(
              d => !(currentUser?.domain_permissions || []).includes(d)
            )) ||
          ((currentUser?.mailbox_permissions || []).length > 0 &&
            (user.mailbox_permissions || []).some(
              m => !(currentUser?.mailbox_permissions || []).includes(m)
            ))

        return (
          <div className='flex justify-end'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 hover:bg-muted'
                >
                  <MoreHorizontal className='w-4 h-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                {canView && (
                  <DropdownMenuItem asChild>
                    <Link to={`/users/${user.user_id}`}>
                      <Eye className='mr-2 h-4 w-4' />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                )}

                {hasHigherPrivileges ? (
                  <DropdownMenuItem disabled>
                    <ShieldCheck className='h-4 w-4' />
                    Higher Privileges Restricted
                  </DropdownMenuItem>
                ) : (
                  <>
                    {canEdit && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to={`/users/${user.user_id}/edit`}>
                            <Edit className='mr-2 h-4 w-4' />
                            Edit User
                          </Link>
                        </DropdownMenuItem>
                        {canCreateTOTP && (
                          <DropdownMenuItem
                            onClick={() =>
                              has2FA
                                ? setManage2FAUser(user)
                                : setSetup2FAUser(user)
                            }
                          >
                            <ShieldCheck className='mr-2 h-4 w-4' />
                            {has2FA ? 'Manage 2FA' : 'Setup 2FA'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setResetPasswordUser(user)}
                        >
                          <Key className='mr-2 h-4 w-4' />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const userName = user.display_name || user.user_name
                            handleToggleStatus(
                              user.user_id,
                              userName,
                              user.is_active
                            )
                          }}
                        >
                          {user.is_active ? (
                            <>
                              <XCircle className='mr-2 h-4 w-4 text-red-500' />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className='mr-2 h-4 w-4 text-green-500' />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </>
                    )}
                    {canDelete && !hasScopeRestriction && (
                      <DropdownMenuItem
                        className='text-red-600 focus:text-red-600'
                        onClick={() =>
                          setDeleteModal({
                            userId: user.user_id,
                            userName: user.user_name,
                          })
                        }
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete User
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  // Loading state
  if (isLoading && pagination.pageIndex === 0) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto text-primary' />
          <p className='mt-2 text-sm text-muted-foreground'>Loading users...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    toast.error(`Failed to load users: ${error?.message}`)
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <XCircle className='h-8 w-8 mx-auto text-red-600' />
          <p className='mt-2 text-sm text-red-600'>Failed to load users</p>
          <Button
            variant='outline'
            className='mt-4'
            onClick={() => {
              refetch()
              refetchCount()
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDeleteUser}
        value={deleteModal?.userName || ''}
        isLoading={deleteUser.isPending}
      />

      {/* Status Change Confirmation Modal */}
      {statusModal && (
        <StatusChangeConfirmationModal
          isOpen={!!statusModal}
          onClose={() => setStatusModal(null)}
          onConfirm={confirmUserStatusChange}
          entityName='User'
          entityLabel={statusModal.userName}
          status={statusModal.currentStatus ? 'inactive' : 'active'}
          isLoading={updateUserStatus.isPending}
        />
      )}

      {/* 2FA Setup Modal */}
      {setup2FAUser && (
        <TwoFASetupModal
          open={!!setup2FAUser}
          onOpenChange={open => !open && setSetup2FAUser(null)}
          user={setup2FAUser}
          addFunction={() => refetch()}
        />
      )}

      {/* Manage 2FA Modal */}
      {manage2FAUser && (
        <Manage2FAModal
          open={!!manage2FAUser}
          onOpenChange={open => !open && setManage2FAUser(null)}
          user={manage2FAUser}
          onSetupClick={() => setSetup2FAUser(manage2FAUser)}
          onComplete={() => refetch()}
        />
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <ResetPasswordModal
          isOpen={!!resetPasswordUser}
          onClose={() => setResetPasswordUser(null)}
          onConfirm={handleResetPassword}
          userName={
            resetPasswordUser.display_name || resetPasswordUser.user_name
          }
          isLoading={updateUser.isPending}
        />
      )}

      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <Breadcrumbs className='mb-0' />
        </div>
        <div className='flex items-center gap-2'>
          {/* Search Input */}
          <div className='relative'>
            <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
            <Input
              placeholder='Search users...'
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              className='pl-8 pr-8 w-52'
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            )}
          </div>

          {/* Clear option near search bar */}
          {(searchInput || selectedCount > 0) && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                handleSearchChange('')
                clearSelection()
              }}
              className='text-muted-foreground hover:text-foreground h-9 px-2'
            >
              <RotateCcw className='w-4 h-4 mr-1' /> Clear
            </Button>
          )}

          {/* Bulk Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='gap-2'>
                Bulk Actions <ChevronDown className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem
                onClick={handleImport}
                disabled={!isImportAvailable || !canCreate}
              >
                <FileDown className='w-4 h-4 mr-2' /> Import
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileUp className='w-4 h-4 mr-2' /> Export
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => handleExportUsers('excel')}
                    >
                      Export to Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportUsers('csv')}>
                      Export to CSV
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              {selectedCount > 0 && !hasScopeRestriction && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowBulkDeleteModal(true)}
                    disabled={!canDelete}
                    className='text-destructive focus:text-destructive focus:bg-destructive/10'
                  >
                    <Trash2 className='w-4 h-4 mr-2' /> Delete Selected (
                    {selectedCount})
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add New User Button */}
          {canCreate && (
            <Button
              asChild
              className='gap-2 bg-gradient-primary border-none shadow-lg hover:shadow-xl transition-shadow'
            >
              <Link to='/users/create'>
                <UserPlus className='w-4 h-4' /> Add New User
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className='border border-border/40 shadow-lg p-0 m-0'>
        <DataTable
          columns={columns}
          data={filteredUsers || []} // The flat array from your API
          pageCount={totalPages}
          rowCount={(totalCount as number) || 0}
          pagination={pagination as PaginationState}
          onPaginationChange={setPagination as any}
          isLoading={isLoading}
        />
      </Card>

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={handleImportModalClose}
        importConfig={importConfig}
        title='Bulk Import Users'
        description='Upload a CSV or Excel file to create multiple users at once.'
        onComplete={onBulkImportComplete}
      />

      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        items={selectedItemsWithLabels}
        onDelete={handleBulkDelete}
        onClose={() => setShowBulkDeleteModal(false)}
        onComplete={onBulkDeleteComplete}
        itemName='user'
        title='Bulk Delete Users'
        description='Are you sure you want to delete the selected users?'
      />
    </div>
  )
}

export default Users
