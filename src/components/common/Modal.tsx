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

import { useEffect, useCallback, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'lg',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop) {
      onClose()
    }
  }, [closeOnBackdrop, onClose])

  if (!isOpen) return null

  const sizeStyles = {
    sm: { maxWidth: '500px', width: '90%' },
    md: { maxWidth: '700px', width: '90%' },
    lg: { maxWidth: '900px', width: '90%' },
    xl: { maxWidth: '1200px', width: '95%' },
    full: { maxWidth: '95vw', width: '95%', height: '95vh' },
  }

  return (
    <div style={styles.overlay} onClick={handleBackdropClick}>
      <div
        style={{
          ...styles.modal,
          ...sizeStyles[size],
          ...(size === 'full' ? { maxHeight: '95vh' } : {}),
        }}
        onClick={e => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            style={styles.closeButton}
            aria-label='Close modal'
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  children: ReactNode
  className?: string
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div style={styles.header} className={className}>
      {children}
    </div>
  )
}

interface ModalBodyProps {
  children: ReactNode
  className?: string
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div style={styles.body} className={className}>
      {children}
    </div>
  )
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div style={styles.footer} className={className}>
      {children}
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 9999,
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    position: 'relative' as const,
    backgroundColor: 'var(--background, #fff)',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column' as const,
    maxHeight: '90vh',
    animation: 'slideIn 0.3s ease-out',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    color: 'var(--muted-foreground, #666)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    zIndex: 1,
  } as const,
  header: {
    padding: '24px 24px 20px 24px',
    borderBottom: '1px solid var(--border, #e5e7eb)',
    flexShrink: 0,
  },
  body: {
    padding: '24px',
    overflow: 'auto',
    flex: 1,
    minHeight: 0,
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid var(--border, #e5e7eb)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    flexShrink: 0,
    backgroundColor: 'var(--muted, #f9fafb)',
  },
}

// Add CSS animations
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Modal close button hover */
  button[aria-label="Close modal"]:hover {
    background-color: var(--muted, #f3f4f6) !important;
    color: var(--foreground, #000) !important;
  }
  
  /* Scrollbar styling */
  .modal-body::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .modal-body::-webkit-scrollbar-track {
    background: var(--muted, #f3f4f6);
    border-radius: 4px;
  }
  .modal-body::-webkit-scrollbar-thumb {
    background: var(--muted-foreground, #9ca3af);
    border-radius: 4px;
  }
  .modal-body::-webkit-scrollbar-thumb:hover {
    background: var(--foreground, #6b7280);
  }
`
if (!document.head.querySelector('style[data-modal-styles]')) {
  styleSheet.setAttribute('data-modal-styles', 'true')
  document.head.appendChild(styleSheet)
}
