'use client'

import { useState, useEffect, useMemo } from 'react'
import { Save, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SiteContent } from '@/types/database.types'
import { Button, Input, Textarea, Skeleton } from '@/components/ui'
import toast from 'react-hot-toast'

const contentSections = [
  { page: 'home', section: 'hero', label: 'Home - Hero Section' },
  { page: 'home', section: 'features', label: 'Home - Features Section' },
  { page: 'about', section: 'main', label: 'About Page' },
  { page: 'footer', section: 'main', label: 'Footer Content' },
]

export function ContentManager() {
  const [contents, setContents] = useState<SiteContent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    const { data } = await supabase
      .from('site_content')
      .select('*')

    setContents(data || [])
    setLoading(false)
  }

  const handleSave = async (page: string, section: string, content: any) => {
    setSaving(`${page}-${section}`)

    try {
      const existing = contents.find((c) => c.page === page && c.section === section)

      if (existing) {
        const { error } = await supabase
          .from('site_content')
          .update({ content })
          .eq('id', existing.id)

        if (error) throw error

        setContents(contents.map((c) =>
          c.id === existing.id ? { ...c, content } : c
        ))
      } else {
        const { data, error } = await supabase
          .from('site_content')
          .insert({ page, section, content })
          .select()
          .single()

        if (error) throw error

        setContents([...contents, data])
      }

      toast.success('Content saved')
    } catch (error) {
      toast.error('Failed to save content')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Site Content</h2>
      </div>

      <p className="text-white/60">
        Edit the text content displayed on various pages of the website.
      </p>

      <div className="space-y-6">
        {/* About Page Content */}
        <AboutContentEditor
          content={contents.find((c) => c.page === 'about' && c.section === 'main')?.content}
          onSave={(content) => handleSave('about', 'main', content)}
          isSaving={saving === 'about-main'}
        />

        {/* Home Hero Content */}
        <HomeHeroEditor
          content={contents.find((c) => c.page === 'home' && c.section === 'hero')?.content}
          onSave={(content) => handleSave('home', 'hero', content)}
          isSaving={saving === 'home-hero'}
        />
      </div>
    </div>
  )
}

interface AboutContentEditorProps {
  content: any
  onSave: (content: any) => void
  isSaving: boolean
}

function AboutContentEditor({ content, onSave, isSaving }: AboutContentEditorProps) {
  const [mission, setMission] = useState(content?.mission || '')
  const [vision, setVision] = useState(content?.vision || '')
  const [story, setStory] = useState(content?.story || '')

  const handleSave = () => {
    onSave({
      mission: mission.trim(),
      vision: vision.trim(),
      story: story.trim(),
    })
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-500/10 rounded-lg">
          <FileText className="w-5 h-5 text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">About Page</h3>
      </div>

      <div className="space-y-4">
        <Textarea
          label="Mission Statement"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder="Our mission is..."
        />

        <Textarea
          label="Vision Statement"
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          placeholder="Our vision is..."
        />

        <Textarea
          label="Our Story"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Triple A Book Club was born..."
          className="min-h-[200px]"
        />

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

interface HomeHeroEditorProps {
  content: any
  onSave: (content: any) => void
  isSaving: boolean
}

function HomeHeroEditor({ content, onSave, isSaving }: HomeHeroEditorProps) {
  const [title, setTitle] = useState(content?.title || '')
  const [subtitle, setSubtitle] = useState(content?.subtitle || '')
  const [description, setDescription] = useState(content?.description || '')

  const handleSave = () => {
    onSave({
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
    })
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent-500/10 rounded-lg">
          <FileText className="w-5 h-5 text-accent-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Home Hero Section</h3>
      </div>

      <div className="space-y-4">
        <Input
          label="Title Line 1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Where Stories"
        />

        <Input
          label="Title Line 2"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Come Alive"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Join a passionate community..."
        />

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
