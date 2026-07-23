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

import { decodeWords } from 'postal-mime'

export interface ParsedEmail {
  headers: Record<string, string>
  htmlBody: string | null
  textBody: string | null
  attachments: Array<{
    filename: string
    contentType: string
    content: string // Base64 or raw content
    size: number
    contentId?: string
    contentLocation?: string
  }>
}

export const parseEml = (emlContent: string): ParsedEmail => {
  const result: ParsedEmail = {
    headers: {},
    htmlBody: null,
    textBody: null,
    attachments: [],
  }

  // Normalize line endings to LF only to handle CRLF issues
  const normalizedEml = emlContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Split headers and body using double newline
  const parts = normalizedEml.split('\n\n')
  const headerBlock = parts[0]
  const rawBody = parts.slice(1).join('\n\n')

  // Parse Headers
  const headerLines = headerBlock.split('\n')
  let currentKey = ''
  for (const line of headerLines) {
    if (line.match(/^[\w-]+:/)) {
      const match = line.match(/^([\w-]+):\s*(.*)$/)
      if (match) {
        currentKey = match[1].toLowerCase()
        result.headers[currentKey] = match[2]
      }
    } else if ((currentKey && line.startsWith(' ')) || line.startsWith('\t')) {
      // Continuation of previous header
      result.headers[currentKey] += ' ' + line.trim()
    }
  }

  // Join parsed headers and decode
  for (const key in result.headers) {
    result.headers[key] = decodeHeaderValue(result.headers[key])
  }

  // Find Boundary
  const contentType = result.headers['content-type']
  let boundary = ''
  if (contentType && contentType.includes('boundary=')) {
    const match = contentType.match(/boundary="?([^";]+)"?/)
    if (match) {
      boundary = match[1]
    }
  }

  // Check main headers for encoding if not multipart
  if (!boundary) {
    const encoding = result.headers['content-transfer-encoding']?.toLowerCase()
    if (encoding === 'quoted-printable') {
      result.textBody = decodeQuotedPrintable(rawBody)
    } else if (encoding === 'base64') {
      result.textBody = decodeBase64UTF8(rawBody)
    } else {
      result.textBody = rawBody
    }

    // If content-type is html, move textBody to htmlBody
    if (contentType?.includes('text/html')) {
      result.htmlBody = result.textBody
      result.textBody = null
    }
  } else {
    parseMultipart(rawBody, boundary, result)
  }

  return result
}

const decodeHeaderValue = (value: string): string => {
  if (!value) return ''

  // 1. Remove whitespace between encoded words (RFC 2047)
  // e.g. =?UTF-8?Q?Foo?=    =?UTF-8?Q?Bar?=  --> =?UTF-8?Q?Foo?==?UTF-8?Q?Bar?=
  const collapsed = value.replace(/(\?=\s+=\?)/g, '?==?')

  // 2. Decode each encoded word
  return collapsed.replace(
    /=\?([\w-]+)\?([BQbq])\?([^?]+)\?=/g,
    (match, _charset, encoding, text) => {
      try {
        if (encoding.toUpperCase() === 'B') {
          // Base64 encoding
          return decodeBase64UTF8(text)
        } else if (encoding.toUpperCase() === 'Q') {
          // Q encoding (Quoted-Printable where '_' is space)
          return decodeQuotedPrintable(text.replace(/_/g, ' '))
        }
        return match
      } catch (e) {
        console.warn('Failed to decode header value', match, e)
        return match // Fallback to raw string
      }
    }
  )
}

const decodeQuotedPrintable = (str: string): string => {
  return (
    str
      .replace(/=[\r\n]+/g, '') // Soft line breaks
      .replace(/=[0-9A-F]{2}/gi, match =>
        String.fromCharCode(parseInt(match.substring(1), 16))
      )
      // Fix for UTF-8 encoded characters split across quoted-printable chunks
      // This is a naive implementation; for robust UTF-8, we'd need a buffer.
      // However, JS strings are UTF-16. decodeURIComponent(escape(binaryString)) is a common trick
      // to decode UTF-8 bytes stored in a latin1 string.
      .replace(
        /(?:[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3})+/g,
        match => {
          try {
            return decodeURIComponent(escape(match))
          } catch (e) {
            return match
          }
        }
      )
  )
}

const decodeBase64UTF8 = (str: string): string => {
  try {
    // Remove whitespace
    const cleanStr = str.replace(/\s/g, '')
    // Decode base64 to binary string
    const binary = atob(cleanStr)
    // Decode UTF-8
    return decodeURIComponent(escape(binary))
  } catch (e) {
    console.warn('Failed to decode base64', e)
    return str
  }
}

