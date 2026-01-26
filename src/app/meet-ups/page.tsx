'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MeetupsContent } from '@/components/meetups/MeetupsContent'
import { PageLoader } from '@/components/ui'

export default function MeetupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/meet-ups')
    }
  }, [status, router])

  if (status === 'loading') {
    return <PageLoader message="Loading..." />
  }

  if (!session?.user) {
    return <PageLoader message="Redirecting..." />
  }

  return (
    <div className="page-enter">
      <MeetupsContent />
    </div>
  )
}
