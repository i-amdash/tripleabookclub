'use client'

import Link from 'next/link'
import { UserX } from 'lucide-react'
import { Button } from '@/components/ui'

// Registration is disabled - users are created by admins
export function RegisterForm() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <UserX className="w-8 h-8 text-primary-400" />
      </div>
      <h3 className="text-xl font-display font-bold text-white mb-2">
        Registration Closed
      </h3>
      <p className="text-white/60 mb-6">
        Membership to Triple A Book Club is by invitation only. 
        If you've received an invitation, please use the link in your email to set up your account.
      </p>
      <Link href="/auth/login">
        <Button variant="primary">
          Back to Sign In
        </Button>
      </Link>
    </div>
  )
}
