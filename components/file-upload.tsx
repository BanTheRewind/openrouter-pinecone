// components/file-upload.tsx
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AttachFileIcon } from './ui/attach-file'
import { LoaderPinwheelIcon } from './ui/loader-pinwheel'
import { CheckIcon } from './ui/check'
import { cn } from '@/lib/utils'
import { useOpenRouterAuth } from '@/app/openrouter-auth-provider'

interface FileUploadProps {
  className?: string
}

export function FileUpload({ className }: FileUploadProps) {
  const { openRouterKey } = useOpenRouterAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!openRouterKey) {
      console.error('OpenRouter key not found')
      return
    }

    const file = e.target.files?.[0]
    if (!file || !file.type.includes('pdf')) return

    try {
      setIsUploading(true)
      setIsSuccess(false)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      setIsUploading(false)
      setIsSuccess(true)
      
      // Reset after showing success
      setTimeout(() => {
        setIsSuccess(false)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }, 2000)
      
    } catch (error) {
      console.error('Upload error:', error)
      setIsUploading(false)
      setIsSuccess(false)
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        onClick={handleButtonClick}
        disabled={isUploading || !openRouterKey}
        size="icon"
        variant="outline"
      >
        {isUploading ? (
          <LoaderPinwheelIcon />
        ) : isSuccess ? (
          <CheckIcon />
        ) : (
          <AttachFileIcon />
        )}
        <span className="sr-only">
          {isUploading ? 'Uploading...' : isSuccess ? 'Uploaded!' : 'Upload PDF'}
        </span>
      </Button>
      <input
        type="file"
        ref={inputRef}
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
