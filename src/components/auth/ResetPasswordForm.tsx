'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import toast from 'react-hot-toast'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get token from URL
  useEffect(() => {
    const urlToken = searchParams.get('token')
    setToken(urlToken)
  }, [searchParams])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long.'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must include at least one uppercase letter (A-Z).'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must include at least one lowercase letter (a-z).'
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must include at least one number (0-9).'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid or expired reset link. Please request a new one.')
      return
    }

    // Validate passwords
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update password. Please try again.')
      }

      setIsSuccess(true)
      toast.success('Password updated successfully!')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      console.error('Password update error:', err)
      const errorMessage = err.message || 'Unable to update password. Please try again or request a new reset link.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Show error if no token
  if (token === null) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">
          Invalid Reset Link
        </h3>
        <p className="text-white/60 mb-6">
          This password reset link is invalid. Please request a new one.
        </p>
        <Link href="/auth/forgot-password">
          <Button variant="primary">
            Request New Link
          </Button>
        </Link>
      </div>
    )
  }

  // Show success message
  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">
          Password Updated!
        </h3>
        <p className="text-white/60 mb-6">
          Your password has been successfully updated. Redirecting to login...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="label-text">New Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className="input-field pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="label-text">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="input-field pl-10"
            required
          />
        </div>
      </div>

      <div className="text-xs text-white/40 space-y-1">
        <p>Password must contain:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li className={password.length >= 8 ? 'text-green-400' : ''}>At least 8 characters</li>
          <li className={/[A-Z]/.test(password) ? 'text-green-400' : ''}>One uppercase letter</li>
          <li className={/[a-z]/.test(password) ? 'text-green-400' : ''}>One lowercase letter</li>
          <li className={/[0-9]/.test(password) ? 'text-green-400' : ''}>One number</li>
        </ul>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isLoading}
        disabled={!password || !confirmPassword}
      >
        Update Password
      </Button>
    </form>
  )
}
