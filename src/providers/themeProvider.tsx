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

import { createContext, useContext, useEffect, useCallback } from 'react'
import { useAtom } from 'jotai'
import { themeAtom } from '@/atoms/theme'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  actualTheme: 'light' | 'dark' // The resolved theme (light or dark)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useAtom(themeAtom)

  // Wraps getActualTheme in useCallback to avoid recreating it on every render
  const getActualTheme = useCallback((): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return theme as 'light' | 'dark'
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const actualTheme = getActualTheme()
    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)
  }, [theme, getActualTheme])

  // Listen for system theme changes only when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      const root = document.documentElement
      const newActualTheme = mediaQuery.matches ? 'dark' : 'light'

      root.classList.remove('light', 'dark')
      root.classList.add(newActualTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    actualTheme: getActualTheme(),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
