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

import { Children, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Search,
  Book,
  Shield,
  Users,
  Database,
  Mail,
  HelpCircle,
  Menu,
  ChevronRight,
  LayoutDashboard,
  Settings,
  FileSpreadsheet,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atoms/user'

// --- Markdown doc loading ---
const ICONS: Record<string, React.ElementType> = {
  Book,
  Shield,
  Users,
  Database,
  Mail,
  HelpCircle,
  LayoutDashboard,
  Settings,
  FileSpreadsheet,
  Bell,
}

type DocSection = {
  id: string
  title: string
  icon?: React.ElementType
  permission?: string
  order: number
  content: string
  plainText: string
}

type DocCategory = {
  title: string
  items: DocSection[]
}

// Strips common Markdown syntax so search matching/snippets read as plain
// prose instead of raw `#`/`**`/`|` characters. Rendering still uses the
// original `content` string — this is only used for search.
function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^\s*>+\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/^-{3,}\s*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'i'))
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className='rounded-sm bg-yellow-200 px-0.5 text-yellow-950 dark:bg-yellow-500/40 dark:text-yellow-50'
      >
        {part}
      </mark>
    ) : (
      part
    )
  )
}

function highlightChildren(
  children: React.ReactNode,
  query: string
): React.ReactNode {
  if (!query) return children
  return Children.map(children, child =>
    typeof child === 'string' ? highlightText(child, query) : child
  )
}

type Snippet = { before: string; match: string; after: string }

function buildSnippet(
  plainText: string,
  query: string,
  radius = 70
): Snippet | null {
  const idx = plainText.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return null
  const start = Math.max(0, idx - radius)
  const end = Math.min(plainText.length, idx + query.length + radius)
  return {
    before: (start > 0 ? '…' : '') + plainText.slice(start, idx),
    match: plainText.slice(idx, idx + query.length),
    after:
      plainText.slice(idx + query.length, end) +
      (end < plainText.length ? '…' : ''),
  }
}

const CATEGORY_ORDER = [
  'Getting Started',
  'Core Modules',
  'Settings',
  'Support',
]

function parseFrontmatter(raw: string): {
  data: Record<string, string>
  content: string
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const [, frontmatter, content] = match
  const data: Record<string, string> = {}
  frontmatter.split('\n').forEach(line => {
    const idx = line.indexOf(':')
    if (idx === -1) return
    data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  })
  return { data, content }
}

const docModules = import.meta.glob('/src/content/help/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const DocumentationData: DocCategory[] = (() => {
  const categories = new Map<string, DocSection[]>()

  Object.entries(docModules)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw)
      const id = (path.split('/').at(-1) ?? path)
        .replace(/\.md$/, '')
        .replace(/^\d+-/, '')
      return {
        id,
        title: data.title ?? id,
        icon: data.icon ? ICONS[data.icon] : undefined,
        permission: data.permission || undefined,
        order: Number(data.order ?? 0),
        content,
        plainText: toPlainText(content),
        category: data.category ?? 'Support',
      }
    })
    .sort((a, b) => a.order - b.order)
    .forEach(({ category, ...item }) => {
      const list = categories.get(category) ?? []
      list.push(item)
      categories.set(category, list)
    })

  return [...categories.entries()]
    .sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
    .map(([title, items]) => ({ title, items }))
})()

const hasPermission = (userPermissions: string[], permission?: string) => {
  if (!permission) return true
  return userPermissions.includes(permission)
}

