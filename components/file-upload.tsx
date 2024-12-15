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
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('File selected:', file?.name)

    if (!file || !file.type.includes('pdf')) return

    try {
      console.log('Starting upload process...')
      setIsUploading(true)
      setFileName(file.name)

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
      
    } catch (error) {
      console.error('Upload error:', error)
      // You might want to show an error message to the user here
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
        <span className="text-sm text-muted-foreground ml-2">
          {isUploading ? `Uploading ${fileName}...` : fileName}
        </span>
      )}
    </div>
  )
}
