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

import { describe, it, expect } from 'vitest'
import { parseEmails, parseEml } from './emlParser'

describe('emlParser', () => {
  describe('parseEmails', () => {
    it('should parse simple email address', () => {
      const result = parseEmails('test@example.com')
      expect(result).toEqual({ name: 'test', email: 'test@example.com' })
    })

    it('should parse email with name in angle brackets', () => {
      const result = parseEmails('John Doe <john@example.com>')
      expect(result).toEqual({ name: 'John Doe', email: 'john@example.com' })
    })

    it('should parse email with quoted name', () => {
      const result = parseEmails('"Doe, John" <john@example.com>')
      expect(result).toEqual({ name: 'Doe, John', email: 'john@example.com' })
    })

    it('should handle empty or null input', () => {
      // @ts-expect-error - testing null input validation
      expect(parseEmails(null)).toEqual({ name: 'Unknown', email: '' })
      expect(parseEmails('')).toEqual({ name: 'Unknown', email: '' })
    })
  })

  describe('parseEml', () => {
    it('should parse a basic EML structure', () => {
      const eml = `Subject: Test Email\nFrom: sender@example.com\nTo: recipient@example.com\nContent-Type: text/plain\n\nHello World`
      const result = parseEml(eml)

      expect(result.headers.subject).toBe('Test Email')
      expect(result.headers.from).toBe('sender@example.com')
      expect(result.textBody).toBe('Hello World')
    })

    it('should handle multipart boundaries', () => {
      const eml = [
        'Content-Type: multipart/alternative; boundary="boundary"',
        'Subject: Multipart Test',
        '',
        '--boundary',
        'Content-Type: text/plain',
        '',
        'Text content',
        '--boundary',
        'Content-Type: text/html',
        '',
        '<b>HTML content</b>',
        '--boundary--',
      ].join('\n')

      const result = parseEml(eml)
      expect(result.textBody).toBe('Text content')
      expect(result.htmlBody).toBe('<b>HTML content</b>')
    })
  })
})
