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

import { useState, useMemo, useCallback } from 'react'
import { type ColumnDef, type CellContext } from '@tanstack/react-table'
import {
  Plus,
  Loader2,
  Edit2,
  FileUp,
  FileDown,
  XCircle,
  MoreHorizontal,
  CheckCircle2,
  Search,
  X,
  Trash2,
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
  useDomains,
  useUpdateDomain,
  useDeleteDomain,
  DOMAINS_QUERY_KEY,
  DOMAINS_COUNT_QUERY_KEY,
} from '@/hooks/useDomains'
import { type Domain as DomainType } from '@/types/domain.types'
import { useLogout } from '@/hooks/useAuth'
import { AUDIT_LOG_TYPES } from '@/types/auditlogs.types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import StatusViewer from '@/components/common/StatusViewer'
import RetentionDuration from '@/components/common/RetentionDuration'
import DateFormatView from '@/components/common/DateFormatView'
import { useAccessPermission } from '@/utils/accessPermission'
import NoAccess from '@/components/common/NoAccess'
import useBulkImport from '@/hooks/useImport'
import { useExport, type ExportFormat } from '@/hooks/useExport'
import BulkImportModal from '@/components/common/BulkImportModal'
import { domainService } from '@/api/domain'
import { useQueryClient } from '@tanstack/react-query'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
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
import StatusChangeConfirmationModal from '@/components/common/StatusChangeConfirmationModal'
import { userAtom } from '@/atoms/user'
import { useAtomValue } from 'jotai'
import NoDataFound from '@/components/common/NoDataFound'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import BulkDeleteModal from '@/components/common/BulkDeleteModal'
import useBulkEdit from '@/hooks/useBulkEdit'
import BulkEditModal from '@/components/common/BulkEditModal'

type DomainItem = DomainType

