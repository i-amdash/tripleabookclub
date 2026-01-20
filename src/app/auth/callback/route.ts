import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  // Use production URL if we're in production
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://tripleabookclub.com' 
    : origin

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Handle password recovery - redirect to reset password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${baseUrl}/auth/reset-password`)
      }
      
      // Handle email confirmation or other auth flows
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // If there's a token_hash in the URL (email link format), handle it
  const token_hash = searchParams.get('token_hash')
  const authType = searchParams.get('type')
  
  if (token_hash && authType) {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: authType as any,
    })
    
    if (!error) {
      if (authType === 'recovery') {
        return NextResponse.redirect(`${baseUrl}/auth/reset-password`)
      }
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  return NextResponse.redirect(`${baseUrl}/auth/login?error=Could not authenticate`)
}
