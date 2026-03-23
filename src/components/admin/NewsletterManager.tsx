'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Mail,
  Search,
  Send,
  User,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  ImagePlus,
} from 'lucide-react'
import { Button, CloudinaryUpload, Input, Skeleton, Textarea } from '@/components/ui'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

type RecipientSource = 'member' | 'subscriber'

interface NewsletterRecipient {
  email: string
  full_name: string | null
  sources: RecipientSource[]
}

interface RecipientStats {
  totalRecipients: number
  memberRecipients: number
  subscriberRecipients: number
}

interface RecipientsResponse {
  recipients: NewsletterRecipient[]
  stats: RecipientStats
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function normalizeUrl(value: string): string | null {
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

function renderInlineMarkdown(line: string) {
  let output = escapeHtml(line)

  output = output.replace(/`([^`]+)`/g, '<code class="bg-dark-100 text-dark-800 px-1 py-0.5 rounded">$1</code>')
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, text: string, rawUrl: string) => {
    const safeUrl = normalizeUrl(rawUrl)
    if (!safeUrl) return `${text} (${rawUrl})`
    return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="text-primary-600 underline">${text}</a>`
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
    htmlParts.push(`<p class="text-dark-700 leading-relaxed mb-4">${paragraphHtml}</p>`)
    paragraphBuffer = []
  }

  const flushList = () => {
    if (listBuffer.length === 0) return
    const listHtml = listBuffer
      .map((item) => `<li class="mb-2">${renderInlineMarkdown(item)}</li>`)
      .join('')
    htmlParts.push(`<ul class="text-dark-700 leading-relaxed mb-4 list-disc pl-6">${listHtml}</ul>`)
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
      const headingClass = level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg'
      htmlParts.push(`<h${level} class="${headingClass} font-semibold text-dark-900 mb-3">${headingText}</h${level}>`)
      continue
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/)
    if (imageMatch) {
      flushParagraph()
      flushList()
      const safeUrl = normalizeUrl(imageMatch[2])
      if (safeUrl) {
        const altText = escapeHtml(imageMatch[1] || 'Newsletter image')
        htmlParts.push(`<img src="${escapeHtml(safeUrl)}" alt="${altText}" class="w-full rounded-xl border border-gray-200 mb-4" />`)
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

  return htmlParts.join('')
}

export function NewsletterManager() {
  const [recipients, setRecipients] = useState<NewsletterRecipient[]>([])
  const [stats, setStats] = useState<RecipientStats>({
    totalRecipients: 0,
    memberRecipients: 0,
    subscriberRecipients: 0,
  })
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [subject, setSubject] = useState('')
  const [bodyMarkdown, setBodyMarkdown] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [uploadedMediaUrl, setUploadedMediaUrl] = useState('')
  const [uploadWidgetKey, setUploadWidgetKey] = useState(0)
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchRecipients()
  }, [])

