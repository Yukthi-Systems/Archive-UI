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

const extensionToMimeType: Record<string, string> = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  // Documents
  pdf: 'application/pdf',
  // Video
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  flv: 'video/x-flv',
  // Audio
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  opus: 'audio/opus',
  wav: 'audio/wav',
  // Text
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
}

/** When the server returns application/octet-stream, resolve the real MIME type from the file extension. */
export const resolveEffectiveMimeType = (
  contentType: string,
  fileName?: string
): string => {
  if (contentType !== 'application/octet-stream') return contentType
  const ext = fileName?.split('.').pop()?.toLowerCase() ?? ''
  return extensionToMimeType[ext] ?? contentType
}

export const base64ToBlob = (
  base64: string,
  contentType: string,
  fileName?: string
) => {
  const effectiveType = resolveEffectiveMimeType(contentType, fileName)
  try {
    // Check if base64 string contains data URI prefix (e.g. data:image/png;base64,)
    const base64Content = base64.includes(',') ? base64.split(',')[1] : base64

    // Clean up any whitespace/newlines
    const cleanBase64 = base64Content.replace(/\s/g, '')

    const byteCharacters = atob(cleanBase64)
    const byteArrays = []

    // Process in chunks to avoid stack overflow
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }
    return new Blob(byteArrays, { type: effectiveType })
  } catch (e) {
    console.error('Error converting base64 to blob', e)
    // Fallback for plain text or failures
    return new Blob([base64], { type: effectiveType })
  }
}

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const webImageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif']
const webVideoFormats = [
  'mp4',
  'webm',
  'ogv',
  'mkv',
  'avi',
  'mov',
  'flv',
  'wmv',
  'asf',
  'mpg',
  'mpeg',
  'm4v',
  '3gp',
  '3g2',
]
const webAudioFormats = ['mp3', 'aac', 'm4a', 'ogg', 'opus', 'wav']

export const getFileType = (contentType: string, fileName: string) => {
  let fileExtension = ''
  if (fileName) {
    fileExtension = fileName
      ?.split('.')
      ?.[fileName?.split('.')?.length - 1]?.toLowerCase()
  }
  if (
    contentType.startsWith('image/') ||
    webImageFormats.includes(fileExtension)
  )
    return 'image'
  if (contentType === 'application/pdf' || fileExtension === 'pdf') return 'pdf'
  if (
    contentType.startsWith('video/') ||
    webVideoFormats.includes(fileExtension)
  )
    return 'video'
  if (
    contentType.startsWith('audio/') ||
    webAudioFormats.includes(fileExtension)
  )
    return 'audio'
  if (
    contentType.startsWith('text/') ||
    contentType === 'application/json' ||
    fileExtension === 'txt'
  )
    return 'text'
  return 'other'
}
