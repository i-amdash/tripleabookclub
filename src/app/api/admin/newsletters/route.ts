import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BCC_BATCH_SIZE = 45
const DEFAULT_FROM_EMAIL = 'noreply@tripleabookclub.com'
const DEFAULT_LOGO_URL = 'https://tripleabookclub.com/logo.jpg'

type RecipientSource = 'member' | 'subscriber'

interface ProfileRecipientRow {
  email: string | null
  full_name: string | null
}

interface SubscriberRecipientRow {
  email: string | null
  is_active?: boolean | null
}

interface RecipientEntry {
  email: string
  full_name: string | null
  sources: Set<RecipientSource>
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

function isAuthorized(role?: string | null) {
  return role === 'admin' || role === 'super_admin'
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  if (!trimmed || !EMAIL_REGEX.test(trimmed)) return null
  return trimmed
}

function normalizeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

function resolveFromAddress() {
  const configuredFrom = process.env.NEWSLETTER_FROM_EMAIL?.trim()
  const emailFromAngleBrackets = configuredFrom?.match(/<([^>]+)>/)?.[1]
  const candidateEmail = emailFromAngleBrackets || configuredFrom || DEFAULT_FROM_EMAIL
  const normalizedSenderEmail = normalizeEmail(candidateEmail) || DEFAULT_FROM_EMAIL

  // Always enforce a clean display name regardless of how the env variable was formatted.
  return `Triple A Book Club <${normalizedSenderEmail}>`
}

function resolveLogoUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured && /^https?:\/\//.test(configured)) {
    const safeBase = configured.replace(/\/+$/, '')
    if (safeBase.startsWith('https://')) {
      return `${safeBase}/logo.jpg`
    }
  }
  return DEFAULT_LOGO_URL
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderInlineMarkdown(line: string) {
  let output = escapeHtml(line)

  output = output.replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 1px 4px; border-radius: 4px;">$1</code>')
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, text: string, rawUrl: string) => {
    const safeUrl = normalizeUrl(rawUrl)
    if (!safeUrl) return `${text} (${rawUrl})`
    return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" style="color: #0f766e; text-decoration: underline;">${text}</a>`
  })

  return output
}

function renderMarkdownToHtml(markdown: string) {
  const lines = markdown.split(/\r?\n/)
  const htmlParts: string[] = []
  let paragraphBuffer: string[] = []
  let listBuffer: string[] = []

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return
    const paragraphHtml = paragraphBuffer.map((line) => renderInlineMarkdown(line)).join('<br />')
    htmlParts.push(`<p style="margin: 0 0 16px; line-height: 1.7; color: #1f2937;">${paragraphHtml}</p>`)
    paragraphBuffer = []
  }

  const flushList = () => {
    if (listBuffer.length === 0) return
    const listHtml = listBuffer
      .map((item) => `<li style="margin: 0 0 8px;">${renderInlineMarkdown(item)}</li>`)
      .join('')
    htmlParts.push(`<ul style="margin: 0 0 16px; padding-left: 22px; color: #1f2937;">${listHtml}</ul>`)
    listBuffer = []
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      const level = headingMatch[1].length
      const headingText = renderInlineMarkdown(headingMatch[2])
      const fontSize = level === 1 ? '24px' : level === 2 ? '20px' : '18px'
      htmlParts.push(`<h${level} style="margin: 0 0 14px; color: #111827; font-size: ${fontSize}; line-height: 1.35;">${headingText}</h${level}>`)
      continue
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/)
    if (imageMatch) {
      flushParagraph()
      flushList()
      const safeUrl = normalizeUrl(imageMatch[2])
      if (safeUrl) {
        const altText = escapeHtml(imageMatch[1] || 'Newsletter image')
        htmlParts.push(`
          <div style="margin: 0 0 16px;">
            <img
              src="${escapeHtml(safeUrl)}"
              alt="${altText}"
              style="display: block; max-width: 100%; width: 100%; border-radius: 12px; border: 1px solid #e5e7eb;"
            />
          </div>
        `)
      }
      continue
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (listMatch) {
      flushParagraph()
      listBuffer.push(listMatch[1])
      continue
    }

    flushList()
    paragraphBuffer.push(rawLine)
  }

  flushParagraph()
  flushList()

  return htmlParts.join('') || '<p style="margin: 0; color: #1f2937;">(No content)</p>'
}

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (_match, altText: string, url: string) => `${altText || 'Image'}: ${url}`)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 ($2)')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim()
}

