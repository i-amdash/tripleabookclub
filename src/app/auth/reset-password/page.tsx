import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your Triple A Book Club account.',
}

function LoadingSpinner() {
  return (
    <div className="text-center py-8">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-white/60">Loading...</p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-white mb-2">
              Reset Your Password
            </h1>
            <p className="text-white/60">
              Enter your new password below.
            </p>
          </div>
          <Suspense fallback={<LoadingSpinner />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
