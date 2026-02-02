'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Image as ImageIcon, Video, GripVertical, Calendar } from 'lucide-react'
import { GalleryItem } from '@/types/database.types'
import { Button, Modal, Input, Textarea, Skeleton, CloudinaryUpload } from '@/components/ui'
import toast from 'react-hot-toast'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/gallery?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      setItems(items.filter((i) => i.id !== id))
      toast.success('Item deleted')
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setShowModal(true)
  }

  const handleSubmit = async (formData: Partial<GalleryItem>) => {
    setIsSubmitting(true)

    try {
      if (editingItem) {
        const response = await fetch('/api/gallery', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...formData }),
        })

        if (!response.ok) throw new Error('Failed to update')

        const updatedItem = await response.json()
        setItems(items.map((i) => (i.id === editingItem.id ? updatedItem : i)))
        toast.success('Item updated')
      } else {
        const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order_index)) : 0
        const response = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, order_index: maxOrder + 1 }),
        })

        if (!response.ok) throw new Error('Failed to create')

        const newItem = await response.json()
        setItems([...items, newItem])
        toast.success('Item added')
      }

      setShowModal(false)
    } catch (error) {
      toast.error('Failed to save item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Manage Gallery</h2>
        <Button onClick={handleAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add Item
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 card">
          <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No gallery items yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-white/5">
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                />
              )}

              {/* Type indicator */}
              <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-dark-950/80">
                {item.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 text-white" />
                ) : (
                  <Video className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Month/Year badge */}
              <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-dark-950/80 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary-400" />
                <span className="text-xs text-white/80">
                  {MONTH_NAMES[(item.month || 1) - 1]?.slice(0, 3)} {item.year}
                </span>
              </div>

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-dark-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-dark-950/80 to-transparent">
                <p className="text-sm text-white truncate">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Gallery Item' : 'Add Gallery Item'}
        size="md"
      >
        <GalleryItemForm
          item={editingItem}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  )
}

interface GalleryItemFormProps {
  item: GalleryItem | null
  onSubmit: (data: Partial<GalleryItem>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

function GalleryItemForm({ item, onSubmit, onCancel, isSubmitting }: GalleryItemFormProps) {
  const currentDate = new Date()
  const [type, setType] = useState<'image' | 'video'>(item?.type || 'image')
  const [url, setUrl] = useState(item?.url || '')
  const [title, setTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || '')
  const [month, setMonth] = useState(item?.month || currentDate.getMonth() + 1)
  const [year, setYear] = useState(item?.year || currentDate.getFullYear())

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - i)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim() || !title.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    onSubmit({
      type,
      url: url.trim(),
      title: title.trim(),
      description: description.trim() || null,
      month,
      year,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <span className="text-white/80">Image</span>
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
        label={type === 'image' ? 'Image' : 'Video'}
        value={url}
        onChange={setUrl}
        resourceType={type}
        folder="tripleabookclub/gallery"
      />

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Item title"
      />

      <Textarea
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Brief description"
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {item ? 'Update' : 'Add'} Item
        </Button>
      </div>
    </form>
  )
}
