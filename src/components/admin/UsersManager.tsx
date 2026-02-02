'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, User, Shield, ShieldOff, Mail, Key, Link2, UserPlus } from 'lucide-react'
import { Profile, Member } from '@/types/database.types'
import { Button, Modal, Input, Skeleton } from '@/components/ui'
import toast from 'react-hot-toast'

export function UsersManager() {
  const [users, setUsers] = useState<Profile[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchMembers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  // Get linked member for a profile
  const getLinkedMember = (profileId: string) => {
    return members.find(m => m.profile_id === profileId)
  }

  const handleToggleAdmin = async (user: Profile) => {
    const newRole = user.role === 'super_admin' ? 'member' : 'super_admin'
    
    if (user.role === 'super_admin' && !confirm('Remove admin privileges from this user?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role: newRole }),
      })

      if (!response.ok) throw new Error('Failed to update')

      setUsers(users.map((u) => 
        u.id === user.id ? { ...u, role: newRole } : u
      ))
      toast.success(`User is now ${newRole === 'super_admin' ? 'an admin' : 'a member'}`)
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  const handleAdd = () => {
    setSelectedUser(null)
    setShowModal(true)
  }

  const handleResetPassword = (user: Profile) => {
    setSelectedUser(user)
    setShowPasswordModal(true)
  }

  const handleLinkMember = (user: Profile) => {
    setSelectedUser(user)
    setShowLinkModal(true)
  }

  const handleLinkSubmit = async (memberId: string | null, createNew: boolean) => {
    if (!selectedUser) return
    
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/member/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedUser.id,
          memberId: createNew ? null : memberId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link member')
      }

      toast.success(createNew ? 'Member profile created and linked!' : 'Member linked successfully!')
      fetchMembers()
      setShowLinkModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to link member')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (formData: { email: string; password: string; full_name: string }) => {
    setIsSubmitting(true)

    try {
      // Create user via API route
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password || null,
          full_name: formData.full_name,
          send_invite: !formData.password, // Send invite if no password provided
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      toast.success(formData.password 
        ? 'User created successfully!' 
        : 'User created! They will receive an invite email.')
      fetchUsers()
      setShowModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async (email: string) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      toast.success('Password reset email sent!')
      setShowPasswordModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-white">User Accounts</h2>
          <p className="text-white/60 text-sm">Create and manage member login accounts</p>
        </div>
        <Button onClick={handleAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add User
        </Button>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="card text-center py-12">
            <User className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No users yet</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                  {user.role === 'super_admin' ? (
                    <Shield className="w-6 h-6 text-primary-400" />
                  ) : (
                    <User className="w-6 h-6 text-white/60" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-white">{user.full_name || 'Unnamed User'}</h3>
                  <p className="text-sm text-white/60">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.role === 'super_admin' 
                        ? 'bg-primary-500/20 text-primary-400' 
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {user.role === 'super_admin' ? 'Admin' : 'Member'}
                    </span>
                    {getLinkedMember(user.id) ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        Linked to: {getLinkedMember(user.id)?.name}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                        Not linked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!getLinkedMember(user.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLinkMember(user)}
                    title="Link to member profile"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetPassword(user)}
                  title="Send password reset"
                >
                  <Key className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleAdmin(user)}
                  title={user.role === 'super_admin' ? 'Remove admin' : 'Make admin'}
                >
                  {user.role === 'super_admin' ? (
                    <ShieldOff className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New User"
      >
        <UserForm
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Reset Password"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Send a password reset email to <strong className="text-white">{selectedUser?.email}</strong>?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && handlePasswordReset(selectedUser.email || '')}
              isLoading={isSubmitting}
            >
              Send Reset Email
            </Button>
          </div>
        </div>
      </Modal>

      {/* Link to Member Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="Link to Member Profile"
      >
        <LinkMemberForm
          user={selectedUser}
          members={members.filter(m => !m.profile_id)} // Only show unlinked members
          onSubmit={handleLinkSubmit}
          onCancel={() => setShowLinkModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  )
}

interface UserFormProps {
  onSubmit: (data: { email: string; password: string; full_name: string }) => void
  onCancel: () => void
  isLoading: boolean
}

function UserForm({ onSubmit, onCancel, isLoading }: UserFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({ email, password, full_name: fullName })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        placeholder="Enter member's full name"
      />
      <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder="member@example.com"
      />
      <Input
        label="Temporary Password"
        type="text"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        placeholder="Create a temporary password"
        helperText="The user should change this after first login"
      />

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Create User
        </Button>
      </div>
    </form>
  )
}

interface LinkMemberFormProps {
  user: Profile | null
  members: Member[]
  onSubmit: (memberId: string | null, createNew: boolean) => void
  onCancel: () => void
  isLoading: boolean
}

function LinkMemberForm({ user, members, onSubmit, onCancel, isLoading }: LinkMemberFormProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [createNew, setCreateNew] = useState(members.length === 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (createNew) {
      onSubmit(null, true)
    } else if (selectedMemberId) {
      onSubmit(selectedMemberId, false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-white/70 text-sm">
        Link <strong className="text-white">{user?.full_name || user?.email}</strong> to a member profile so they can manage their own information.
      </p>

      {members.length > 0 && (
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-primary-500/50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="linkOption"
              checked={!createNew}
              onChange={() => setCreateNew(false)}
              className="w-4 h-4 text-primary-500"
            />
            <div>
              <p className="text-white font-medium">Link to existing member</p>
              <p className="text-white/50 text-sm">Choose from unlinked member profiles</p>
            </div>
          </label>

          {!createNew && (
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">Select a member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-primary-500/50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="linkOption"
              checked={createNew}
              onChange={() => setCreateNew(true)}
              className="w-4 h-4 text-primary-500"
            />
            <div>
              <p className="text-white font-medium">Create new member profile</p>
              <p className="text-white/50 text-sm">A new member entry will be created and linked</p>
            </div>
          </label>
        </div>
      )}

      {members.length === 0 && (
        <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <p className="text-primary-300 text-sm">
            No unlinked members found. A new member profile will be created for this user.
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          isLoading={isLoading}
          disabled={!createNew && !selectedMemberId}
        >
          {createNew ? 'Create & Link' : 'Link Member'}
        </Button>
      </div>
    </form>
  )
}