const parseMultipart = (
  content: string,
  boundary: string,
  result: ParsedEmail
) => {
  const parts = content.split(new RegExp(`--${boundary}(?:--)?`))

  for (const part of parts) {
    if (!part || part.trim() === '') continue

    // Find the first double newline to split headers from body
    const splitIndex = part.indexOf('\n\n')
    if (splitIndex === -1) continue // Invalid part?

    const partHeaderBlock = part.substring(0, splitIndex).trim()
    const partBody = part.substring(splitIndex + 2) // Keep trailing newlines/content as is

    // Parse Part Headers
    const partHeaders: Record<string, string> = {}
    const lines = partHeaderBlock.split('\n')
    let currentKey = ''
    for (const line of lines) {
      if (line.match(/^[\w-]+:/)) {
        const match = line.match(/^([\w-]+):\s*(.*)$/)
        if (match) {
          currentKey = match[1].toLowerCase()
          partHeaders[currentKey] = match[2]
        }
      } else if (
        currentKey &&
        (line.startsWith(' ') || line.startsWith('\t'))
      ) {
        partHeaders[currentKey] += ' ' + line.trim()
      }
    }

    // Decode headers
    for (const key in partHeaders) {
      partHeaders[key] = decodeHeaderValue(partHeaders[key])
    }

    const partContentType = partHeaders['content-type'] || ''
    const partContentDisposition = partHeaders['content-disposition'] || ''
    const partEncoding =
      partHeaders['content-transfer-encoding']?.toLowerCase() || ''
    const partContentId = partHeaders['content-id']?.replace(/[<>]/g, '')
    const partContentLocation = partHeaders['content-location']

    // Check for nested multipart
    if (partContentType.includes('multipart/')) {
      const match = partContentType.match(/boundary="?([^";]+)"?/)
      if (match) {
        parseMultipart(partBody, match[1], result)
      }
      continue
    }

    // Decode content based on encoding
    let decodedContent = partBody
    if (partEncoding === 'quoted-printable') {
      decodedContent = decodeQuotedPrintable(partBody)
    } else if (partEncoding === 'base64') {
      // For attachments, we keep the raw base64 (cleaned) or decode if it's text?
      // The interface says content is "Base64 or raw content" for attachments.
      // But for text/html bodies, we want the decoded string.
      if (!partContentDisposition.includes('attachment')) {
        decodedContent = decodeBase64UTF8(partBody)
      } else {
        decodedContent = partBody.replace(/\s/g, '')
      }
    }

    // Handle Content
    if (
      partContentDisposition.includes('attachment') ||
      partContentType.includes('application/pdf') ||
      partContentType.includes('image/')
    ) {
      let filename = 'attachment'
      const filenameMatch =
        partContentDisposition.match(/filename="?([^";]+)"?/) ||
        partContentType.match(/name="?([^";]+)"?/)
      if (filenameMatch) {
        // Should decode filename too as it can be RFC 2047 encoded
        filename = decodeHeaderValue(filenameMatch[1])
      }

      result.attachments.push({
        filename,
        contentType: partContentType.split(';')[0],
        content: decodedContent, // Keep base64 for attachments if it was base64
        size: Math.round((decodedContent.length * 3) / 4),
        contentId: partContentId,
        contentLocation: partContentLocation,
      })
    } else if (partContentType.includes('text/html')) {
      result.htmlBody = decodedContent.trim()
    } else if (partContentType.includes('text/plain') || !partContentType) {
      result.textBody = decodedContent.trim()
    }
  }
}

export const processEmailHtml = (
  htmlBody: string | null,
  attachments: {
    contentId?: string
    contentType: string
    content: string
    contentLocation?: string
  }[]
): string | null => {
  if (!htmlBody) return null

  let html = htmlBody

  if (attachments && attachments.length > 0) {
    attachments.forEach(attachment => {
      const base64Data = `data:${attachment.contentType};base64,${attachment.content}`

      if (attachment.contentId) {
        // Remove < and > from contentId if present (though parser should have done it)
        const cleanContentId = attachment.contentId.replace(/[<>]/g, '')

        // 1. Regular CID match
        const escapedId = cleanContentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const cidPattern = new RegExp(`cid:${escapedId}`, 'gi')
        html = html.replace(cidPattern, () => base64Data)

        // 2. URL Encoded CID match (e.g. cid:foo%40bar)
        try {
          const encodedId = encodeURIComponent(cleanContentId).replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          )
          if (encodedId !== escapedId) {
            const encodedCidPattern = new RegExp(`cid:${encodedId}`, 'gi')
            html = html.replace(encodedCidPattern, () => base64Data)
          }
        } catch (e) {
          // ignore
        }
      }

      if (attachment.contentLocation) {
        // Escape the location for regex
        const escapedLocation = attachment.contentLocation.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )

        // Match src="LOCATION" or src='LOCATION'
        // We use a broader regex to capture the quoting style, but simple replace might be enough if we target specific attribute contexts
        // For safety, let's target src/href attributes
        // Note: This matches "LOCATION" inside quotes.
        const locationPattern = new RegExp(
          `(src|href)=["']${escapedLocation}["']`,
          'gi'
        )

        html = html.replace(
          locationPattern,
          (_match, attr) => `${attr}="${base64Data}"`
        )
      }
    })
  }

  return html
}

/**
 * Parse email address with proper decoding Handles all formats: "Name <email>",
 * "<email>", "email", encoded names, escaped quotes, etc.
 */