function CategoryNav({
  categories,
  activeId,
  onSelect,
}: {
  categories: DocCategory[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <nav className='px-4 space-y-6'>
      {categories.map(category => (
        <div key={category.title}>
          <h4 className='mb-2 text-sm font-semibold tracking-tight text-foreground/70 uppercase'>
            {category.title}
          </h4>
          <div className='space-y-1'>
            {category.items.map(item => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                  activeId === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.icon && <item.icon className='h-4 w-4' />}
                {item.title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

type SearchResult = {
  item: DocSection
  titleMatch: boolean
  snippet: Snippet | null
}

function SearchResultsList({
  results,
  query,
  activeId,
  onSelect,
}: {
  results: SearchResult[]
  query: string
  activeId: string
  onSelect: (id: string) => void
}) {
  if (results.length === 0) {
    return (
      <p className='px-4 text-sm text-muted-foreground'>
        No results for &ldquo;{query}&rdquo;.
      </p>
    )
  }
  return (
    <nav className='px-4 space-y-1'>
      <p className='mb-2 text-xs font-semibold tracking-tight text-foreground/70 uppercase'>
        {results.length} result{results.length === 1 ? '' : 's'}
      </p>
      {results.map(({ item, snippet }) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            'flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm transition-colors',
            activeId === item.id
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <span className='flex items-center gap-2 font-medium'>
            {item.icon && <item.icon className='h-4 w-4 shrink-0' />}
            {highlightText(item.title, query)}
          </span>
          {snippet && (
            <span className='line-clamp-2 pl-6 text-xs text-muted-foreground'>
              {snippet.before}
              <mark className='rounded-sm bg-yellow-200 px-0.5 text-yellow-950 dark:bg-yellow-500/40 dark:text-yellow-50'>
                {snippet.match}
              </mark>
              {snippet.after}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}

const HelpPage = () => {
  const [activeId, setActiveId] = useState('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const trimmedQuery = searchQuery.trim()
  const contentRef = useRef<HTMLDivElement>(null)

  const user = useAtomValue(userAtom)
  const userPermissions = useMemo(() => user?.basic_permissions ?? [], [user])

  const allPermittedItems = useMemo(
    () =>
      DocumentationData.flatMap(cat =>
        cat.items.filter(item =>
          hasPermission(userPermissions, item.permission)
        )
      ),
    [userPermissions]
  )

  // Categorized nav shown when there's no active search
  const categorizedData = useMemo(
    () =>
      DocumentationData.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          hasPermission(userPermissions, item.permission)
        ),
      })).filter(cat => cat.items.length > 0),
    [userPermissions]
  )

  // Flat, ranked results (title matches first) searched across full doc
  // content, not just titles — each result carries a highlighted snippet.
  const searchResults = useMemo((): SearchResult[] | null => {
    if (!trimmedQuery) return null
    const q = trimmedQuery.toLowerCase()
    return allPermittedItems
      .map(item => {
        const titleMatch = item.title.toLowerCase().includes(q)
        const snippet = buildSnippet(item.plainText, trimmedQuery)
        if (!titleMatch && !snippet) return null
        return { item, titleMatch, snippet }
      })
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => Number(b.titleMatch) - Number(a.titleMatch))
  }, [trimmedQuery, allPermittedItems])

  const activeItem = allPermittedItems.find(item => item.id === activeId)

  // Reveal the first in-content match when the doc or the query changes.
  useEffect(() => {
    if (!trimmedQuery) return
    contentRef.current
      ?.querySelector('mark')
      ?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }, [activeId, trimmedQuery])

  const markdownComponents: Components = useMemo(
    () => ({
      p: ({ children }) => <p>{highlightChildren(children, trimmedQuery)}</p>,
      li: ({ children }) => (
        <li>{highlightChildren(children, trimmedQuery)}</li>
      ),
      td: ({ children }) => (
        <td>{highlightChildren(children, trimmedQuery)}</td>
      ),
      th: ({ children }) => (
        <th>{highlightChildren(children, trimmedQuery)}</th>
      ),
      h1: ({ children }) => (
        <h1>{highlightChildren(children, trimmedQuery)}</h1>
      ),
      h2: ({ children }) => (
        <h2>{highlightChildren(children, trimmedQuery)}</h2>
      ),
      h3: ({ children }) => (
        <h3>{highlightChildren(children, trimmedQuery)}</h3>
      ),
      strong: ({ children }) => (
        <strong>{highlightChildren(children, trimmedQuery)}</strong>
      ),
    }),
    [trimmedQuery]
  )

  return (
    <div className='flex h-[calc(100vh-4rem)] -m-6 bg-background'>
      {/* Sidebar for Desktop */}
      <aside className='hidden md:flex w-64 flex-col border-r bg-muted/10'>
        <div className='p-4 border-b'>
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search docs...'
              className='pl-8 h-9'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className='flex-1 py-4'>
          {trimmedQuery ? (
            <SearchResultsList
              results={searchResults ?? []}
              query={trimmedQuery}
              activeId={activeId}
              onSelect={setActiveId}
            />
          ) : (
            <CategoryNav
              categories={categorizedData}
              activeId={activeId}
              onSelect={setActiveId}
            />
          )}
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className='flex-1 overflow-auto w-full'>
        {/* Mobile Header */}
        <div className='md:hidden flex items-center justify-between p-4 border-b'>
          <span className='font-semibold'>Documentation</span>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className='h-5 w-5' />
          </Button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className='md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm'>
            <div className='flex flex-col h-full p-4'>
              <div className='flex justify-end mb-4'>
                <Button variant='ghost' onClick={() => setIsSidebarOpen(false)}>
                  Close
                </Button>
              </div>
              <div className='mb-4'>
                <Input
                  placeholder='Search...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className='flex-1 overflow-auto space-y-6'>
                {trimmedQuery ? (
                  <SearchResultsList
                    results={searchResults ?? []}
                    query={trimmedQuery}
                    activeId={activeId}
                    onSelect={id => {
                      setActiveId(id)
                      setIsSidebarOpen(false)
                    }}
                  />
                ) : (
                  <CategoryNav
                    categories={categorizedData}
                    activeId={activeId}
                    onSelect={id => {
                      setActiveId(id)
                      setIsSidebarOpen(false)
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Render */}
        <div className='max-w-4xl mx-auto p-8 lg:p-12'>
          {activeItem ? (
            <div className='animate-in fade-in duration-300 slide-in-from-bottom-4'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground mb-6'>
                <span>Docs</span>
                <ChevronRight className='h-3.5 w-3.5' />
                <span className='text-foreground font-medium'>
                  {activeItem.title}
                </span>
              </div>

              <div
                ref={contentRef}
                className='prose dark:prose-invert max-w-none'
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {activeItem.content}
                </ReactMarkdown>
              </div>

              <Separator className='my-10' />
            </div>
          ) : (
            <div className='text-center py-20'>
              <h3 className='text-lg font-semibold'>No content found</h3>
              <p className='text-muted-foreground'>
                Select a topic from the sidebar or try a different search.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default HelpPage
