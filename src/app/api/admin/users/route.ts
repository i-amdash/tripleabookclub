import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { auth } from '@/lib/auth'
import crypto from 'crypto'

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
    
    // Check if user is admin
    const session = await auth()
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email, password, full_name, send_invite } = await request.json()

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Generate user ID
    const userId = crypto.randomUUID()

    // Hash password if provided, otherwise create a reset token
    let passwordHash = null
    let resetToken = null
    let resetTokenExpiry = null

    if (password) {
      passwordHash = await hash(password, 12)
    } else if (send_invite) {
      // Generate reset token for invite
      resetToken = crypto.randomBytes(32).toString('hex')
      resetTokenExpiry = new Date(Date.now() + 7 * 24 * 3600000).toISOString() // 7 days
    }

    // Create user in profiles table
    const { data: newUser, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        full_name,
        password_hash: passwordHash,
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
        role: 'member',
        is_active: true,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create user:', createError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Send invite email if requested and Resend is configured
    if (send_invite && resetToken && process.env.RESEND_API_KEY) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripleabookclub.com'
      const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'Triple A Book Club <noreply@tripleabookclub.com>',
        to: email,
        subject: 'Welcome to Triple A Book Club - Set Your Password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #cf6f4e;">Welcome to Triple A Book Club!</h1>
            <p>Hi ${full_name},</p>
            <p>You've been invited to join Triple A Book Club. To get started, please set your password by clicking the button below:</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #cf6f4e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
              Set Your Password
            </a>
            <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">Triple A Book Club</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ 
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
