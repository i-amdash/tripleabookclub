import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
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
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store token in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to store reset token:', updateError)
      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      )
    }

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripleabookclub.com'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

    // Send email using Resend (you'll need to set up Resend)
    // For now, we'll use Supabase's edge function or a simple email service
    
    // If you have Resend configured:
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'Triple A Book Club <noreply@tripleabookclub.com>',
        to: user.email,
        subject: 'Reset Your Password - Triple A Book Club',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #cf6f4e;">Reset Your Password</h1>
            <p>Hi ${user.full_name || 'there'},</p>
            <p>We received a request to reset your password for your Triple A Book Club account.</p>
            <p>Click the button below to set a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #cf6f4e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
              Reset Password
            </a>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">Triple A Book Club</p>
          </div>
        `,
      })
    } else {
      // Fallback: Log the reset URL (for development)
      console.log('Password reset URL:', resetUrl)
    }

    return NextResponse.json({ 
      message: 'If an account exists with this email, you will receive a password reset link.' 
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
