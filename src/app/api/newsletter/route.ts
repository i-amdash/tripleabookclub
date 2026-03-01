import { NextResponse } from 'next/server'

const DESTINATION_EMAIL = 'tripleabookgroup@gmail.com'

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

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Newsletter email service is not configured' },
        { status: 500 }
      )
    }

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}
