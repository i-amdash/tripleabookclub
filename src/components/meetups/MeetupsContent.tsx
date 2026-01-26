'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Download,
  ExternalLink,
  CalendarPlus,
  History,
  Sparkles,
  Building2
} from 'lucide-react'
import { Meetup } from '@/types/database.types'
import { Tabs, TabPanel, Button, Modal } from '@/components/ui'
import { getMonthName } from '@/lib/utils'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'upcoming', label: 'Upcoming', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'past', label: 'Past Meet-ups', icon: <History className="w-4 h-4" /> },
]

export function MeetupsContent() {
  const [activeTab, setActiveTab] = useState('upcoming')
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMap, setExpandedMap] = useState<string | null>(null)
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null)

  useEffect(() => {
    fetchMeetups()
  }, [])

  const fetchMeetups = async () => {
    try {
      const response = await fetch('/api/meetups')
      if (!response.ok) throw new Error('Failed to fetch meetups')
      const data = await response.json()
      setMeetups(data)
    } catch (error) {
      console.error('Error fetching meetups:', error)
      toast.error('Failed to load meetups')
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()

  const { upcomingMeetups, pastMeetups, pastMeetupsByYear } = useMemo(() => {
    const upcoming = meetups.filter(m => new Date(m.event_date) >= now)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    
    const past = meetups.filter(m => new Date(m.event_date) < now)
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
    
    // Group past meetups by year
    const byYear: Record<number, Meetup[]> = {}
    past.forEach(meetup => {
      const year = meetup.year
      if (!byYear[year]) byYear[year] = []
      byYear[year].push(meetup)
    })

    return { upcomingMeetups: upcoming, pastMeetups: past, pastMeetupsByYear: byYear }
  }, [meetups, now])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-NG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const handleAddToCalendar = (meetup: Meetup) => {
    const params = new URLSearchParams({
      title: meetup.title,
      description: meetup.description || '',
      venue: meetup.venue_name,
      address: meetup.address,
      start: meetup.event_date,
      end: meetup.end_time || '',
    })
    
    window.open(`/api/calendar?${params.toString()}`, '_blank')
    toast.success('Calendar file downloaded!')
  }

  const handleAddToGoogleCalendar = (meetup: Meetup) => {
    const startDate = new Date(meetup.event_date)
    const endDate = meetup.end_time ? new Date(meetup.end_time) : new Date(startDate.getTime() + 3 * 60 * 60 * 1000)
    
    const formatForGoogle = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: meetup.title,
      dates: `${formatForGoogle(startDate)}/${formatForGoogle(endDate)}`,
      details: meetup.description || '',
      location: `${meetup.venue_name}, ${meetup.address}`,
    })
    
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank')
  }

  const getOpenStreetMapEmbedUrl = (meetup: Meetup) => {
    if (meetup.latitude && meetup.longitude) {
      // Use OpenStreetMap embed - no API key required
      return `https://www.openstreetmap.org/export/embed.html?bbox=${meetup.longitude - 0.01},${meetup.latitude - 0.01},${meetup.longitude + 0.01},${meetup.latitude + 0.01}&layer=mapnik&marker=${meetup.latitude},${meetup.longitude}`
    }
    return null
  }

  const getGoogleMapsDirectionsUrl = (meetup: Meetup) => {
    if (meetup.google_maps_url) return meetup.google_maps_url
    const query = encodeURIComponent(`${meetup.venue_name}, ${meetup.address}, ${meetup.city}`)
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-white/60">Loading meet-ups...</p>
        </div>
      </div>
    )
  }

  return (
    <section className="section-padding pt-32">
      <div className="container-main">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-400 text-sm font-medium mb-4"
          >
            <Calendar className="w-4 h-4" />
            <span>Community Events</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="heading-display mb-4"
          >
            <span className="text-gradient">Meet-ups</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            Join us for our monthly gatherings where we discuss books, share insights, and connect with fellow readers.
          </motion.p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Content */}
        <TabPanel value="upcoming" activeValue={activeTab}>
          {upcomingMeetups.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No upcoming meet-ups</h3>
              <p className="text-white/60">Check back soon for our next gathering!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {upcomingMeetups.map((meetup, index) => (
                <MeetupCard
                  key={meetup.id}
                  meetup={meetup}
                  index={index}
                  isExpanded={expandedMap === meetup.id}
                  onToggleMap={() => setExpandedMap(expandedMap === meetup.id ? null : meetup.id)}
                  onAddToCalendar={handleAddToCalendar}
                  onAddToGoogleCalendar={handleAddToGoogleCalendar}
                  getOpenStreetMapEmbedUrl={getOpenStreetMapEmbedUrl}
                  getGoogleMapsDirectionsUrl={getGoogleMapsDirectionsUrl}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  isUpcoming
                />
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel value="past" activeValue={activeTab}>
          {pastMeetups.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No past meet-ups yet</h3>
              <p className="text-white/60">Our meet-up history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(pastMeetupsByYear)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, yearMeetups]) => (
                  <YearlyMeetups
                    key={year}
                    year={Number(year)}
                    meetups={yearMeetups}
                    onSelectMeetup={setSelectedMeetup}
                    formatDate={formatDate}
                  />
                ))}
            </div>
          )}
        </TabPanel>
      </div>

      {/* Past Meetup Detail Modal */}
      <Modal
        isOpen={!!selectedMeetup}
        onClose={() => setSelectedMeetup(null)}
        title={selectedMeetup?.title}
        size="lg"
      >
        {selectedMeetup && (
          <div className="space-y-4">
            {selectedMeetup.image_url && (
              <img 
                src={selectedMeetup.image_url} 
                alt={selectedMeetup.title}
                className="w-full aspect-video object-cover rounded-xl"
              />
            )}
            <div className="flex items-center gap-2 text-white/60">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(selectedMeetup.event_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <MapPin className="w-4 h-4" />
              <span>{selectedMeetup.venue_name}, {selectedMeetup.address}</span>
            </div>
            {selectedMeetup.description && (
              <p className="text-white/80 leading-relaxed">{selectedMeetup.description}</p>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}

interface MeetupCardProps {
  meetup: Meetup
  index: number
  isExpanded: boolean
  onToggleMap: () => void
  onAddToCalendar: (meetup: Meetup) => void
  onAddToGoogleCalendar: (meetup: Meetup) => void
  getOpenStreetMapEmbedUrl: (meetup: Meetup) => string | null
  getGoogleMapsDirectionsUrl: (meetup: Meetup) => string
  formatDate: (date: string) => string
  formatTime: (date: string) => string
  isUpcoming?: boolean
}

function MeetupCard({
  meetup,
  index,
  isExpanded,
  onToggleMap,
  onAddToCalendar,
  onAddToGoogleCalendar,
  getOpenStreetMapEmbedUrl,
  getGoogleMapsDirectionsUrl,
  formatDate,
  formatTime,
  isUpcoming,
}: MeetupCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card overflow-hidden"
    >
      {/* Month Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex flex-col items-center justify-center text-white">
            <span className="text-xs font-medium uppercase">{getMonthName(meetup.month).slice(0, 3)}</span>
            <span className="text-lg font-bold">{meetup.year}</span>
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white">{meetup.title}</h3>
            <p className="text-white/60 text-sm">{getMonthName(meetup.month)} Meet-up</p>
          </div>
        </div>
        {isUpcoming && (
          <span className="px-3 py-1 bg-accent-500/20 text-accent-400 rounded-full text-sm font-medium">
            Upcoming
          </span>
        )}
      </div>

      {/* Image */}
      {meetup.image_url && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
          <img 
            src={meetup.image_url} 
            alt={meetup.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Details */}
      <div className="space-y-4">
        {/* Date & Time */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium">{formatDate(meetup.event_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium">
                {formatTime(meetup.event_date)}
                {meetup.end_time && ` - ${formatTime(meetup.end_time)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-start gap-3 text-white/80">
          <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <p className="font-medium">{meetup.venue_name}</p>
            <p className="text-sm text-white/60">{meetup.address}, {meetup.city}</p>
          </div>
        </div>

        {/* Description */}
        {meetup.description && (
          <p className="text-white/60 leading-relaxed">{meetup.description}</p>
        )}

        {/* Mini Map Toggle */}
        <button
          onClick={onToggleMap}
          className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium"
        >
          <MapPin className="w-4 h-4" />
          <span>{isExpanded ? 'Hide Map' : 'View Location'}</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Expandable Map */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3">
                {/* Map Embed */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-dark-800">
                  {getOpenStreetMapEmbedUrl(meetup) ? (
                    <iframe
                      src={getOpenStreetMapEmbedUrl(meetup)!}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      className="absolute inset-0"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-white/20 mx-auto mb-2" />
                        <p className="text-white/40 text-sm mb-2">Location coordinates not set</p>
                        <a
                          href={getGoogleMapsDirectionsUrl(meetup)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300 text-sm inline-block"
                        >
                          Search in Google Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Get Directions Button */}
                <a
                  href={getGoogleMapsDirectionsUrl(meetup)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get Directions
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        {isUpcoming && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={() => onAddToCalendar(meetup)}
              leftIcon={<Download className="w-4 h-4" />}
              variant="secondary"
              className="flex-1"
            >
              Download .ics
            </Button>
            <Button
              onClick={() => onAddToGoogleCalendar(meetup)}
              leftIcon={<CalendarPlus className="w-4 h-4" />}
              className="flex-1"
            >
              Add to Google Calendar
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface YearlyMeetupsProps {
  year: number
  meetups: Meetup[]
  onSelectMeetup: (meetup: Meetup) => void
  formatDate: (date: string) => string
}

function YearlyMeetups({ year, meetups, onSelectMeetup, formatDate }: YearlyMeetupsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const currentYear = new Date().getFullYear()
  const isCurrentYear = year === currentYear

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Year Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center text-white">
            <span className="text-xl font-bold">{year}</span>
          </div>
          <div className="text-left">
            <h3 className="text-xl font-display font-bold text-white">{year} Meet-ups</h3>
            <p className="text-white/60">{meetups.length} event{meetups.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-6 h-6 text-white/40" />
        </motion.div>
      </button>

      {/* Meetups Grid */}
      <AnimatePresence>
        {(isExpanded || isCurrentYear) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
              {meetups.map((meetup) => (
                <motion.button
                  key={meetup.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectMeetup(meetup)}
                  className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {meetup.image_url && (
                    <div className="aspect-video rounded-lg overflow-hidden mb-3">
                      <img 
                        src={meetup.image_url} 
                        alt={meetup.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded text-xs font-medium">
                      {getMonthName(meetup.month)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-white mb-1 line-clamp-1">{meetup.title}</h4>
                  <p className="text-sm text-white/60 line-clamp-1">{meetup.venue_name}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
