// components/pdf/file-upload.tsx
'use client'

import { useState } from 'react'
import { Button } from './ui/button'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.includes('pdf')) return

    try {
      setIsUploading(true)
      await onUpload(file)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-xl">
      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
        Upload PDF
      </label>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder:text-gray-400"
        disabled={isUploading}
      />
    </div>
  )
}
