"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  // optional: callback with actual File objects and data URLs for upload
  onFilesSelected?: (files: { file: File; dataUrl: string; previewUrl: string }[]) => void
}

export function ImageUpload({ photos, onPhotosChange, onFilesSelected }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos = Array.from(files).slice(0, 2 - photos.length)
    const photoUrls = newPhotos.map((file) => URL.createObjectURL(file))
    onPhotosChange([...photos, ...photoUrls])

    if (onFilesSelected) {
      const readers = newPhotos.map((file, idx) =>
        new Promise<{ file: File; dataUrl: string; previewUrl: string }>((res) => {
          const r = new FileReader()
          r.onload = () => res({ file, dataUrl: String(r.result), previewUrl: photoUrls[idx] })
          r.readAsDataURL(file)
        })
      )
      Promise.all(readers).then((res) => onFilesSelected?.(res))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files) return

    const newPhotos = Array.from(files).slice(0, 2 - photos.length)
    const photoUrls = newPhotos.map((file) => URL.createObjectURL(file))
    onPhotosChange([...photos, ...photoUrls])

    if (onFilesSelected) {
      const readers = newPhotos.map((file, idx) =>
        new Promise<{ file: File; dataUrl: string; previewUrl: string }>((res) => {
          const r = new FileReader()
          r.onload = () => res({ file, dataUrl: String(r.result), previewUrl: photoUrls[idx] })
          r.readAsDataURL(file)
        })
      )
      Promise.all(readers).then((res) => onFilesSelected?.(res))
    }
  }

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? "border-ucab-maroon bg-ucab-maroon/5" : "border-gray-300"
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={photos.length >= 2}
        />
        <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="mb-2 text-sm font-medium">
          {photos.length >= 2 ? "Máximo de fotos alcanzado" : "Arrastra fotos aquí o haz clic para seleccionar"}
        </p>
        <p className="text-xs text-muted-foreground">Exactamente 2 fotos requeridas</p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg">
              <Image src={photo || "/placeholder.svg"} alt={`Foto ${index + 1}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                Foto {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
