// components/file-upload.tsx
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { IconUpload } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  className?: string
}

export function FileUpload({ className }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string>()
  const [isSuccess, setIsSuccess] = useState(false)
  const [showFullMessage, setShowFullMessage] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('File selected:', file?.name)

    if (!file || !file.type.includes('pdf')) return

    try {
      console.log('Starting upload process...')
      setIsSuccess(false)
      setIsUploading(true)
      setFileName(file.name)
      setShowFullMessage(false)

      const formData = new FormData()
      formData.append('file', file)

      console.log('Sending request to:', '/api/upload')
      console.log('File type:', file.type)
      console.log('File size:', file.size)

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          // Don't set Content-Type - browser will set it with boundary for FormData
          'X-Debug-Info': 'file-upload-component'
        },
        body: formData
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Response error:', errorData)
        throw new Error(`Upload failed: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      console.log('Upload successful:', data)
      setIsSuccess(true)
      setShowFullMessage(true)
      setTimeout(() => {
        setShowFullMessage(false)
      }, 3000)
      
    } catch (error) {
      console.error('Upload error:', error)
      setIsSuccess(false)
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        onClick={handleButtonClick}
        disabled={isUploading}
        size="icon"
        variant="outline"
      >
        <IconUpload />
        <span className="sr-only">
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </span>
      </Button>
      <input
        type="file"
        ref={inputRef}
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      {fileName && (
        <span className="text-sm ml-2">
          {isUploading ? (
            <span className="text-muted-foreground">Uploading {fileName}...</span>
          ) : isSuccess ? (
            showFullMessage ? (
              <span className="text-green-600">
                File uploaded successfully! Now chatting with {fileName}
              </span>
            ) : (
              <span className="text-muted-foreground">{fileName}</span>
            )
          ) : (
            <span className="text-muted-foreground">{fileName}</span>
          )}
        </span>
      )}
    </div>
  )
}