function buildNewsletterHtml(subject: string, markdownBody: string) {
  const bodyHtml = renderMarkdownToHtml(markdownBody)
  const logoUrl = resolveLogoUrl()

  return `
    <div style="background: #f6f8fb; padding: 32px 12px; font-family: Arial, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #e8edf3; box-shadow: 0 8px 30px rgba(17, 24, 39, 0.06); overflow: hidden;">
        <div style="height: 5px; background: linear-gradient(90deg, #e5e7eb 0%, #cbd5e1 100%);"></div>
        <div style="padding: 28px 26px 6px;">
          <h1 style="margin: 0 0 18px; color: #111827; font-size: 27px; line-height: 1.25; letter-spacing: -0.01em;">${escapeHtml(subject)}</h1>
        </div>

        <div style="padding: 0 26px 4px;">
          ${bodyHtml}
        </div>

        <div style="padding: 8px 26px 28px;">
          <p style="margin: 0 0 16px; font-size: 12px; color: #6b7280; line-height: 1.55; font-weight: 600;">
            Warm greetings,
          </p>
          <div style="display: inline-flex; flex-direction: column; align-items: center; gap: 8px;">
            <img
              src="${escapeHtml(logoUrl)}"
              alt="Triple A Book Club logo"
              width="62"
              height="62"
              style="display: block; width: 62px; height: 62px; border-radius: 9999px; border: 1px solid #e5e7eb; object-fit: cover;"
            />
            <p style="margin: 16px 0 0px; font-size: 12px; color: #6b7280; font-weight: 600; letter-spacing: 0.01em;">Triple A Book Club</p>
          </div>
        </div>
      </div>
    </div>
  `
}

function buildNewsletterText(subject: string, markdownBody: string) {
  return `${subject}\n\n${markdownToPlainText(markdownBody)}\n\nWarm greetings\nTriple A Book Club`.trim()
}

function chunkEmails(emails: string[], size: number) {
  const chunks: string[][] = []
  for (let i = 0; i < emails.length; i += size) {
    chunks.push(emails.slice(i, i + size))
  }
  return chunks
}

function isMissingSubscribersTable(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === '42P01' || error.message?.toLowerCase().includes('newsletter_subscribers') === true
}