  const fetchRecipients = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/newsletters')
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load recipients')
      }

      const data = payload as RecipientsResponse
      const recipientList = data.recipients || []

      setRecipients(recipientList)
      setStats(
        data.stats || {
          totalRecipients: recipientList.length,
          memberRecipients: recipientList.filter((item) => item.sources.includes('member')).length,
          subscriberRecipients: recipientList.filter((item) => item.sources.includes('subscriber')).length,
        }
      )
      setSelectedEmails(recipientList.map((item) => item.email))
    } catch (error) {
      console.error('Failed to fetch newsletter recipients:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load recipients')
    } finally {
      setLoading(false)
    }
  }

  const filteredRecipients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return recipients

    return recipients.filter((item) => {
      const name = (item.full_name || '').toLowerCase()
      return item.email.includes(query) || name.includes(query)
    })
  }, [recipients, searchTerm])

  const previewHtml = useMemo(() => renderMarkdownToHtml(bodyMarkdown), [bodyMarkdown])

  const selectedCount = selectedEmails.length
  const filteredSelectedCount = filteredRecipients.filter((item) => selectedEmails.includes(item.email)).length

  const toggleRecipientSelection = (email: string) => {
    setSelectedEmails((previous) =>
      previous.includes(email) ? previous.filter((item) => item !== email) : [...previous, email]
    )
  }

  const selectAll = () => {
    setSelectedEmails(recipients.map((item) => item.email))
  }

  const clearAll = () => {
    setSelectedEmails([])
  }

  const selectMembersOnly = () => {
    setSelectedEmails(
      recipients.filter((item) => item.sources.includes('member')).map((item) => item.email)
    )
  }

  const selectSubscribersOnly = () => {
    setSelectedEmails(
      recipients.filter((item) => item.sources.includes('subscriber')).map((item) => item.email)
    )
  }

  const insertAtCursor = (snippet: string) => {
    const textarea = bodyTextareaRef.current

    if (!textarea) {
      setBodyMarkdown((previous) => `${previous}${snippet}`)
      return
    }

    const start = textarea.selectionStart ?? bodyMarkdown.length
    const end = textarea.selectionEnd ?? bodyMarkdown.length

    const nextValue = `${bodyMarkdown.slice(0, start)}${snippet}${bodyMarkdown.slice(end)}`
    setBodyMarkdown(nextValue)

    requestAnimationFrame(() => {
      const cursor = start + snippet.length
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const handleInsertUploadedImage = () => {
    const safeUrl = normalizeUrl(uploadedMediaUrl)
    if (!safeUrl) {
      toast.error('Upload an image or GIF first')
      return
    }

    insertAtCursor(`\n\n![Newsletter image](${safeUrl})\n\n`)
    setUploadedMediaUrl('')
    setUploadWidgetKey((previous) => previous + 1)
    toast.success('Image inserted into markdown body')
  }

  const handleInsertImageTemplate = () => {
    insertAtCursor('\n\n![Describe image](https://your-image-url-here)\n\n')
  }

  const handleSendNewsletter = async () => {
    if (subject.trim().length < 3) {
      toast.error('Subject must be at least 3 characters')
      return
    }

    if (!bodyMarkdown.trim()) {
      toast.error('Add newsletter body content')
      return
    }

    if (selectedEmails.length === 0) {
      toast.error('Select at least one recipient')
      return
    }

    const invalidEmail = selectedEmails.find((email) => !EMAIL_REGEX.test(email))
    if (invalidEmail) {
      toast.error(`Invalid recipient email: ${invalidEmail}`)
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/admin/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          bodyMarkdown,
          recipientEmails: selectedEmails,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send newsletter')
      }

      toast.success(`Newsletter sent to ${payload.recipientCount || selectedEmails.length} recipients`)

      setSubject('')
      setBodyMarkdown('')
      setUploadedMediaUrl('')
      setUploadWidgetKey((previous) => previous + 1)
    } catch (error) {
      console.error('Send newsletter error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send newsletter')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Newsletter</h2>
          <p className="text-white/60 text-sm">
            Send email updates to members and newsletter subscribers using BCC.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchRecipients}
        >
          Refresh Recipients
        </Button>
      </div>

      <div className="grid xl:grid-cols-[1.15fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-white">Compose Newsletter</h3>

            <Input
              label="Mail Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Example: April Book Picks and Meet-up Updates"
              maxLength={180}
            />

            <Textarea
              ref={bodyTextareaRef}
              label="Body (Markdown)"
              value={bodyMarkdown}
              onChange={(event) => setBodyMarkdown(event.target.value)}
              placeholder={[
                '# Hello readers',
                '',
                'We have exciting updates this month.',
                '',
                '![Meet-up photo](https://your-image-url)',
                '',
                'Use **bold**, *italic*, and [links](https://example.com).',
              ].join('\n')}
              className="min-h-[240px] font-mono text-sm"
              helperText="Markdown supported: headings, bold/italic, lists, links, and images with ![alt](url)."
            />

            <div className="space-y-3">
              <CloudinaryUpload
                key={uploadWidgetKey}
                value={uploadedMediaUrl}
                onChange={setUploadedMediaUrl}
                resourceType="image"
                folder="tripleabookclub/newsletters"
                label="Upload Image or GIF"
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<ImagePlus className="w-4 h-4" />}
                  onClick={handleInsertUploadedImage}
                  disabled={!uploadedMediaUrl}
                >
                  Insert Uploaded Image
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleInsertImageTemplate}
                >
                  Insert Image Markdown
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSendNewsletter}
                isLoading={sending}
                leftIcon={<Send className="w-4 h-4" />}
                disabled={selectedCount === 0}
              >
                Send Newsletter ({selectedCount})
              </Button>
            </div>
          </div>

          <div className="card space-y-3">
            <h3 className="text-lg font-semibold text-white">Preview</h3>
            <div className="rounded-xl border border-white/10 bg-white p-4">
              <h4 className="text-xl font-semibold text-dark-900 mb-3">
                {subject.trim() || 'Your newsletter subject will appear here'}
              </h4>

              {bodyMarkdown.trim() ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <p className="text-dark-400">Newsletter markdown preview</p>
              )}
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Recipients</h3>
            <p className="text-sm text-white/60">
              Select and deselect who should receive this newsletter.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-xs text-white/50">Total</p>
              <p className="text-lg font-semibold text-white">{stats.totalRecipients}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-xs text-white/50">Members</p>
              <p className="text-lg font-semibold text-white">{stats.memberRecipients}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-xs text-white/50">Subscribers</p>
              <p className="text-lg font-semibold text-white">{stats.subscriberRecipients}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="input-field pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" leftIcon={<Check className="w-4 h-4" />} onClick={selectAll}>
              Select All
            </Button>
            <Button type="button" variant="secondary" size="sm" leftIcon={<UserX className="w-4 h-4" />} onClick={clearAll}>
              Deselect All
            </Button>
            <Button type="button" variant="secondary" size="sm" leftIcon={<Users className="w-4 h-4" />} onClick={selectMembersOnly}>
              Members Only
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<UserCheck className="w-4 h-4" />}
              onClick={selectSubscribersOnly}
            >
              Subscribers Only
            </Button>
          </div>

          <p className="text-xs text-white/50">
            Showing {filteredRecipients.length} recipient(s). Selected in view: {filteredSelectedCount}.
          </p>

          <div className="max-h-[560px] overflow-y-auto space-y-2 pr-1">
            {filteredRecipients.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-white/10 bg-white/5">
                <Mail className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="text-white/60">No recipients found</p>
              </div>
            ) : (
              filteredRecipients.map((recipient) => {
                const isSelected = selectedEmails.includes(recipient.email)
                return (
                  <button
                    key={recipient.email}
                    type="button"
                    onClick={() => toggleRecipientSelection(recipient.email)}
                    className={cn(
                      'w-full rounded-xl border text-left p-3 transition-colors',
                      isSelected
                        ? 'border-primary-500/60 bg-primary-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-0.5 w-5 h-5 rounded border flex items-center justify-center',
                          isSelected
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-white/30 text-transparent'
                        )}
                      >
                        <Check className="w-3 h-3" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">
                          {recipient.full_name || 'Newsletter Subscriber'}
                        </p>
                        <p className="text-xs text-white/60 truncate">{recipient.email}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {recipient.sources.includes('member') && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300">
                              <User className="w-3 h-3 inline mr-1" />
                              Member
                            </span>
                          )}
                          {recipient.sources.includes('subscriber') && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                              <Mail className="w-3 h-3 inline mr-1" />
                              Subscriber
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
