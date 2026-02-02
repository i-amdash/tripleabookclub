'use client'

import { CldUploadWidget, CloudinaryUploadWidgetResults } from 'next-cloudinary'
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react'
import { useState, useEffect } from 'react'

interface CloudinaryUploadProps {
  value?: string
  onChange: (url: string) => void
  resourceType?: 'image' | 'video' | 'auto'
  label?: string
  folder?: string
}

// Helper to convert Cloudinary URL to serve HEIC/HEIF as JPG
function getDisplayUrl(url: string): string {
  if (!url) return url
  
  // Check if it's a Cloudinary image URL with HEIC/HEIF
  if (url.includes('cloudinary.com') && (url.includes('.heic') || url.includes('.heif'))) {
    // Insert f_auto transformation to auto-convert to browser-compatible format
    // Transform: /upload/ -> /upload/f_auto,q_auto/
    return url.replace('/upload/', '/upload/f_auto,q_auto/')
  }
  
  return url
}

export function CloudinaryUpload({
  value,
  onChange,
  resourceType = 'image',
  label,
  folder = 'tripleabookclub',
}: CloudinaryUploadProps) {
  const [preview, setPreview] = useState(value || '')
  // Use a unique key to force widget recreation when resourceType changes
  const [widgetKey, setWidgetKey] = useState(0)

  // Force widget recreation when resourceType changes
  useEffect(() => {
    setWidgetKey(prev => prev + 1)
    setPreview('') // Clear preview when switching types
  }, [resourceType])

  const handleUpload = (result: CloudinaryUploadWidgetResults) => {
    if (result.event === 'success' && result.info && typeof result.info !== 'string') {
      const url = result.info.secure_url
      setPreview(url)
      onChange(url)
    }
  }

  const handleClear = () => {
    setPreview('')
    onChange('')
  }

  const isVideo = resourceType === 'video' || (preview && preview.includes('/video/'))

  return (
    <div className="space-y-2">
      {label && <label className="label-text">{label}</label>}
      
      {/* Key forces widget to reinitialize when resourceType changes */}
      <CldUploadWidget
        key={`upload-${resourceType}-${widgetKey}`}
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        options={{
          folder,
          // IMPORTANT: For video uploads to work, your Cloudinary upload preset
          // must be set to "Auto" delivery type in Cloudinary Dashboard > Settings > Upload Presets
          resourceType: resourceType,
          maxFiles: 1,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          styles: {
            palette: {
              window: '#1a1a2e',
              windowBorder: '#6b21a8',
              tabIcon: '#eab308',
              menuIcons: '#eab308',
              textDark: '#000000',
              textLight: '#ffffff',
              link: '#eab308',
              action: '#eab308',
              inactiveTabIcon: '#6b7280',
              error: '#ef4444',
              inProgress: '#eab308',
              complete: '#22c55e',
              sourceBg: '#0d0d1a',
            },
          },
        }}
        onSuccess={handleUpload}
      >
        {({ open }) => (
          <div className="space-y-3">
            {/* Upload button */}
            {!preview && (
              <button
                type="button"
                onClick={() => open()}
                className="w-full border-2 border-dashed border-white/20 hover:border-primary-500/50 active:border-primary-500/70 rounded-xl p-4 sm:p-6 transition-colors group touch-manipulation"
              >
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-white/60 group-hover:text-primary-400 group-active:text-primary-400 transition-colors">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="text-xs sm:text-sm font-medium text-center">
                    Tap to upload {resourceType === 'video' ? 'video' : resourceType === 'auto' ? 'file' : 'image'}
                  </span>
                  <span className="text-xs text-white/40">
                    {resourceType === 'video' ? 'MP4, MOV, AVI, WebM' : 'JPG, PNG, GIF, WebP, HEIC'}
                  </span>
                </div>
              </button>
            )}

            {/* Preview */}
            {preview && (
              <div className="relative rounded-xl overflow-hidden bg-white/5">
                {isVideo ? (
                  <video
                    src={preview}
                    controls
                    className="w-full aspect-[4/3] sm:aspect-video object-contain"
                  />
                ) : (
                  <img
                    src={getDisplayUrl(preview)}
                    alt="Preview"
                    className="w-full aspect-[4/3] sm:aspect-video object-contain"
                  />
                )}

                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => open()}
                    className="p-2.5 sm:p-2 rounded-lg bg-dark-950/90 hover:bg-dark-950 active:bg-dark-800 text-white/80 hover:text-white transition-colors touch-manipulation"
                    title="Change"
                  >
                    <Upload className="w-4 h-4 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-2.5 sm:p-2 rounded-lg bg-dark-950/90 hover:bg-red-500/20 active:bg-red-500/30 text-white/80 hover:text-red-400 transition-colors touch-manipulation"
                    title="Remove"
                  >
                    <X className="w-4 h-4 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Type indicator */}
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-dark-950/80 flex items-center gap-1.5">
                  {isVideo ? (
                    <Video className="w-3.5 h-3.5 text-primary-400" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-primary-400" />
                  )}
                  <span className="text-xs text-white/60">
                    {isVideo ? 'Video' : 'Image'}
                  </span>
                </div>
              </div>
            )}

            {/* URL display */}
            {preview && (
              <input
                type="text"
                value={preview}
                readOnly
                className="input-field text-xs text-white/40 bg-white/5"
              />
            )}
          </div>
        )}
      </CldUploadWidget>
    </div>
  )
}
