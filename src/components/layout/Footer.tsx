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

// Footer.tsx
import { Link } from 'react-router-dom'
import { CompactHealthIndicator } from '../common/HealthIndicator'

export const Footer = () => {
  return (
    <footer className='mt-12 py-6 border-t border-border/40'>
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <span>© 2025 Archive Inc. Version 1.0.2</span>
          <span className='hidden sm:inline'>•</span>
          <span className='hidden sm:inline'>
            Status: <CompactHealthIndicator />
          </span>
        </div>
        <div className='flex items-center gap-6 text-xs'>
          <FooterLink to='/docs'>Docs</FooterLink>
          <FooterLink to='/support'>Support</FooterLink>
          <FooterLink to='/changelog'>Changelog</FooterLink>
        </div>
      </div>
    </footer>
  )
}

interface FooterLinkProps {
  to: string
  children: React.ReactNode
}

const FooterLink = ({ to, children }: FooterLinkProps) => (
  <Link
    to={to}
    className='text-muted-foreground hover:text-foreground transition-colors'
  >
    {children}
  </Link>
)
