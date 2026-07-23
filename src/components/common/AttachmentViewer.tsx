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

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  File,
  Maximize2,
  Minimize2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { base64ToBlob, formatBytes, getFileType } from '@/utils/attachmentUtils'

interface AttachmentFile {
  filename: string
  contentType: string
  content: string
  size: number
}

interface AttachmentViewerProps {
  isOpen: boolean
  onClose: () => void
  file: AttachmentFile | null
  allFiles?: AttachmentFile[]
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  isOpen,
  onClose,
  file,
  allFiles = [],
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Combined list of files to support navigation
  const files = useMemo(() => {
    if (allFiles && allFiles.length > 0) {
      // Ensure the initial file is in the list
      if (file && !allFiles.some(f => f.filename === file.filename)) {
        return [file, ...allFiles]
      }
      return allFiles
    }
    return file ? [file] : []
  }, [file, allFiles])

  // Reset index when file or allFiles changes
  useEffect(() => {
    if (file) {
      const index = files.findIndex(f => f.filename === file.filename)
      if (index !== -1) {
        setCurrentIndex(index)
      } else {
        setCurrentIndex(0)
      }
    }
  }, [file, files])

  const currentFile = files[currentIndex] || null

  useEffect(() => {
    if (currentFile && isOpen) {
      setIsLoading(true)
      setTextContent(null)

      try {
        const blob = base64ToBlob(
          currentFile.content,
          currentFile.contentType,
          currentFile.filename
        )
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)

        if (
          getFileType(currentFile.contentType, currentFile?.filename) === 'text'
        ) {
          const reader = new FileReader()
          reader.onload = e => {
            setTextContent(e.target?.result as string)
            setIsLoading(false)
          }
          reader.onerror = () => setIsLoading(false)
          reader.readAsText(blob)
        } else {
          setIsLoading(false)
        }
      } catch (e) {
        console.error('Failed to process file', e)
        setIsLoading(false)
      }
    } else {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
        setBlobUrl(null)
      }
    }

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [currentFile, isOpen])

  const handleDownload = () => {
    if (!blobUrl || !currentFile) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = currentFile.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleNext = useCallback(() => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, files.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleNext, handlePrev])

  const type = currentFile
    ? getFileType(currentFile.contentType, currentFile.filename)
    : 'other'

  const renderContent = () => {
    if (!currentFile || !blobUrl) return null
    if (isLoading) {
      return (
        <div className='flex flex-col items-center justify-center py-20'>
          <Loader2 className='w-10 h-10 animate-spin mb-4 text-primary' />
          <p className='text-sm text-muted-foreground'>Loading preview...</p>
        </div>
      )
    }

    switch (type) {
      case 'image':
        return (
          <div className='flex items-center justify-center min-h-[400px] p-4 group relative'>
            <img
              src={blobUrl}
              alt={currentFile.filename}
              className='max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl transition-all duration-300'
            />
          </div>
        )
      case 'pdf':
        return (
          <div className='w-full h-[75vh] rounded-lg overflow-hidden border border-white/10'>
            <iframe
              src={`${blobUrl}#toolbar=0`}
              className='w-full h-full bg-white'
              title='PDF Preview'
            />
          </div>
        )
      case 'video':
        return (
          <div className='flex items-center justify-center min-h-[400px] p-4'>
            <video
              controls
              className='max-w-full max-h-[75vh] rounded-lg shadow-2xl'
              src={blobUrl}
            />
          </div>
        )
      case 'audio':
        return (
          <div className='flex flex-col items-center justify-center py-20'>
            <div className='w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6'>
              <Music className='w-10 h-10 text-primary' />
            </div>
            <h4 className='text-lg font-semibold mb-6 text-white'>
              {currentFile.filename}
            </h4>
            <audio controls className='w-full max-w-md' src={blobUrl} />
          </div>
        )
      case 'text':
        return (
          <div className='border border-white/10 rounded-lg p-4 overflow-auto max-h-[75vh] bg-black/40'>
            <pre className='text-sm font-mono whitespace-pre-wrap text-gray-200'>
              {textContent || 'Loading...'}
            </pre>
          </div>
        )
      default:
        return (
          <div className='flex flex-col items-center justify-center py-20'>
            <div className='w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4'>
              <File className='w-10 h-10 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold mb-2 text-white'>
              Preview not available
            </h3>
            <p className='text-gray-400 text-sm mb-6 max-w-xs text-center'>
              Cannot preview this file type ({currentFile.contentType})
            </p>
            <Button
              onClick={handleDownload}
              variant='secondary'
              className='gap-2'
            >
              <Download className='w-4 h-4' /> Download to View
            </Button>
          </div>
        )
    }
  }

  const HeaderIcon = useMemo(() => {
    switch (type) {
      case 'image':
        return ImageIcon
      case 'pdf':
        return FileText
      case 'video':
        return Video
      case 'audio':
        return Music
      default:
        return File
    }
  }, [type])

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={open => !open && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-[100] bg-black/90 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <DialogPrimitive.Content
          className={`fixed left-[50%] top-[50%] z-[101] translate-x-[-50%] translate-y-[-50%] flex flex-col bg-transparent outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ${
            isFullscreen
              ? 'w-screen h-screen'
              : 'w-[98vw] sm:w-[90vw] lg:w-[80vw] max-h-[95vh]'
          }`}
        >
          <DialogPrimitive.Title className='sr-only'>
            {currentFile?.filename || 'Attachment Viewer'}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className='sr-only'>
            Preview of {currentFile?.filename}
          </DialogPrimitive.Description>

          <div
            className='flex flex-col h-full overflow-hidden'
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 shrink-0 bg-black/50 backdrop-blur-sm border-b border-white/10'>
              <div className='flex items-center gap-4 overflow-hidden flex-1 min-w-0'>
                <div className='p-2.5 rounded-xl bg-primary/20 text-primary shrink-0 border border-primary/20'>
                  <HeaderIcon className='w-5 h-5' />
                </div>
                <div className='flex flex-col overflow-hidden flex-1 min-w-0'>
                  <h3 className='text-base font-semibold text-white truncate'>
                    {currentFile?.filename || 'Attachment'}
                  </h3>
                  {currentFile && (
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-gray-400'>
                        {formatBytes(currentFile.size)}
                      </span>
                      <span className='text-gray-600 font-bold'>•</span>
                      <span className='text-xs text-gray-400 uppercase truncate'>
                        {currentFile.contentType}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex items-center gap-2 shrink-0'>
                {files.length > 1 && (
                  <div className='flex items-center bg-white/5 rounded-lg border border-white/10 p-1 mr-4'>
                    <Button
                      variant='ghost'
                      size='icon'
                      disabled={currentIndex === 0}
                      onClick={handlePrev}
                      className='h-8 w-8 text-white hover:bg-white/10 disabled:opacity-30'
                    >
                      <ChevronLeft className='w-4 h-4' />
                    </Button>
                    <span className='px-3 text-xs font-medium text-white min-w-[60px] text-center'>
                      {currentIndex + 1} / {files.length}
                    </span>
                    <Button
                      variant='ghost'
                      size='icon'
                      disabled={currentIndex === files.length - 1}
                      onClick={handleNext}
                      className='h-8 w-8 text-white hover:bg-white/10 disabled:opacity-30'
                    >
                      <ChevronRight className='w-4 h-4' />
                    </Button>
                  </div>
                )}

                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className='h-9 w-9 hidden sm:flex text-white hover:bg-white/10 rounded-lg'
                >
                  {isFullscreen ? (
                    <Minimize2 className='w-4 h-4' />
                  ) : (
                    <Maximize2 className='w-4 h-4' />
                  )}
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleDownload}
                  className='h-9 w-9 text-white hover:bg-white/10 rounded-lg'
                >
                  <Download className='w-4 h-4' />
                </Button>
                <DialogPrimitive.Close asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-9 w-9 text-white hover:bg-destructive/20 hover:text-red-400 rounded-lg ml-2'
                  >
                    <X className='w-5 h-5' />
                  </Button>
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* Content Container */}
            <div className='relative flex-1 flex flex-col justify-center overflow-hidden bg-black/20'>
              {/* Navigation Arrows Overlay (Mobile-friendly and Desktop) */}
              {files.length > 1 && (
                <>
                  <div className='absolute left-4 top-1/2 -translate-y-1/2 z-10'>
                    <Button
                      variant='ghost'
                      size='icon'
                      disabled={currentIndex === 0}
                      onClick={handlePrev}
                      className='h-12 w-12 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 hover:scale-105 transition-all disabled:opacity-0 pointer-events-auto'
                    >
                      <ChevronLeft className='w-6 h-6' />
                    </Button>
                  </div>
                  <div className='absolute right-4 top-1/2 -translate-y-1/2 z-10'>
                    <Button
                      variant='ghost'
                      size='icon'
                      disabled={currentIndex === files.length - 1}
                      onClick={handleNext}
                      className='h-12 w-12 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 hover:scale-105 transition-all disabled:opacity-0 pointer-events-auto'
                    >
                      <ChevronRight className='w-6 h-6' />
                    </Button>
                  </div>
                </>
              )}

              {/* Real Content */}
              <div className='flex-1 overflow-auto p-4 sm:p-8 lg:p-12 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300'>
                {renderContent()}
              </div>
            </div>

            {/* Sub-footer (Optional: Thumbnail list or strip for more context?) */}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