const DomainsPage = () => {
  const hasPermission = useAccessPermission('domain:view') || false
  const currentUser = useAtomValue(userAtom)
  const hasDomainRestriction =
    (currentUser?.domain_permissions?.length ?? 0) > 0
  const hasScopeRestriction =
    hasDomainRestriction || (currentUser?.mailbox_permissions?.length ?? 0) > 0
  const canCreate = useAccessPermission('domain:create') || false
  const canEdit = useAccessPermission('domain:edit') || false
  const canDelete = useAccessPermission('domain:delete') || false
  const queryClient = useQueryClient()
  const { mutate: updateDomain } = useUpdateDomain()
  const { mutate: deleteDomain, isPending: isDeleting } = useDeleteDomain()
  const logout = useLogout()

  const [searchInput, setSearchInput] = useState('')
  const [statusModal, setStatusModal] = useState<DomainType | null>(null)
  const [deleteModal, setDeleteModal] = useState<DomainType | null>(null)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showReLoginModal, setShowReLoginModal] = useState(false)

  const handleToggleActive = (domain: DomainType) => {
    setStatusModal(domain)
  }

  const confirmDomainStatusChange = () => {
    if (!statusModal) return

    updateDomain(
      {
        domainId: statusModal.domain_id,
        domainData: {
          domain_name: statusModal.domain_name,
          data_retention_days: statusModal.data_retention_days,
          quota_allocated: statusModal.quota_allocated,
          is_active: !statusModal.is_active,
        },
        domainName: statusModal.domain_name,
      },
      {
        onSuccess: () => {
          setStatusModal(null)
          toast.success(
            `Domain "${statusModal.domain_name}" ${
              !statusModal.is_active ? 'activated' : 'deactivated'
            } successfully`
          )
        },
      }
    )
  }

  const confirmDomainDelete = () => {
    if (!deleteModal) return

    deleteDomain(
      { domainId: deleteModal.domain_id, domainName: deleteModal.domain_name },
      {
        onSuccess: () => {
          setDeleteModal(null)
          setShowReLoginModal(true)
        },
        onError: error => {
          toast.error(`Failed to delete domain: ${error.message}`)
        },
      }
    )
  }

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  // Fetch all domains with React Query (no pagination)
  const { data, isLoading, isError, error, refetch } = useDomains(
    {},
    { enabled: hasPermission || false }
  )

  const {
    isImportModalOpen,
    importConfig,
    handleImport,
    handleImportModalClose,
    handleImportComplete,
    isImportAvailable,
  } = useBulkImport({
    entityType: 'domain',
    createFunction: async (domainData: any) => {
      return await domainService.createDomain({
        domainData,
        notify: false,
      })
    },
  })

  const {
    isEditModalOpen,
    editConfig,
    handleEdit,
    handleEditModalClose,
    handleEditComplete,
    isEditAvailable,
  } = useBulkEdit({
    entityType: 'domain',
    updateFunction: async (domainData: any) => {
      const domainName = domainData.domain_name?.toLowerCase()
      const domains = data?.data || []
      const existingDomain = domains.find(
        d => d.domain_name.toLowerCase() === domainName
      )

      if (!existingDomain) {
        throw new Error(
          `Domain "${domainData.domain_name}" not found in current records. Bulk edit only updates existing domains.`
        )
      }

      return await domainService.updateDomain(
        existingDomain.domain_id,
        {
          domain_name: domainData.domain_name,
          data_retention_days: domainData.data_retention_days,
          quota_allocated: domainData.quota_allocated,
          is_active: domainData.is_active,
        },
        domainData.domain_name
      )
    },
  })

  const { isExporting, handleExport } = useExport<DomainType>()

  const handleExportDomains = (format: ExportFormat) => {
    handleExport(
      async () => {
        try {
          const response = await domainService.getDomains({})
          return response.data
        } catch (error) {
          console.error('Failed to fetch all domains for export', error)
          throw error
        }
      },
      {
        filename: 'domains-export',
        fieldMappings: [
          {
            header: 'Status',
            key: 'is_active',
            transform: (val: boolean) => (val ? 'Active' : 'Inactive'),
          },
          { header: 'Domain Name', key: 'domain_name' },
          { header: 'Allocated Quota (GB)', key: 'quota_allocated' },
          { header: 'Utilized Quota (GB)', key: 'quota_utilized' },
          { header: 'Retention Days', key: 'data_retention_days' },
          {
            header: 'Created At',
            key: 'created_at',
            transform: (val: string) => new Date(val).toLocaleString(),
          },
          {
            header: 'Updated At',
            key: 'updated_at',
            transform: (val: string) => new Date(val).toLocaleString(),
          },
        ],
      },
      {
        context: 'Domain',
        type: AUDIT_LOG_TYPES.DOMAIN_EXPORT,
        failType: AUDIT_LOG_TYPES.DOMAIN_EXPORT_FAILED,
        description: `Export of domain list to ${format === 'excel' ? 'Excel' : 'CSV'}.`,
      },
      format
    )
  }

  const filteredDomains = useMemo(() => {
    const domains = data?.data || []

    if (!searchInput.trim()) {
      return domains
    }

    const search = searchInput.toLowerCase()
    return domains.filter(domain =>
      domain.domain_name.toLowerCase().includes(search)
    )
  }, [data, searchInput])

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
  } = useBulkSelection(filteredDomains, 'domain_id', 'domain_name')

  const handleBulkDelete = async (domainId: string | number) => {
    return new Promise<void>((resolve, reject) => {
      const domain = filteredDomains.find(d => d.domain_id === domainId)
      if (!domain) {
        reject(new Error('Domain not found'))
        return
      }
      deleteDomain(
        { domainId: domain.domain_id, domainName: domain.domain_name },
        {
          onSuccess: () => resolve(),
          onError: error => reject(error),
        }
      )
    })
  }

  const onBulkDeleteComplete = (results: any) => {
    refetch()
    queryClient.invalidateQueries({ queryKey: [DOMAINS_COUNT_QUERY_KEY] })
    if (results.successful.length > 0) {
      removeFromSelection(results.successful)
      setShowReLoginModal(true)
    }
    if (results.failed.length === 0) {
      toast.success(
        `Successfully deleted ${results.successful.length} domain${results.successful.length !== 1 ? 's' : ''}`
      )
    } else if (results.successful.length === 0) {
      toast.error('Failed to delete all selected domains')
    } else {
      toast.warning(
        `Deleted ${results.successful.length} domains. ${results.failed.length} failed.`
      )
    }
  }

  const onBulkImportComplete = (results: any) => {
    handleImportComplete(results)
    queryClient.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] })
    queryClient.invalidateQueries({ queryKey: [DOMAINS_COUNT_QUERY_KEY] })
  }

  const onBulkEditComplete = (results: any) => {
    handleEditComplete(results)
    queryClient.invalidateQueries({ queryKey: [DOMAINS_QUERY_KEY] })
    queryClient.invalidateQueries({ queryKey: [DOMAINS_COUNT_QUERY_KEY] })
  }

  if (!hasPermission) {
    return <NoAccess />
  }

  const columns: ColumnDef<DomainItem>[] = [
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
            checked={isItemSelected(row.original.domain_id)}
            onCheckedChange={() => toggleItem(row.original.domain_id)}
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
      accessorKey: 'domain_name',
      header: 'Domain',
      cell: ({ row }) => (
        <Link
          to={`/domains/${row.original.domain_id}`}
          className='w-full cursor-pointer flex items-center'
        >
          <div className='flex items-center gap-2'>
            <div className='flex flex-col'>
              <span className='font-medium text-sm'>
                {row.original.domain_name}
              </span>
            </div>
          </div>
        </Link>
      ),
    },
    {
      accessorKey: 'quota',
      header: 'Storage',
      cell: ({ row }) => {
        const utilizedPercentage =
          (row.original.quota_utilized / row.original.quota_allocated) * 100

        return (
          <div className='flex flex-col gap-1'>
            <div className='flex items-center justify-between text-xs'>
              <span className='text-muted-foreground'>
                {row.original.quota_utilized}GB / {row.original.quota_allocated}
                GB
              </span>
              <span
                className={cn(
                  'font-medium',
                  utilizedPercentage > 90
                    ? 'text-red-600'
                    : utilizedPercentage > 70
                      ? 'text-yellow-600'
                      : 'text-green-600'
                )}
              >
                {utilizedPercentage.toFixed(1)}%
              </span>
            </div>
            <div className='w-full h-1.5 bg-muted rounded-full overflow-hidden'>
              <div
                className={cn(
                  'h-full rounded-full',
                  utilizedPercentage > 90
                    ? 'bg-red-500'
                    : utilizedPercentage > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                )}
                style={{ width: `${Math.min(utilizedPercentage, 100)}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'data_retention_days',
      header: 'Retention',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <span className='text-sm'>
            <RetentionDuration
              retentionDays={Number(row.original.data_retention_days || 0)}
            />
          </span>
        </div>
      ),
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
      cell: ({ row }: CellContext<DomainItem, unknown>) => (
        <div className='flex justify-end'>
          {canEdit && (
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

              <DropdownMenuContent align='end' className='w-48'>
                {canEdit && (
                  <DropdownMenuItem asChild>
                    <Link to={`/domains/${row.original.domain_id}/edit`}>
                      <Edit2 className='h-4 w-4 mr-2' />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem
                    variant={row.original.is_active ? 'destructive' : 'default'}
                    className='cursor-pointer flex items-center'
                    onClick={() => handleToggleActive(row.original)}
                  >
                    {row.original.is_active ? (
                      <>
                        <XCircle className='h-4 w-4 mr-2' />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className='h-4 w-4 mr-2 text-green-600' />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {canDelete && !hasScopeRestriction && (
                  <DropdownMenuItem
                    className='cursor-pointer flex items-center text-destructive focus:text-destructive'
                    onClick={() => setDeleteModal(row.original)}
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto text-primary' />
          <p className='mt-2 text-sm text-muted-foreground'>
            Loading domains...
          </p>
        </div>
      </div>
    )
  }

  if (isError) {
    toast.error(`Failed to load domains: ${error?.message}`)
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <XCircle className='h-8 w-8 mx-auto text-red-600' />
          <p className='mt-2 text-sm text-red-600'>Failed to load domains</p>
          <Button variant='outline' className='mt-4' onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const totalDomainsCount = data?.data?.length || 0

  return (
    <div className='space-y-2'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <Breadcrumbs className='mb-0 md:static' />
          {!isLoading && (
            <Badge
              variant='secondary'
              className='font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20 transition-all hover:bg-primary/20'
            >
              {totalDomainsCount}{' '}
              {totalDomainsCount === 1 ? 'Domain' : 'Domains'}
            </Badge>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {/* Search Input and Clear Selection */}
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
              <Input
                placeholder='Search domains...'
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
          </div>

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
                disabled={
                  !isImportAvailable || !canCreate || hasDomainRestriction
                }
              >
                <FileDown className='w-4 h-4 mr-2' /> Import
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleEdit}
                disabled={!isEditAvailable || !canEdit || hasDomainRestriction}
              >
                <Edit2 className='w-4 h-4 mr-2' /> Bulk Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileUp className='w-4 h-4 mr-2' /> Export
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => handleExportDomains('excel')}
                    >
                      Export to Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportDomains('csv')}
                    >
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

          {/* Add New Domain Button */}
          {canCreate && !hasDomainRestriction && (
            <Button
              asChild
              className='gap-2 bg-gradient-primary border-none shadow-lg'
            >
              <Link to='/domains/create'>
                <Plus className='w-4 h-4' /> Add New Domain
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className='border border-border/40 shadow-lg p-0 m-0'>
        {filteredDomains.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredDomains}
            rowCount={totalDomainsCount}
            isLoading={isLoading}
          />
        ) : (
          <NoDataFound />
        )}
      </Card>

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={handleImportModalClose}
        importConfig={importConfig}
        title='Bulk Import Domains'
        description='Upload a CSV or Excel file to create multiple domains at once.'
        onComplete={onBulkImportComplete}
      />

      <BulkEditModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        editConfig={editConfig}
        title='Bulk Edit Domains'
        description='Upload a CSV or Excel file to update multiple domains at once. Existing domains will be matched by name.'
        onComplete={onBulkEditComplete}
      />

      {statusModal && (
        <StatusChangeConfirmationModal
          isOpen={!!statusModal}
          onClose={() => setStatusModal(null)}
          onConfirm={confirmDomainStatusChange}
          entityName='Domain'
          entityLabel={statusModal.domain_name}
          status={statusModal.is_active ? 'inactive' : 'active'}
        />
      )}

      {deleteModal && (
        <DeleteConfirmationModal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={confirmDomainDelete}
          value={deleteModal.domain_name}
          isLoading={isDeleting}
          title='Delete Domain'
          warningItems={[
            'This action cannot be undone',
            'All data associated with this domain will be permanently removed',
            'Users restricted to this domain will lose access',
          ]}
        />
      )}

      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        items={selectedItemsWithLabels}
        onDelete={handleBulkDelete}
        onClose={() => setShowBulkDeleteModal(false)}
        onComplete={onBulkDeleteComplete}
        itemName='domain'
        title='Bulk Delete Domains'
        description='Are you sure you want to delete the selected domains?'
      />

      <AlertDialog open={showReLoginModal} onOpenChange={setShowReLoginModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Domain Deleted Successfully</AlertDialogTitle>
            <AlertDialogDescription>
              The domain has been deleted. For security reasons and to ensure
              your session reflects updated permissions, please re-login to the
              application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReLoginModal(false)}>
              Skip
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => logout()}>
              Log Out and Re-login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DomainsPage
