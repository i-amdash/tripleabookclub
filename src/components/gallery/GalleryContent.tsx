'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Play, X, Image as ImageIcon, Video, ZoomIn, Plus, Calendar, ArrowLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks'
import { GalleryItem } from '@/types/database.types'
import { Tabs, TabPanel, Skeleton, Button, Modal, Input, Textarea, CloudinaryUpload } from '@/components/ui'
import toast from 'react-hot-toast'

gsap.registerPlugin(ScrollTrigger)

const tabs = [
  { id: 'all', label: 'All', icon: null },
  { id: 'image', label: 'Photos', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'video', label: 'Videos', icon: <Video className="w-4 h-4" /> },
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface MonthGroup {
  key: string
  month: number
  year: number
  label: string
  items: GalleryItem[]
  thumbnails: string[]
}

export function GalleryContent() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<MonthGroup | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch('/api/gallery')
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        setItems(data || [])
      } catch (error) {
        console.error('Error fetching gallery:', error)
        toast.error('Failed to load gallery')
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, [])

  useEffect(() => {
    if (!galleryRef.current || loading) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gallery-item, .month-card',
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
  }, [loading, activeTab, selectedMonth])

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.type === activeTab)

  // Group items by month and year (using month/year fields from database)
  const monthGroups = useMemo(() => {
    const groups: Record<string, MonthGroup> = {}
    
    filteredItems.forEach(item => {
      // Use month and year from database (month is 1-12, convert to 0-11 for array index)
      const month = (item.month || 1) - 1 // Convert to 0-indexed for MONTH_NAMES array
      const year = item.year || new Date().getFullYear()
      const key = `${year}-${month}`
      
      if (!groups[key]) {
        groups[key] = {
          key,
          month,
          year,
          label: `${MONTH_NAMES[month]} ${year}`,
          items: [],
          thumbnails: []
        }
      }
      
      groups[key].items.push(item)
      // Collect up to 4 thumbnails for the card preview
      if (groups[key].thumbnails.length < 4) {
        groups[key].thumbnails.push(item.url)
      }
    })
    
    // Sort by date (newest first)
    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
  }, [filteredItems])

  // Get items for the selected month, filtered by type
  const selectedMonthItems = useMemo(() => {
    if (!selectedMonth) return []
    return activeTab === 'all' 
      ? selectedMonth.items 
      : selectedMonth.items.filter(item => item.type === activeTab)
  }, [selectedMonth, activeTab])

  const handleUploadSuccess = (newItem: GalleryItem) => {
    setItems([...items, newItem])
    setShowUploadModal(false)
    toast.success('Media uploaded successfully!')
  }

  const handleBackToMonths = () => {
    setSelectedMonth(null)
  }

  return (
    <section className="section-padding pt-0">
      <div className="container-main">
        {/* Header with Tabs and Upload Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {selectedMonth && (
              <Button
                variant="ghost"
                onClick={handleBackToMonths}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="mr-2"
              >
                Back
              </Button>
            )}
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
          
          {user && (
            <Button 
              onClick={() => setShowUploadModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Media
            </Button>
          )}
        </div>

        {/* Show selected month title */}
        <AnimatePresence mode="wait">
          {selectedMonth && (
            <motion.div
              key="month-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary-500" />
                {selectedMonth.label}
              </h2>
              <p className="text-white/60 mt-2">
                {selectedMonthItems.length} {selectedMonthItems.length === 1 ? 'item' : 'items'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery Content */}
        <TabPanel value={activeTab} activeValue={activeTab}>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
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
            <AnimatePresence mode="wait">
              {selectedMonth ? (
                // Show items in the selected month
                <motion.div
                  key="month-items"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  ref={galleryRef}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {selectedMonthItems.map((item, index) => (
                    <GalleryCard
                      key={item.id}
                      item={item}
                      index={index}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </motion.div>
              ) : (
                // Show month cards
                <motion.div
                  key="month-cards"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  ref={galleryRef}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {monthGroups.map((group) => (
                    <MonthCard
                      key={group.key}
                      group={group}
                      onClick={() => setSelectedMonth(group)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </TabPanel>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <Lightbox
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            items={selectedMonthItems}
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

// Month Card Component
interface MonthCardProps {
  group: MonthGroup
  onClick: () => void
}

function MonthCard({ group, onClick }: MonthCardProps) {
  const imageCount = group.items.filter(i => i.type === 'image').length
  const videoCount = group.items.filter(i => i.type === 'video').length

  return (
    <motion.div
      className="month-card group cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border border-white/10 hover:border-primary-500/50 transition-all duration-300 shadow-xl hover:shadow-primary-500/20">
        {/* Thumbnail Grid */}
        <div className="aspect-[4/3] relative">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
            {group.thumbnails.slice(0, 4).map((url, index) => (
              <div key={index} className="relative overflow-hidden">
                <img
                  src={url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            ))}
            {/* Fill empty slots with placeholder */}
            {Array.from({ length: Math.max(0, 4 - group.thumbnails.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-dark-700/50 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-white/20" />
              </div>
            ))}
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                {MONTH_NAMES[group.month]}
              </h3>
              <p className="text-4xl font-black text-white/20 -mt-2">{group.year}</p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-3 text-white/60">
                {imageCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    {imageCount}
                  </span>
                )}
                {videoCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Video className="w-4 h-4" />
                    {videoCount}
                  </span>
                )}
              </div>
              
              <div className="mt-2 flex items-center gap-1 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">View Gallery</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <Calendar className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
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
  const currentDate = new Date()
  const [type, setType] = useState<'image' | 'video'>('image')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [month, setMonth] = useState(currentDate.getMonth() + 1) // 1-12
  const [year, setYear] = useState(currentDate.getFullYear())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - i)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim() || !title.trim()) {
      toast.error('Please upload a file and add a title')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          url: url.trim(),
          title: title.trim(),
          description: description.trim() || null,
          month,
          year,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload')
      }

      const data = await response.json()
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

      {/* Month and Year Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="input-field w-full"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={index} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-text">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="input-field w-full"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
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
