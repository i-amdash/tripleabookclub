'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit2, Trash2, User, Shield, ShieldOff, Mail, Key } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database.types'
import { Button, Modal, Input, Skeleton } from '@/components/ui'
import toast from 'react-hot-toast'

export function UsersManager() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    setUsers(data || [])
    setLoading(false)
  }

  const handleToggleAdmin = async (user: Profile) => {
    const newRole = user.role === 'super_admin' ? 'member' : 'super_admin'
    
    if (user.role === 'super_admin' && !confirm('Remove admin privileges from this user?')) {
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to update role')
      return
    }

    setUsers(users.map((u) => 
      u.id === user.id ? { ...u, role: newRole } : u
    ))
    toast.success(`User is now ${newRole === 'super_admin' ? 'an admin' : 'a member'}`)
  }

  const handleAdd = () => {
    setSelectedUser(null)
    setShowModal(true)
  }

  const handleResetPassword = (user: Profile) => {
    setSelectedUser(user)
    setShowPasswordModal(true)
  }

  const handleSubmit = async (formData: { email: string; password: string; full_name: string }) => {
    setIsSubmitting(true)

    try {
      // Create user via Supabase Auth Admin API (requires service role)
      // For now, we'll use a workaround - create the user through signUp
      // In production, this should be done via a secure API route
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Update the profile
        await supabase
          .from('profiles')
          .update({ 
            full_name: formData.full_name,
            role: 'member'
          })
          .eq('id', authData.user.id)

        toast.success('User created successfully! They will receive a confirmation email.')
        fetchUsers()
      }

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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) throw error

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
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user.role === 'super_admin' 
                      ? 'bg-primary-500/20 text-primary-400' 
                      : 'bg-white/10 text-white/60'
                  }`}>
                    {user.role === 'super_admin' ? 'Admin' : 'Member'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
