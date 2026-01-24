'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { PageHeader, PageLoader } from '@/components/ui'
import { ProfileManager } from '@/components/profile/ProfileManager'

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <PageLoader message="Loading..." />
  }

  if (!session?.user) {
    redirect('/auth/login')
  }

  return (
    <main className="min-h-screen">
      <PageHeader
        title="My Profile"
        description="Manage your profile information, avatar, and social links"
      />
      <Suspense fallback={<PageLoader message="Loading profile..." />}>
        <ProfileManager userId={session.user.id} isAdmin={session.user.role === 'super_admin' || session.user.role === 'admin'} />
      </Suspense>
    </main>
  )
}
