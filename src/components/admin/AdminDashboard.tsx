'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Image,
  Users,
  Settings,
  FileText,
  Calendar,
  BarChart3,
  Plus,
  UserPlus,
} from 'lucide-react'
import { Tabs, TabPanel } from '@/components/ui'
import { BooksManager } from './BooksManager'
import { PortalManager } from './PortalManager'
import { GalleryManager } from './GalleryManager'
import { MembersManager } from './MembersManager'
import { ContentManager } from './ContentManager'
import { SuggestionsManager } from './SuggestionsManager'
import { UsersManager } from './UsersManager'
import { useSupabase } from '@/hooks'

interface Stats {
  books: number
  members: number
  suggestions: number
  gallery: number
}

const tabs = [
  { id: 'books', label: 'Books', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'portal', label: 'Portal Control', icon: <Calendar className="w-4 h-4" /> },
  { id: 'suggestions', label: 'Suggestions', icon: <FileText className="w-4 h-4" /> },
  { id: 'gallery', label: 'Gallery', icon: <Image className="w-4 h-4" /> },
  { id: 'members', label: 'Members Display', icon: <Users className="w-4 h-4" /> },
  { id: 'users', label: 'User Accounts', icon: <UserPlus className="w-4 h-4" /> },
  { id: 'content', label: 'Site Content', icon: <Settings className="w-4 h-4" /> },
]

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('books')
  const [stats, setStats] = useState<Stats>({ books: 0, members: 0, suggestions: 0, gallery: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const supabase = useSupabase()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all counts in parallel
        const [booksResult, membersResult, suggestionsResult, galleryResult] = await Promise.all([
          supabase.from('books').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('suggestions').select('id', { count: 'exact', head: true }),
          supabase.from('gallery').select('id', { count: 'exact', head: true }),
        ])

        setStats({
          books: booksResult.count || 0,
          members: membersResult.count || 0,
          suggestions: suggestionsResult.count || 0,
          gallery: galleryResult.count || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-main">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-white/60">
            Manage your book club's content, members, and settings.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard 
            icon={BookOpen} 
            label="Books" 
            value={statsLoading ? '...' : stats.books.toString()} 
            color="primary" 
          />
          <StatCard 
            icon={Users} 
            label="Members" 
            value={statsLoading ? '...' : stats.members.toString()} 
            color="accent" 
          />
          <StatCard 
            icon={FileText} 
            label="Suggestions" 
            value={statsLoading ? '...' : stats.suggestions.toString()} 
            color="secondary" 
          />
          <StatCard 
            icon={Image} 
            label="Gallery Items" 
            value={statsLoading ? '...' : stats.gallery.toString()} 
            color="emerald" 
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="overflow-x-auto">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="pills"
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <TabPanel value="books" activeValue={activeTab}>
            <BooksManager />
          </TabPanel>

          <TabPanel value="portal" activeValue={activeTab}>
            <PortalManager />
          </TabPanel>

          <TabPanel value="suggestions" activeValue={activeTab}>
            <SuggestionsManager />
          </TabPanel>

          <TabPanel value="gallery" activeValue={activeTab}>
            <GalleryManager />
          </TabPanel>

          <TabPanel value="members" activeValue={activeTab}>
            <MembersManager />
          </TabPanel>

          <TabPanel value="users" activeValue={activeTab}>
            <UsersManager />
          </TabPanel>

          <TabPanel value="content" activeValue={activeTab}>
            <ContentManager />
          </TabPanel>
        </motion.div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: 'primary' | 'accent' | 'secondary' | 'emerald'
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colors = {
    primary: 'bg-primary-500/10 text-primary-400',
    accent: 'bg-accent-500/10 text-accent-400',
    secondary: 'bg-secondary-500/10 text-secondary-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
  }

  return (
    <div className="card">
      <div className={`p-3 rounded-xl w-fit ${colors[color]} mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/60">{label}</div>
    </div>
  )
}
