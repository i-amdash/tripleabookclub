import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

function getRsvpMemberName(profileData: unknown) {
  const normalizedProfile = Array.isArray(profileData) ? profileData[0] : profileData

  if (!normalizedProfile || typeof normalizedProfile !== 'object') {
    return 'Member'
  }

  const profile = normalizedProfile as { full_name?: string | null; email?: string | null }
  if (profile.full_name && profile.full_name.trim()) {
    return profile.full_name.trim()
  }

  if (profile.email && profile.email.includes('@')) {
    return profile.email.split('@')[0]
  }

  return 'Member'
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { meetup_id } = body

    if (!meetup_id) {
      return NextResponse.json(
        { error: 'Meetup ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const isAdmin = session.user.role === 'super_admin' || session.user.role === 'admin'

    const { data: meetup, error: meetupError } = await supabase
      .from('meetups')
      .select('id, event_date, is_published')
      .eq('id', meetup_id)
      .single()

    if (meetupError || !meetup) {
      return NextResponse.json(
        { error: 'Meetup not found' },
        { status: 404 }
      )
    }

    if (!meetup.is_published && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only RSVP for published meetups' },
        { status: 403 }
      )
    }

    if (new Date(meetup.event_date).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'RSVP is closed for past meetups' },
        { status: 400 }
      )
    }

    const { data: existingRsvp } = await supabase
      .from('meetup_rsvps')
      .select('id')
      .eq('meetup_id', meetup_id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (existingRsvp) {
      return NextResponse.json(
        { error: 'You already RSVP\'d for this meetup' },
        { status: 400 }
      )
    }

    const { error: rsvpError } = await supabase
      .from('meetup_rsvps')
      .insert({
        meetup_id,
        user_id: session.user.id,
      })

    if (rsvpError) {
      console.error('Meetup RSVP creation error:', rsvpError)
      return NextResponse.json(
        { error: 'Failed to RSVP for meetup' },
        { status: 500 }
      )
    }

    const { data: rsvps, error: rsvpsError } = await supabase
      .from('meetup_rsvps')
      .select('user_id, profiles(full_name, email)')
      .eq('meetup_id', meetup_id)
      .order('created_at', { ascending: true })

    if (rsvpsError) {
      console.error('Meetup RSVP fetch error:', rsvpsError)
      return NextResponse.json(
        { error: 'RSVP was saved but failed to load attendees' },
        { status: 500 }
      )
    }

    const rsvpMembers = (rsvps || []).map((rsvp) => getRsvpMemberName(rsvp.profiles))

    return NextResponse.json({
      success: true,
      meetup_id,
      has_rsvped: true,
      rsvp_count: rsvpMembers.length,
      rsvp_members: rsvpMembers,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
