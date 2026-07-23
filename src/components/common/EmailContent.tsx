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

import React, { useEffect, useRef } from 'react'

interface EmailContentProps {
  content: string
  className?: string
}

export const EmailContent: React.FC<EmailContentProps> = ({
  content,
  className,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <base target="_blank">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: inherit;
            word-wrap: break-word;
            overflow-wrap: break-word;
            overflow: hidden;
          }
          html {
            overflow: hidden;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          a {
            color: #0066cc;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `)
    doc.close()

    // Ensure all links open in new tab
    const links = doc.querySelectorAll('a')
    links.forEach(link => {
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')
    })

    // Auto-resize iframe
    const resizeIframe = () => {
      if (doc.body) {
        iframe.style.height = `${doc.body.scrollHeight}px`
      }
    }

    setTimeout(resizeIframe, 100)

    const observer = new MutationObserver(resizeIframe)
    if (doc.body) {
      observer.observe(doc.body, {
        childList: true,
        subtree: true,
        attributes: true,
      })
    }

    window.addEventListener('resize', resizeIframe)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', resizeIframe)
    }
  }, [content])

  return (
    <iframe
      ref={iframeRef}
      className={`w-full border-none ${className}`}
      title='Email Content'
      sandbox='allow-popups allow-same-origin'
      style={{
        backgroundColor: 'transparent',
        minHeight: '400px',
        overflow: 'hidden',
        display: 'block',
      }}
    />
  )
}
