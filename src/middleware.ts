import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAuthPage = nextUrl.pathname.startsWith('/auth')
  const isAdminPage = nextUrl.pathname.startsWith('/admin')
  const isApiRoute = nextUrl.pathname.startsWith('/api')
  
  // Allow API routes to pass through
  if (isApiRoute) {
    return NextResponse.next()
  }

  // If trying to access auth pages while logged in, redirect to home
  if (isAuthPage && isLoggedIn) {
    // Allow reset-password page even when logged in (for changing password)
    if (nextUrl.pathname === '/auth/reset-password') {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  // Protect admin routes
  if (isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/login', nextUrl))
    }
    
    const userRole = req.auth?.user?.role
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
