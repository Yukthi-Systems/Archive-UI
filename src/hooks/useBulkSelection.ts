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

import { useState, useCallback, useMemo } from 'react'

/**
 * Custom hook for managing bulk selection with persistence across pagination
 * @param data - Current page data
 * @param idKey - Key to use as unique identifier (default: 'id')
 * @param labelKey - Key to use as display label (default: 'name')
 */
export function useBulkSelection<T>(
  data: T[] = [],
  idKey: keyof T = 'id' as keyof T,
  labelKey: keyof T = 'name' as keyof T
) {
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(
    new Set()
  )
  const [selectedItemsData, setSelectedItemsData] = useState<
    Map<string | number, T>
  >(new Map())

  // Get current page item IDs
  const currentPageIds = useMemo(
    () => data.map(item => item[idKey] as unknown as string | number),
    [data, idKey]
  )

  // Check if all current page items are selected
  const isAllCurrentPageSelected = useMemo(
    () =>
      currentPageIds.length > 0 &&
      currentPageIds.every(id => selectedItems.has(id)),
    [currentPageIds, selectedItems]
  )

  // Check if some (but not all) current page items are selected
  const isSomeCurrentPageSelected = useMemo(
    () =>
      currentPageIds.some(id => selectedItems.has(id)) &&
      !isAllCurrentPageSelected,
    [currentPageIds, selectedItems, isAllCurrentPageSelected]
  )

  // Get selected items with their labels for display
  const selectedItemsWithLabels = useMemo(() => {
    const result: { id: string | number; label: string }[] = []

    // Map through the stored data to get all selected items
    selectedItems.forEach(id => {
      const itemData = selectedItemsData.get(id)
      if (itemData) {
        result.push({
          id,
          label: (itemData[labelKey] as unknown as string) || (id as string),
        })
      }
    })

    return result
  }, [selectedItems, selectedItemsData, labelKey])

  // Toggle single item selection
  const toggleItem = useCallback(
    (itemId: string | number) => {
      const item = data.find(
        i => (i[idKey] as unknown as string | number) === itemId
      )

      setSelectedItems(prev => {
        const newSet = new Set(prev)
        if (newSet.has(itemId)) {
          newSet.delete(itemId)
        } else {
          newSet.add(itemId)
        }
        return newSet
      })

      if (item) {
        setSelectedItemsData(prev => {
          const newMap = new Map(prev)
          if (selectedItems.has(itemId)) {
            newMap.delete(itemId)
          } else {
            newMap.set(itemId, item)
          }
          return newMap
        })
      }
    },
    [data, idKey, selectedItems]
  )

  // Toggle all current page items
  const toggleAllCurrentPage = useCallback(() => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)

      if (isAllCurrentPageSelected) {
        // Deselect all current page items
        currentPageIds.forEach(id => newSet.delete(id))
      } else {
        // Select all current page items
        currentPageIds.forEach(id => newSet.add(id))
      }

      return newSet
    })

    setSelectedItemsData(prev => {
      const newMap = new Map(prev)

      if (isAllCurrentPageSelected) {
        // Remove current page items
        currentPageIds.forEach(id => newMap.delete(id))
      } else {
        // Add current page items
        data.forEach(item => {
          const id = item[idKey] as unknown as string | number
          if (!selectedItems.has(id)) {
            newMap.set(id, item)
          }
        })
      }

      return newMap
    })
  }, [currentPageIds, isAllCurrentPageSelected, data, idKey, selectedItems])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
    setSelectedItemsData(new Map())
  }, [])

  const isItemSelected = useCallback(
    (itemId: string | number) => {
      return selectedItems.has(itemId)
    },
    [selectedItems]
  )

  const removeFromSelection = useCallback((itemIds: (string | number)[]) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      itemIds.forEach(id => newSet.delete(id))
      return newSet
    })

    setSelectedItemsData(prev => {
      const newMap = new Map(prev)
      itemIds.forEach(id => newMap.delete(id))
      return newMap
    })
  }, [])

  return {
    selectedItems,
    selectedCount: selectedItems.size,
    selectedItemsWithLabels,
    isAllCurrentPageSelected,
    isSomeCurrentPageSelected,
    toggleItem,
    toggleAllCurrentPage,
    clearSelection,
    isItemSelected,
    removeFromSelection,
  }
}