export function parseEmails(emailString: string): {
  name: string
  email: string
} {
  if (!emailString?.trim()) {
    return { name: 'Unknown', email: '' }
  }

  // Remove line breaks, tabs, and normalize whitespace
  let cleaned = emailString.replace(/[\r\n\t]+/g, ' ').trim()

  // Remove escaped backslashes and quotes that might come from the server
  // This handles cases like "\"rupraj\"" -> "rupraj"
  cleaned = cleaned.replace(/\\"/g, '"').replace(/\\\\/g, '')

  // Handle multiple emails - take first one, but respect quoted commas
  // Using a regex that matches either quoted strings or non-comma sequences
  const firstEmail = cleaned.match(/([^",]+|"[^"]*")+/)?.[0]?.trim() || ''

  // Case 1: Just angle brackets with email: "<email@domain.com>"
  const angleOnlyMatch = firstEmail.match(/^<([^>]+)>$/)
  if (angleOnlyMatch) {
    const email = angleOnlyMatch[1].trim()
    return {
      name: extractNameFromEmail(email),
      email: email,
    }
  }

  // Case 2: Name with angle brackets: "Name <email@domain.com>" or "\"Name\" <email>"
  const nameAngleMatch = firstEmail.match(/^(.+?)\s*<([^>]+)>$/)
  if (nameAngleMatch) {
    let rawName = nameAngleMatch[1].trim()
    const email = nameAngleMatch[2].trim()

    // Remove surrounding quotes (both single and double)
    rawName = rawName.replace(/^["']+|["']+$/g, '')

    // Decode any encoded words (handles =?UTF-8?B?...?= format)
    let decodedName = decodeWords(rawName)

    // Clean up the decoded name
    decodedName = decodedName
      .replace(/^["']+|["']+$/g, '') // remove only quotes
      .replace(/\s+/g, ' ') // normalize whitespace
      .trim() // trim spaces safely

    // If name is empty or just whitespace after cleaning, use email
    if (!decodedName || decodedName.length === 0) {
      return {
        name: extractNameFromEmail(email),
        email: email,
      }
    }

    // Only capitalize if the name looks like it needs it (all lowercase or weird casing)
    // This preserves intentional casing like "iPhone" or "eBay"
    const needsCapitalization = decodedName === decodedName.toLowerCase()

    return {
      name: needsCapitalization ? capitalizeWords(decodedName) : decodedName,
      email: email,
    }
  }

  // Case 3: Just email address without brackets
  const emailOnlyMatch = firstEmail.match(/^([^\s<>]+@[^\s<>]+)$/)
  if (emailOnlyMatch) {
    const email = emailOnlyMatch[1].trim()
    return {
      name: extractNameFromEmail(email),
      email: email,
    }
  }

  // Case 4: Encoded subject/name without proper email format
  const decoded = decodeWords(firstEmail)

  // Try to extract email from decoded string
  const decodedEmailMatch = decoded.match(/<([^>]+@[^>]+)>/)
  if (decodedEmailMatch) {
    const email = decodedEmailMatch[1].trim()
    let name = decoded
      .replace(/<[^>]+>/, '')
      .trim()
      .replace(/^["'\\]+|["'\\]+$/g, '')

    if (!name || name.length === 0) {
      name = extractNameFromEmail(email)
    } else {
      // Only capitalize if needed
      const needsCapitalization = name === name.toLowerCase()
      name = needsCapitalization ? capitalizeWords(name) : name
    }

    return {
      name: name,
      email: email,
    }
  }

  // Fallback - return as-is but cleaned
  const fallbackName = decoded.replace(/^["'\\]+|["'\\]+$/g, '').trim()
  const needsCapitalization = fallbackName === fallbackName.toLowerCase()

  return {
    name:
      (needsCapitalization ? capitalizeWords(fallbackName) : fallbackName) ||
      'Unknown',
    email: firstEmail,
  }
}

/**
 * Extract a readable name from an email address Preserves original casing to
 * respect user's intended format.
 */
function extractNameFromEmail(email: string): string {
  if (!email) return 'Unknown'

  const localPart = email.split('@')[0]

  if (!localPart) return 'Unknown'

  // Just replace separators with spaces, preserve original case
  // E.g., "ruprajsingh1" stays "ruprajsingh1", not "Ruprajsingh1"
  const formatted = localPart.replace(/[._-]/g, ' ').trim()

  return formatted || localPart
}

/** Capitalize a single word intelligently. */
function capitalizeWord(word: string): string {
  if (!word || word.length === 0) return word

  // Handle all-caps words (like "JOHN" -> "John")
  if (word === word.toUpperCase() && word.length > 1) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }

  // Handle normal words
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/** Capitalize all words in a string. */
function capitalizeWords(text: string): string {
  if (!text) return text

  return text
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => capitalizeWord(word))
    .join(' ')
}

export const parseMultipleEmails = (emailString: string) => {
  if (!emailString) return []

  const emailArray =
    emailString
      .match(/([^",]+|"[^"]*")+/g)
      ?.map(email => email.trim())
      .filter(Boolean) || []

  return emailArray.map(email => {
    const parsed = parseEmails(email)
    return {
      name: parsed.name,
      email: parsed.email,
      original: email,
    }
  })
}
