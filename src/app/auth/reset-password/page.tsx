import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your Triple A Book Club account.',
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
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  )
}
