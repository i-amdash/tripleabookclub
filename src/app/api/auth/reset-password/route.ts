import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Reset token and new password are required.' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    // Find user with valid reset token
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, reset_token, reset_token_expiry')
      .eq('reset_token', token)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has already been used. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date(user.reset_token_expiry) < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired. Reset links are valid for 1 hour. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const passwordHash = await hash(password, 12)

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update password:', updateError)
      return NextResponse.json(
        { error: 'Unable to update password. Please try again or contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Password updated successfully' 
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again or contact support.' },
      { status: 500 }
    )
  }
}
