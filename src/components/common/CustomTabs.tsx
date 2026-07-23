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
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

interface TabsContextType {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
  defaultValue: string
  children: ReactNode
  onChange?: (value: string) => void
}

export function Tabs({ defaultValue, children, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value)
      onChange?.(value)
    },
    [onChange]
  )

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div style={styles.tabsContainer}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: ReactNode
}

export function TabsList({ children }: TabsListProps) {
  return <div style={styles.tabsList}>{children}</div>
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  icon?: ReactNode
}

export function TabsTrigger({ value, children, icon }: TabsTriggerProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      style={{
        ...styles.tabTrigger,
        ...(isActive ? styles.tabTriggerActive : {}),
      }}
      className={isActive ? 'tab-active' : ''}
      data-active={isActive}
    >
      {icon && <span style={styles.tabIcon}>{icon}</span>}
      <span>{children}</span>
      <span
        style={{
          ...styles.tabIndicator,
          ...(isActive ? styles.tabIndicatorActive : {}),
        }}
      />
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
}

export function TabsContent({ value, children }: TabsContentProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  const { activeTab } = context

  if (activeTab !== value) return null

  return <div style={styles.tabContent}>{children}</div>
}

const styles = {
  tabsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    width: '100%',
  },
  tabsList: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid var(--border, #e5e7eb)',
    backgroundColor: 'var(--background, #fff)',
    gap: '0',
    flexShrink: 0,
  },
  tabTrigger: {
    position: 'relative' as const,
    padding: '14px 24px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--muted-foreground, #6b7280)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    outline: 'none',
    whiteSpace: 'nowrap' as const,
  },
  tabTriggerActive: {
    color: 'var(--primary, #3b82f6)',
  },
  tabIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: 'var(--primary, #3b82f6)',
    transform: 'scaleX(0)',
    transition: 'transform 0.2s ease',
  },
  tabIndicatorActive: {
    transform: 'scaleX(1)',
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
    animation: 'tabFadeIn 0.2s ease-out',
    minHeight: 0,
  },
}

// Add CSS animations and hover effects
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes tabFadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  button[data-active="false"]:hover {
    color: var(--foreground, #111827) !important;
    background-color: var(--muted, #f9fafb);
  }
  
  button[data-active="true"] {
    font-weight: 600;
  }
  
  /* Scrollbar for tab content */
  div[style*="animation: tabFadeIn"]::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  div[style*="animation: tabFadeIn"]::-webkit-scrollbar-track {
    background: var(--muted, #f3f4f6);
    border-radius: 4px;
  }
  div[style*="animation: tabFadeIn"]::-webkit-scrollbar-thumb {
    background: var(--muted-foreground, #9ca3af);
    border-radius: 4px;
  }
  div[style*="animation: tabFadeIn"]::-webkit-scrollbar-thumb:hover {
    background: var(--foreground, #6b7280);
  }
`
if (!document.head.querySelector('style[data-tabs-styles]')) {
  styleSheet.setAttribute('data-tabs-styles', 'true')
  document.head.appendChild(styleSheet)
}
