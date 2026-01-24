'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Instagram, Twitter, Linkedin, Save, Camera, Loader2, AlertCircle, Link as LinkIcon } from 'lucide-react'
import { Button, Input, Skeleton } from '@/components/ui'
import { Member } from '@/types/database.types'
import toast from 'react-hot-toast'

interface ProfileManagerProps {
  userId: string
  isAdmin?: boolean
}

export function ProfileManager({ userId, isAdmin = false }: ProfileManagerProps) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [noMemberLinked, setNoMemberLinked] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    image_url: '',
    social_links: {
      instagram: '',
      twitter: '',
      linkedin: '',
    },
  })

  useEffect(() => {
    fetchMemberProfile()
  }, [userId])

  const fetchMemberProfile = async () => {
    try {
      const response = await fetch(`/api/member/profile?profileId=${userId}`)
      const data = await response.json()

      if (data.member) {
        setMember(data.member)
        const socialLinks = data.member.social_links as { instagram?: string; twitter?: string; linkedin?: string } | null
        setFormData({
          name: data.member.name || '',
          bio: data.member.bio || '',
          image_url: data.member.image_url || '',
          social_links: {
            instagram: socialLinks?.instagram || '',
            twitter: socialLinks?.twitter || '',
            linkedin: socialLinks?.linkedin || '',
          },
        })
      } else {
        setNoMemberLinked(true)
      }
    } catch (error) {
      console.error('Failed to fetch member profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSocialChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value },
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary not configured')
      }

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('upload_preset', uploadPreset)
      formDataUpload.append('folder', 'members')

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formDataUpload }
      )

      const data = await response.json()

      if (data.secure_url) {
        setFormData(prev => ({ ...prev, image_url: data.secure_url }))
        toast.success('Image uploaded successfully')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!member) return

    setSaving(true)

    try {
      const response = await fetch('/api/member/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          name: formData.name,
          bio: formData.bio,
          image_url: formData.image_url,
          social_links: formData.social_links,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      setMember(data.member)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="section-padding pt-0">
        <div className="container-main max-w-2xl">
          <div className="card">
            <Skeleton className="w-32 h-32 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </section>
    )
  }

  if (noMemberLinked) {
    return (
      <section className="section-padding pt-0">
        <div className="container-main max-w-2xl">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
              No Member Profile Found
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Your account is not linked to a member profile yet. Please contact an administrator to set up your member profile.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-padding pt-0">
      <div className="container-main max-w-2xl">
        <div className="card">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-dark-700 border-4 border-primary-500/30">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                    <User className="w-16 h-16 text-white/60" />
                  </div>
                )}
              </div>
              
              {/* Upload Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            <p className="text-sm text-white/50 mt-3">
              Click to upload a new photo
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Display Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-3 bg-dark-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-4">
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Social Links
              </label>
              
              <div className="space-y-4">
                {/* Instagram */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <Input
                    value={formData.social_links.instagram}
                    onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/username"
                    className="flex-1"
                  />
                </div>

                {/* Twitter/X */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-black rounded-lg border border-white/20">
                    <Twitter className="w-5 h-5 text-white" />
                  </div>
                  <Input
                    value={formData.social_links.twitter}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    placeholder="https://x.com/username"
                    className="flex-1"
                  />
                </div>

                {/* LinkedIn */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-600 rounded-lg">
                    <Linkedin className="w-5 h-5 text-white" />
                  </div>
                  <Input
                    value={formData.social_links.linkedin}
                    onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
