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
    } else {
      // Always generate reset token if no password provided
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

    // Always send welcome email when user is created
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripleabookclub.com'
      const loginUrl = `${baseUrl}/auth/login`

      if (password) {
        // Send welcome email with credentials
        await resend.emails.send({
          from: 'Triple A Book Club <noreply@tripleabookclub.com>',
          to: email,
          subject: 'Welcome to Triple A Book Club - Your Account Details',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #cf6f4e;">Welcome to Triple A Book Club!</h1>
              <p>Hi ${full_name},</p>
              <p>Your account has been created. Here are your login details:</p>
              <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0 0 0;"><strong>Password:</strong> ${password}</p>
              </div>
              <p>Click the button below to log in:</p>
              <a href="${loginUrl}" style="display: inline-block; background-color: #cf6f4e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                Log In to Your Account
              </a>
              <p style="color: #666; font-size: 14px;">For security, we recommend changing your password after your first login.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">Triple A Book Club</p>
            </div>
          `,
        })
      } else if (resetToken) {
        // Send invite email with password setup link
        const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`
        
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
    } else {
      console.log('RESEND_API_KEY not configured - skipping email')
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

// GET - Fetch all users (admin only)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Users fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user role (admin only)
export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('User update error:', error)
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
