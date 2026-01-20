import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { PageLoader } from '@/components/ui'

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage Triple A Book Club content and settings.',
}

export default async function AdminPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <Suspense fallback={<PageLoader message="Loading admin dashboard..." />}>
      <AdminDashboard />
    </Suspense>
  )
}
