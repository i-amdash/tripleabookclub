'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  MapPin, 
  Eye, 
  EyeOff,
  Clock,
  Building2,
  Search
} from 'lucide-react'
import { Meetup } from '@/types/database.types'
import { Button, Input, Textarea, Modal, CloudinaryUpload } from '@/components/ui'
import { getMonthName } from '@/lib/utils'
import toast from 'react-hot-toast'

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => currentYear + i - 2)

export function MeetupsManager() {
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMeetup, setEditingMeetup] = useState<Meetup | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterYear, setFilterYear] = useState<number | 'all'>('all')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue_name: '',
    address: '',
    city: 'Lagos',
    latitude: '',
    longitude: '',
    google_maps_url: '',
    event_date: '',
    event_time: '',
    end_time: '',
    month: new Date().getMonth() + 1,
    year: currentYear,
    image_url: '',
    is_published: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMeetups()
  }, [])

  const fetchMeetups = async () => {
    try {
      const response = await fetch('/api/meetups')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setMeetups(data)
    } catch (error) {
      console.error('Error fetching meetups:', error)
      toast.error('Failed to load meetups')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Combine date and time
      const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}`)
      const endDateTime = formData.end_time 
        ? new Date(`${formData.event_date}T${formData.end_time}`)
        : null

      const payload = {
        ...formData,
        event_date: eventDateTime.toISOString(),
        end_time: endDateTime?.toISOString() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        ...(editingMeetup && { id: editingMeetup.id }),
      }

      const response = await fetch('/api/meetups', {
        method: editingMeetup ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save')
      }

      const savedMeetup = await response.json()

      if (editingMeetup) {
        setMeetups(prev => prev.map(m => m.id === savedMeetup.id ? savedMeetup : m))
        toast.success('Meetup updated!')
      } else {
        setMeetups(prev => [savedMeetup, ...prev])
        toast.success('Meetup created!')
      }

      handleCloseModal()
    } catch (error) {
      console.error('Error saving meetup:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save meetup')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meetup?')) return

    try {
      const response = await fetch(`/api/meetups?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      setMeetups(prev => prev.filter(m => m.id !== id))
      toast.success('Meetup deleted!')
    } catch (error) {
      console.error('Error deleting meetup:', error)
      toast.error('Failed to delete meetup')
    }
  }

  const handleTogglePublish = async (meetup: Meetup) => {
    try {
      const response = await fetch('/api/meetups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: meetup.id, is_published: !meetup.is_published }),
      })

      if (!response.ok) throw new Error('Failed to update')

      const updatedMeetup = await response.json()
      setMeetups(prev => prev.map(m => m.id === updatedMeetup.id ? updatedMeetup : m))
      toast.success(updatedMeetup.is_published ? 'Meetup published!' : 'Meetup unpublished')
    } catch (error) {
      console.error('Error updating meetup:', error)
      toast.error('Failed to update meetup')
    }
  }

  const handleEdit = (meetup: Meetup) => {
    const eventDate = new Date(meetup.event_date)
    const endDate = meetup.end_time ? new Date(meetup.end_time) : null

    setEditingMeetup(meetup)
    setFormData({
      title: meetup.title,
      description: meetup.description || '',
      venue_name: meetup.venue_name,
      address: meetup.address,
      city: meetup.city || 'Lagos',
      latitude: meetup.latitude?.toString() || '',
      longitude: meetup.longitude?.toString() || '',
      google_maps_url: meetup.google_maps_url || '',
      event_date: eventDate.toISOString().split('T')[0],
      event_time: eventDate.toTimeString().slice(0, 5),
      end_time: endDate ? endDate.toTimeString().slice(0, 5) : '',
      month: meetup.month,
      year: meetup.year,
      image_url: meetup.image_url || '',
      is_published: meetup.is_published,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMeetup(null)
    setFormData({
      title: '',
      description: '',
      venue_name: '',
      address: '',
      city: 'Lagos',
      latitude: '',
      longitude: '',
      google_maps_url: '',
      event_date: '',
      event_time: '',
      end_time: '',
      month: new Date().getMonth() + 1,
      year: currentYear,
      image_url: '',
      is_published: false,
    })
  }

  const filteredMeetups = meetups.filter(meetup => {
    const matchesSearch = meetup.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meetup.venue_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesYear = filterYear === 'all' || meetup.year === filterYear
    return matchesSearch && matchesYear
  })

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Meet-ups</h2>
          <p className="text-white/60">Manage monthly gatherings and events</p>
        </div>
        <Button onClick={() => setShowModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Meet-up
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search meetups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="input-field w-full sm:w-40"
        >
          <option value="all">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Meetups List */}
      <div className="space-y-4">
        {filteredMeetups.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No meetups found</p>
          </div>
        ) : (
          filteredMeetups.map((meetup, index) => (
            <motion.div
              key={meetup.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-4 flex flex-col sm:flex-row gap-4"
            >
              {/* Thumbnail */}
              <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-dark-800 flex-shrink-0">
                {meetup.image_url ? (
                  <img src={meetup.image_url} alt={meetup.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-white/20" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{meetup.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        meetup.is_published 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {meetup.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-white/60">{getMonthName(meetup.month)} {meetup.year}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{formatDateTime(meetup.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">{meetup.venue_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{meetup.city}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col items-center gap-2 sm:justify-center">
                <button
                  onClick={() => handleTogglePublish(meetup)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title={meetup.is_published ? 'Unpublish' : 'Publish'}
                >
                  {meetup.is_published ? (
                    <Eye className="w-5 h-5 text-green-400" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-white/40" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(meetup)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5 text-white/60" />
                </button>
                <button
                  onClick={() => handleDelete(meetup.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingMeetup ? 'Edit Meet-up' : 'Add Meet-up'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <Input
            label="Title"
            placeholder="e.g., January Book Club Meet-up"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />

          <Textarea
            label="Description"
            placeholder="Describe what the meetup is about..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Month</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: Number(e.target.value) }))}
                className="input-field"
                required
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                className="input-field"
                required
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Input
              label="Event Date"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
              required
            />
            <Input
              label="Start Time"
              type="time"
              value={formData.event_time}
              onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
              required
            />
            <Input
              label="End Time (optional)"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
            />
          </div>

          <Input
            label="Venue Name"
            placeholder="e.g., Bogobiri House"
            value={formData.venue_name}
            onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
            required
          />

          <Input
            label="Address"
            placeholder="e.g., 9 Maitama Sule Street, Ikoyi"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            required
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="Lagos"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            />
            <Input
              label="Google Maps URL (optional)"
              placeholder="https://maps.google.com/..."
              value={formData.google_maps_url}
              onChange={(e) => setFormData(prev => ({ ...prev, google_maps_url: e.target.value }))}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Latitude (optional)"
              placeholder="e.g., 6.4541"
              value={formData.latitude}
              onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
            />
            <Input
              label="Longitude (optional)"
              placeholder="e.g., 3.4347"
              value={formData.longitude}
              onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
            />
          </div>

          <CloudinaryUpload
            label="Cover Image (optional)"
            value={formData.image_url}
            onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
            resourceType="image"
            folder="tripleabookclub/meetups"
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
              className="w-5 h-5 rounded border-white/20 bg-dark-800 text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="is_published" className="text-white/80">
              Publish this meetup (visible to members)
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingMeetup ? 'Update Meet-up' : 'Create Meet-up'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
