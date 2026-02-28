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

function normalizeExternalUrl(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return null
  }

  const withProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`

  try {
    return new URL(withProtocol).toString()
  } catch {
    return null
  }
}

function normalizeUrlLabel(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()
  return trimmedValue || null
}

function hasUserInput(value: unknown) {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return value !== null && value !== undefined
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

// GET - Fetch meetups (for authenticated users)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()
    const isAdmin = session.user.role === 'super_admin' || session.user.role === 'admin'

    // Admins can see all meetups, members only see published
    const query = supabase
      .from('meetups')
      .select('*')
      .order('event_date', { ascending: false })

    if (!isAdmin) {
      query.eq('is_published', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Meetups fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch meetups' },
        { status: 500 }
      )
    }

    const meetups = data || []
    const meetupIds = meetups.map(meetup => meetup.id)

    if (meetupIds.length === 0) {
      return NextResponse.json(meetups)
    }

    const { data: rsvps, error: rsvpError } = await supabase
      .from('meetup_rsvps')
      .select('meetup_id, user_id, profiles(full_name, email)')
      .in('meetup_id', meetupIds)
      .order('created_at', { ascending: true })

    if (rsvpError) {
      console.error('Meetup RSVP fetch error:', rsvpError)
      return NextResponse.json(
        { error: 'Failed to fetch meetup RSVPs' },
        { status: 500 }
      )
    }

    const rsvpByMeetup: Record<string, { rsvp_count: number; rsvp_members: string[]; has_rsvped: boolean }> = {}

    for (const rsvp of rsvps || []) {
      if (!rsvpByMeetup[rsvp.meetup_id]) {
        rsvpByMeetup[rsvp.meetup_id] = {
          rsvp_count: 0,
          rsvp_members: [],
          has_rsvped: false,
        }
      }

      const target = rsvpByMeetup[rsvp.meetup_id]
      target.rsvp_count += 1
      target.rsvp_members.push(getRsvpMemberName(rsvp.profiles))

      if (rsvp.user_id === session.user.id) {
        target.has_rsvped = true
      }
    }

    const enrichedMeetups = meetups.map(meetup => ({
      ...meetup,
      rsvp_count: rsvpByMeetup[meetup.id]?.rsvp_count || 0,
      rsvp_members: rsvpByMeetup[meetup.id]?.rsvp_members || [],
      has_rsvped: rsvpByMeetup[meetup.id]?.has_rsvped || false,
    }))

    return NextResponse.json(enrichedMeetups)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new meetup (admin only)
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      venue_name,
      address,
      city,
      latitude,
      longitude,
      google_maps_url,
      external_url,
      external_url_label,
      event_date,
      end_time,
      month,
      year,
      image_url,
      is_published
    } = body

    // Validate required fields
    if (!title || !venue_name || !address || !event_date || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const normalizedExternalUrl = normalizeExternalUrl(external_url)
    if (hasUserInput(external_url) && !normalizedExternalUrl) {
      return NextResponse.json(
        { error: 'Custom URL must be a valid URL' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('meetups')
      .insert({
        title,
        description: description || null,
        venue_name,
        address,
        city: city || 'Lagos',
        latitude: latitude || null,
        longitude: longitude || null,
        google_maps_url: google_maps_url || null,
        external_url: normalizedExternalUrl,
        external_url_label: normalizedExternalUrl ? normalizeUrlLabel(external_url_label) : null,
        event_date,
        end_time: end_time || null,
        month,
        year,
        image_url: image_url || null,
        is_published: is_published || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Meetup creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create meetup' },
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

// PUT - Update a meetup (admin only)
export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Meetup ID is required' },
        { status: 400 }
      )
    }

    const sanitizedUpdateData: Record<string, unknown> = { ...updateData }

    if ('external_url' in sanitizedUpdateData) {
      const normalizedExternalUrl = normalizeExternalUrl(sanitizedUpdateData.external_url)

      if (hasUserInput(sanitizedUpdateData.external_url) && !normalizedExternalUrl) {
        return NextResponse.json(
          { error: 'Custom URL must be a valid URL' },
          { status: 400 }
        )
      }

      sanitizedUpdateData.external_url = normalizedExternalUrl

      if (!normalizedExternalUrl && !('external_url_label' in sanitizedUpdateData)) {
        sanitizedUpdateData.external_url_label = null
      }
    }

    if ('external_url_label' in sanitizedUpdateData) {
      sanitizedUpdateData.external_url_label = normalizeUrlLabel(sanitizedUpdateData.external_url_label)
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('meetups')
      .update(sanitizedUpdateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Meetup update error:', error)
      return NextResponse.json(
        { error: 'Failed to update meetup', details: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Meetup not found' },
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

// DELETE - Delete a meetup (admin only)
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Meetup ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('meetups')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Meetup deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete meetup' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