async function resolveNewsletterToEmail(supabase: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const { data: currentUser, error: currentUserError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle()

  if (currentUserError) {
    console.error('Failed to resolve current sender email:', currentUserError)
  }

  const fromCurrentUser = normalizeEmail(currentUser?.email)
  if (fromCurrentUser) {
    return fromCurrentUser
  }

  const { data: adminUsers, error: adminUsersError } = await supabase
    .from('profiles')
    .select('email')
    .in('role', ['super_admin', 'admin'])
    .order('created_at', { ascending: true })
    .limit(1)

  if (adminUsersError) {
    console.error('Failed to resolve fallback sender email:', adminUsersError)
    return null
  }

  return normalizeEmail(adminUsers?.[0]?.email ?? null)
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAuthorized(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()

    const [profilesResult, subscribersResult] = await Promise.all([
      supabase.from('profiles').select('email, full_name'),
      supabase.from('newsletter_subscribers').select('email, is_active'),
    ])

    if (profilesResult.error) {
      console.error('Failed to fetch member recipients:', profilesResult.error)
      return NextResponse.json({ error: 'Failed to load recipients' }, { status: 500 })
    }

    const profileRows = (profilesResult.data || []) as ProfileRecipientRow[]
    let subscriberRows: SubscriberRecipientRow[] = []

    if (subscribersResult.error) {
      if (!isMissingSubscribersTable(subscribersResult.error)) {
        console.error('Failed to fetch subscriber recipients:', subscribersResult.error)
        return NextResponse.json({ error: 'Failed to load recipients' }, { status: 500 })
      }
      console.warn('newsletter_subscribers table not found. Returning member recipients only.')
    } else {
      subscriberRows = (subscribersResult.data || []) as SubscriberRecipientRow[]
    }

    const recipientMap = new Map<string, RecipientEntry>()

    for (const row of profileRows) {
      const email = normalizeEmail(row.email)
      if (!email) continue

      const existing = recipientMap.get(email)
      if (existing) {
        existing.sources.add('member')
        if (!existing.full_name && row.full_name) {
          existing.full_name = row.full_name
        }
        continue
      }

      recipientMap.set(email, {
        email,
        full_name: row.full_name,
        sources: new Set<RecipientSource>(['member']),
      })
    }

    for (const row of subscriberRows) {
      if (row.is_active === false) continue
      const email = normalizeEmail(row.email)
      if (!email) continue

      const existing = recipientMap.get(email)
      if (existing) {
        existing.sources.add('subscriber')
        continue
      }

      recipientMap.set(email, {
        email,
        full_name: null,
        sources: new Set<RecipientSource>(['subscriber']),
      })
    }

    const recipients = Array.from(recipientMap.values())
      .map((entry) => ({
        email: entry.email,
        full_name: entry.full_name,
        sources: Array.from(entry.sources).sort() as RecipientSource[],
      }))
      .sort((a, b) => {
        const nameA = (a.full_name || '').toLowerCase()
        const nameB = (b.full_name || '').toLowerCase()
        if (nameA && nameB && nameA !== nameB) return nameA.localeCompare(nameB)
        if (nameA && !nameB) return -1
        if (!nameA && nameB) return 1
        return a.email.localeCompare(b.email)
      })

    return NextResponse.json({
      recipients,
      stats: {
        totalRecipients: recipients.length,
        memberRecipients: recipients.filter((item) => item.sources.includes('member')).length,
        subscriberRecipients: recipients.filter((item) => item.sources.includes('subscriber')).length,
      },
    })
  } catch (error) {
    console.error('Newsletter recipients API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAuthorized(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payload = await request.json()

    const subject = typeof payload?.subject === 'string' ? payload.subject.trim() : ''
    const bodyMarkdownRaw =
      typeof payload?.bodyMarkdown === 'string'
        ? payload.bodyMarkdown
        : typeof payload?.bodyText === 'string'
          ? payload.bodyText
          : ''
    const bodyMarkdown = bodyMarkdownRaw.trim()

    const rawMediaUrls: unknown[] = Array.isArray(payload?.mediaUrls) ? payload.mediaUrls : []
    const rawRecipientEmails: unknown[] = Array.isArray(payload?.recipientEmails) ? payload.recipientEmails : []

    if (subject.length < 3) {
      return NextResponse.json({ error: 'Subject must be at least 3 characters' }, { status: 400 })
    }

    if (subject.length > 180) {
      return NextResponse.json({ error: 'Subject must be 180 characters or less' }, { status: 400 })
    }

    const mediaUrls = Array.from(
      new Set(rawMediaUrls.map((value) => normalizeUrl(value)).filter((value): value is string => Boolean(value)))
    )

    const legacyMediaAsMarkdown = mediaUrls
      .map((url) => `![Newsletter image](${url})`)
      .join('\n\n')

    const finalMarkdown = [bodyMarkdown, legacyMediaAsMarkdown].filter(Boolean).join('\n\n').trim()

    if (!finalMarkdown) {
      return NextResponse.json({ error: 'Newsletter body cannot be empty' }, { status: 400 })
    }

    const recipientEmails = Array.from(
      new Set(
        rawRecipientEmails
          .map((value) => normalizeEmail(value))
          .filter((value): value is string => Boolean(value))
      )
    )

    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: 'Select at least one recipient' }, { status: 400 })
    }

    if (recipientEmails.length > 2500) {
      return NextResponse.json({ error: 'Too many recipients in one send request' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdmin()
    const from = resolveFromAddress()
    const to = await resolveNewsletterToEmail(supabase, session.user.id)

    if (!to) {
      return NextResponse.json(
        { error: 'Unable to resolve a valid sender email from user records' },
        { status: 500 }
      )
    }

    const html = buildNewsletterHtml(subject, finalMarkdown)
    const text = buildNewsletterText(subject, finalMarkdown)
    const batches = chunkEmails(recipientEmails, BCC_BATCH_SIZE)

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    for (const bccBatch of batches) {
      await resend.emails.send({
        from,
        to,
        bcc: bccBatch,
        subject,
        html,
        text,
      })
    }

    return NextResponse.json({
      success: true,
      recipientCount: recipientEmails.length,
      batchCount: batches.length,
    })
  } catch (error) {
    console.error('Newsletter send API error:', error)
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    )
  }
}
