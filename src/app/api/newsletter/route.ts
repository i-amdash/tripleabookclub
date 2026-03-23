import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DESTINATION_EMAIL = 'tripleabookgroup@gmail.com'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { error: subscriberError } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          source: 'website_footer',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )

    if (subscriberError) {
      console.error('Newsletter subscriber save error:', subscriberError)
      return NextResponse.json(
        { error: 'Failed to save newsletter subscription' },
        { status: 500 }
      )
    }

    // Optional admin notification email when Resend is configured
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'Triple A Book Club <noreply@tripleabookclub.com>',
        to: DESTINATION_EMAIL,
        subject: 'New Newsletter Subscription',
        replyTo: email,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="margin: 0 0 12px; color: #cf6f4e;">New Subscription</h2>
            <p style="margin: 0 0 8px;">A new user subscribed from the website footer.</p>
            <p style="margin: 0 0 4px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Time (UTC):</strong> ${new Date().toISOString()}</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}
