'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit2, Trash2, User, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Member } from '@/types/database.types'
import { Button, Modal, Input, Textarea, Skeleton, CloudinaryUpload } from '@/components/ui'
import toast from 'react-hot-toast'

export function MembersManager() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('order_index', { ascending: true })

    setMembers(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return

    const { error } = await supabase.from('members').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete member')
      return
    }

    setMembers(members.filter((m) => m.id !== id))
    toast.success('Member deleted')
  }

  const handleToggleVisibility = async (member: Member) => {
    const { error } = await supabase
      .from('members')
      .update({ is_visible: !member.is_visible })
      .eq('id', member.id)

    if (error) {
      toast.error('Failed to update visibility')
      return
    }

    setMembers(members.map((m) => 
      m.id === member.id ? { ...m, is_visible: !m.is_visible } : m
    ))
    toast.success(`Member ${member.is_visible ? 'hidden' : 'visible'}`)
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingMember(null)
    setShowModal(true)
  }

  const handleSubmit = async (formData: Partial<Member>) => {
    setIsSubmitting(true)

    try {
      if (editingMember) {
        const { error } = await supabase
          .from('members')
          .update(formData)
          .eq('id', editingMember.id)

        if (error) throw error

        setMembers(members.map((m) => (m.id === editingMember.id ? { ...m, ...formData } : m)))
        toast.success('Member updated')
      } else {
        const maxOrder = members.length > 0 ? Math.max(...members.map(m => m.order_index)) : 0
        const { data, error } = await supabase
          .from('members')
          .insert({ ...formData, order_index: maxOrder + 1, is_visible: true })
          .select()
          .single()

        if (error) throw error

        setMembers([...members, data])
        toast.success('Member added')
      }

      setShowModal(false)
    } catch (error) {
      toast.error('Failed to save member')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Manage Members</h2>
        <Button onClick={handleAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add Member
        </Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 card">
          <User className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No members yet. Add your first member!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id} className={`card flex items-center gap-4 ${!member.is_visible ? 'opacity-50' : ''}`}>
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                {member.image_url ? (
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                    <User className="w-6 h-6 text-white/60" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{member.name}</h3>
                <p className="text-sm text-primary-400">{member.role}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleVisibility(member)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  title={member.is_visible ? 'Hide member' : 'Show member'}
                >
                  {member.is_visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(member)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMember ? 'Edit Member' : 'Add Member'}
        size="lg"
      >
        <MemberForm
          member={editingMember}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  )
}

interface MemberFormProps {
  member: Member | null
  onSubmit: (data: Partial<Member>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

function MemberForm({ member, onSubmit, onCancel, isSubmitting }: MemberFormProps) {
  const [name, setName] = useState(member?.name || '')
  const [role, setRole] = useState(member?.role || '')
  const [bio, setBio] = useState(member?.bio || '')
  const [imageUrl, setImageUrl] = useState(member?.image_url || '')
  const [instagram, setInstagram] = useState((member?.social_links as any)?.instagram || '')
  const [twitter, setTwitter] = useState((member?.social_links as any)?.twitter || '')
  const [linkedin, setLinkedin] = useState((member?.social_links as any)?.linkedin || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !role.trim()) {
      toast.error('Please fill in name and role')
      return
    }

    const socialLinks = {
      ...(instagram && { instagram }),
      ...(twitter && { twitter }),
      ...(linkedin && { linkedin }),
    }

    onSubmit({
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim() || null,
      image_url: imageUrl.trim() || null,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
        />

        <Input
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g., Founder, Member"
        />
      </div>

      <Textarea
        label="Bio (optional)"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Brief bio about the member"
      />

      <CloudinaryUpload
        label="Photo (optional)"
        value={imageUrl}
        onChange={setImageUrl}
        resourceType="image"
        folder="tripleabookclub/members"
      />

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white/80">Social Links (optional)</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            placeholder="Instagram URL"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
          <Input
            placeholder="Twitter URL"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
          />
          <Input
            placeholder="LinkedIn URL"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {member ? 'Update' : 'Add'} Member
        </Button>
      </div>
    </form>
  )
}
