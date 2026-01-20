'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Play, X, Image as ImageIcon, Video, ZoomIn, Plus } from 'lucide-react'
import { useSupabase } from '@/hooks'
import { GalleryItem } from '@/types/database.types'
import { Tabs, TabPanel, Skeleton, Button, Modal, Input, Textarea, CloudinaryUpload } from '@/components/ui'
import toast from 'react-hot-toast'

gsap.registerPlugin(ScrollTrigger)

const tabs = [
  { id: 'all', label: 'All', icon: null },
  { id: 'image', label: 'Photos', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'video', label: 'Videos', icon: <Video className="w-4 h-4" /> },
]

export function GalleryContent() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  const supabase = useSupabase()

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await supabase
        .from('gallery')
        .select('*')
        .order('order_index', { ascending: true })

      setItems(data || [])
      setLoading(false)
    }

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }

    fetchGallery()
    checkAuth()
  }, [supabase])

  useEffect(() => {
    if (!galleryRef.current || loading) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gallery-item',
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: galleryRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, galleryRef)

    return () => ctx.revert()
  }, [loading, activeTab])

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.type === activeTab)

  const handleUploadSuccess = (newItem: GalleryItem) => {
    setItems([...items, newItem])
    setShowUploadModal(false)
    toast.success('Media uploaded successfully!')
  }

  return (
    <section className="section-padding pt-0">
      <div className="container-main">
        {/* Header with Tabs and Upload Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          
          {isAuthenticated && (
            <Button 
              onClick={() => setShowUploadModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Media
            </Button>
          )}
        </div>

        {/* Gallery Grid */}
        <TabPanel value={activeTab} activeValue={activeTab}>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 card"
            >
              <div className="text-6xl mb-4">📷</div>
              <h4 className="text-xl font-semibold text-white mb-2">
                No Media Yet
              </h4>
              <p className="text-white/60">
                Check back soon for photos and videos from our events!
              </p>
            </motion.div>
          ) : (
            <div ref={galleryRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item, index) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  index={index}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}
        </TabPanel>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <Lightbox
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            items={filteredItems}
            onNavigate={setSelectedItem}
          />
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Add to Gallery"
        size="md"
      >
        <GalleryUploadForm
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadModal(false)}
        />
      </Modal>
    </section>
  )
}

interface GalleryCardProps {
  item: GalleryItem
  index: number
  onClick: () => void
}

function GalleryCard({ item, index, onClick }: GalleryCardProps) {
  const isWide = index % 7 === 0 || index % 7 === 3
  const isTall = index % 11 === 5

  return (
    <motion.div
      className={`gallery-item relative group cursor-pointer overflow-hidden rounded-xl ${
        isWide ? 'md:col-span-2' : ''
      } ${isTall ? 'md:row-span-2' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`relative ${isTall ? 'aspect-[3/4]' : 'aspect-square'}`}>
        {item.type === 'image' ? (
          <img
            src={item.url}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <>
            <video
              src={item.url}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              loop
              playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause()
                e.currentTarget.currentTime = 0
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          </>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h4 className="text-white font-semibold mb-1">{item.title}</h4>
            {item.description && (
              <p className="text-white/60 text-sm line-clamp-2">{item.description}</p>
            )}
          </div>
        </div>

        {/* Zoom icon */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
            <ZoomIn className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface LightboxProps {
  item: GalleryItem
  items: GalleryItem[]
  onClose: () => void
  onNavigate: (item: GalleryItem) => void
}

function Lightbox({ item, items, onClose, onNavigate }: LightboxProps) {
  const currentIndex = items.findIndex(i => i.id === item.id)

  const handlePrev = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
    onNavigate(items[prevIndex])
  }

  const handleNext = () => {
    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
    onNavigate(items[nextIndex])
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/95 backdrop-blur-lg"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Navigation */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handlePrev()
        }}
        className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation()
          handleNext()
        }}
        className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Content */}
      <motion.div
        key={item.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="max-w-5xl max-h-[90vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'image' ? (
          <img
            src={item.url}
            alt={item.title}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        ) : (
          <video
            src={item.url}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] rounded-lg"
          />
        )}

        {/* Caption */}
        <div className="mt-4 text-center">
          <h4 className="text-xl font-semibold text-white">{item.title}</h4>
          {item.description && (
            <p className="text-white/60 mt-2">{item.description}</p>
          )}
        </div>
      </motion.div>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {currentIndex + 1} / {items.length}
      </div>
    </motion.div>
  )
}

// Gallery Upload Form for Members
interface GalleryUploadFormProps {
  onSuccess: (item: GalleryItem) => void
  onCancel: () => void
}

function GalleryUploadForm({ onSuccess, onCancel }: GalleryUploadFormProps) {
  const [type, setType] = useState<'image' | 'video'>('image')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = useSupabase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim() || !title.trim()) {
      toast.error('Please upload a file and add a title')
      return
    }

    setIsSubmitting(true)

    try {
      // Get the max order index
      const { data: existingItems } = await supabase
        .from('gallery')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)

      const maxOrder = existingItems?.[0]?.order_index || 0

      const { data, error } = await supabase
        .from('gallery')
        .insert({
          type,
          url: url.trim(),
          title: title.trim(),
          description: description.trim() || null,
          order_index: maxOrder + 1,
        })
        .select()
        .single()

      if (error) throw error

      onSuccess(data)
    } catch (error) {
      toast.error('Failed to upload media. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-white/60 text-sm">
        Share photos or videos from book club events with the community!
      </p>

      <div>
        <label className="label-text">Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="image"
              checked={type === 'image'}
              onChange={() => {
                setType('image')
                setUrl('')
              }}
              className="w-4 h-4 text-primary-500"
            />
            <ImageIcon className="w-4 h-4 text-white/60" />
            <span className="text-white/80">Photo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="video"
              checked={type === 'video'}
              onChange={() => {
                setType('video')
                setUrl('')
              }}
              className="w-4 h-4 text-primary-500"
            />
            <Video className="w-4 h-4 text-white/60" />
            <span className="text-white/80">Video</span>
          </label>
        </div>
      </div>

      <CloudinaryUpload
        label={type === 'image' ? 'Photo' : 'Video'}
        value={url}
        onChange={setUrl}
        resourceType={type}
        folder="tripleabookclub/gallery"
      />

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give your media a title"
      />

      <Textarea
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a brief description"
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Upload
        </Button>
      </div>
    </form>
  )
}
