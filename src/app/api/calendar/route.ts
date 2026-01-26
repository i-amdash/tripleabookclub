import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Book Club Meet-up'
    const description = searchParams.get('description') || ''
    const venue = searchParams.get('venue') || ''
    const address = searchParams.get('address') || ''
    const startDate = searchParams.get('start') || ''
    const endDate = searchParams.get('end') || ''

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

    // Format dates for ICS (YYYYMMDDTHHmmssZ)
    const formatDateForICS = (dateString: string) => {
      const date = new Date(dateString)
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    }

    const startFormatted = formatDateForICS(startDate)
    const endFormatted = endDate ? formatDateForICS(endDate) : formatDateForICS(
      new Date(new Date(startDate).getTime() + 3 * 60 * 60 * 1000).toISOString()
    )

    const location = venue ? `${venue}, ${address}` : address
    const uid = `meetup-${Date.now()}@tripleabookclub.com`

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Triple A Book Club//Meet-ups//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDateForICS(new Date().toISOString())}`,
      `DTSTART:${startFormatted}`,
      `DTEND:${endFormatted}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Book Club Meet-up in 1 hour',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Book Club Meet-up tomorrow',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.ics"`,
      },
    })
  } catch (error) {
    console.error('Calendar generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar file' },
      { status: 500 }
    )
  }
}
