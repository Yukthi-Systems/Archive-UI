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

    it('keeps an inline PDF attachment as raw base64 instead of UTF-8 decoding it', () => {
      // Bank statement style: multipart/mixed with a nested multipart/alternative
      // body, plus a PDF sent as `Content-Disposition: inline` (no "attachment"
      // keyword) — a real pattern some mailers use for statement PDFs.
      const base64Pdf = 'JVBERi0xLjQKJeLjz9MK' // arbitrary base64, not valid UTF-8 when decoded
      const eml = [
        'Content-Type: multipart/mixed; boundary="outer"',
        'Subject: Statement',
        '',
        '--outer',
        'Content-Type: multipart/alternative; boundary="inner"',
        '',
        '--inner',
        'Content-Type: text/plain',
        '',
        'Plain text body',
        '--inner',
        'Content-Type: text/html',
        '',
        '<b>HTML body</b>',
        '--inner--',
        '--outer',
        'Content-Type: application/pdf; name="statement.pdf"',
        'Content-Disposition: inline; filename="statement.pdf"',
        'Content-Transfer-Encoding: base64',
        '',
        base64Pdf,
        '--outer--',
      ].join('\n')

      const result = parseEml(eml)
      expect(result.textBody).toBe('Plain text body')
      expect(result.htmlBody).toBe('<b>HTML body</b>')
      expect(result.attachments).toHaveLength(1)
      expect(result.attachments[0].filename).toBe('statement.pdf')
      // Must stay as the original base64, not run through UTF-8 decoding
      expect(result.attachments[0].content).toBe(base64Pdf)
    })

    it('still parses a body part that is itself marked Content-Disposition: inline', () => {
      // Some senders mark the primary HTML body `inline` too (no filename) —
      // that must NOT be reclassified as an attachment.
      const eml = [
        'Content-Type: multipart/alternative; boundary="boundary"',
        'Subject: Inline body test',
        '',
        '--boundary',
        'Content-Type: text/html',
        'Content-Disposition: inline',
        '',
        '<p>Inline body content</p>',
        '--boundary--',
      ].join('\n')

      const result = parseEml(eml)
      expect(result.htmlBody).toBe('<p>Inline body content</p>')
      expect(result.attachments).toHaveLength(0)
    })

    it('finds nested multipart bodies when the boundary param is capitalized (Boundary=)', () => {
      // Real-world repro: an HDFC bank statement sent via "iECCM Mailer 2.0"
      // nests multipart/mixed > multipart/related > multipart/alternative,
      // and the two inner Content-Type headers use `Boundary=` (capital B)
      // instead of `boundary=`. The nested-multipart regex was case-sensitive,
      // so it silently failed to find the inner boundary and `continue`d past
      // the whole part — leaving htmlBody/textBody/attachments all empty even
      // though the email plainly has an HTML body.
      const eml = [
        'Content-Type: multipart/mixed; boundary="{outer}"',
        'Subject: Statement',
        '',
        '--{outer}',
        'Content-Type: multipart/related;',
        ' Boundary="{related}"',
        '',
        '--{related}',
        'Content-Type: multipart/alternative;',
        ' Boundary="{alt}"',
        '',
        '--{alt}',
        'Content-Type: text/html; charset="utf-8"',
        '',
        '<p>Statement body</p>',
        '--{alt}--',
        '--{related}--',
        '--{outer}--',
      ].join('\n')

      const result = parseEml(eml)
      expect(result.htmlBody).toBe('<p>Statement body</p>')
    })
  })
})
