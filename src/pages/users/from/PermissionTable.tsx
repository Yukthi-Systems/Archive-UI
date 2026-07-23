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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Eye,
  Plus,
  Pencil,
  Trash2,
  CheckCheck,
  Minus,
  ZapIcon,
  FileText,
  Settings2Icon,
  FileTextIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

// Types based on your config
export interface PermissionItem {
  value: string
  label: string
}

export interface PermissionCategory {
  category: string
  stateKey: string
  label: string
  permissions: PermissionItem[]
}

interface PermissionsTableProps {
  config: PermissionCategory[]
  selectedPermissions: string[]
  onChange?: (newPermissions: string[]) => void
  readOnly?: boolean
  disabledPermissions?: string[]
  className?: string
}

const ICON_MAP: Record<string, any> = {
  view: Eye,
  create: Plus,
  update: Pencil,
  delete: Trash2,
  advanced: ZapIcon,
  body: FileTextIcon,
  extended: Settings2Icon,
}

export function PermissionsTable({
  config,
  selectedPermissions,
  onChange,
  readOnly = false,
  disabledPermissions = [],
  className,
}: PermissionsTableProps) {
  // Helper to identify permission type
  const getPermissionType = (
    label: string
  ):
    | 'view'
    | 'create'
    | 'update'
    | 'delete'
    | 'advanced'
    | 'body'
    | 'extended'
    | 'other' => {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes('advanced')) return 'advanced'
    if (lowerLabel.includes('body')) return 'body'
    if (lowerLabel.includes('extended')) return 'extended'
    if (lowerLabel.includes('view')) return 'view'
    if (lowerLabel.includes('create')) return 'create'
    if (lowerLabel.includes('update') || lowerLabel.includes('edit'))
      return 'update'
    if (lowerLabel.includes('delete')) return 'delete'
    return 'other'
  }

  // Toggle a single permission
  const togglePermission = (
    category: PermissionCategory,
    perm: PermissionItem
  ) => {
    if (readOnly || !onChange) return

    const { value, label } = perm
    const isSelected = selectedPermissions.includes(value)

    // Determine type for auto-enable logic
    const type = getPermissionType(label)

    let newPermissions = [...selectedPermissions]

    if (isSelected) {
      newPermissions = newPermissions.filter(p => p !== value)

      // Inverse logic: If a prerequisite is unselected, unselect all dependent permissions
      // (Contrapositive of the rules in the 'else' block)

      // 1. If View is unselected, unselect all other permissions in the same category
      if (type === 'view') {
        const categoryValues = category.permissions.map(p => p.value)
        newPermissions = newPermissions.filter(p => !categoryValues.includes(p))
      }

      // 2. If Domain View is unselected, unselect User Create and User Update
      if (value === 'domain:view') {
        newPermissions = newPermissions.filter(
          p => !['user:create', 'user:edit'].includes(p)
        )
        // Also remove 2FA permissions as they depend on Domain View
        const tfaPerms = [
          '2fa:totp:edit',
          '2fa:totp:delete',
          '2fa:sms:edit',
          '2fa:email:edit',
        ]
        newPermissions = newPermissions.filter(p => !tfaPerms.includes(p))
      }

      // 3. If User Update is unselected, unselect 2FA permissions
      if (value === 'user:edit') {
        const tfaPerms = [
          '2fa:totp:edit',
          '2fa:totp:delete',
          '2fa:sms:edit',
          '2fa:email:edit',
        ]
        newPermissions = newPermissions.filter(p => !tfaPerms.includes(p))
      }

      if (value === 'user:view') {
        const tfaPerms = [
          'user:create',
          'user:edit',
          'user:delete',
          '2fa:totp:edit',
          '2fa:totp:delete',
          '2fa:sms:edit',
          '2fa:email:edit',
        ]
        newPermissions = newPermissions.filter(p => !tfaPerms.includes(p))
      }
    } else {
      newPermissions.push(value)

      // Auto-enable View if Create/Update/Delete is selected
      if (['create', 'update', 'delete'].includes(type)) {
        const viewPerm = category.permissions.find(
          p => getPermissionType(p.label) === 'view'
        )
        if (viewPerm && !newPermissions.includes(viewPerm.value)) {
          newPermissions.push(viewPerm.value)
        }
      }

      // Auto-enable User View if User Edit is selected
      if (value === 'user:create' || value === 'user:edit') {
        const domainCategory = config.find(c => c.category === 'Domain')
        const domainViewPerm = domainCategory?.permissions.find(
          p => getPermissionType(p.label) === 'view'
        )
        if (domainViewPerm && !newPermissions.includes(domainViewPerm.value)) {
          newPermissions.push(domainViewPerm.value)
        }
      }

      // Auto-enable User Update if 2FA update is selected
      if (
        [
          '2fa:totp:edit',
          '2fa:totp:delete',
          '2fa:sms:edit',
          '2fa:email:edit',
        ].includes(value)
      ) {
        const userCategory = config.find(c => c.category === 'User')
        const userEditPerm = userCategory?.permissions.find(
          p => p.value === 'user:edit'
        )
        const domainCategory = config.find(c => c.category === 'Domain')
        const domainViewPerm = domainCategory?.permissions.find(
          p => getPermissionType(p.label) === 'view'
        )

        if (userEditPerm && !newPermissions.includes(userEditPerm.value)) {
          newPermissions.push(userEditPerm.value)

          // Also need View for User if we added Edit
          const userViewPerm = userCategory?.permissions.find(
            p => getPermissionType(p.label) === 'view'
          )
          if (userViewPerm && !newPermissions.includes(userViewPerm.value)) {
            newPermissions.push(userViewPerm.value)
          }
        }
        if (domainViewPerm && !newPermissions.includes(domainViewPerm.value)) {
          newPermissions.push(domainViewPerm.value)
        }
      }
    }

    onChange(Array.from(new Set(newPermissions)))
  }

  // Toggle all permissions in a category (Row Select All)
  const toggleCategory = (
    category: PermissionCategory,
    isAllSelected: boolean
  ) => {
    if (readOnly || !onChange) return

    // Exclude disabled permissions from selection
    const categoryValues = category.permissions
      .map(p => p.value)
      .filter(v => !disabledPermissions.includes(v))

    if (isAllSelected) {
      // Uncheck all non-disabled in this category
      onChange(selectedPermissions.filter(p => !categoryValues.includes(p)))
    } else {
      // Check all non-disabled in this category (merge unique)
      const newPermissions = [...selectedPermissions, ...categoryValues]

      // Auto-enable User Update if this is a 2FA category with an update permission
      const has2FAUpdate = categoryValues.some(v =>
        ['2fa:totp:edit', '2fa:sms:edit', '2fa:email:edit'].includes(v)
      )
      if (has2FAUpdate) {
        const userCategory = config.find(c => c.category === 'User')
        const userEditPerm = userCategory?.permissions.find(
          p => p.value === 'user:edit'
        )
        if (userEditPerm && !newPermissions.includes(userEditPerm.value)) {
          newPermissions.push(userEditPerm.value)
          // Also need View for User if we added Edit
          const userViewPerm = userCategory?.permissions.find(
            p => getPermissionType(p.label) === 'view'
          )
          if (userViewPerm && !newPermissions.includes(userViewPerm.value)) {
            newPermissions.push(userViewPerm.value)
          }
        }
      }

      onChange(Array.from(new Set(newPermissions)))
    }
  }

  // Toggle ALL permissions in the table (Global Select All)
  const toggleAll = (isAllSelected: boolean) => {
    if (readOnly || !onChange) return

    if (isAllSelected) {
      // Deselect all non-disabled
      const nonDisabledValues = config.flatMap(cat =>
        cat.permissions
          .map(p => p.value)
          .filter(v => !disabledPermissions.includes(v))
      )
      onChange(selectedPermissions.filter(p => !nonDisabledValues.includes(p)))
    } else {
      // Select all non-disabled
      const allValues = config
        .flatMap(cat => cat.permissions.map(p => p.value))
        .filter(v => !disabledPermissions.includes(v))
      const newSet = new Set([...selectedPermissions, ...allValues])
      onChange(Array.from(newSet))
    }
  }

  const getPermissionByType = (
    permissions: PermissionItem[],
    type: 'view' | 'create' | 'update' | 'delete'
    // type: 'view' | 'create' | 'update' | 'delete' | 'advanced' | 'body' | 'extended'
  ) => {
    return permissions.find(p => getPermissionType(p.label) === type)
  }

  // Toggle all permissions of a specific column type (Column Select All)
  const toggleColumn = (
    type: 'view' | 'create' | 'update' | 'delete',
    // type: 'view' | 'create' | 'update' | 'delete' | 'advanced' | 'body' | 'extended',
    isAllSelected: boolean
  ) => {
    if (readOnly || !onChange) return

    // Find all non-disabled permissions of this type across all categories
    const permissionsOfType: string[] = []
    const viewPermissionsNeeded: string[] = []

    config.forEach(cat => {
      const typePerm = getPermissionByType(cat.permissions, type)
      if (typePerm && !disabledPermissions.includes(typePerm.value)) {
        permissionsOfType.push(typePerm.value)

        // If we are selecting Create/Update/Delete, we also need View
        if (!isAllSelected && ['create', 'update', 'delete'].includes(type)) {
          const viewPerm = getPermissionByType(cat.permissions, 'view')
          if (viewPerm && !disabledPermissions.includes(viewPerm.value)) {
            viewPermissionsNeeded.push(viewPerm.value)
          }
        }
      }
    })

    if (isAllSelected) {
      // Deselect all non-disabled of this type
      onChange(selectedPermissions.filter(p => !permissionsOfType.includes(p)))
    } else {
      // Select all non-disabled of this type + required View permissions
      const uniqueNew = new Set([
        ...selectedPermissions,
        ...permissionsOfType,
        ...viewPermissionsNeeded,
      ])
      onChange(Array.from(uniqueNew))
    }
  }

  const renderPermissionCell = (
    cat: PermissionCategory,
    type: 'view' | 'create' | 'update' | 'delete'
    // type: 'view' | 'create' | 'update' | 'delete' | 'advanced' | 'body' | 'extended'
  ) => {
    const perm = getPermissionByType(cat.permissions, type)

    if (!perm) {
      return (
        <TableCell className='text-left text-muted-foreground w-[100px] px-1'>
          -
        </TableCell>
      )
    }

    const isChecked = selectedPermissions.includes(perm.value)
    const isDisabled = readOnly || disabledPermissions.includes(perm.value)

    return (
      <TableCell className='text-left py-2 w-[100px] px-0'>
        <div className='flex items-center justify-start'>
          <Checkbox
            id={perm.value}
            checked={isChecked}
            disabled={isDisabled}
            onCheckedChange={() => togglePermission(cat, perm)}
            className='h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary'
          />
        </div>
      </TableCell>
    )
  }

  // Helper to determine column header checkbox state
  const getColumnState = (type: 'view' | 'create' | 'update' | 'delete') => {
    // Collect all available permissions of this type
    const availablePerms: string[] = []
    config.forEach(cat => {
      const p = getPermissionByType(cat.permissions, type)
      if (p) availablePerms.push(p.value)
    })

    if (availablePerms.length === 0)
      return { disabled: true, isAllSelected: false }

    const isAllSelected =
      availablePerms.length > 0 &&
      availablePerms.every(val => selectedPermissions.includes(val))

    return {
      disabled: false,
      isAllSelected,
    }
  }

  // Calculate Global Select All State
  const allPermissions = config.flatMap(cat =>
    cat.permissions.map(p => p.value)
  )
  const isGlobalAllSelected =
    allPermissions.length > 0 &&
    allPermissions.every(val => selectedPermissions.includes(val))

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden shadow-sm ',
        className
      )}
    >
      <Table className='rounded-lg'>
        <TableHeader className='bg-muted/40'>
          <TableRow className='hover:bg-muted/40 border-b border-border'>
            <TableHead className='w-[calc(100%-420px)] font-semibold pl-6 h-12'>
              Module Scope
            </TableHead>
            {!readOnly && (
              <TableHead className='w-[100px] text-left font-semibold h-12'>
                <div className='flex items-center justify-start gap-2'>
                  <Button
                    type='button'
                    variant={isGlobalAllSelected ? 'default' : 'outline'}
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => toggleAll(isGlobalAllSelected)}
                    title={isGlobalAllSelected ? 'Deselect All' : 'Select All'}
                  >
                    {isGlobalAllSelected ? (
                      <Minus className='h-4 w-4' />
                    ) : (
                      <CheckCheck className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </TableHead>
            )}

            {/* Dynamic Column Headers with Checkboxes */}
            {(['view', 'create', 'update', 'delete'] as const).map(type => {
              const { isAllSelected } = getColumnState(type)
              const Icon = ICON_MAP[type]
              return (
                <TableHead
                  key={type}
                  className='text-center font-semibold w-[100px] h-12 px-0'
                >
                  <div className='flex items-center justify-start'>
                    {!readOnly ? (
                      <div className='flex items-center gap-2 justify-start'>
                        <Button
                          type='button'
                          variant={isAllSelected ? 'default' : 'outline'}
                          size='icon'
                          className='h-5 w-5'
                          onClick={() => toggleColumn(type, isAllSelected)}
                          title={
                            isAllSelected
                              ? `Deselect all ${type}`
                              : `Select all ${type}`
                          }
                        >
                          <Icon className='h-3 w-3' />
                        </Button>
                        {type}
                      </div>
                    ) : (
                      <div className='flex items-center gap-2 justify-start'>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          className='h-5 w-5'
                          title={` ${type} permission`}
                          disabled
                        >
                          <Icon className='h-3 w-3' />
                        </Button>
                        {type}
                      </div>
                    )}
                  </div>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {config.map((cat, index) => {
            // Check if all permissions in this category are selected
            // const categoryValues = cat.permissions.map((p) => p.value)
            // const isAllSelected =
            //   categoryValues.length > 0 &&
            //   categoryValues.every((val) => selectedPermissions.includes(val))

            return (
              <TableRow
                key={cat.category}
                className={cn(
                  'hover:bg-muted/5 transition-colors',
                  index !== config.length - 1 && 'border-b border-border/60'
                )}
              >
                {/* Module Scope */}
                <TableCell className='align-middle py-2 pl-6'>
                  <span className='text-xs font-medium text-foreground'>
                    {cat.label}
                  </span>
                </TableCell>

                {/* Select All (Row) */}
                {!readOnly && (
                  <TableCell className='align-middle py-2 pl-4'>
                    <div className='flex items-center justify-start'>
                      {/* <Button
                        type='button'
                        variant={isAllSelected ? 'default' : 'outline'}
                        size='icon'
                        className='h-7 w-7'
                        onClick={() => toggleCategory(cat, isAllSelected)}
                        title={isAllSelected ? 'Deselect category' : 'Select category'}
                      >
                        {isAllSelected ? <Minus className='h-4 w-4' /> : <CheckCheck className='h-4 w-4' />}
                      </Button>  */}
                    </div>
                  </TableCell>
                )}

                {/* Permissions Cells */}
                {renderPermissionCell(cat, 'view')}
                {renderPermissionCell(cat, 'create')}
                {renderPermissionCell(cat, 'update')}
                {renderPermissionCell(cat, 'delete')}
                {/* {renderPermissionCell(cat, 'advanced')}
                {renderPermissionCell(cat, 'body')}
                {renderPermissionCell(cat, 'extended')} */}
              </TableRow>
            )
          })}

          {config.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={readOnly ? 8 : 9}
                className='h-32 text-center text-muted-foreground'
              >
                <div className='flex flex-col items-center gap-2'>
                  <div className='h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center'>
                    <span className='text-lg'>∅</span>
                  </div>
                  <p>No permissions configuration available.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
