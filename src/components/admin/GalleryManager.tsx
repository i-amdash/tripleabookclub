'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Image as ImageIcon, Video, GripVertical } from 'lucide-react'
import { useSupabase } from '@/hooks'
import { GalleryItem } from '@/types/database.types'
import { Button, Modal, Input, Textarea, Skeleton, CloudinaryUpload } from '@/components/ui'
import toast from 'react-hot-toast'

export function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = useSupabase()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('order_index', { ascending: true })

    setItems(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    const { error } = await supabase.from('gallery').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete item')
      return
    }

    setItems(items.filter((i) => i.id !== id))
    toast.success('Item deleted')
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
        const { error } = await supabase
          .from('gallery')
          .update(formData)
          .eq('id', editingItem.id)

        if (error) throw error

        setItems(items.map((i) => (i.id === editingItem.id ? { ...i, ...formData } : i)))
        toast.success('Item updated')
      } else {
        const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order_index)) : 0
        const { data, error } = await supabase
          .from('gallery')
          .insert({ ...formData, order_index: maxOrder + 1 })
          .select()
          .single()

        if (error) throw error

        setItems([...items, data])
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
  const [type, setType] = useState<'image' | 'video'>(item?.type || 'image')
  const [url, setUrl] = useState(item?.url || '')
  const [title, setTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || '')

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
              onChange={() => setType('image')}
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
              onChange={() => setType('video')}
              className="w-4 h-4 text-primary-500"
            />
            <Video className="w-4 h-4 text-white/60" />
            <span className="text-white/80">Video</span>
          </label>
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
